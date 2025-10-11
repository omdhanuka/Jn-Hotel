import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Hotel, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Utensils, 
  BedDouble,
  Building
} from 'lucide-react';
import BookingManagement from './BookingManagement';
import RoomManagement from './RoomManagement';
import BookingChart from './BookingChart';
import BanquetManagement from './BanquetManagement';

const AdminPanel: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin' },
    { id: 'rooms', label: 'Rooms', icon: BedDouble, path: '/admin/rooms' },
    { id: 'banquets', label: 'Banquets', icon: Building, path: '/admin/banquets' },
    { id: 'restaurant', label: 'Restaurant', icon: Utensils, path: '/admin/restaurant' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/admin/bookings' },
    { id: 'chart', label: 'Booking Chart', icon: Calendar, path: '/admin/booking-chart' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const stats = [
    { label: 'Total Rooms', value: '120', change: '+5%', color: 'blue' },
    { label: 'Occupancy Rate', value: '85%', change: '+12%', color: 'green' },
    { label: 'Revenue Today', value: '$12,450', change: '+8%', color: 'purple' },
    { label: 'Active Bookings', value: '68', change: '+3%', color: 'orange' }
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
                  {stats.map((stat, index) => (
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
            
            <Route path="/restaurant" element={
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Restaurant Management</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600">Restaurant management interface coming soon...</p>
                </div>
              </div>
            } />
            
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
    