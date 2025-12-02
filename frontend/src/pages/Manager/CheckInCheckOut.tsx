import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, CheckCircle, LogIn, LogOut, Search } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface Stats {
  todayArrivals: number;
  todayDepartures: number;
  currentGuests: number;
  pendingCheckouts: number;
}

interface Booking {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  resourceId: {
    roomNumber: string;
    type: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  isCheckedIn?: boolean;
  isCheckedOut?: boolean;
}

const CheckInCheckOut: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    todayArrivals: 0,
    todayDepartures: 0,
    currentGuests: 0,
    pendingCheckouts: 0
  });
  const [todayArrivals, setTodayArrivals] = useState<Booking[]>([]);
  const [todayDepartures, setTodayDepartures] = useState<Booking[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<Booking[]>([]);
  const [recentCheckouts, setRecentCheckouts] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast.error('Please login to access this page');
      navigate('/manager/login');
      return;
    }

    fetchStats();
    fetchRecentActivities();
    fetchTodayArrivals();
    fetchTodayDepartures();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/manager/checkin-checkout/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get('/api/manager/checkin-checkout/recent-activities');
      setRecentCheckins(response.data.recentCheckins || []);
      setRecentCheckouts(response.data.recentCheckouts || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const fetchTodayArrivals = async () => {
    try {
      const response = await axios.get('/api/manager/checkin-checkout/today-arrivals');
      setTodayArrivals(response.data.arrivals || []);
    } catch (error) {
      console.error('Failed to fetch arrivals:', error);
    }
  };

  const fetchTodayDepartures = async () => {
    try {
      const response = await axios.get('/api/manager/checkin-checkout/today-departures');
      setTodayDepartures(response.data.departures || []);
    } catch (error) {
      console.error('Failed to fetch departures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (bookingId: string) => {
    try {
      await axios.post(`/api/manager/checkin-checkout/${bookingId}/checkin`);
      toast.success('Guest checked in successfully');
      fetchStats();
      fetchTodayArrivals();
      fetchRecentActivities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in guest');
    }
  };

  const handleCheckout = async (bookingId: string) => {
    try {
      await axios.post(`/api/manager/checkin-checkout/${bookingId}/checkout`);
      toast.success('Guest checked out successfully');
      fetchStats();
      fetchTodayDepartures();
      fetchRecentActivities();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check out guest');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading check-in/checkout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Check-In / Check-Out</h1>
              <p className="text-gray-600 mt-2">Manage guest arrivals and departures</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Today's Arrivals</p>
                <p className="text-2xl font-bold text-blue-900">{stats.todayArrivals}</p>
              </div>
              <LogIn className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Today's Departures</p>
                <p className="text-2xl font-bold text-green-900">{stats.todayDepartures}</p>
              </div>
              <LogOut className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Current Guests</p>
                <p className="text-2xl font-bold text-purple-900">{stats.currentGuests}</p>
              </div>
              <Users className="h-12 w-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Pending Checkouts</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pendingCheckouts}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Today's Arrivals */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Today's Arrivals</h2>
          </div>
          <div className="p-6">
            {todayArrivals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No arrivals scheduled for today
              </div>
            ) : (
              <div className="space-y-4">
                {todayArrivals.map((booking) => (
                  <div key={booking._id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        {booking.user.firstName} {booking.user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Room {booking.resourceId.roomNumber} • {booking.guests} guests
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.user.email} • {booking.user.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCheckin(booking._id)}
                      disabled={booking.isCheckedIn}
                      className={`px-4 py-2 rounded-md ${
                        booking.isCheckedIn
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {booking.isCheckedIn ? 'Checked In' : 'Check In'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Departures */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Today's Departures</h2>
          </div>
          <div className="p-6">
            {todayDepartures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No departures scheduled for today
              </div>
            ) : (
              <div className="space-y-4">
                {todayDepartures.map((booking) => (
                  <div key={booking._id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        {booking.user.firstName} {booking.user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Room {booking.resourceId.roomNumber} • {booking.guests} guests
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.user.email} • {booking.user.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCheckout(booking._id)}
                      disabled={booking.isCheckedOut}
                      className={`px-4 py-2 rounded-md ${
                        booking.isCheckedOut
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {booking.isCheckedOut ? 'Checked Out' : 'Check Out'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInCheckOut;
