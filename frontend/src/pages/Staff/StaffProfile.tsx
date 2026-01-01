import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getMyPerformanceMetrics, getMyActivityLog, updateMyProfile, StaffProfile } from '../../services/staffApi';
import StaffNavbar from '../../components/Staff/StaffNavbar';
import toast from 'react-hot-toast';

const StaffProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    address: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, activityRes] = await Promise.all([
        getMyProfile(),
        getMyActivityLog()
      ]);
      setProfile(profileRes.profile);
      setActivityLog(activityRes.activityLog || []);
      
      // Set form data
      if (profileRes.profile) {
        setFormData({
          phoneNumber: profileRes.profile.user.phoneNumber || '',
          emergencyContact: profileRes.profile.emergencyContact || {
            name: '',
            relationship: '',
            phone: ''
          },
          address: profileRes.profile.address || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMyProfile(formData);
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <>
        <StaffNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <StaffNavbar />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Profile not found. Please contact your administrator.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StaffNavbar />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your personal information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Emergency Contact</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={formData.emergencyContact.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Relationship"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                      <input
                        type="tel"
                        placeholder="Contact Phone"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        fetchData();
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{profile.user.firstName} {profile.user.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Staff ID</p>
                      <p className="font-semibold">{profile.staffId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{profile.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{profile.user.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-semibold capitalize">{profile.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Staff Type</p>
                      <p className="font-semibold capitalize">{profile.staffType}</p>
                    </div>
                  </div>
                  {profile.address && (
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold">{profile.address}</p>
                    </div>
                  )}
                  {profile.emergencyContact && profile.emergencyContact.name && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">Emergency Contact</p>
                      <div className="space-y-1">
                        <p><span className="font-medium">Name:</span> {profile.emergencyContact.name}</p>
                        <p><span className="font-medium">Relationship:</span> {profile.emergencyContact.relationship}</p>
                        <p><span className="font-medium">Phone:</span> {profile.emergencyContact.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              {activityLog.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activityLog.map((task) => (
                    <div key={task._id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-semibold capitalize">{task.taskType.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">{task.room?.roomNumber && `Room ${task.room.roomNumber}`}</p>
                      <p className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'verified' ? 'bg-green-100 text-green-800' :
                        task.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{profile.performanceMetrics.tasksCompleted}</p>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{profile.performanceMetrics.tasksRejected}</p>
                  <p className="text-sm text-gray-600">Tasks Rejected</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{profile.performanceMetrics.averageCompletionTime}</p>
                  <p className="text-sm text-gray-600">Avg. Time (min)</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{profile.performanceMetrics.rating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Rating (out of 5)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Leave Balance</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sick Leave</span>
                  <span className="font-bold text-blue-600">{profile.leaveBalance.sick} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Casual Leave</span>
                  <span className="font-bold text-green-600">{profile.leaveBalance.casual} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Annual Leave</span>
                  <span className="font-bold text-purple-600">{profile.leaveBalance.annual} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffProfilePage;
