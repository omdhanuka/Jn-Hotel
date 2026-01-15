import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, TrendingUp, Users } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
  totalPresent: number;
  totalMarked: number;
  attendancePercentage: string;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

interface StaffReport {
  staffId: string;
  staffName: string;
  department: string;
  position: string;
  statistics: AttendanceStats;
  records: AttendanceRecord[];
}

interface StaffAttendanceReportProps {
  userRole: 'manager' | 'admin';
}

const StaffAttendanceReport: React.FC<StaffAttendanceReportProps> = ({ userRole }) => {
  const [reports, setReports] = useState<StaffReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  const baseURL = userRole === 'admin' ? '/admin' : '/manager';

  useEffect(() => {
    // Set default dates based on range
    const now = new Date();
    if (dateRange === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (dateRange === 'year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [dateRange]);

  useEffect(() => {
    if (startDate && endDate && dateRange !== 'custom') {
      fetchReport();
    }
  }, [startDate, endDate]);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/staff/attendance/report`, {
        params: { startDate, endDate }
      });
      setReports(response.data.report || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'on-leave': return 'bg-purple-100 text-purple-800';
      case 'half-day': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportToCSV = () => {
    const headers = ['Staff Name', 'Department', 'Present', 'Absent', 'Late', 'On Leave', 'Half Day', 'Total Days', 'Attendance %'];
    const rows = reports.map(r => [
      r.staffName,
      r.department,
      r.statistics.present,
      r.statistics.absent,
      r.statistics.late,
      r.statistics.onLeave,
      r.statistics.halfDay,
      r.statistics.totalMarked,
      r.statistics.attendancePercentage
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading report...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Staff Attendance Report
          </h2>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={dateRange !== 'custom'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={dateRange !== 'custom'}
            />
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Generate Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-700">
                {reports.length > 0
                  ? (
                      reports.reduce((acc, r) => acc + parseFloat(r.statistics.attendancePercentage), 0) /
                      reports.length
                    ).toFixed(1)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Total Absents</p>
              <p className="text-2xl font-bold text-red-700">
                {reports.reduce((acc, r) => acc + r.statistics.absent, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Total Late</p>
              <p className="text-2xl font-bold text-yellow-700">
                {reports.reduce((acc, r) => acc + r.statistics.late, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Report Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No attendance records found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Staff Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Department</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Present</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Absent</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Late</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">On Leave</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Total Days</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Attendance %</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <React.Fragment key={report.staffId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{report.staffName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report.department}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {report.statistics.present}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {report.statistics.absent}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {report.statistics.late}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {report.statistics.onLeave}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{report.statistics.totalMarked}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${getAttendanceColor(parseFloat(report.statistics.attendancePercentage))}`}>
                          {report.statistics.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedStaff(expandedStaff === report.staffId ? null : report.staffId)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {expandedStaff === report.staffId ? 'Hide' : 'View'} Details
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Records */}
                    {expandedStaff === report.staffId && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-gray-50">
                          <div className="max-h-96 overflow-y-auto">
                            <h4 className="font-semibold mb-3">Daily Attendance Records</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {report.records.map((record, idx) => (
                                <div key={idx} className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium">
                                      {new Date(record.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                                      {record.status.replace('-', ' ')}
                                    </span>
                                  </div>
                                  {record.checkIn && (
                                    <div className="text-xs text-gray-600">
                                      In: {new Date(record.checkIn).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                  )}
                                  {record.checkOut && (
                                    <div className="text-xs text-gray-600">
                                      Out: {new Date(record.checkOut).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                  )}
                                  {record.notes && (
                                    <div className="text-xs text-gray-500 mt-1 italic">{record.notes}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAttendanceReport;
