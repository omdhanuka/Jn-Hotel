import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyLeave, getMyLeaves, getLeaveBalance, cancelLeave, StaffLeave } from '../../services/staffApi';
import StaffNavbar from '../../components/Staff/StaffNavbar';
import toast from 'react-hot-toast';

const StaffLeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'sick' as 'sick' | 'casual' | 'annual' | 'unpaid',
    startDate: '',
    endDate: '',
    reason: '',
    numberOfDays: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, balanceRes] = await Promise.all([
        getMyLeaves(),
        getLeaveBalance()
      ]);
      setLeaves(leavesRes.leaves || []);
      setLeaveBalance(balanceRes.leaveBalance);
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFormData = { ...formData, [field]: value };
    if (newFormData.startDate && newFormData.endDate) {
      newFormData.numberOfDays = calculateDays(newFormData.startDate, newFormData.endDate);
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate balance
    if (formData.leaveType !== 'unpaid' && leaveBalance) {
      const balance = leaveBalance[formData.leaveType];
      if (formData.numberOfDays > balance) {
        toast.error(`Insufficient ${formData.leaveType} leave balance. Available: ${balance} days`);
        return;
      }
    }

    try {
      await applyLeave(formData);
      toast.success('Leave application submitted successfully!');
      setShowForm(false);
      setFormData({
        leaveType: 'sick',
        startDate: '',
        endDate: '',
        reason: '',
        numberOfDays: 1
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit leave application');
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) {
      return;
    }

    try {
      await cancelLeave(leaveId);
      toast.success('Leave application cancelled');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    }
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

  if (loading) {
    return (
      <>
        <StaffNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading leave data...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <StaffNavbar />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-600 mt-1">Apply for leave and track your applications</p>
        </div>

        {/* Leave Balance Cards */}
        {leaveBalance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-sm text-blue-600 font-medium">Sick Leave</p>
              <p className="text-2xl font-bold text-blue-700">{leaveBalance.sick} days</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-sm text-green-600 font-medium">Casual Leave</p>
              <p className="text-2xl font-bold text-green-700">{leaveBalance.casual} days</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-sm text-purple-600 font-medium">Annual Leave</p>
              <p className="text-2xl font-bold text-purple-700">{leaveBalance.annual} days</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full h-full flex flex-col items-center justify-center hover:bg-orange-100 transition"
              >
                <span className="text-3xl mb-1">➕</span>
                <span className="text-sm text-orange-600 font-medium">Apply Leave</span>
              </button>
            </div>
          </div>
        )}

        {/* Leave Application Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                  <select
                    required
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
                  <input
                    type="number"
                    value={formData.numberOfDays}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  placeholder="Please provide a reason for your leave..."
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Leave Applications List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">My Leave Applications</h2>
          {leaves.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No leave applications found</p>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div key={leave._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getLeaveTypeIcon(leave.leaveType)}</span>
                        <div>
                          <h3 className="font-semibold text-lg capitalize">{leave.leaveType} Leave</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} 
                            <span className="ml-2 font-medium">({leave.numberOfDays} days)</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{leave.reason}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Applied: {new Date(leave.appliedAt).toLocaleDateString()}</span>
                        {leave.reviewedBy && leave.reviewedAt && (
                          <span>Reviewed: {new Date(leave.reviewedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {leave.reviewNotes && (
                        <div className="mt-2 bg-gray-50 rounded p-2">
                          <p className="text-sm text-gray-700"><strong>Review Notes:</strong> {leave.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}>
                        {leave.status.toUpperCase()}
                      </span>
                      {leave.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(leave._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffLeaveManagement;
