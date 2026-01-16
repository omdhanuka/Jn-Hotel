import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount,
  StaffNotification 
} from '../../services/staffApi';
import StaffNavbar from '../../components/Staff/StaffNavbar';
import { 
  Bell, 
  BellOff, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  FileText, 
  Calendar,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

const StaffNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getMyNotifications();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'task_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'task_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'leave_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'leave_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'urgent':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'shift_update':
        return <Clock className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[priority as keyof typeof styles] || styles.medium}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const now = new Date();
      const notifDate = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(notifDate.getTime())) {
        return 'Recently';
      }
      
      const diffMs = now.getTime() - notifDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return notifDate.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNavbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCheck className="w-5 h-5" />
                Mark All Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setFilter('all')}
              className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
                filter === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
                filter === 'unread'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You're all caught up! Check back later for new updates."
                : "We'll notify you when there's something new."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.isRead ? 'border-l-4 border-blue-500' : ''
                }`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className={`text-base font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <p className={`mt-1 text-sm ${!notification.isRead ? 'text-gray-700' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                        </div>
                        {getPriorityBadge(notification.priority)}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(notification.createdAt)}
                        </span>
                        
                        {!notification.isRead && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            New
                          </span>
                        )}

                        {notification.relatedTask && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/staff/tasks/${notification.relatedTask}`);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Task →
                          </button>
                        )}

                        {notification.relatedLeave && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/staff/leaves');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Leave →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffNotifications;
