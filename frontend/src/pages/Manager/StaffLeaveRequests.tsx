import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Filter, TrendingUp } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface LeaveApplication {
  _id: string;
  staff: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  leaveType: 'sick' | 'casual' | 'annual' | 'unpaid';
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: Date;
  reviewNotes?: string;
  appliedAt: Date;
}

interface LeaveStatistics {
  totalApplications: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: {
    sick: number;
    casual: number;
    annual: number;
    unpaid: number;
  };
}

interface StaffLeaveRequestsProps {
  userRole: 'manager' | 'admin';
}

const StaffLeaveRequests: React.FC<StaffLeaveRequestsProps> = ({ userRole }) => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [statistics, setStatistics] = useState<LeaveStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const baseURL = userRole === 'admin' ? '/admin' : '/manager';

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, statsRes] = await Promise.all([
        axios.get(`${baseURL}/staff/leaves`),
        axios.get(`${baseURL}/staff/leaves/statistics`)
      ]);

      let filteredLeaves = leavesRes.data.leaves || [];
      if (filter !== 'all') {
        filteredLeaves = filteredLeaves.filter((l: LeaveApplication) => l.status === filter);
      }

      setLeaves(filteredLeaves);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
      toast.error('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedLeave || !reviewAction) return;

    try {
      const endpoint = `${baseURL}/staff/leaves/${selectedLeave._id}/${reviewAction}`;
      await axios.put(endpoint, { reviewNotes });

      toast.success(`Leave ${reviewAction}d successfully`);
      setShowReviewModal(false);
      setSelectedLeave(null);
      setReviewNotes('');
      setReviewAction(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${reviewAction} leave`);
    }
  };

  const openReviewModal = (leave: LeaveApplication, action: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'sick': return '🤒';
      case 'casual': return '🏖️';
      case 'annual': return '✈️';
      case 'unpaid': return '📅';
      default: return '📋';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading leave applications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.totalApplications}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Leave Applications</h2>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Leave Applications List */}
        <div className="space-y-4">
          {leaves.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No leave applications found</p>
          ) : (
            leaves.map((leave) => (
              <div
                key={leave._id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getLeaveTypeIcon(leave.leaveType)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {leave.staff.firstName} {leave.staff.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{leave.staff.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-600">Leave Type</p>
                        <p className="font-medium capitalize">{leave.leaveType} Leave</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">{leave.numberOfDays} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">From - To</p>
                        <p className="font-medium">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Applied On</p>
                        <p className="font-medium">{formatDate(leave.appliedAt)}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Reason</p>
                      <p className="text-sm bg-gray-50 rounded p-2 mt-1">{leave.reason}</p>
                    </div>

                    {leave.reviewNotes && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">Review Notes</p>
                        <p className="text-sm bg-blue-50 rounded p-2 mt-1">{leave.reviewNotes}</p>
                      </div>
                    )}

                    {leave.reviewedBy && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Reviewed by {leave.reviewedBy.firstName} {leave.reviewedBy.lastName} on{' '}
                          {formatDate(leave.reviewedAt!)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                      {leave.status.toUpperCase()}
                    </span>

                    {leave.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => openReviewModal(leave, 'approve')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openReviewModal(leave, 'reject')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-4">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Leave Application
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="font-medium">
                {selectedLeave.staff.firstName} {selectedLeave.staff.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {selectedLeave.leaveType} Leave - {selectedLeave.numberOfDays} days
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes {reviewAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review notes here..."
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewAction === 'reject' && !reviewNotes.trim()}
                className={`px-4 py-2 rounded-lg text-white ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffLeaveRequests;
