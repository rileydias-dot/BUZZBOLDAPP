# BuzzBold CRM

Complete marketing CRM solution for BuzzBold Marketing. A full-stack web application with social media management, review tracking, invoicing, lead management, and more.

## Features

### Core Modules

#### 1. Profile Management
- Store business information (name, address, phone, photo)
- Business hours management
- Services catalog
- Full validation on all fields
- Client self-service editing

#### 2. Social Media Management
- **Platform Integration**: Instagram, TikTok, LinkedIn, X (Twitter)
- **OAuth Authentication**: Secure platform connections
- **Post Management**: Create, schedule, and publish posts
- **Comment Management**: Reply to comments from unified interface
- **Analytics**: Track reach, clicks, followers, and engagement

#### 3. Review Management
- **Platform Integration**: Google Business Profile, Facebook
- **Review Monitoring**: Receive and track all reviews
- **Review Responses**: Reply to reviews from CRM
- **Analytics**: Rating charts and trends over time
- **Review Requests**: Send via SMS or email with tracking
- **Open/Click Tracking**: Monitor customer engagement

#### 4. Invoice Management
- **Invoice Creation**: Create professional invoices
- **Email Delivery**: Send invoices directly to customers
- **Payment Tracking**: Track paid/unpaid status
- **Stripe Integration**: Accept online payments
- **PDF Generation**: Automatic PDF invoice creation

#### 5. Unified Inbox
- Centralized message management across all platforms
- Email, Instagram, Facebook, LinkedIn, SMS integration
- Mark as read, archive, and star messages
- Thread management

#### 6. Lead Capture & Pipeline
- Custom lead capture forms
- Pipeline stage management
- Lead source tracking
- Lead value calculation
- Assignment and notes

#### 7. Customer Management
- Complete customer database
- Contact information
- Tags and notes
- Activity history

#### 8. Task Management
- Create and assign tasks
- Due dates and priorities
- Status tracking
- Reminders and notifications

#### 9. Analytics & Reporting
- Dashboard with key metrics
- Traffic analytics
- Lead conversion tracking
- Review trends
- Social media insights
- Revenue reports

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **SMS**: Twilio
- **Payments**: Stripe
- **PDF Generation**: PDFKit

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with custom properties
- **JavaScript**: ES6+ vanilla JavaScript
- **API Communication**: Fetch API

### Third-Party Integrations
- Instagram Graph API
- TikTok API
- LinkedIn API
- X (Twitter) API
- Google Business Profile API
- Facebook Graph API
- Stripe Payment API
- Twilio SMS API

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=buzzbold_crm
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=your_stripe_key
# ... add all other API keys
```

5. Create PostgreSQL database:
```bash
createdb buzzbold_crm
```

6. Run database migrations:
```bash
psql -U postgres -d buzzbold_crm -f ../database/schema.sql
```

7. Start the server:
```bash
npm start
```

The API will be running at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Update API URL in `js/config.js` if needed

3. Serve the frontend using any static server:
```bash
# Using Python
python -m http.server 3000

# Using Node.js http-server
npx http-server -p 3000
```

The frontend will be available at `http://localhost:3000`

## API Documentation

### Authentication

#### POST /api/auth/register
Register a new user
```json
{
  "name": "John Doe",
  "businessName": "Acme Corp",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST /api/auth/login
Login existing user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Get current user (requires authentication)

### Profile

#### GET /api/profile
Get user profile

#### PUT /api/profile
Update user profile
```json
{
  "business_name": "Updated Corp",
  "phone": "+1234567890",
  "address": "123 Main St",
  "business_hours": {"monday": {"open": "09:00", "close": "17:00"}}
}
```

### Social Media

#### GET /api/social/accounts
Get connected social accounts

#### GET /api/social/posts
Get social media posts

#### POST /api/social/posts
Create new post
```json
{
  "social_account_id": "uuid",
  "content": "Post content",
  "scheduled_for": "2024-01-01T10:00:00Z"
}
```

### Reviews

#### GET /api/reviews
Get all reviews

#### POST /api/reviews/:reviewId/reply
Reply to a review

#### POST /api/reviews/requests
Send review request

### Invoices

#### GET /api/invoices
Get all invoices

#### POST /api/invoices
Create new invoice

#### POST /api/invoices/:invoiceId/send
Send invoice via email

## OAuth Setup

### Instagram
1. Create Facebook App
2. Add Instagram Basic Display product
3. Configure redirect URI: `http://localhost:5000/api/social/instagram/callback`
4. Add credentials to `.env`

### TikTok
1. Register at TikTok for Developers
2. Create app
3. Add redirect URI
4. Add credentials to `.env`

### LinkedIn
1. Create LinkedIn App
2. Add OAuth 2.0 redirect URL
3. Request required scopes
4. Add credentials to `.env`

### Google Business Profile
1. Create project in Google Cloud Console
2. Enable My Business API
3. Create OAuth credentials
4. Add credentials to `.env`

## Database Schema

See [database/schema.sql](database/schema.sql) for complete schema.

Key tables:
- `users` - User accounts
- `profiles` - Business profiles
- `social_accounts` - Connected social media accounts
- `social_posts` - Social media posts
- `reviews` - Customer reviews
- `invoices` - Invoice records
- `customers` - Customer database
- `leads` - Sales leads
- `tasks` - Task management
- `messages` - Unified inbox

## Security

- JWT authentication for all protected endpoints
- Password hashing with bcryptjs
- Rate limiting on API endpoints
- Helmet.js for security headers
- SQL injection prevention with parameterized queries
- XSS protection
- CORS configuration

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@buzzbold.com
