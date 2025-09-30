<<<<<<< HEAD
# Jn-Hotel
=======
# Hotel Management & Booking System

A comprehensive hotel management application with room booking, banquet reservations, restaurant table booking, and food ordering capabilities.

## Features

### 🏨 Room & Hotel Booking
- Individual room bookings
- Group bookings (multiple rooms)
- Entire hotel booking for events
- Advanced filters (room type, price, amenities)
- Real-time availability calendar
- Payment gateway integration

### 🎉 Banquet & Event Halls
- Banquet hall reservations
- Conference room booking
- Event space management
- Capacity-based booking
- Additional services (catering, decoration)

### 🍽️ Restaurant Management
- Table reservations
- Time slot management
- Indoor/outdoor seating options
- QR code check-in system
- Live availability tracking

### 📱 Food Ordering System
- In-restaurant ordering via QR codes
- Room service ordering
- Digital menu management
- Real-time order tracking
- Payment integration

### 👨‍💼 Admin Dashboard
- Comprehensive management panel
- Analytics and reporting
- Revenue tracking
- Occupancy management
- Menu and pricing control

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Payments**: Stripe integration
- **State Management**: React Query + Context API

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd Hotel
npm run install-all
```

2. Set up environment variables:
```bash
# Backend (.env in /backend folder)
MONGODB_URI=mongodb://localhost:27017/hotel_management
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000

# Frontend (.env in /frontend folder)
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

3. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend application on http://localhost:3000

## Project Structure

```
Hotel/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── controllers/
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Bookings
- `GET /api/rooms` - Get available rooms
- `POST /api/bookings/room` - Book a room
- `GET /api/banquets` - Get banquet halls
- `POST /api/bookings/banquet` - Book banquet hall

### Restaurant
- `GET /api/restaurant/tables` - Get table availability
- `POST /api/restaurant/reserve` - Reserve table
- `GET /api/food/menu` - Get menu items
- `POST /api/food/order` - Place food order

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
>>>>>>> e378373 (Initial commit - Hotel project setup)
