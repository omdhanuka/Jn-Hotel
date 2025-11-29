import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Users, Building, Utensils, BarChart3, Shield, AlertTriangle, BedDouble, ClipboardCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface ManagerUser {
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

interface DashboardStats {
  totalBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  occupiedRooms: number;
  availableRooms: number;
  pendingTasks: number;
  pendingComplaints: number;
}

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<ManagerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    pendingTasks: 0,
    pendingComplaints: 0
  });

  useEffect(() => {
    const verifyManagerAccess = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        toast.error('Please login to continue');
        navigate('/manager/login');
        return;
      }

      const parsedUser = JSON.parse(userData) as ManagerUser;
      
      if (parsedUser.role !== 'manager' && parsedUser.role !== 'admin') {
        toast.error('Access denied. Manager credentials required.');
        navigate('/manager/login');
        return;
      }

      setUser(parsedUser);
      await fetchDashboardStats();
      setLoading(false);
    };

    verifyManagerAccess();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/manager/dashboard');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/manager/login');
      }
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/manager/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const managerSections = [
    {
      id: 'bookings',
      icon: Calendar,
      title: 'All Bookings',
      description: 'View and manage all bookings',
      color: 'blue',
      link: '/manager/bookings',
      stat: stats.totalBookings
    },
    {
      id: 'rooms',
      icon: BedDouble,
      title: 'Room Operations',
      description: 'Manage room status and operations',
      color: 'green',
      link: '/manager/room-operations', // Updated link
      stat: `${stats.occupiedRooms}/${stats.occupiedRooms + stats.availableRooms}`
    },
    {
      id: 'check-in-out',
      icon: ClipboardCheck,
      title: 'Check-In/Out',
      description: 'Handle guest arrivals and departures',
      color: 'purple',
      link: '/manager/check-in-out',
      stat: `${stats.todayCheckIns}/${stats.todayCheckOuts}`
    },
    {
      id: 'tasks',
      icon: ClipboardCheck,
      title: 'Staff Tasks',
      description: 'Monitor and approve staff tasks',
      color: 'orange',
      link: '/manager/tasks',
      stat: stats.pendingTasks
    },
    {
      id: 'banquets',
      icon: Building,
      title: 'Banquet Management',
      description: 'Oversee banquet bookings',
      color: 'pink',
      link: '/manager/banquets'
    },
    {
      id: 'restaurant',
      icon: Utensils,
      title: 'Restaurant',
      description: 'Monitor restaurant operations',
      color: 'red',
      link: '/manager/restaurant'
    },
    {
      id: 'complaints',
      icon: AlertTriangle,
      title: 'Guest Complaints',
      description: 'Address guest issues',
      color: 'yellow',
      link: '/manager/complaints',
      stat: stats.pendingComplaints
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'View performance reports',
      color: 'cyan',
      link: '/manager/reports'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      purple: 'text-purple-600 bg-purple-50',
      orange: 'text-orange-600 bg-orange-50',
      red: 'text-red-600 bg-red-50',
      pink: 'text-pink-600 bg-pink-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      cyan: 'text-cyan-600 bg-cyan-50'
    };
    return colors[color] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Shield className="h-10 w-10 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
                <p className="text-indigo-100 text-sm">JN Palace Hotel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-indigo-100">
                  {user.department || 'Management'} {user.position && `• ${user.position}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-md hover:bg-white/30 transition"
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
            You have full supervisory access to manage hotel operations.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied Rooms</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.occupiedRooms}</p>
              </div>
              <BedDouble className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Check-Ins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayCheckIns}</p>
              </div>
              <ClipboardCheck className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingTasks}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Manager Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {managerSections.map((section) => {
            const Icon = section.icon;
            const colorClasses = getColorClasses(section.color);
            
            return (
              <div
                key={section.id}
                onClick={() => navigate(section.link)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200 hover:border-indigo-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {section.stat !== undefined && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                      {section.stat}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-sm text-gray-600">{section.description}</p>
              </div>
            );
          })}
        </div>

        {/* Manager Capabilities Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Manager Portal</h3>
              <p className="text-sm text-indigo-800 mb-3">
                As a hotel manager, you have supervisory access to oversee and manage all hotel operations. 
                You can view reports, approve tasks, handle guest services, and ensure smooth daily operations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-indigo-800">
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Manage all bookings and reservations</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Supervise room operations</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Approve and monitor staff tasks</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Handle guest complaints</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Access reports and analytics</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Manage check-ins and check-outs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
