# J.N Palace Hotel Management System

A modern, full‑stack hotel management platform supporting room bookings, banquet/event reservations, restaurant ordering, billing, reviews, and rich admin analytics.

## ✨ Highlights

- Unified booking engine (rooms, banquets, restaurant tables, food orders)
- Dynamic availability & conflict detection
- Admin panel with charts, revenue metrics, occupancy stats
- Review lifecycle (submit → approve → publish)
- Bill builder (line items, taxes, service charge, extra charges, printable HTML)
- Email notifications (confirmation, status changes, payment updates)
- Extensible data models with audit metadata
- Modular REST API with role-based access control (RBAC)

---

## 🗂 Architecture Overview

| Layer        | Stack / Purpose                                  |
|--------------|--------------------------------------------------|
| Frontend     | React + TypeScript + Tailwind + React Router     |
| State/Auth   | Context-based auth + JWT local storage           |
| Backend      | Node.js + Express + TypeScript                   |
| Database     | MongoDB (Mongoose ODM models)                    |
| Security     | JWT auth, admin middleware, validation rules     |
| Communication| Axios-based API client                           |

---

## 🧩 Core Modules

1. Authentication & Users
2. Rooms & Availability
3. Banquet/Event Management
4. Restaurant (tables + food ordering)
5. Bookings & Payments (simulated logic)
6. Billing & Invoicing
7. Reviews & Moderation
8. Admin Operations (dashboards + charts)
9. Email Notification Service

---

## 🛠 Tech Stack Details

### Frontend
- React 18, TypeScript
- Tailwind CSS (utility-first styling)
- React Router v6
- Axios (HTTP client)
- Lucide Icons
- Recharts (charts)
- React Hot Toast (notifications)

### Backend
- Express + TypeScript
- Mongoose (models & indexing)
- express-validator (input validation)
- JWT (auth & role checking)
- Nodemailer (transactional emails)

### Dev & Build
- ts-node / nodemon (dev)
- TypeScript compiler (build)
- Environment-based configuration

---

## 📁 Project Structure (High-Level)

```
Hotel/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # auth, admin checks
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   ├── utils/              # email, helpers
│   │   └── server.ts           # entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # views
│   │   ├── components/         # reusable UI
│   │   ├── contexts/           # auth provider
│   │   ├── hooks/              # custom logic
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
└── README.md
```

---

## 🔐 Authentication & Authorization

- JWT generated on login / registration
- Protected routes require Authorization: Bearer <token>
- Middleware:
  - auth: verifies token
  - adminAuth: ensures user.role === 'admin'

---

## 🧪 Data Models (Summary)

| Model     | Purpose                                  | Key Fields                                      |
|-----------|-------------------------------------------|-------------------------------------------------|
| User      | Accounts / roles / loyalty points         | firstName, lastName, email, role, loyaltyPoints |
| Room      | Room inventory & metadata                 | roomNumber, type, price, facilities, status     |
| Banquet   | Event spaces with hourly/daily pricing    | banquetId, type, capacity, pricePerDay/Hour     |
| Booking   | Room/Banquet/Table reservations           | type, resourceId, checkIn/out, totalAmount      |
| Review    | User feedback linked to bookings          | rating, comment, isApproved                     |
| Order     | Restaurant food orders (not shown above)  | items, deliveryType, status                     |
| (Bill embedded in Booking) | Generated invoice data  | items[], subtotal, grandTotal, tax/service      |

---

## 🚦 Booking Flow (Room)

1. User selects date range & guest count
2. Frontend calls /api/rooms/availability
3. User selects room → POST /api/bookings
4. Booking created with status=pending
5. Payment simulation updates status=confirmed
6. After completion → eligible for review

### Banquet Flow (Difference)
- Supports hourly or daily bookingType via eventDetails
- Conflict detection prevents overlapping schedules
- Advance payment concept handled externally later

---

## 🧾 Billing System

- Bill attached to booking (editable by admin)
- Components:
  - Line items (description, qty, unit price)
  - Discount (%)
  - Service charge (%)
  - Tax (%)
  - Extra charges (minibar/damages)
  - Printable & downloadable HTML
- Updates booking.totalAmount to grandTotal

---

## 🗣 Review Lifecycle

| Stage            | Action                                 |
|------------------|----------------------------------------|
| Submit           | POST /api/reviews (user)               |
| Moderation       | Admin views /api/admin/reviews         |
| Approve/Reject   | Admin toggles isApproved               |
| Display          | Home page fetches published reviews    |

---

## 📊 Admin Dashboard Features

- Booking trend chart (last 30 days)
- Room vs Banquet vs Total counts
- Today's bookings
- Occupancy calculations
- Recent activity snapshots
- Quick navigation actions

---

## 📬 Email Notifications (Samples)

- Booking Confirmation (Room / Banquet)
- Payment Status Update
- Booking Status Change
- (Extendable: Cancellation, Reminder, Feedback Request)

---

## ⚙ Environment Variables

Backend (.env):
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hotel-management
JWT_SECRET=replace_with_strong_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=app_or_smtp_password
CLIENT_URL=http://localhost:3000
```

Frontend (.env):
```
REACT_APP_API_URL=http://localhost:5000
```

---

## 🚀 Setup & Run

1. Clone:
```
git clone <repo>
cd Hotel
```

2. Install:
```
cd backend && npm install
cd ../frontend && npm install
```

3. Dev Run:
```
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm start
```

4. Build Production:
```
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
serve -s build  # or deploy via hosting
```

---

## 🔌 Key API Endpoints (Condensed)

### Public
- GET /api/rooms
- GET /api/rooms/:id
- POST /api/rooms/availability
- GET /api/banquets
- GET /api/banquets/:id
- GET /api/reviews (published)

### Authenticated (User)
- POST /api/bookings
- GET /api/bookings
- GET /api/bookings/:id
- PUT /api/bookings/:id (modify if allowed)
- DELETE /api/bookings/:id (cancel logic)
- POST /api/reviews (submit)

### Admin
- GET /api/admin/bookings
- GET /api/admin/reviews
- PUT /api/bookings/:id (status/payment updates)
- POST /api/rooms | PUT /api/rooms/:id | DELETE /api/rooms/:id
- POST /api/banquets | PUT /api/banquets/:id | DELETE /api/banquets/:id

---

## ✅ Validation & Error Handling

- express-validator on critical POST/PUT routes
- Consistent JSON responses:
```
{ message: string, data?: any, errors?: [...], pagination?: {...} }
```
- 400 for validation / misuse
- 403 for unauthorized role
- 404 for missing resource
- 500 for unexpected failures

---

## 🛡 Security Considerations

- JWT signed & verified server-side
- Role separation (guest / admin)
- No sensitive fields returned (password excluded)
- Basic rate limiting (recommended future enhancement)
- Input validation on creation/update endpoints

---

## 🔍 Debugging Tips

| Symptom         | Check                                      |
|-----------------|---------------------------------------------|
| 404 on route    | Path prefix (/api/...) & mounting order     |
| CORS errors     | CLIENT_URL value & dev proxy config         |
| Empty charts    | Booking date range / status filters         |
| Bill not saving | PUT /api/bookings/:id payload structure     |
| Review not visible | Approved status in admin panel          |

---

## 🧭 Roadmap (Suggested Enhancements)

- Payment gateway integration (Razorpay / Stripe)
- Real-time notifications (WebSockets)
- Role: staff / auditor
- Multi-currency + localization
- Export reports (CSV / PDF)
- Automated review reminders
- Rate plans & seasonal pricing
- Channel manager integration

---

## 🧪 Testing Strategy (Recommended)

| Layer      | Tool / Approach                    |
|------------|-------------------------------------|
| Unit       | Jest (controllers, helpers)         |
| Integration| Supertest (API routes)              |
| E2E        | Playwright / Cypress (user flows)   |
| Load       | k6 / Artillery (booking spikes)     |

---

## 🧩 Deployment (Outline)

1. Build backend → deploy (PM2 / Docker)
2. Build frontend → static host (Netlify / S3 / Vercel)
3. Set environment variables securely
4. Add reverse proxy (NGINX) for API + frontend
5. Configure SSL (HTTPS)

---

## 🆘 Troubleshooting Quick Commands

Kill stuck ports:
```
npx kill-port 5000
npx kill-port 3000
```

Mongo service check (Linux):
```
systemctl status mongod
systemctl start mongod
```

Dependency cleanup:
```
rm -rf node_modules
npm install
```

---

## 🤝 Contributing

```
git checkout -b feature/YourFeature
git commit -m "Add feature"
git push origin feature/YourFeature
# Open Pull Request
```

Guidelines:
- Keep PRs focused
- Include concise description
- Reference related issues
- Add tests when modifying logic

---

## 🪪 License

MIT License — free to use & modify with attribution.

---

## 📧 Contact

| Purpose        | Channel                    |
|----------------|----------------------------|
| General        | info@jnpalace.com          |
| Reservations   | reservations@jnpalace.com  |
| Support        | +91 123 456 7890           |

---

## ❤️ Acknowledgments

- Icons: Lucide
- Photos: Unsplash
- Inspiration: Modern hospitality UX patterns

---

Built with care for operational clarity, scalability, and guest experience excellence.
