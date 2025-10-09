import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, MapPin, Star, CreditCard } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  type: 'room' | 'banquet' | 'table' | 'hotel';
  resourceId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled' | 'failed';
  specialRequests?: string;
  services: string[];
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getResourceTitle = (booking: Booking) => {
    switch (booking.type) {
      case 'room':
        return `Room Booking`;
      case 'banquet':
        return `Banquet Hall`;
      case 'table':
        return `Restaurant Table`;
      case 'hotel':
        return `Hotel Booking`;
      default:
        return 'Booking';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDatesDisplay = (booking: Booking) => {
    if (booking.type === 'table') {
      return formatDate(booking.checkIn);
    }
    return `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}`;
  };

  const tabs = [
    { id: 'bookings', label: 'My Bookings' },
    { id: 'profile', label: 'Profile' },
    { id: 'loyalty', label: 'Loyalty Points' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Manage your bookings and account settings</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Bookings</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{user?.loyaltyPoints || 0}</div>
                  <div className="text-sm text-gray-600">Loyalty Points</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(user?.loyaltyPoints || 0) >= 1000 ? 'Platinum' : (user?.loyaltyPoints || 0) >= 500 ? 'Gold' : 'Silver'}
                  </div>
                  <div className="text-sm text-gray-600">Member Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-600 mb-4">Start planning your stay with us!</p>
                    <Link
                      to="/rooms"
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                      Browse Rooms
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{getResourceTitle(booking)}</h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{getDatesDisplay(booking)}</span>
                            </div>
                            <div className="flex items-center text-gray-600 mt-1">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{booking.guests} guests</span>
                            </div>
                            {booking.specialRequests && (
                              <div className="text-sm text-gray-500 mt-1">
                                Special requests: {booking.specialRequests}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">${booking.totalAmount}</div>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {booking.status}
                            </span>
                            <div className="mt-1">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                booking.paymentStatus === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : booking.paymentStatus === 'pending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : booking.paymentStatus === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : booking.paymentStatus === 'refunded'
                                  ? 'bg-blue-100 text-blue-800'
                                  : booking.paymentStatus === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Link
                            to={`/booking/${booking._id}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                          >
                            View Details
                          </Link>
                          <Link
                            to={`/receipt/${booking._id}`}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
                          >
                            Download Receipt
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.firstName}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.lastName}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Update Profile
                  </button>
                </div>
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === 'loyalty' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Loyalty Program</h2>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold">Gold Member</h3>
                      <p className="text-blue-100">Current Status</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{user?.loyaltyPoints || 250}</div>
                      <p className="text-blue-100">Points</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-white bg-opacity-20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-sm text-blue-100 mt-2">750 points until Platinum status</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Redeem Points</h4>
                    <p className="text-gray-600 text-sm mb-4">Use your points for rewards and discounts</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                      View Rewards
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Earn More Points</h4>
                    <p className="text-gray-600 text-sm mb-4">Book stays and earn points for future rewards</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
