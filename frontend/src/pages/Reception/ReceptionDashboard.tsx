import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, BedDouble } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReceptionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      toast.error('Please login to continue');
      navigate('/reception/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.role !== 'reception') {
      toast.error('Access denied. Reception Manager access required.');
      navigate('/reception/login');
      return;
    }

    setUser(parsedUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
    navigate('/reception/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JN Palace Hotel</h1>
              <p className="text-sm text-gray-600">Reception Manager Portal</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600">Reception Manager</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-gray-600">
            Manage front desk operations, check-ins, check-outs, and room status.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center">
              <Calendar className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Today's Bookings</h3>
                <p className="text-sm text-gray-600">View check-ins & check-outs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center">
              <BedDouble className="h-10 w-10 text-green-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Room Status</h3>
                <p className="text-sm text-gray-600">Manage room availability</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center">
              <Calendar className="h-10 w-10 text-purple-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Booking</h3>
                <p className="text-sm text-gray-600">Register walk-in guests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Reception Manager Portal</h3>
          <p className="text-sm text-blue-800">
            This portal provides access to front desk operations including guest check-in/check-out, 
            room status management, and walk-in booking registration. Full booking management and 
            admin features are available in the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
