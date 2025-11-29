import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck, LogOut, RefreshCw, Clock, User, Mail, Phone, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CheckInTab from '../../components/Manager/CheckIn/CheckInTab';
import CheckOutTab from '../../components/Manager/CheckOut/CheckOutTab';

type TabType = 'checkin' | 'checkout';

interface RecentActivity {
  _id: string;
  type: 'checkin' | 'checkout';
  bookingId: string;
  guestName: string;
  roomNumber: string;
  timestamp: string;
  performedBy: string;
}

const CheckInCheckOut: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('checkin');
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await axios.get('/api/manager/checkin-checkout/recent-activities');
      setRecentActivities(response.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleActivityRefresh = () => {
    fetchRecentActivities();
    toast.success('Activity list refreshed');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Check-In / Check-Out</h1>
              <p className="text-gray-600 mt-2">Manage guest arrivals and departures</p>
            </div>
            <button
              onClick={handleActivityRefresh}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('checkin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'checkin'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="inline h-5 w-5 mr-2" />
                Check-In
              </button>
              <button
                onClick={() => setActiveTab('checkout')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'checkout'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LogOut className="inline h-5 w-5 mr-2" />
                Check-Out
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'checkin' ? (
            <CheckInTab onSuccess={fetchRecentActivities} />
          ) : (
            <CheckOutTab onSuccess={fetchRecentActivities} />
          )}
        </div>

        {/* Recent Activity List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                Recent Check-In/Out Activity
              </h2>
              <span className="text-sm text-gray-500">
                Last 24 hours
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loadingActivities ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading activities...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent check-in/out activity</p>
                <p className="text-sm text-gray-400 mt-2">Activity from the last 24 hours will appear here</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-full ${
                        activity.type === 'checkin' 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                      }`}>
                        {activity.type === 'checkin' ? (
                          <UserCheck className={`h-6 w-6 ${
                            activity.type === 'checkin' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        ) : (
                          <LogOut className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {activity.type === 'checkin' ? 'Check-In' : 'Check-Out'}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            activity.type === 'checkin'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {activity.type === 'checkin' ? 'Checked In' : 'Checked Out'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span className="font-medium">{activity.guestName}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Room:</span>
                            <span>{activity.roomNumber}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Booking ID:</span>
                            <span className="font-mono text-xs">#{activity.bookingId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(activity.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        by {activity.performedBy}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInCheckOut;
