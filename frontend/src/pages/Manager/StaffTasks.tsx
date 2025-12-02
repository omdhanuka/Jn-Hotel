import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Plus,
  Filter,
  Search,
  BarChart3,
  UserCheck,
  MessageSquare,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import axios from '../../utils/axios'; // Make sure to use the configured axios instance
import toast from 'react-hot-toast';

type TabType = 'tasks' | 'assign' | 'performance' | 'attendance' | 'requests';

interface Task {
  _id: string;
  taskId: string;
  staffId: {
    _id: string;
    firstName: string;
    lastName: string;
    department: string;
  };
  category: string;
  roomNumber?: string;
  priority: string;
  status: string;
  deadline: string;
  notes?: string;
  createdAt: string;
}

interface Performance {
  staffId: string;
  name: string;
  department: string;
  completedTasks: number;
  pendingTasks: number;
  delayedTasks: number;
  averageTime: number;
  performanceScore: number;
}

interface Attendance {
  staffId: string;
  name: string;
  department: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  shiftStart: string;
  shiftEnd: string;
}

interface StaffRequest {
  _id: string;
  staffId: {
    firstName: string;
    lastName: string;
    department: string;
  };
  requestType: string;
  subject: string;
  description: string;
  roomNumber?: string;
  priority: string;
  status: string;
  createdAt: string;
}

const StaffTasks: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    pendingRequests: 0
  });

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    staffId: ''
  });

  // Performance
  const [performance, setPerformance] = useState<Performance[]>([]);

  // Attendance
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  // Requests
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [requestFilters, setRequestFilters] = useState({
    status: 'all',
    type: 'all'
  });

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StaffRequest | null>(null);

  // Staff list for task assignment
  const [staffList, setStaffList] = useState<any[]>([]);

  // Task form
  const [taskForm, setTaskForm] = useState({
    staffId: '',
    category: 'room-cleaning',
    roomNumber: '',
    priority: 'medium',
    deadline: '',
    notes: ''
  });

  useEffect(() => {
    // Check authentication before loading
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

    // Load data
    fetchStats();
    fetchStaffList();
    fetchTasks();
    fetchAttendance();
  }, [navigate]);

  useEffect(() => {
    switch (activeTab) {
      case 'tasks':
        fetchTasks();
        break;
      case 'performance':
        fetchPerformance();
        break;
      case 'attendance':
        fetchAttendance();
        break;
      case 'requests':
        fetchRequests();
        break;
    }
  }, [activeTab, taskFilters, requestFilters]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Verify token exists before making request
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please login again.');
        navigate('/manager/login');
        return;
      }

      const response = await axios.get('/api/manager/staff/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/manager/login');
      } else {
        toast.error('Failed to load statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      // Verify token exists
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await axios.get('/api/manager/staff/list');
      setStaffList(response.data.staff || []);
    } catch (error: any) {
      console.error('Failed to fetch staff list:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load staff list');
      }
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Verify token exists
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const params = new URLSearchParams();
      if (taskFilters.status !== 'all') params.append('status', taskFilters.status);
      if (taskFilters.priority !== 'all') params.append('priority', taskFilters.priority);
      if (taskFilters.category !== 'all') params.append('category', taskFilters.category);
      if (taskFilters.staffId) params.append('staffId', taskFilters.staffId);

      const response = await axios.get(`/api/manager/staff/tasks?${params.toString()}`);
      setTasks(response.data.tasks || []);
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/manager/login');
      } else {
        toast.error('Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/manager/staff/performance');
      setPerformance(response.data.performance || []);
    } catch (error) {
      toast.error('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/manager/staff/attendance/today');
      setAttendance(response.data.attendance || []);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (requestFilters.status !== 'all') params.append('status', requestFilters.status);
      if (requestFilters.type !== 'all') params.append('type', requestFilters.type);

      const response = await axios.get(`/api/manager/staff/requests?${params.toString()}`);
      setRequests(response.data.requests || []);
    } catch (error) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      await axios.post('/api/manager/staff/tasks', taskForm);
      toast.success('Task assigned successfully');
      setShowTaskModal(false);
      resetTaskForm();
      fetchTasks();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      await axios.put(`/api/manager/staff/tasks/${editingTask._id}`, taskForm);
      toast.success('Task updated successfully');
      setShowTaskModal(false);
      setEditingTask(null);
      resetTaskForm();
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`/api/manager/staff/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateRequest = async (requestId: string, status: string, notes: string = '') => {
    try {
      await axios.put(`/api/manager/staff/requests/${requestId}`, { status, reviewNotes: notes });
      toast.success('Request updated successfully');
      setShowRequestModal(false);
      setSelectedRequest(null);
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update request');
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      staffId: '',
      category: 'room-cleaning',
      roomNumber: '',
      priority: 'medium',
      deadline: '',
      notes: ''
    });
  };

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        staffId: task.staffId._id,
        category: task.category,
        roomNumber: task.roomNumber || '',
        priority: task.priority,
        deadline: new Date(task.deadline).toISOString().slice(0, 16),
        notes: task.notes || ''
      });
    } else {
      resetTaskForm();
    }
    setShowTaskModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Staff Tasks Management</h1>
          <p className="text-gray-600 mt-2">Assign tasks, track performance, and manage staff</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStaff}</p>
              </div>
              <Users className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <p className="text-sm font-medium text-green-600">Present Today</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.presentToday}</p>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <p className="text-sm font-medium text-yellow-600">Pending Tasks</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingTasks}</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
            <p className="text-sm font-medium text-red-600">Overdue</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats.overdueTasks}</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
            <p className="text-sm font-medium text-purple-600">Requests</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.pendingRequests}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'tasks', label: 'All Tasks', icon: ClipboardList },
                { id: 'assign', label: 'Assign Task', icon: Plus },
                { id: 'performance', label: 'Staff Performance', icon: BarChart3 },
                { id: 'attendance', label: 'Attendance', icon: UserCheck },
                { id: 'requests', label: 'Staff Requests', icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* All Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={taskFilters.status}
                    onChange={(e) => setTaskFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <select
                    value={taskFilters.priority}
                    onChange={(e) => setTaskFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select
                    value={taskFilters.category}
                    onChange={(e) => setTaskFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Categories</option>
                    <option value="room-cleaning">Room Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="guest-support">Guest Support</option>
                    <option value="food-delivery">Food Delivery</option>
                    <option value="laundry">Laundry</option>
                    <option value="emergency">Emergency</option>
                    <option value="inventory">Inventory</option>
                  </select>
                  
                  <button
                    onClick={() => openTaskModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </button>
                </div>
              </div>

              {/* Tasks Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No tasks found
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{task.taskId}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {task.staffId.firstName} {task.staffId.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{task.staffId.department}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                            {task.category.replace('-', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{task.roomNumber || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(task.deadline).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openTaskModal(task)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assign Task Tab */}
          {activeTab === 'assign' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Assign New Task</h3>
              
              {/* Debug info */}
              {staffList.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No staff members available. Make sure staff are registered in the system.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to Staff *
                    </label>
                    <select
                      value={taskForm.staffId}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, staffId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select staff member...</option>
                      {staffList.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName} - {staff.department || staff.role}
                        </option>
                      ))}
                    </select>
                    {staffList.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No staff members found. Please register staff first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Category *
                    </label>
                    <select
                      value={taskForm.category}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="room-cleaning">Room Cleaning</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="guest-support">Guest Support</option>
                      <option value="food-delivery">Food Delivery</option>
                      <option value="laundry">Laundry</option>
                      <option value="emergency">Emergency Response</option>
                      <option value="inventory">Inventory Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={taskForm.roomNumber}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., 205"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes / Instructions
                  </label>
                  <textarea
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Special instructions or details..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={resetTaskForm}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleCreateTask}
                    disabled={!taskForm.staffId || !taskForm.deadline}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Assign Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delayed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performance.map((perf) => (
                    <tr key={perf.staffId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{perf.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{perf.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{perf.completedTasks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{perf.pendingTasks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{perf.delayedTasks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{perf.averageTime} min</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            perf.performanceScore >= 80 ? 'bg-green-100 text-green-800' :
                            perf.performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {perf.performanceScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold">Today's Attendance - {new Date().toLocaleDateString()}</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((att) => (
                    <tr key={att.staffId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{att.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{att.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{att.shiftStart} - {att.shiftEnd}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          att.status === 'present' ? 'bg-green-100 text-green-800' :
                          att.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={requestFilters.status}
                    onChange={(e) => setRequestFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  
                  <select
                    value={requestFilters.type}
                    onChange={(e) => setRequestFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Types</option>
                    <option value="leave">Leave Request</option>
                    <option value="inventory">Inventory Request</option>
                    <option value="issue-report">Issue Report</option>
                    <option value="guest-complaint">Guest Complaint</option>
                    <option value="room-damage">Room Damage</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {requests.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No staff requests found</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div key={request._id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-lg">{request.subject}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Staff:</strong> {request.staffId.firstName} {request.staffId.lastName} ({request.staffId.department})</p>
                            <p><strong>Type:</strong> {request.requestType.replace('-', ' ')}</p>
                            {request.roomNumber && <p><strong>Room:</strong> {request.roomNumber}</p>}
                            <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                            <p className="mt-2">{request.description}</p>
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleUpdateRequest(request._id, 'approved')}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateRequest(request._id, 'rejected')}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button 
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                    resetTaskForm();
                  }} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Staff Member *
                    </label>
                    <select
                      value={taskForm.staffId}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, staffId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select staff...</option>
                      {staffList.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={taskForm.category}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="room-cleaning">Room Cleaning</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="guest-support">Guest Support</option>
                      <option value="food-delivery">Food Delivery</option>
                      <option value="laundry">Laundry</option>
                      <option value="emergency">Emergency</option>
                      <option value="inventory">Inventory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={taskForm.roomNumber}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowTaskModal(false);
                      setEditingTask(null);
                      resetTaskForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingTask ? handleUpdateTask : handleCreateTask}
                    disabled={!taskForm.staffId || !taskForm.deadline}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTasks;
