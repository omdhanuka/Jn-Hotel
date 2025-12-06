import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, CheckCircle, Clock, TrendingUp, Filter, Search,
  RefreshCw, Eye, UserPlus, FileText, ChevronRight, BarChart3
} from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import ComplaintDetailsModal from '../../components/Manager/ComplaintDetailsModal';
import ComplaintReportsModal from '../../components/Manager/ComplaintReportsModal';

interface Complaint {
  _id: string;
  complaintId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  roomNumber?: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const ComplaintManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    highPriorityComplaints: 0
  });

  const [trends, setTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchDashboard();
    fetchComplaints();
  }, [filters, pagination.page]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/manager/complaints/dashboard');
      setStats(response.data.stats);
      setTrends(response.data.trends);
      setCategoryBreakdown(response.data.categoryBreakdown);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await axios.get(`/manager/complaints?${params.toString()}`);
      setComplaints(response.data.complaints);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error: any) {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaintId: string) => {
    setSelectedComplaint(complaintId);
    setShowDetailsModal(true);
  };

  const handleRefresh = () => {
    fetchDashboard();
    fetchComplaints();
    toast.success('Data refreshed');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'housekeeping': 'Housekeeping',
      'restaurant': 'Restaurant',
      'room-service': 'Room Service',
      'maintenance': 'Maintenance',
      'billing': 'Billing',
      'front-desk': 'Front Desk',
      'other': 'Other'
    };
    return labels[category] || category;
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

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complaint Management</h1>
              <p className="text-gray-600 mt-2">Manage guest complaints and resolutions</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReportsModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalComplaints}</p>
              </div>
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingComplaints}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.inProgressComplaints}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Resolved</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats.resolvedComplaints}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">High Priority</p>
                <p className="text-3xl font-bold text-red-900 mt-2">{stats.highPriorityComplaints}</p>
              </div>
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search complaints..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Categories</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="restaurant">Restaurant</option>
                <option value="room-service">Room Service</option>
                <option value="maintenance">Maintenance</option>
                <option value="billing">Billing</option>
                <option value="front-desk">Front Desk</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No complaints found
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{complaint.complaintId}</div>
                      {complaint.roomNumber && (
                        <div className="text-xs text-gray-500">Room {complaint.roomNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {complaint.user.firstName} {complaint.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{complaint.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getCategoryLabel(complaint.category)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {complaint.assignedTo ? (
                        <span className="text-sm text-gray-900">
                          {complaint.assignedTo.firstName} {complaint.assignedTo.lastName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(complaint._id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedComplaint && (
        <ComplaintDetailsModal
          complaintId={selectedComplaint}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedComplaint(null);
          }}
          onRefresh={() => {
            fetchDashboard();
            fetchComplaints();
          }}
        />
      )}

      {showReportsModal && (
        <ComplaintReportsModal
          onClose={() => setShowReportsModal(false)}
        />
      )}
    </div>
  );
};

export default ComplaintManagement;
