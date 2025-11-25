import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Users, Building, Utensils, MessageSquare, BarChart3, AlertTriangle, Shield, BedDouble, CreditCard } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// Define extended user type with staff properties
interface StaffUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  position?: string;
  isActive: boolean;
}

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessibleSections, setAccessibleSections] = useState<string[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        toast.error('Please login to continue');
        navigate('/staff/login');
        return;
      }

      const parsedUser = JSON.parse(userData) as StaffUser;
      
      if (parsedUser.role !== 'staff' && parsedUser.role !== 'reception') {
        toast.error('Access denied. Staff credentials required.');
        navigate('/staff/login');
        return;
      }

      setUser(parsedUser);

      try {
        // Use the new auth endpoint instead of admin endpoint
        const response = await axios.get('/api/auth/me/permissions');
        console.log('User permissions response:', response.data);
        setAccessibleSections(response.data.accessibleSections || ['dashboard']);
      } catch (error: any) {
        console.error('Failed to fetch permissions:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/staff/login');
        } else {
          // Default to just dashboard if fetch fails
          setAccessibleSections(['dashboard']);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/staff/login');
  };

  const hasAccess = (section: string) => {
    return accessibleSections.includes(section);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Define all possible sections with their display info
  const allSections = [
    {
      id: 'bookings',
      icon: Calendar,
      title: 'Room Bookings',
      description: 'View and manage room bookings',
      color: 'blue',
      link: '/staff/bookings'
    },
    {
      id: 'rooms',
      icon: BedDouble,
      title: 'Rooms',
      description: 'Manage room information',
      color: 'green',
      link: '/staff/rooms'
    },
    {
      id: 'banquets',
      icon: Building,
      title: 'Banquet Bookings',
      description: 'View and manage banquet hall bookings',
      color: 'purple',
      link: '/staff/banquets'
    },
    {
      id: 'restaurant',
      icon: Utensils,
      title: 'Restaurant',
      description: 'View menu and tables',
      color: 'orange',
      link: '/staff/restaurant'
    },
    {
      id: 'orders',
      icon: Utensils,
      title: 'Restaurant Orders',
      description: 'Manage restaurant orders',
      color: 'red',
      link: '/staff/orders'
    },
    {
      id: 'reviews',
      icon: MessageSquare,
      title: 'Reviews',
      description: 'View guest reviews',
      color: 'pink',
      link: '/staff/reviews'
    },
    {
      id: 'users',
      icon: Users,
      title: 'Users',
      description: 'View user information',
      color: 'indigo',
      link: '/staff/users'
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: 'Reports',
      description: 'View analytics and reports',
      color: 'cyan',
      link: '/staff/reports'
    },
    {
      id: 'bills',
      icon: CreditCard,
      title: 'Bills',
      description: 'View and manage bills',
      color: 'yellow',
      link: '/staff/bills'
    }
  ];

  // Filter sections based on user's accessible sections
  const availableSections = allSections.filter(section => 
    accessibleSections.includes(section.id)
  );

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      pink: 'text-pink-600',
      indigo: 'text-indigo-600',
      cyan: 'text-cyan-600',
      yellow: 'text-yellow-600'
    };
    return colors[color] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JN Palace Hotel</h1>
              <p className="text-sm text-gray-600">Staff Portal</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {user.department || 'Staff'} {user.position && `• ${user.position}`}
                </p>
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
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-gray-600">
            {user.department && `${user.department} ${user.position ? `• ${user.position}` : ''}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            You have access to {availableSections.length} section{availableSections.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Available Sections Grid */}
        {availableSections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {availableSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  onClick={() => navigate(section.link)}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center">
                    <Icon className={`h-10 w-10 ${getColorClasses(section.color)} mr-4`} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Permissions Assigned</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  You currently have no specific permissions assigned to access any sections. 
                  Please contact your administrator to request access.
                </p>
                <p className="text-sm text-yellow-800">
                  Available sections include: Bookings, Rooms, Banquets, Restaurant, Orders, Reviews, Users, Reports, and Bills.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Permissions Summary</h3>
          
          {availableSections.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableSections.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{section.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No permissions granted yet</p>
          )}
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Staff Portal</h3>
              <p className="text-sm text-blue-800 mb-2">
                This is a permission-based portal for hotel staff. You can only access sections 
                that have been granted to you by the administrator.
              </p>
              <p className="text-sm text-blue-800">
                {user.role === 'reception' ? (
                  <>For front desk operations, visit the <a href="/reception/dashboard" className="underline font-medium">Reception Manager Portal</a>.</>
                ) : (
                  <>If you need additional access, please contact your administrator or manager.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
