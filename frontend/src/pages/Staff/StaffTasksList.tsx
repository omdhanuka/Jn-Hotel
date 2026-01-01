import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyTasks, StaffTask } from '../../services/staffApi';
import StaffNavbar from '../../components/Staff/StaffNavbar';

const StaffTasksList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    taskType: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await getMyTasks(filters);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'cleaning': return '🧹';
      case 'maintenance': return '🔧';
      case 'service': return '🛎️';
      case 'banquet_setup': return '🎉';
      case 'restaurant_service': return '🍽️';
      default: return '📋';
    }
  };

  return (
    <>
      <StaffNavbar />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-600 mt-1">View and manage your assigned tasks</p>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
            <select
              value={filters.taskType}
              onChange={(e) => setFilters({ ...filters, taskType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
              <option value="service">Service</option>
              <option value="banquet_setup">Banquet Setup</option>
              <option value="restaurant_service">Restaurant Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading tasks...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg">No tasks found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => navigate(`/staff/tasks/${task._id}`)}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getTaskTypeIcon(task.taskType)}</span>
                    <h3 className="text-lg font-semibold text-gray-800 capitalize">
                      {task.taskType.replace('_', ' ')}
                    </h3>
                    {task.isAutoGenerated && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  {task.room && (
                    <p className="text-sm text-gray-500 mb-2">
                      📍 Room: <span className="font-semibold">{task.room.roomNumber}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.deadline && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                        ⏰ Due: {new Date(task.deadline).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <button className="ml-4 text-blue-600 hover:text-blue-800 font-semibold">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default StaffTasksList;
