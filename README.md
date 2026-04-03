# Philz Properties API

Backend REST API for the Philz Properties real estate platform. Built with **Express.js**, **TypeScript**, **MongoDB (Mongoose)**, and secured with **JWT authentication**, **role-based access control**, and comprehensive input validation.

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js + TypeScript                |
| Framework      | Express.js 5                        |
| Database       | MongoDB Atlas + Mongoose 9          |
| Auth           | JWT (jsonwebtoken) + bcrypt         |
| Email          | Resend                              |
| Payments       | Paystack                            |
| File Storage   | Cloudinary (via Multer)             |
| Validation     | Zod                                 |
| Security       | Helmet, CORS, express-rate-limit    |
| Docs           | Swagger UI (swagger-jsdoc)          |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Resend account (for transactional emails)
- Paystack account (for payments)

### Installation

```bash
cd server
pnpm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable               | Description                                |
| ---------------------- | ------------------------------------------ |
| `DEV_PORT`             | Development server port (default: 5000)    |
| `PROD_PORT`            | Production server port (default: 8000)     |
| `NODE_ENV`             | `development` or `production`              |
| `MONGO_URI`            | MongoDB connection string                  |
| `JWT_SECRET`           | 256-bit hex secret for JWT signing         |
| `DEV_FRONTEND_URL`     | Frontend URL in dev (http://localhost:3000) |
| `PROD_FRONTEND_URL`    | Frontend URL in production                 |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name                      |
| `CLOUDINARY_API_KEY`   | Cloudinary API key                         |
| `CLOUDINARY_API_SECRET`| Cloudinary API secret                      |
| `RESEND_API_KEY`       | Resend API key for sending emails          |
| `RESEND_FROM_EMAIL`    | Sender email address (verified in Resend)  |
| `PAYSTACK_SECRET_KEY`  | Paystack secret key                        |
| `SUPER_ADMIN_EMAIL`    | Email for seeded super admin               |
| `SUPER_ADMIN_PASSWORD` | Password for seeded super admin            |

### Seed the Database

```bash
# Create the initial super admin (required before first use)
pnpm run seed:admin

# Seed sample properties (optional, for development)
pnpm run seed:properties
```

### Run Development Server

```bash
pnpm run dev
```

Server starts at `http://localhost:5000`. Swagger docs at `http://localhost:5000/api/docs`.

### Build for Production

```bash
pnpm run build
pnpm start
```

---

## Architecture

```
server/src/
  @types/            Express type declarations
  config/
    db.ts            MongoDB connection
  controllers/       Request handlers (business logic)
    authController.ts
    propertyController.ts
    tourController.ts
    testimonialController.ts
    inquiryController.ts
    contactController.ts
    paymentController.ts
  middleware/
    auth.ts          JWT verification + role authorization
    rateLimiter.ts   Rate limiting (public, auth, password reset, webhook)
    upload.ts        Multer config with MIME type whitelist
    validateRequest.ts   Zod schema validation middleware
    validateObjectId.ts  MongoDB ObjectID param validation
    errorHandler.ts      Centralized error handler
  models/
    User.ts          Users with admin approval flow + soft deletes
    Property.ts      Real estate listings with geo + text indexes
    TourRequest.ts   Tour bookings with status lifecycle
    Testimonial.ts   Client reviews with approval workflow
    Contact.ts       Contact form submissions
    Inquiry.ts       Property-specific inquiries
    Payment.ts       Paystack payment records with idempotency
    TokenBlacklist.ts   Revoked JWT tokens (TTL auto-cleanup)
    AuditLog.ts      Who did what, when, from where
  routes/            Express route definitions with Swagger annotations
  seeds/
    seedSuperAdmin.ts    Create initial admin account
    seedProperties.ts    Populate sample property data
  utils/
    cloudinary.ts    Cloudinary SDK configuration
    email.ts         Resend email service + HTML templates
    generateToken.ts JWT token generation with variable expiry
    validatorSchemas.ts  Zod schemas for all endpoints
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method   | Endpoint               | Description                        | Access  |
| -------- | ---------------------- | ---------------------------------- | ------- |
| `POST`   | `/register`            | Register new user                  | Public  |
| `POST`   | `/login`               | Login (supports remember me)       | Public  |
| `GET`    | `/me`                  | Get current user                   | Auth    |
| `GET`    | `/session`             | Check session from cookie          | Public  |
| `POST`   | `/forgot-password`     | Send password reset email          | Public  |
| `POST`   | `/reset-password`      | Reset password with token          | Public  |
| `POST`   | `/verify-email`        | Verify email with token            | Public  |
| `POST`   | `/refresh`             | Refresh JWT token                  | Auth    |
| `PUT`    | `/update-profile`      | Update name, phone, avatar         | Auth    |
| `POST`   | `/logout`              | Logout and revoke token            | Public  |
| `DELETE` | `/delete-account`      | Soft-delete account + related data | Auth    |
| `GET`    | `/admin/pending`       | List pending admin requests        | Admin   |
| `POST`   | `/admin/approve`       | Approve or deny admin access       | Admin   |

### Properties (`/api/properties`)

| Method   | Endpoint   | Description                        | Access  |
| -------- | ---------- | ---------------------------------- | ------- |
| `GET`    | `/`        | List properties (paginated, filtered, sorted) | Public |
| `GET`    | `/:id`     | Get property by ID                 | Public  |
| `POST`   | `/`        | Create property                    | Admin   |
| `PATCH`  | `/:id`     | Update property (whitelisted fields only) | Admin |
| `DELETE` | `/:id`     | Delete property + Cloudinary media | Admin   |

**Query params:** `page`, `pageSize`, `sortBy` (createdAt/price/title:asc/desc), `title` (text search), `location`, `propertyType`, `status`, `maxPrice`, `amenities`

### Tours (`/api/tours`)

| Method   | Endpoint             | Description              | Access  |
| -------- | -------------------- | ------------------------ | ------- |
| `POST`   | `/`                  | Request a tour           | Auth    |
| `GET`    | `/`                  | Get user's tours         | Auth    |
| `PATCH`  | `/:id/reschedule`    | Reschedule a tour        | Auth    |
| `PATCH`  | `/:id/cancel`        | Cancel a tour            | Auth    |
| `GET`    | `/admin/all`         | List all tours           | Admin   |
| `PATCH`  | `/:id/approve`       | Approve/reject tour      | Admin   |

### Testimonials (`/api/testimonials`)

| Method   | Endpoint             | Description              | Access  |
| -------- | -------------------- | ------------------------ | ------- |
| `GET`    | `/public`            | Get approved testimonials | Public |
| `POST`   | `/`                  | Submit testimonial       | Auth    |
| `GET`    | `/`                  | List all testimonials    | Admin   |
| `GET`    | `/:id`               | Get testimonial by ID    | Admin   |
| `PUT`    | `/:id`               | Update testimonial       | Admin   |
| `PATCH`  | `/:id/approve`       | Approve/unapprove        | Admin   |
| `DELETE` | `/:id`               | Delete testimonial       | Admin   |

### Inquiries (`/api/inquiries`)

| Method | Endpoint              | Description                 | Access  |
| ------ | --------------------- | --------------------------- | ------- |
| `POST` | `/`                   | Submit inquiry (validated)  | Public  |
| `GET`  | `/`                   | List inquiries (paginated)  | Admin   |
| `GET`  | `/property/:propertyId` | Inquiries for a property  | Public  |

### Contact (`/api/contact`)

| Method | Endpoint | Description                    | Access  |
| ------ | -------- | ------------------------------ | ------- |
| `POST` | `/`      | Submit contact form (validated) | Public |
| `GET`  | `/`      | List messages (paginated)       | Admin  |

### Payments (`/api/payments`)

| Method | Endpoint    | Description                              | Access   |
| ------ | ----------- | ---------------------------------------- | -------- |
| `POST` | `/`         | Initialize Paystack payment              | Auth     |
| `POST` | `/webhook`  | Paystack webhook (signature-verified)    | Paystack |

### Uploads (`/api/upload`)

| Method | Endpoint | Description                              | Access |
| ------ | -------- | ---------------------------------------- | ------ |
| `POST` | `/`      | Upload images/videos/floor plans to Cloudinary | Auth |

---

## Security

- **JWT Authentication** with httpOnly cookies and Bearer token support
- **Token Revocation** via blacklist with TTL auto-cleanup
- **Role-Based Access**: `user` and `admin` roles with admin approval workflow
- **Admin Approval**: `@philzproperties.com` emails get admin role but require approval from an existing admin
- **Rate Limiting**: Separate limiters for public endpoints (100/15min), auth (10/15min), password reset (5/hr), webhooks (100/min)
- **Input Validation**: Zod schemas on all public-facing endpoints
- **ObjectID Validation**: Middleware validates MongoDB IDs on all parameterized routes
- **File Upload Security**: MIME type whitelist (images + video only), 50MB max
- **Password Security**: bcrypt with 12 salt rounds, strong password requirements enforced on register and reset
- **CSP Headers**: Content Security Policy via Helmet
- **CORS**: Whitelist-based, null origin blocked in production
- **Audit Logging**: All create/update/delete/login actions logged with user, resource, IP

---

## Email Notifications (Resend)

| Event                  | Recipients         | Template                     |
| ---------------------- | ------------------ | ---------------------------- |
| Email verification     | New user           | Verify link (24hr expiry)    |
| Password reset         | Requesting user    | Reset link (1hr expiry)      |
| Admin request          | All existing admins| Name + email of requester    |
| Admin approved         | Approved user      | Confirmation                 |
| Admin denied           | Denied user        | Notification + role downgrade|

---

## Deployment

- **Platform**: Render.com (or any Node.js host)
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary CDN
- **Build**: `pnpm run build` compiles TypeScript to `dist/`
- **Start**: `pnpm start` runs `node dist/index.js`
