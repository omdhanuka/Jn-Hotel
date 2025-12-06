import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BedDouble, CheckCircle, AlertTriangle, Wrench, ClipboardList, 
  Package, Activity, Search, Filter, Plus, Eye, Clock, Users,
  XCircle, Edit, MessageSquare, Home, Trash2, Calendar, Bell
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  floor: number;
  status: string;
  isAvailable: boolean;
  isBooked: boolean;
  pendingTasks: number;
  unresolvedNotes: number;
}

interface Task {
  _id: string;
  room: { _id: string; roomNumber: string; floor: number };
  roomNumber: string;
  taskType: string;
  issueType?: string;
  priority: string;
  status: string;
  description: string;
  notes?: string;
  assignedTo?: { firstName: string; lastName: string };
  createdBy: { firstName: string; lastName: string };
  estimatedTime?: number;
  checklist?: { item: string; completed: boolean }[];
  createdAt: string;
}

interface Note {
  _id: string;
  room: { _id: string; roomNumber: string };
  roomNumber: string;
  note: string;
  category: string;
  priority: string;
  isResolved: boolean;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
}

interface Stats {
  totalRooms: number;
  availableRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  occupiedRooms: number;
  pendingTasks: number;
  myPendingTasks: number;
  readyForCheckIn: number;
}

const StaffRooms: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'cleaning' | 'maintenance' | 'notes' | 'inventory' | 'activity'>('overview');
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any>({});
  
  // State
  const [stats, setStats] = useState<Stats>({
    totalRooms: 0,
    availableRooms: 0,
    cleaningRooms: 0,
    maintenanceRooms: 0,
    occupiedRooms: 0,
    pendingTasks: 0,
    myPendingTasks: 0,
    readyForCheckIn: 0
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<Task[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  
  // Filters
  const [roomFilter, setRoomFilter] = useState({ status: 'all', floor: 'all', search: '' });
  const [taskFilter, setTaskFilter] = useState({ status: 'all', assignedToMe: false });
  
  // Modals
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showInspection, setShowInspection] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (permissions.viewRooms) {
      fetchData();
    }
  }, [permissions, activeTab, roomFilter, taskFilter]);

  const checkPermissions = async () => {
    try {
      const response = await axios.get('/auth/me/permissions');
      setPermissions(response.data.permissions || {});
      
      if (!response.data.permissions.viewRooms) {
        toast.error('You do not have permission to view rooms');
        navigate('/staff/dashboard');
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      toast.error('Failed to verify permissions');
      navigate('/staff/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await axios.get('/staff/rooms/stats');
      setStats(statsRes.data);
      
      // Fetch based on active tab
      if (activeTab === 'overview') {
        const params = new URLSearchParams();
        if (roomFilter.status !== 'all') params.append('status', roomFilter.status);
        if (roomFilter.floor !== 'all') params.append('floor', roomFilter.floor);
        
        const roomsRes = await axios.get(`/staff/rooms/status?${params.toString()}`);
        setRooms(roomsRes.data.rooms);
      } else if (activeTab === 'cleaning') {
        const params = new URLSearchParams();
        if (taskFilter.status !== 'all') params.append('status', taskFilter.status);
        if (taskFilter.assignedToMe) params.append('assignedToMe', 'true');
        
        const tasksRes = await axios.get(`/staff/rooms/cleaning-tasks?${params.toString()}`);
        setCleaningTasks(tasksRes.data.tasks);
      } else if (activeTab === 'maintenance') {
        const params = new URLSearchParams();
        if (taskFilter.status !== 'all') params.append('status', taskFilter.status);
        
        const tasksRes = await axios.get(`/staff/rooms/maintenance-tasks?${params.toString()}`);
        setMaintenanceTasks(tasksRes.data.tasks);
      } else if (activeTab === 'notes') {
        const notesRes = await axios.get('/staff/rooms/notes');
        setNotes(notesRes.data.notes);
      } else if (activeTab === 'activity') {
        const activityRes = await axios.get('/staff/rooms/activity-log?limit=100');
        setActivityLog(activityRes.data.activities);
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (roomId: string, newStatus: string, notes?: string) => {
    if (!permissions.manageRooms) {
      toast.error('You do not have permission to update room status');
      return;
    }

    try {
      await axios.put(`/staff/rooms/${roomId}/status`, { status: newStatus, notes });
      toast.success('Room status updated successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update room status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      cleaning: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
      'out-of-service': 'bg-red-100 text-red-800',
      'needs-inspection': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600 mt-2">
            Manage room status, cleaning, maintenance, and inspections
          </p>
        </div>

        {/* Permission Notice */}
        {!permissions.manageRooms && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You have view-only access. Contact admin to request room management permissions.
              </span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
              </div>
              <Home className="h-8 w-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableRooms}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cleaning</p>
                <p className="text-2xl font-bold text-blue-600">{stats.cleaningRooms}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.maintenanceRooms}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Occupied</p>
                <p className="text-2xl font-bold text-blue-900">{stats.occupiedRooms}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Pending Tasks</p>
                <p className="text-2xl font-bold text-purple-900">{stats.pendingTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-800">My Tasks</p>
                <p className="text-2xl font-bold text-pink-900">{stats.myPendingTasks}</p>
              </div>
              <Activity className="h-8 w-8 text-pink-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Ready for Check-in</p>
                <p className="text-2xl font-bold text-green-900">{stats.readyForCheckIn}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Room Overview', icon: BedDouble },
                { id: 'cleaning', label: 'Cleaning Tasks', icon: ClipboardList },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'notes', label: 'Room Notes', icon: MessageSquare },
                { id: 'inventory', label: 'Inventory', icon: Package },
                { id: 'activity', label: 'Activity Log', icon: Activity }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
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

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={roomFilter.search}
                      onChange={(e) => setRoomFilter(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search by room number..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={roomFilter.status}
                    onChange={(e) => setRoomFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Available</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="needs-inspection">Needs Inspection</option>
                    <option value="out-of-service">Out of Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                  <select
                    value={roomFilter.floor}
                    onChange={(e) => setRoomFilter(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Floors</option>
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                    <option value="3">Floor 3</option>
                    <option value="4">Floor 4</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms
                .filter(room => 
                  roomFilter.search === '' || 
                  room.roomNumber.toLowerCase().includes(roomFilter.search.toLowerCase())
                )
                .map(room => (
                  <div key={room._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Room {room.roomNumber}</h3>
                        <p className="text-sm text-gray-500 capitalize">{room.type} • Floor {room.floor}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(room.status)}`}>
                        {room.status.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <span className={room.isBooked ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                          {room.isBooked ? '● Occupied' : '● Vacant'}
                        </span>
                      </div>
                      
                      {room.pendingTasks > 0 && (
                        <div className="flex items-center text-sm text-orange-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {room.pendingTasks} pending task{room.pendingTasks > 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {room.unresolvedNotes > 0 && (
                        <div className="flex items-center text-sm text-blue-600">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {room.unresolvedNotes} unresolved note{room.unresolvedNotes > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {permissions.manageRooms && (
                        <>
                          {room.status === 'active' && (
                            <button
                              onClick={() => handleStatusUpdate(room._id, 'cleaning')}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              Start Cleaning
                            </button>
                          )}
                          {room.status === 'needs-inspection' && (
                            <button
                              onClick={() => {
                                setSelectedRoom(room);
                                setShowInspection(true);
                              }}
                              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                            >
                              Inspect Room
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRoom(room);
                          setShowRoomDetails(true);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {activeTab === 'cleaning' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <select
                    value={taskFilter.status}
                    onChange={(e) => setTaskFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={taskFilter.assignedToMe}
                      onChange={(e) => setTaskFilter(prev => ({ ...prev, assignedToMe: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Show only my tasks</span>
                  </label>
                </div>

                {permissions.manageRooms && (
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </button>
                )}
              </div>
            </div>

            {/* Cleaning Tasks List */}
            <div className="space-y-4">
              {cleaningTasks.map(task => (
                <div key={task._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Room {task.roomNumber}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status.replace('-', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      {task.estimatedTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Estimated time: {task.estimatedTime} minutes
                        </p>
                      )}
                    </div>
                  </div>

                  {task.checklist && task.checklist.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Checklist:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {task.checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            {item.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                            )}
                            <span className={item.completed ? 'text-gray-900' : 'text-gray-500'}>
                              {item.item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Created by {task.createdBy.firstName} {task.createdBy.lastName} •{' '}
                      {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                    {permissions.manageRooms && task.status !== 'completed' && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.put(`/staff/rooms/cleaning-tasks/${task._id}`, {
                              status: task.status === 'pending' ? 'in-progress' : 'completed'
                            });
                            toast.success('Task updated');
                            fetchData();
                          } catch (error) {
                            toast.error('Failed to update task');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        {task.status === 'pending' ? 'Start Task' : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'maintenance' && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <select
                    value={taskFilter.status}
                    onChange={(e) => setTaskFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Issues</option>
                    <option value="AC">AC Issues</option>
                    <option value="Light/Fan">Light/Fan</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="TV/WiFi">TV/WiFi</option>
                    <option value="Power">Power</option>
                    <option value="Plumbing">Plumbing</option>
                  </select>
                </div>

                {permissions.manageRooms && (
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Report Issue
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {maintenanceTasks.map(task => (
                <div key={task._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Room {task.roomNumber}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {task.status.replace('-', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900">{task.issueType}</span>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      {task.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">Notes: {task.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Reported by {task.createdBy.firstName} {task.createdBy.lastName} •{' '}
                      {new Date(task.createdAt).toLocaleDateString()}
                      {task.assignedTo && (
                        <span className="ml-2">
                          • Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </span>
                      )}
                    </div>
                    {permissions.manageRooms && task.status !== 'completed' && (
                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                await axios.put(`/staff/rooms/maintenance-tasks/${task._id}`, {
                                  status: 'in-progress'
                                });
                                toast.success('Task status updated');
                                fetchData();
                              } catch (error) {
                                toast.error('Failed to update task');
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Start Work
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const notes = prompt('Add completion notes (optional):');
                            try {
                              await axios.put(`/staff/rooms/maintenance-tasks/${task._id}`, {
                                status: 'completed',
                                notes: notes || task.notes
                              });
                              toast.success('Task completed');
                              fetchData();
                            } catch (error) {
                              toast.error('Failed to complete task');
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Mark Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <select className="border border-gray-300 rounded-md px-3 py-2">
                  <option value="all">All Notes</option>
                  <option value="unresolved">Unresolved</option>
                  <option value="resolved">Resolved</option>
                </select>

                {permissions.manageRooms && (
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {notes.map(note => (
                <div key={note._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">Room {note.roomNumber}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${note.isResolved ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {note.isResolved ? 'Resolved' : 'Open'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{note.note}</p>
                      <div className="text-sm text-gray-500">
                        By {note.createdBy.firstName} {note.createdBy.lastName} •{' '}
                        {new Date(note.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {permissions.manageRooms && !note.isResolved && (
                      <button className="ml-4 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Room Inventory Management</h3>
            <p className="text-gray-600 mb-4">
              Select a room to view and update its inventory
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rooms.slice(0, 12).map(room => (
                <button
                  key={room._id}
                  onClick={async () => {
                    try {
                      const response = await axios.get(`/staff/rooms/${room._id}/inventory`);
                      // Show inventory modal
                      toast.success('Inventory loaded');
                    } catch (error: any) {
                      if (error.response?.status === 404) {
                        // Create new inventory
                        toast('No inventory found. Creating new...', {
                          icon: 'ℹ️',
                        });
                      } else {
                        toast.error('Failed to load inventory');
                      }
                    }
                  }}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-bold text-gray-900">Room {room.roomNumber}</div>
                  <div className="text-sm text-gray-500 capitalize">{room.type}</div>
                  <div className={`text-xs mt-2 ${getStatusColor(room.status)}`}>
                    {room.status}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Standard Inventory Items</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
                <div>• Towels</div>
                <div>• Bedsheets</div>
                <div>• Pillow covers</div>
                <div>• Toiletries</div>
                <div>• Water bottles</div>
                <div>• Tea/Coffee sachets</div>
                <div>• TV Remote</div>
                <div>• Menu card</div>
                <div>• Slippers</div>
                <div>• Hangers</div>
                <div>• Iron/Ironing board</div>
                <div>• Safe key</div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex gap-4">
                <select
                  onChange={(e) => {
                    // Apply category filter
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="status-update">Status Updates</option>
                  <option value="note">Notes</option>
                  <option value="inventory">Inventory</option>
                  <option value="inspection">Inspections</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md divide-y">
              {activityLog.map((activity, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      activity.category === 'cleaning' ? 'bg-blue-100' :
                      activity.category === 'maintenance' ? 'bg-orange-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.category === 'cleaning' && <ClipboardList className="h-5 w-5 text-blue-600" />}
                      {activity.category === 'maintenance' && <Wrench className="h-5 w-5 text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold">{activity.action}</h4>
                          <p className="text-sm text-gray-600">{activity.details}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">By {activity.staffName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaffRooms;
