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
import axios from 'axios';
import './index.css';

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
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/rooms/book/:roomId" element={<BookRoom />} />
                <Route path="/banquets" element={<Banquets />} />
                <Route path="/restaurant" element={<Restaurant />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin/*" element={<AdminPanel />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
