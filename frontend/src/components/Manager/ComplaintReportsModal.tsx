import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface ComplaintReportsModalProps {
  onClose: () => void;
}

const ComplaintReportsModal: React.FC<ComplaintReportsModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [reports, setReports] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/manager/complaints/reports?period=${period}`);
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reports) return;
    
    const csvData = [
      ['Complaint Reports', '', '', ''],
      ['Period:', period, '', ''],
      ['', '', '', ''],
      ['Category Breakdown:', '', '', ''],
      ['Category', 'Count', '', ''],
      ...reports.byCategory.map((item: any) => [item._id, item.count, '', '']),
      ['', '', '', ''],
      ['Staff Performance:', '', '', ''],
      ['Staff', 'Total Assigned', 'Resolved', 'Resolution Rate'],
      ...reports.staffPerformance.map((item: any) => [
        item.staffName,
        item.totalAssigned,
        item.resolved,
        `${Math.round(item.resolutionRate)}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `complaint-reports-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
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

  if (!reports) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold">Complaint Reports</h2>
            <p className="text-gray-600 text-sm mt-1">Analytics and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Resolution Stats */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
            <h3 className="font-semibold text-lg mb-4">Resolution Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Average Resolution Time</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {Math.round(reports.resolutionStats.avgResolutionTime || 0)} hrs
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fastest Resolution</p>
                <p className="text-2xl font-bold text-green-900">
                  {Math.round(reports.resolutionStats.minResolutionTime || 0)} hrs
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Slowest Resolution</p>
                <p className="text-2xl font-bold text-red-900">
                  {Math.round(reports.resolutionStats.maxResolutionTime || 0)} hrs
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Complaints by Category</h3>
            <div className="space-y-3">
              {reports.byCategory.map((item: any) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">{item._id}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(item.count / reports.byCategory.reduce((sum: number, c: any) => sum + c.count, 0)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Priority Distribution</h3>
            <div className="grid grid-cols-2 gap-4">
              {reports.byPriority.map((item: any) => (
                <div key={item._id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{item._id}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Performance */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Staff Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Assigned</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Resolved</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.staffPerformance.map((staff: any) => (
                    <tr key={staff._id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{staff.staffName}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">{staff.totalAssigned}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{staff.resolved}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          staff.resolutionRate >= 80 ? 'bg-green-100 text-green-800' :
                          staff.resolutionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(staff.resolutionRate)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Trend */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Daily Complaint Trend</h3>
            <div className="space-y-2">
              {reports.dailyComplaints.map((day: any) => (
                <div key={day._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{new Date(day._id).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(day.count / Math.max(...reports.dailyComplaints.map((d: any) => d.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{day.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintReportsModal;
