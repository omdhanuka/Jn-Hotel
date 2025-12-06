import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, AlertCircle, UserPlus, Save, FileText } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface ComplaintDetailsModalProps {
  complaintId: string;
  onClose: () => void;
  onRefresh: () => void;
}

const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaintId,
  onClose,
  onRefresh
}) => {
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<any>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    remarks: '',
    resolutionDescription: ''
  });
  const [internalNote, setInternalNote] = useState('');

  useEffect(() => {
    fetchComplaintDetails();
    fetchAvailableStaff();
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/manager/complaints/${complaintId}`);
      setComplaint(response.data.complaint);
      setStatusUpdate(prev => ({ ...prev, status: response.data.complaint.status }));
    } catch (error) {
      toast.error('Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const response = await axios.get('/manager/complaints/staff/available');
      setAvailableStaff(response.data.staff);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    try {
      await axios.post(`/manager/complaints/${complaintId}/assign`, {
        staffId: selectedStaff,
        remarks: assignRemarks
      });
      toast.success('Staff assigned successfully');
      setShowAssignModal(false);
      fetchComplaintDetails();
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign staff');
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      await axios.put(`/manager/complaints/${complaintId}/status`, statusUpdate);
      toast.success('Status updated successfully');
      fetchComplaintDetails();
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      await axios.post(`/manager/complaints/${complaintId}/notes`, {
        note: internalNote
      });
      toast.success('Note added successfully');
      setInternalNote('');
      fetchComplaintDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold">Complaint Details</h2>
            <p className="text-gray-600 text-sm mt-1">{complaint.complaintId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Guest Info & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Guest Information
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {complaint.user.firstName} {complaint.user.lastName}</p>
                <p><span className="font-medium">Email:</span> {complaint.user.email}</p>
                <p><span className="font-medium">Phone:</span> {complaint.user.phone}</p>
                {complaint.roomNumber && (
                  <p><span className="font-medium">Room:</span> {complaint.roomNumber}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Complaint Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Category:</span> {complaint.category}</p>
                <p>
                  <span className="font-medium">Priority:</span>{' '}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority.toUpperCase()}
                  </span>
                </p>
                <p><span className="font-medium">Date:</span> {new Date(complaint.createdAt).toLocaleString()}</p>
                {complaint.assignedTo && (
                  <p><span className="font-medium">Assigned To:</span> {complaint.assignedTo.firstName} {complaint.assignedTo.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Complaint Description */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2">Title</h3>
            <p className="text-gray-900 mb-3">{complaint.title}</p>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {/* Assign Staff */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Staff Assignment</h3>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {complaint.assignedTo ? 'Reassign' : 'Assign'} Staff
              </button>
            </div>
            {complaint.assignedTo ? (
              <div className="text-sm">
                Currently assigned to: <span className="font-medium">{complaint.assignedTo.firstName} {complaint.assignedTo.lastName}</span>
                {complaint.assignedTo.department && <span className="text-gray-500"> ({complaint.assignedTo.department})</span>}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No staff assigned yet</p>
            )}
          </div>

          {/* Status Update */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Update Status</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {statusUpdate.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Resolution Description</label>
                  <textarea
                    value={statusUpdate.resolutionDescription}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, resolutionDescription: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Describe how the complaint was resolved..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea
                  value={statusUpdate.remarks}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Add remarks..."
                />
              </div>

              <button
                onClick={handleStatusUpdate}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Status
              </button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Internal Notes</h3>
            {complaint.internalNotes && (
              <div className="bg-white p-3 rounded mb-3 text-sm whitespace-pre-wrap">
                {complaint.internalNotes}
              </div>
            )}
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-2"
              rows={2}
              placeholder="Add internal note (not visible to guest)..."
            />
            <button
              onClick={handleAddNote}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Add Note
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Activity Timeline</h3>
            <div className="space-y-3">
              {complaint.timeline.map((entry: any, index: number) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-indigo-600 rounded-full"></div>
                  <div className="ml-3 text-sm">
                    <p className="font-medium">{entry.action.replace(/_/g, ' ')}</p>
                    <p className="text-gray-600">{entry.remarks}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                      {entry.performedBy && ` • ${entry.performedBy.firstName} ${entry.performedBy.lastName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Assign Staff Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Staff</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">-- Select Staff --</option>
                  {availableStaff.map(staff => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.department}) - {staff.currentWorkload} active
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Remarks (Optional)</label>
                <textarea
                  value={assignRemarks}
                  onChange={(e) => setAssignRemarks(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Add assignment remarks..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAssignStaff}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStaff('');
                    setAssignRemarks('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailsModal;
