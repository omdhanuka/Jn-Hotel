import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Briefcase, LogOut, User, Bell } from 'lucide-react';
import { getUnreadCount } from '../../services/staffApi';

const StaffNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch unread notifications count
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/staff/login');
  };

  const getDepartmentDisplay = (department: string) => {
    const departmentMap: { [key: string]: string } = {
      'housekeeping': 'Housekeeping Department',
      'maintenance': 'Maintenance Department',
      'front desk': 'Front Desk Department',
      'restaurant': 'Restaurant Department',
      'banquet': 'Banquet Department'
    };

    return departmentMap[department?.toLowerCase()] || `${department} Department`;
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Department */}
          <div className="flex items-center space-x-4">
            <Link to="/staff/dashboard" className="flex items-center space-x-3">
              <Briefcase className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">JN Palace Hotel</h1>
                {user?.department && (
                  <p className="text-xs text-blue-100">{getDepartmentDisplay(user.department)}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <Link
              to="/staff/dashboard"
              className={`px-4 py-2 rounded-md hover:bg-blue-700 transition ${isActive('/staff/dashboard')}`}
            >
              Dashboard
            </Link>
            <Link
              to="/staff/tasks"
              className={`px-4 py-2 rounded-md hover:bg-blue-700 transition ${isActive('/staff/tasks')}`}
            >
              My Tasks
            </Link>
            <Link
              to="/staff/leaves"
              className={`px-4 py-2 rounded-md hover:bg-blue-700 transition ${isActive('/staff/leaves')}`}
            >
              Leave
            </Link>
            <Link
              to="/staff/profile"
              className={`px-4 py-2 rounded-md hover:bg-blue-700 transition ${isActive('/staff/profile')}`}
            >
              Profile
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/staff/notifications')}
              className="relative px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-blue-400">
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-blue-100 capitalize">{user?.position || 'Staff Member'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-red-600 transition"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default StaffNavbar;
