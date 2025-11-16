const { query, getClient } = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generate invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};

// Generate PDF invoice
const generatePDF = (invoice, items) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice-${invoice.invoice_number}.pdf`;
    const filepath = path.join(__dirname, '../uploads', filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('INVOICE', 50, 50);
    doc.fontSize(10).text(`Invoice #: ${invoice.invoice_number}`, 50, 80);
    doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 50, 95);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 50, 110);

    // Bill To
    doc.fontSize(12).text('Bill To:', 50, 140);
    doc.fontSize(10).text(invoice.customer_name, 50, 160);
    if (invoice.customer_address) {
      doc.text(invoice.customer_address, 50, 175);
    }

    // Items table
    let yPosition = 220;
    doc.fontSize(12).text('Items', 50, yPosition);
    yPosition += 20;

    doc.fontSize(10);
    doc.text('Description', 50, yPosition);
    doc.text('Qty', 300, yPosition);
    doc.text('Price', 350, yPosition);
    doc.text('Amount', 450, yPosition);
    yPosition += 20;

    items.forEach(item => {
      doc.text(item.description, 50, yPosition, { width: 240 });
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(`$${parseFloat(item.unit_price).toFixed(2)}`, 350, yPosition);
      doc.text(`$${parseFloat(item.amount).toFixed(2)}`, 450, yPosition);
      yPosition += 30;
    });

    // Totals
    yPosition += 20;
    doc.text(`Subtotal: $${parseFloat(invoice.subtotal).toFixed(2)}`, 350, yPosition);
    yPosition += 20;
    doc.text(`Tax: $${parseFloat(invoice.tax).toFixed(2)}`, 350, yPosition);
    yPosition += 20;
    doc.text(`Discount: $${parseFloat(invoice.discount).toFixed(2)}`, 350, yPosition);
    yPosition += 20;
    doc.fontSize(12).text(`Total: $${parseFloat(invoice.total).toFixed(2)}`, 350, yPosition);

    // Notes
    if (invoice.notes) {
      yPosition += 40;
      doc.fontSize(10).text('Notes:', 50, yPosition);
      yPosition += 20;
      doc.text(invoice.notes, 50, yPosition, { width: 500 });
    }

    doc.end();

    stream.on('finish', () => {
      resolve(`/uploads/${filename}`);
    });

    stream.on('error', reject);
  });
};

// Create invoice
const createInvoice = async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const {
      customer_id,
      customer_name,
      customer_email,
      customer_address,
      issue_date,
      due_date,
      items,
      tax,
      discount,
      notes,
    } = req.body;

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const total = subtotal + parseFloat(tax || 0) - parseFloat(discount || 0);

    const invoice_number = generateInvoiceNumber();

    const invoiceResult = await client.query(
      `INSERT INTO invoices (user_id, customer_id, invoice_number, customer_name, customer_email, customer_address, issue_date, due_date, subtotal, tax, discount, total, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        req.user.id,
        customer_id || null,
        invoice_number,
        customer_name,
        customer_email,
        customer_address,
        issue_date,
        due_date,
        subtotal,
        tax || 0,
        discount || 0,
        total,
        notes,
        'draft',
      ]
    );

    const invoice = invoiceResult.rows[0];

    for (const item of items) {
      await client.query(
        'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES ($1, $2, $3, $4, $5)',
        [invoice.id, item.description, item.quantity, item.unit_price, item.amount]
      );
    }

    const pdf_url = await generatePDF(invoice, items);

    await client.query('UPDATE invoices SET pdf_url = $1 WHERE id = $2', [pdf_url, invoice.id]);

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Invoice created successfully',
      data: { ...invoice, pdf_url },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create invoice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create invoice',
    });
  } finally {
    client.release();
  }
};

// Get invoices
const getInvoices = async (req, res) => {
  try {
    const { status } = req.query;

    let queryText = 'SELECT * FROM invoices WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get invoices',
    });
  }
};

// Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoiceResult = await query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, req.user.id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found',
      });
    }

    const itemsResult = await query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [invoiceId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        invoice: invoiceResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get invoice',
    });
  }
};

// Send invoice via email
const sendInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const result = await query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found',
      });
    }

    const invoice = result.rows[0];

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: invoice.customer_email,
      subject: `Invoice ${invoice.invoice_number}`,
      html: `
        <p>Dear ${invoice.customer_name},</p>
        <p>Please find attached your invoice.</p>
        <p>Invoice Number: ${invoice.invoice_number}</p>
        <p>Total Amount: $${parseFloat(invoice.total).toFixed(2)}</p>
        <p>Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p>Thank you for your business!</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          path: path.join(__dirname, '../', invoice.pdf_url),
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    await query(
      'UPDATE invoices SET status = $1 WHERE id = $2',
      ['sent', invoiceId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Invoice sent successfully',
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send invoice',
    });
  }
};

// Create Stripe payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const result = await query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found',
      });
    }

    const invoice = result.rows[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(invoice.total) * 100),
      currency: 'usd',
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      },
    });

    await query(
      'UPDATE invoices SET stripe_payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, invoiceId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent',
    });
  }
};

// Stripe webhook handler
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      await query(
        'UPDATE invoices SET status = $1, paid_at = CURRENT_TIMESTAMP, payment_method = $2 WHERE stripe_payment_intent_id = $3',
        ['paid', 'stripe', paymentIntent.id]
      );
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Webhook error',
    });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  sendInvoice,
  createPaymentIntent,
  stripeWebhook,
};
