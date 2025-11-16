# BuzzBold CRM - System Architecture

## Overview

BuzzBold CRM is a full-stack web application built with a RESTful API architecture. The system is designed to be scalable, secure, and easy to maintain.

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       │
┌──────▼──────────────────────┐
│     Frontend (HTML/CSS/JS)  │
│  - Login/Register Pages     │
│  - Dashboard                │
│  - Module Pages             │
└──────┬──────────────────────┘
       │ REST API
       │
┌──────▼──────────────────────┐
│     Backend (Node/Express)  │
│  ┌────────────────────────┐ │
│  │   API Routes Layer     │ │
│  └────────┬───────────────┘ │
│  ┌────────▼───────────────┐ │
│  │  Controllers Layer     │ │
│  └────────┬───────────────┘ │
│  ┌────────▼───────────────┐ │
│  │   Services Layer       │ │
│  └────────┬───────────────┘ │
│  ┌────────▼───────────────┐ │
│  │   Middleware Layer     │ │
│  │  - Auth                │ │
│  │  - Validation          │ │
│  │  - Rate Limiting       │ │
│  └────────┬───────────────┘ │
└───────────┼─────────────────┘
            │
    ┌───────▼───────┐
    │  PostgreSQL   │
    │   Database    │
    └───────────────┘

External Services:
├── Stripe (Payments)
├── Twilio (SMS)
├── Nodemailer (Email)
├── Instagram API
├── TikTok API
├── LinkedIn API
├── X API
├── Google Business API
└── Facebook API
```

## System Components

### 1. Frontend Layer

**Technology**: HTML5, CSS3, Vanilla JavaScript

**Structure**:
```
frontend/
├── index.html (Login)
├── register.html
├── dashboard.html
├── pages/
│   ├── profile.html
│   ├── social.html
│   ├── reviews.html
│   ├── invoices.html
│   ├── customers.html
│   ├── leads.html
│   ├── tasks.html
│   └── inbox.html
├── css/
│   ├── main.css (Global styles)
│   ├── auth.css
│   └── dashboard.css
└── js/
    ├── config.js (Configuration)
    ├── api.js (API client)
    ├── utils.js (Helper functions)
    ├── auth.js
    ├── register.js
    └── dashboard.js
```

**Key Features**:
- Responsive design (mobile-first)
- Client-side routing
- JWT token management
- API client with error handling
- Form validation
- Loading states
- Error messages

### 2. Backend Layer

**Technology**: Node.js, Express.js

**Structure**:
```
backend/
├── server.js (Main entry point)
├── config/
│   └── database.js
├── middleware/
│   └── auth.middleware.js
├── controllers/
│   ├── auth.controller.js
│   ├── profile.controller.js
│   ├── social.controller.js
│   ├── review.controller.js
│   ├── invoice.controller.js
│   ├── customer.controller.js
│   ├── lead.controller.js
│   ├── task.controller.js
│   ├── message.controller.js
│   ├── notification.controller.js
│   ├── analytics.controller.js
│   └── subscription.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── profile.routes.js
│   ├── social.routes.js
│   ├── review.routes.js
│   ├── invoice.routes.js
│   ├── customer.routes.js
│   ├── lead.routes.js
│   ├── task.routes.js
│   ├── message.routes.js
│   ├── notification.routes.js
│   ├── analytics.routes.js
│   └── subscription.routes.js
├── models/ (Future: ORM models)
├── services/ (Future: Business logic)
└── utils/ (Future: Helper functions)
```

**Architecture Layers**:

1. **Routes Layer**
   - Define API endpoints
   - Apply middleware
   - Map to controllers

2. **Controllers Layer**
   - Handle HTTP requests/responses
   - Input validation
   - Call database queries
   - Error handling

3. **Middleware Layer**
   - Authentication (JWT)
   - Authorization (role-based)
   - Request validation
   - Rate limiting
   - Error handling

### 3. Database Layer

**Technology**: PostgreSQL

**Design Principles**:
- Normalized database schema
- Foreign key constraints
- Indexes for performance
- Triggers for auto-updates
- UUID for primary keys

**Key Tables**:
- Users & Authentication
- Business Profiles
- Social Media (accounts, posts, comments)
- Reviews (platforms, reviews, requests)
- Invoicing (invoices, items)
- CRM (customers, leads, tasks)
- Communication (messages, notifications)
- Analytics & Subscriptions

### 4. External Integrations

**OAuth Flows**:
```
User clicks "Connect Instagram"
    ↓
Redirect to Instagram OAuth
    ↓
User authorizes app
    ↓
Instagram redirects back with code
    ↓
Exchange code for access token
    ↓
Store token in database
    ↓
Fetch user's Instagram data
```

**Payment Processing**:
```
User initiates payment
    ↓
Create Stripe Payment Intent
    ↓
Client confirms payment
    ↓
Stripe webhook notifies backend
    ↓
Update invoice status to "paid"
    ↓
Send confirmation email
```

## Data Flow

### Example: Creating an Invoice

```
Frontend (invoice.html)
    ↓ POST /api/invoices
Backend (invoice.routes.js)
    ↓ Middleware: auth, validation
Controller (invoice.controller.js)
    ↓ Begin transaction
Database
    ├─ Insert invoice record
    ├─ Insert invoice items
    └─ Commit transaction
    ↓ Generate PDF
File System
    ↓ Return invoice data
Frontend
    ↓ Display success message
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Backend validates credentials
3. Generate JWT token (expires in 7 days)
4. Return token to client
5. Client stores token in localStorage
6. Include token in Authorization header for all requests
7. Backend validates token on each request
```

### Security Measures

1. **Password Security**
   - bcryptjs with salt rounds: 12
   - Minimum 8 characters required
   - No password in logs/responses

2. **API Security**
   - JWT authentication
   - Rate limiting (100 req/15min)
   - CORS configuration
   - Helmet.js headers
   - SQL injection prevention

3. **Data Security**
   - Parameterized queries
   - Input validation
   - XSS prevention
   - HTTPS enforcement (production)

## Performance Optimizations

1. **Database**
   - Indexes on frequently queried fields
   - Connection pooling
   - Query optimization

2. **API**
   - Response compression
   - Caching headers
   - Pagination for large datasets

3. **Frontend**
   - Lazy loading
   - Debounced search
   - Optimistic UI updates

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- JWT tokens (no server-side sessions)
- Database connection pooling
- Load balancer ready

### Vertical Scaling
- Efficient queries
- Proper indexing
- Resource cleanup

### Future Enhancements
- Redis for session/cache
- Message queue (Bull/RabbitMQ)
- CDN for static assets
- Microservices architecture

## Error Handling

### API Error Response Format
```json
{
  "status": "error",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional
}
```

### Error Types
- 400: Bad Request (validation errors)
- 401: Unauthorized (no/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Monitoring & Logging

### Logging Strategy
- Request/response logging
- Error logging
- Database query logging
- External API call logging

### Future Monitoring
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Uptime monitoring

## Deployment Architecture

```
GitHub Repository
    ↓ CI/CD Pipeline
Docker Containers
    ├─ Frontend (Nginx)
    ├─ Backend (Node.js)
    └─ Database (PostgreSQL)
    ↓
Cloud Platform (AWS/DigitalOcean/Heroku)
```

## API Versioning

Current: v1 (implicit)
Future: `/api/v2/...`

Strategy: URL-based versioning for breaking changes

## Testing Strategy

### Unit Tests
- Controller functions
- Utility functions
- Validation logic

### Integration Tests
- API endpoints
- Database operations
- External API calls

### E2E Tests
- User workflows
- Critical paths

## Documentation

- API documentation (OpenAPI/Swagger)
- Code comments
- README files
- Architecture diagrams
