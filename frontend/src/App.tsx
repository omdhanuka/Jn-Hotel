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
import RoomBookingInvoice from './pages/RoomBookingInvoice';
import RestaurantInvoice from './pages/RestaurantInvoice';
import BanquetBookingInvoice from './pages/BanquetBookingInvoice';
import AdminLogin from './pages/Auth/AdminLogin';
import CreateAdmin from './pages/Auth/CreateAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';
import './index.css';
import BookBanquet from './pages/BookBanquet';
import { AdminGuard, ReceptionGuard, StaffGuard } from './utils/roleGuard';
import ManagerLogin from './pages/Manager/ManagerLogin';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import AllBookings from './pages/Manager/AllBookings';
import RoomOperations from './pages/Manager/RoomOperations';
import CheckInCheckOut from './pages/Manager/CheckInCheckOut';
import StaffTasks from './pages/Manager/StaffTasks';
import BanquetManagement from './pages/Manager/BanquetManagement';
import RestaurantManagement from './pages/Manager/RestaurantManagement';
import ComplaintManagement from './pages/Manager/ComplaintManagement';
import ManualBooking from './pages/Manager/ManualBooking';
import BookingCalendar from './pages/Manager/BookingCalendar';
import StaffDashboard from './pages/Staff/StaffDashboard';
import StaffTasksList from './pages/Staff/StaffTasksList';
import StaffTaskDetails from './pages/Staff/StaffTaskDetails';
import StaffLogin from './pages/Staff/StaffLogin';
import StaffLeaveManagement from './pages/Staff/StaffLeaveManagement';
import StaffProfile from './pages/Staff/StaffProfile';
import StaffNotifications from './pages/Staff/StaffNotifications';
import TaskVerification from './pages/Manager/TaskVerification';
import ReportsAnalytics from './pages/Manager/ReportsAnalytics';
import SpecialOffers from './pages/SpecialOffers';
import UpcomingBookings from './pages/UpcomingBookings';
import BookingHistory from './pages/BookingHistory';
import AccountSettings from './pages/AccountSettings';
import QRMenu from './pages/QRMenu';
import QRTableDashboard from './pages/Admin/QRTableDashboard';

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
              {/* QR Menu - Public (no Navbar) */}
              <Route path="/menu" element={<QRMenu />} />

              {/* Routes WITHOUT Navbar - Admin Portal */}
              <Route path="/admin/*" element={
                <Routes>
                  <Route path="login" element={<AdminLogin />} />
                  <Route path="create" element={<CreateAdmin />} />
                  <Route path="qr-tables" element={
                    <ProtectedRoute adminOnly={true}>
                      <QRTableDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                </Routes>
              } />

              {/* Manager Routes */}
              <Route path="/manager/login" element={<ManagerLogin />} />
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/reports" element={<ReportsAnalytics />} />
              <Route path="/manager/manual-booking" element={<ManualBooking />} />
              <Route path="/manager/bookings" element={<AllBookings />} />
              <Route path="/manager/booking-calendar" element={<BookingCalendar />} />
              <Route path="/manager/room-operations" element={<RoomOperations />} />
              <Route path="/manager/checkin-checkout" element={<CheckInCheckOut />} />
              <Route path="/manager/staff-tasks" element={<StaffTasks />} />
              <Route path="/manager/task-verification" element={<TaskVerification />} />
              <Route path="/manager/banquets" element={<BanquetManagement />} />
              <Route path="/manager/rooms" element={<RoomOperations />} />
              <Route path="/manager/restaurant" element={<RestaurantManagement />} />
              <Route path="/manager/complaints" element={<ComplaintManagement />} />

              {/* Staff Routes */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/tasks" element={<StaffTasksList />} />
              <Route path="/staff/tasks/:taskId" element={<StaffTaskDetails />} />
              <Route path="/staff/leaves" element={<StaffLeaveManagement />} />
              <Route path="/staff/profile" element={<StaffProfile />} />
              <Route path="/staff/notifications" element={<StaffNotifications />} />
              
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
                      <Route path="/special-offers" element={<SpecialOffers />} />
                      <Route path="/upcoming-bookings" element={<UpcomingBookings />} />
                      <Route path="/booking-history" element={<BookingHistory />} />
                      <Route path="/account-settings" element={<AccountSettings />} />
                      <Route path="/booking/:bookingId" element={<BookingDetails />} />
                      <Route path="/receipt/:bookingId" element={<Receipt />} />
                      <Route path="/invoice/room/:bookingId" element={<RoomBookingInvoice />} />
                      <Route path="/invoice/restaurant/:billId" element={<RestaurantInvoice />} />
                      <Route path="/invoice/banquet/:bookingId" element={<BanquetBookingInvoice />} />
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
