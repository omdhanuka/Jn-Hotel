import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  _id: string;
  staffId: {
    _id: string;
    firstName: string;
    lastName: string;
    department: string;
  };
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  notes?: string;
}

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
}

interface StaffAttendanceProps {
  userRole: 'manager' | 'admin';
}

const StaffAttendance: React.FC<StaffAttendanceProps> = ({ userRole }) => {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMarkForm, setShowMarkForm] = useState(false);

  const [markForm, setMarkForm] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'present' | 'absent' | 'late' | 'on-leave',
    checkIn: '09:00',
    checkOut: '17:00',
    notes: ''
  });

  const baseURL = userRole === 'admin' ? '/admin' : '/manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, attendanceRes] = await Promise.all([
        axios.get(`${baseURL}/staff`),
        axios.get(`${baseURL}/staff/attendance/today`)
      ]);
      setStaffList(staffRes.data.staff || []);
      setTodayAttendance(attendanceRes.data.attendance || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        staffId: markForm.staffId,
        date: markForm.date,
        status: markForm.status,
        shiftStart: '09:00',
        shiftEnd: '17:00',
        notes: markForm.notes
      };

      // Only include checkIn/checkOut for non-absent statuses
      if (markForm.status !== 'absent' && markForm.status !== 'on-leave') {
        payload.checkIn = markForm.checkIn;
        payload.checkOut = markForm.checkOut;
      }

      await axios.post(`${baseURL}/staff/attendance`, payload);
      toast.success('Attendance marked successfully');
      setShowMarkForm(false);
      setMarkForm({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkIn: '09:00',
        checkOut: '17:00',
        notes: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'on-leave': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: staffList.length,
    present: todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length,
    absent: todayAttendance.filter(a => a.status === 'absent').length,
    onLeave: todayAttendance.filter(a => a.status === 'on-leave').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Staff</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Present</p>
          <p className="text-2xl font-bold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Absent</p>
          <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <p className="text-sm text-purple-600">On Leave</p>
          <p className="text-2xl font-bold text-purple-700">{stats.onLeave}</p>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Today's Attendance</h3>
          <button
            onClick={() => setShowMarkForm(!showMarkForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showMarkForm ? 'Cancel' : 'Mark Attendance'}
          </button>
        </div>

        {/* Mark Form */}
        {showMarkForm && (
          <form onSubmit={handleMarkAttendance} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={markForm.staffId}
                onChange={(e) => setMarkForm(prev => ({ ...prev, staffId: e.target.value }))}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">Select Staff</option>
                {staffList.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>

              <select
                value={markForm.status}
                onChange={(e) => setMarkForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="border rounded px-3 py-2"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="on-leave">On Leave</option>
              </select>

              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </form>
        )}

        {/* Attendance List */}
        {todayAttendance.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No attendance marked today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Staff</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Department</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Check In</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todayAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {record.staffId.firstName} {record.staffId.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.staffId.department}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAttendance;
