# BuzzBold CRM - Deployment Guide

## Deployment Options

This guide covers deployment to various platforms.

## Prerequisites

- Node.js 16+
- PostgreSQL 13+
- Domain name (for production)
- SSL certificate (for production)
- API keys for all integrations

## Option 1: DigitalOcean Droplet

### Step 1: Create Droplet

1. Create a Ubuntu 22.04 droplet
2. Choose at least 2GB RAM
3. Add SSH key

### Step 2: Initial Server Setup

```bash
# SSH into server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### Step 3: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE buzzbold_crm;
CREATE USER buzzbold WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE buzzbold_crm TO buzzbold;
\q
```

### Step 4: Deploy Application

```bash
# Create app directory
mkdir -p /var/www/buzzbold-crm
cd /var/www/buzzbold-crm

# Clone repository
git clone https://github.com/yourusername/BUZZBOLDAPP.git .

# Install backend dependencies
cd backend
npm install --production

# Setup environment variables
cp .env.example .env
nano .env
# Fill in all required values

# Run database migrations
psql -U buzzbold -d buzzbold_crm -f ../database/schema.sql

# Start backend with PM2
pm2 start server.js --name buzzbold-api
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

```bash
# Create Nginx config
nano /etc/nginx/sites-available/buzzbold-crm
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/buzzbold-crm/frontend;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/buzzbold-crm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

## Option 2: Heroku

### Step 1: Prepare Application

```bash
# Create Procfile in root
echo "web: cd backend && npm start" > Procfile

# Create package.json in root
cat > package.json << EOF
{
  "name": "buzzbold-crm",
  "version": "1.0.0",
  "scripts": {
    "start": "cd backend && npm start",
    "postinstall": "cd backend && npm install"
  }
}
EOF
```

### Step 2: Deploy to Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create buzzbold-crm

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
heroku config:set STRIPE_SECRET_KEY=your_key
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run psql $DATABASE_URL -f database/schema.sql

# Open app
heroku open
```

## Option 3: AWS EC2

### Step 1: Launch EC2 Instance

1. Launch Ubuntu 22.04 instance
2. Configure security groups (HTTP, HTTPS, SSH)
3. Create Elastic IP
4. Connect to instance

### Step 2: Follow DigitalOcean Steps

Follow steps 2-6 from DigitalOcean deployment

### Step 3: Configure RDS (Optional)

For managed PostgreSQL:
1. Create RDS PostgreSQL instance
2. Configure security group
3. Update DATABASE_URL in .env

## Option 4: Docker Deployment

### Step 1: Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM nginx:alpine
COPY frontend/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: buzzbold_crm
      POSTGRES_USER: buzzbold
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=buzzbold_crm
      - DB_USER=buzzbold
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "5000:5000"
    depends_on:
      - db

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Step 3: Deploy

```bash
# Create .env file
cp .env.example .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

Required environment variables for production:

```bash
# Server
NODE_ENV=production
PORT=5000
API_URL=https://api.yourdomain.com
CLIENT_URL=https://yourdomain.com

# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=buzzbold_crm
DB_USER=buzzbold
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Social Media APIs
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
X_CLIENT_ID=...
X_CLIENT_SECRET=...

# Review Platforms
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

## Post-Deployment Checklist

- [ ] Database migrated successfully
- [ ] All environment variables set
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Email sending working
- [ ] SMS sending working
- [ ] Stripe webhooks configured
- [ ] OAuth redirects updated
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Error logging configured

## Database Backups

### Automated Backups

```bash
# Create backup script
cat > /var/scripts/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/buzzbold"
mkdir -p $BACKUP_DIR

pg_dump -U buzzbold buzzbold_crm > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /var/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/scripts/backup-db.sh
```

## Monitoring

### PM2 Monitoring

```bash
# View processes
pm2 list

# View logs
pm2 logs buzzbold-api

# Monitor
pm2 monit

# Restart
pm2 restart buzzbold-api
```

### Server Monitoring

```bash
# Install monitoring tools
apt install -y htop iotop nethogs

# Check CPU/Memory
htop

# Check disk
df -h

# Check network
netstat -tulpn
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs buzzbold-api

# Check environment
cd /var/www/buzzbold-crm/backend
cat .env

# Test manually
node server.js
```

### Database connection issues
```bash
# Test connection
psql -U buzzbold -d buzzbold_crm -h localhost

# Check PostgreSQL status
systemctl status postgresql
```

### Nginx issues
```bash
# Test config
nginx -t

# Check logs
tail -f /var/log/nginx/error.log

# Restart
systemctl restart nginx
```

## Scaling

### Vertical Scaling
- Increase droplet/instance size
- Add more CPU/RAM
- Upgrade database plan

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Database read replicas
- Redis for caching
- CDN for static assets

## Security Hardening

```bash
# Setup firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Fail2ban for SSH protection
apt install -y fail2ban
systemctl enable fail2ban

# Auto security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/buzzbold-crm
            git pull
            cd backend
            npm install --production
            pm2 restart buzzbold-api
```
