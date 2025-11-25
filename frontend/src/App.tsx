import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Banquets from './pages/Banquets';
import Restaurant from './pages/Restaurant';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/Admin/AdminPanel';
import BookRoom from './pages/BookRoom';
import BookingDetails from './pages/BookingDetails';
import Receipt from './pages/Receipt';
import AdminLogin from './pages/Auth/AdminLogin';
import CreateAdmin from './pages/Auth/CreateAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';
import './index.css';
import BookBanquet from './pages/BookBanquet';
import StaffLogin from './pages/Staff/StaffLogin';
import StaffDashboard from './pages/Staff/StaffDashboard';
import StaffBookingManagement from './pages/Staff/StaffBookingManagement';
import StaffBanquetBookings from './pages/Staff/StaffBanquetBookings';
import StaffRestaurant from './pages/Staff/StaffRestaurant';
import StaffRestaurantOrders from './pages/Staff/StaffRestaurantOrders';
import { AdminGuard, ReceptionGuard, StaffGuard } from './utils/roleGuard';

// Configure axios defaults immediately
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = baseURL;
console.log('Global axios baseURL set to:', baseURL);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Routes WITHOUT Navbar - Staff Portal */}
              <Route path="/staff/*" element={
                <Routes>
                  <Route path="login" element={<StaffLogin />} />
                  <Route path="dashboard" element={
                    <StaffGuard>
                      <StaffDashboard />
                    </StaffGuard>
                  } />
                  <Route path="bookings" element={
                    <StaffGuard>
                      <StaffBookingManagement />
                    </StaffGuard>
                  } />
                  <Route path="banquets" element={
                    <StaffGuard>
                      <StaffBanquetBookings />
                    </StaffGuard>
                  } />
                  <Route path="restaurant" element={
                    <StaffGuard>
                      <StaffRestaurant />
                    </StaffGuard>
                  } />
                  <Route path="orders" element={
                    <StaffGuard>
                      <StaffRestaurantOrders />
                    </StaffGuard>
                  } />
                </Routes>
              } />
              
              {/* Routes WITHOUT Navbar - Admin Portal */}
              <Route path="/admin/*" element={
                <Routes>
                  <Route path="login" element={<AdminLogin />} />
                  <Route path="create" element={<CreateAdmin />} />
                  <Route path="*" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                </Routes>
              } />

              {/* Routes WITH Navbar - Public and User Routes */}
              <Route path="*" element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/rooms" element={<Rooms />} />
                      <Route path="/rooms/book/:roomId" element={<BookRoom />} />
                      <Route path="/banquets" element={<Banquets />} />
                      <Route path="/banquets/book/:banquetId" element={<BookBanquet />} />
                      <Route path="/restaurant" element={<Restaurant />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/booking/:bookingId" element={<BookingDetails />} />
                      <Route path="/receipt/:bookingId" element={<Receipt />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
