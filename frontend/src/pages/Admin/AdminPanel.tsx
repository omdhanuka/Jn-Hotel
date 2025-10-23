import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Hotel, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Utensils, 
  BedDouble,
  Building,
  Calculator
} from 'lucide-react';
import BookingManagement from './BookingManagement';
import RoomManagement from './RoomManagement';
import BookingChart from './BookingChart';
import BanquetManagement from './BanquetManagement';
import RestaurantManagement from './RestaurantManagement';
import RestaurantOrderManagement from './RestaurantOrderManagement';
import BillManagement from './BillManagement';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminPanel: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookingChartData, setBookingChartData] = useState<Array<{ date: string; room: number; banquet: number; total: number }>>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    roomBookings: 0,
    banquetBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin' },
    { id: 'rooms', label: 'Rooms', icon: BedDouble, path: '/admin/rooms' },
    { id: 'banquets', label: 'Banquets', icon: Building, path: '/admin/banquets' },
    { id: 'restaurant', label: 'Restaurant', icon: Utensils, path: '/admin/restaurant' },
    { id: 'restaurant-orders', label: 'Restaurant Orders', icon: Utensils, path: '/admin/restaurant-orders' },
    { id: 'bills', label: 'Bills', icon: Calculator, path: '/admin/bills' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/admin/bookings' },
    { id: 'chart', label: 'Booking Chart', icon: Calendar, path: '/admin/booking-chart' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const fetchBookingStats = async () => {
    try {
      console.log('Fetching booking stats...');
      const response = await axios.get('/api/bookings/stats');
      console.log('Booking stats response:', response.data);
      
      const { chartData, totalBookings, roomBookings, banquetBookings, todayBookings } = response.data;
      
      setBookingChartData(chartData || []);
      setStats(prev => ({
        ...prev,
        totalBookings: totalBookings || 0,
        roomBookings: roomBookings || 0,
        banquetBookings: banquetBookings || 0,
        todayBookings: todayBookings || 0
      }));
    } catch (error) {
      console.error('Failed to fetch booking stats:', error);
      toast.error('Failed to load booking statistics');
    }
  };

  useEffect(() => {
    fetchBookingStats();
  }, []);

  const statsData = [
    { label: 'Total Bookings', value: stats.totalBookings.toString(), change: '+5%', color: 'blue' },
    { label: 'Room Bookings', value: stats.roomBookings.toString(), change: '+12%', color: 'green' },
    { label: 'Banquet Bookings', value: stats.banquetBookings.toString(), change: '+8%', color: 'purple' },
    { label: 'Today\'s Bookings', value: stats.todayBookings.toString(), change: '+3%', color: 'orange' }
  ];

  const recentBookings = [
    { id: 1, guest: 'John Doe', type: 'Room', date: '2024-03-15', status: 'confirmed' },
    { id: 2, guest: 'Jane Smith', type: 'Banquet', date: '2024-03-16', status: 'pending' },
    { id: 3, guest: 'Mike Johnson', type: 'Restaurant', date: '2024-03-17', status: 'confirmed' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <div className="flex items-center space-x-2">
              <Hotel className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
          </div>
          
          <nav className="mt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={
              <div>
                {/* Dashboard Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600">Overview of hotel operations</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statsData.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <span className={`text-sm font-medium text-${stat.color}-600`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Booking Trends (Last 30 Days)</h3>
                    <span className="text-sm text-gray-500">
                      Total: {bookingChartData.reduce((sum, day) => sum + day.total, 0)} bookings
                    </span>
                  </div>
                  
                  {bookingChartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={bookingChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value, name) => [
                              value, 
                              name === 'room' ? 'Room Bookings' : 
                              name === 'banquet' ? 'Banquet Bookings' : 'Total Bookings'
                            ]}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="room" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            name="Room Bookings"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="banquet" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            name="Banquet Bookings"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            name="Total Bookings"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading booking data...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
                    <div className="space-y-4">
                      {recentBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{booking.guest}</p>
                            <p className="text-sm text-gray-600">{booking.type} - {booking.date}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                      <Link 
                        to="/admin/rooms"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition block text-center"
                      >
                        Add New Room
                      </Link>
                      <Link 
                        to="/admin/bookings"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition block text-center"
                      >
                        Manage Bookings
                      </Link>
                      <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition">
                        Generate Report
                      </button>
                      <Link 
                        to="/admin/restaurant"
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition block text-center"
                      >
                        Update Menu
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            } />
            
            <Route path="/rooms" element={<RoomManagement />} />
            
            <Route path="/banquets" element={<BanquetManagement />} />
            
            <Route path="/restaurant" element={<RestaurantManagement />} />
            
            <Route path="/restaurant-orders" element={<RestaurantOrderManagement />} />

            <Route path="/bills" element={<BillManagement />} />

            <Route path="/bookings" element={<BookingManagement />} />
            
            <Route path="/booking-chart" element={<BookingChart />} />
            
            <Route path="/users" element={
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600">User management interface coming soon...</p>
                </div>
              </div>
            } />
            
            <Route path="/settings" element={
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600">Settings interface coming soon...</p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
