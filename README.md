# Philz Properties Backend Documentation

## Overview

This backend is built with **Node.js, Express, TypeScript, and MongoDB (Mongoose)**. It provides all APIs for the **Philz Properties website**, including authentication, property management, tours, testimonials, inquiries, and contact messages.

Key features:

* JWT-based authentication with role-based access (`super-admin`, `client`).
* File uploads for images, videos, floor plans (via Cloudinary).
* Full-text search, filtering, and pagination support for properties.
* Rate limiting for public endpoints (e.g., inquiries, contact forms).
* Swagger/OpenAPI documentation support.

---

## 1. **Authentication & Security**

### Middleware

* `protect` – checks for valid JWT and adds `req.user`.
* `authorize(...roles)` – restricts access based on user role.
* `publicLimiter` – rate limits public routes to prevent abuse.
* File upload middleware (`multer`) with validation.

### User Roles

| Role        | Access                                                         |
| ----------- | -------------------------------------------------------------- |
| super-admin | Full access to all endpoints (create, update, delete, approve) |
| client      | Can submit testimonials, inquiries, tour requests              |

---

## 2. **Routes & Endpoints**

### 2.1 Properties

**Model Fields**

* `title`, `description`, `propertyType` (apartment, house, office, shop)
* `address` (`city`, `state`)
* `location` (`latitude`, `longitude`)
* `bedrooms`, `bathrooms`, `toilets`, `area`, `garages`
* `price`, `status` (for sale / for rent), `sold`, `featured`
* `yearBuilt`, `amenities[]`, `images[]`, `videos[]`, `floorPlans[]`
* `additionalDetails` (object)
* `createdBy` (ref `User`)

**Endpoints**

| Method | URL                      | Description                                                                                | Access      |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------ | ----------- |
| POST   | `/api/properties`        | Create property                                                                            | super-admin |
| PATCH  | `/api/properties/:id`    | Update `featured`, `sold`, `status`                                                        | super-admin |
| DELETE | `/api/properties/:id`    | Delete property                                                                            | super-admin |
| GET    | `/api/properties/:id`    | Get property by ID                                                                         | Public      |
| GET    | `/api/properties`        | Get all properties                                                                         | Public      |
| GET    | `/api/properties/search` | Filter properties by `state`, `status`, `featured`, `propertyType`, distance (geo queries) | Public      |

**Indexes**

* `address.state`, `status`, `featured`, `price`, `propertyType`, `sold`
* Compound index: `{ address.state, status, featured, price }`
* Geospatial index on `location` for distance queries
* Full-text index on `title`, `description`

### 2.2 Testimonials

**Model Fields**

* `name`, `title`, `content`, `rating` (1-5)
* `image`, `approved`, `isDeleted`

**Endpoints**

| Method | URL                             | Description               | Access      |
| ------ | ------------------------------- | ------------------------- | ----------- |
| POST   | `/api/testimonials`             | Submit testimonial        | client      |
| GET    | `/api/testimonials/public`      | Get approved testimonials | Public      |
| GET    | `/api/testimonials`             | List all testimonials     | super-admin |
| GET    | `/api/testimonials/:id`         | Get testimonial by ID     | super-admin |
| PUT    | `/api/testimonials/:id`         | Update testimonial        | super-admin |
| PATCH  | `/api/testimonials/:id/approve` | Approve/unapprove         | super-admin |
| DELETE | `/api/testimonials/:id`         | Delete testimonial        | super-admin |

### 2.3 Tour Requests

**Model Fields**

* `propertyId` (ref `Property`), `userId` (ref `User`)
* `type` (`virtual` | `in-person`), `status` (`pending`, `approved`, `rejected`)
* `requestedAt`, `approvedBy` (ref `User`)
* `scheduledTime` (optional), `cost` (determined by type)

**Endpoints**

| Method | URL                         | Description         | Access      |
| ------ | --------------------------- | ------------------- | ----------- |
| POST   | `/api/tours`                | Request a tour      | client      |
| GET    | `/api/tours`                | Get user’s tours    | client      |
| PATCH  | `/api/tours/:id/reschedule` | Reschedule a tour   | client      |
| PATCH  | `/api/tours/:id/cancel`     | Cancel a tour       | client      |
| GET    | `/api/tours/admin/all`      | List all tours      | super-admin |
| PATCH  | `/api/tours/:id/approve`    | Approve/reject tour | super-admin |

### 2.4 Inquiries

**Model Fields**

* `name`, `email`, `phone`, `message`
* `propertyId` (optional)

**Endpoints**

| Method | URL              | Description       | Access      |
| ------ | ---------------- | ----------------- | ----------- |
| POST   | `/api/inquiries` | Submit inquiry    | Public      |
| GET    | `/api/inquiries` | Get all inquiries | super-admin |

### 2.5 Contact

**Model Fields**

* `name`, `email`, `phone` (optional), `message`

**Endpoints**

| Method | URL            | Description               | Access      |
| ------ | -------------- | ------------------------- | ----------- |
| POST   | `/api/contact` | Submit site contact form  | Public      |
| GET    | `/api/contact` | List all contact messages | super-admin |

---

## 3. **Best Practices / Improvements**

1. **Indexes for Scalability**

   * Compound indexes on frequently queried fields.
   * Geospatial index on `location` for distance queries.

2. **Pagination & Lean Queries**

   * Always paginate for list endpoints (`?page=1&limit=20`).
   * Use `.lean()` for read-heavy endpoints.

3. **Full-text search**

   * Text indexes for `title`, `description`.

4. **Caching**

   * Consider Redis for caching frequently queried properties.

5. **Validation**

   * Use `express-validator` or Zod for request body validation.

6. **Notifications**

   * Email or push notifications for tours, contact, inquiries.

7. **Security**

   * JWT expiration and refresh token strategy.
   * Rate limiting for public endpoints.
   * Input sanitization.

---

## 4. **Swagger / OpenAPI**

* All routes have annotations for Swagger UI.
* Public vs admin routes are clearly separated.
* BearerAuth security applied where required.