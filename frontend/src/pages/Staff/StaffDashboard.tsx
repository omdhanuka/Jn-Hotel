import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTaskStats, getMyNotifications, getUnreadCount, StaffTask } from '../../services/staffApi';
import StaffNavbar from '../../components/Staff/StaffNavbar';

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, unreadRes] = await Promise.all([
        getMyTaskStats(),
        getUnreadCount()
      ]);
      setStats(statsRes);
      setUnreadCount(unreadRes.unreadCount);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const StatCard = ({ title, value, color, icon, onClick }: any) => (
    <div 
      className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${onClick ? 'hover:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <>
      <StaffNavbar />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your daily summary</p>
        </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Pending Tasks"
          value={stats?.pending || 0}
          color="text-yellow-600"
          icon="⏳"
          onClick={() => navigate('/staff/tasks?status=pending')}
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgress || 0}
          color="text-blue-600"
          icon="🔄"
          onClick={() => navigate('/staff/tasks?status=in_progress')}
        />
        <StatCard
          title="Completed Today"
          value={stats?.completedToday || 0}
          color="text-green-600"
          icon="✅"
        />
        <StatCard
          title="Urgent Tasks"
          value={stats?.urgentTasks || 0}
          color="text-red-600"
          icon="⚠️"
          onClick={() => navigate('/staff/tasks?priority=urgent')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/staff/tasks')}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>📋</span>
            <span>View All Tasks</span>
          </button>
          <button
            onClick={() => navigate('/staff/leaves')}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <span>🏖️</span>
            <span>Leave Management</span>
          </button>
          <button
            onClick={() => navigate('/staff/profile')}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span>👤</span>
            <span>My Profile</span>
          </button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Success Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats?.completed > 0 
                ? Math.round((stats.completed / (stats.completed + stats.rejected)) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Today's Progress</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.completedToday || 0}</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default StaffDashboard;
