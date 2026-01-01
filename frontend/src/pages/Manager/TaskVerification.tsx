import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Image as ImageIcon,
  User,
  Calendar,
  MapPin,
  MessageSquare,
  ArrowLeft,
  ZoomIn
} from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';

interface CompletedTask {
  _id: string;
  taskType: string;
  title: string;
  description: string;
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  room?: {
    _id: string;
    roomNumber: string;
  };
  area?: string;
  priority: string;
  status: string;
  completedAt: string;
  completionPhotos: string[];
  completionNotes?: string;
  createdAt: string;
  dueTime?: string;
}

const TaskVerification: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<CompletedTask | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast.error('Please login to access this page');
      navigate('/manager/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'manager' && userData.role !== 'admin') {
      toast.error('Access denied. Manager privileges required.');
      navigate('/');
      return;
    }

    fetchPendingVerificationTasks();
  }, [navigate]);

  const fetchPendingVerificationTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/manager/staff-tasks/pending-verification');
      console.log('Fetched tasks:', response.data.tasks);
      setTasks(response.data.tasks || []);
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      toast.error(error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to approve this task?')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.patch(`/manager/staff-tasks/${taskId}/verify`, {
        verificationNotes
      });
      
      toast.success('Task verified successfully!');
      setSelectedTask(null);
      setVerificationNotes('');
      fetchPendingVerificationTasks();
    } catch (error: any) {
      console.error('Verify task error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this task? The staff member will need to redo it.')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.patch(`/manager/staff-tasks/${taskId}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      
      toast.success('Task rejected. Staff member has been notified.');
      setSelectedTask(null);
      setRejectionReason('');
      fetchPendingVerificationTasks();
    } catch (error: any) {
      console.error('Reject task error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject task');
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImageUrl = (photoPath: string) => {
    if (!photoPath) {
      console.warn('Empty photo path provided');
      return '';
    }
    
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    
    // Remove /api prefix if present since uploads are served from root
    const cleanPath = photoPath.replace('/api', '');
    const baseURL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const fullUrl = `${baseURL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    
    console.log('Image URL constructed:', fullUrl);
    return fullUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Task Verification</h1>
          <p className="text-gray-600 mt-2">
            Review and verify completed tasks from staff members
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{tasks.length}</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">
              There are no tasks pending verification at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  {/* Task Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{task.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Task Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </span>
                    </div>
                    
                    {task.room && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>Room {task.room.roomNumber}</span>
                      </div>
                    )}
                    
                    {task.area && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{task.area}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Completed: {new Date(task.completedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Completion Notes */}
                  {task.completionNotes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      <div className="flex items-start">
                        <MessageSquare className="h-4 w-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Staff Notes:
                          </p>
                          <p className="text-sm text-blue-800">{task.completionNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion Photos */}
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <ImageIcon className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Completion Photos ({task.completionPhotos.length})
                      </span>
                    </div>
                    
                    {task.completionPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {task.completionPhotos.map((photo, index) => (
                          <div
                            key={index}
                            className="relative aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer group"
                            onClick={() => setSelectedImage(getImageUrl(photo))}
                          >
                            <img
                              src={getImageUrl(photo)}
                              alt={`Completion photo ${index + 1}`}
                              className="w-full h-full object-cover transition group-hover:scale-110"
                              onError={(e) => {
                                console.error('Failed to load image:', photo, 'URL:', getImageUrl(photo));
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                              onLoad={() => console.log('Image loaded successfully:', photo)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No photos uploaded</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setRejectionReason('');
                        setVerificationNotes('');
                      }}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Review & Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Verify Task: {selectedTask.title}
                </h2>

                {/* Task Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Staff Member</p>
                      <p className="font-medium">
                        {selectedTask.assignedTo.firstName} {selectedTask.assignedTo.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium">
                        {selectedTask.room ? `Room ${selectedTask.room.roomNumber}` : selectedTask.area || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Completed At</p>
                      <p className="font-medium">
                        {new Date(selectedTask.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Priority</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>

                  {selectedTask.completionNotes && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm mb-1">Staff Notes:</p>
                      <p className="text-gray-900">{selectedTask.completionNotes}</p>
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Completion Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedTask.completionPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
                        onClick={() => setSelectedImage(getImageUrl(photo))}
                      >
                        <img
                          src={getImageUrl(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Modal image load failed:', photo);
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Notes (Optional) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes (Optional)
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Add any notes about the task verification..."
                  />
                </div>

                {/* Rejection Reason (if rejecting) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (Required if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Explain why this task is being rejected..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedTask(null)}
                    disabled={actionLoading}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedTask._id)}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    {actionLoading ? 'Processing...' : 'Reject Task'}
                  </button>
                  <button
                    onClick={() => handleVerify(selectedTask._id)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {actionLoading ? 'Processing...' : 'Approve Task'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="max-w-5xl max-h-full">
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              aria-label="Close image"
            >
              <XCircle className="h-8 w-8" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskVerification;
