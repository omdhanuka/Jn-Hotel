import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Calendar, Download, Filter, Users,
  BedDouble, Utensils, DollarSign, AlertCircle, CheckCircle,
  Clock, Star, TrendingDown, Activity, FileText, PieChart as PieChartIcon,
  FileSpreadsheet, FileDown, ChevronDown
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface ReportData {
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    revenue: number;
    averageBookingValue: number;
    monthlyTrend: Array<{ month: string; bookings: number; revenue: number }>;
  };
  rooms: {
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    availableRooms: number;
    maintenanceRooms: number;
    cleaningRooms: number;
    roomTypeOccupancy: Array<{ type: string; occupied: number; total: number }>;
  };
  restaurant: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    popularDishes: Array<{ name: string; count: number }>;
    dailyTrend: Array<{ date: string; orders: number; revenue: number }>;
  };
  staff: {
    totalStaff: number;
    presentToday: number;
    onLeave: number;
    attendanceRate: number;
    departmentWise: Array<{ department: string; count: number }>;
  };
  complaints: {
    total: number;
    resolved: number;
    pending: number;
    inProgress: number;
    avgResolutionTime: number;
  };
}

const ReportsAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    fetchReportData();
  }, [navigate, dateRange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints
      const [bookingsRes, dashboardRes, restaurantRes, complaintsRes] = await Promise.all([
        axios.get('/manager/bookings'),
        axios.get('/manager/dashboard'),
        axios.get('/manager/restaurant/reports', { params: { period: dateRange } }),
        axios.get('/manager/complaints/reports')
      ]);

      // Process and aggregate data
      const bookings = bookingsRes.data.bookings || [];
      const dashboard = dashboardRes.data;
      const restaurant = restaurantRes.data;
      const complaints = complaintsRes.data;

      // Calculate booking statistics
      const totalRevenue = bookings
        .filter((b: any) => b.paymentStatus === 'paid')
        .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);

      const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled').length;
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;

      // Generate monthly trend (mock data for now)
      const monthlyTrend = generateMonthlyTrend(bookings);

      // Room type occupancy (mock data)
      const roomTypeOccupancy = [
        { type: 'Deluxe', occupied: 15, total: 20 },
        { type: 'Suite', occupied: 8, total: 10 },
        { type: 'Standard', occupied: 25, total: 30 },
        { type: 'Executive', occupied: 5, total: 8 }
      ];

      // Department wise staff (mock data)
      const departmentWise = [
        { department: 'Housekeeping', count: 15 },
        { department: 'Front Desk', count: 8 },
        { department: 'Food & Beverage', count: 20 },
        { department: 'Maintenance', count: 6 }
      ];

      setReportData({
        bookings: {
          total: bookings.length,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          pending: pendingBookings,
          revenue: totalRevenue,
          averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
          monthlyTrend
        },
        rooms: {
          totalRooms: dashboard.totalRooms || 0,
          occupiedRooms: dashboard.occupiedRooms || 0,
          occupancyRate: dashboard.totalRooms > 0 ? ((dashboard.occupiedRooms || 0) / dashboard.totalRooms) * 100 : 0,
          availableRooms: dashboard.availableRooms || 0,
          maintenanceRooms: dashboard.maintenanceRooms || 0,
          cleaningRooms: dashboard.cleaningRooms || 0,
          roomTypeOccupancy
        },
        restaurant: {
          totalOrders: restaurant.totalOrders || 0,
          totalRevenue: restaurant.totalRevenue || 0,
          averageOrderValue: restaurant.totalOrders > 0 ? (restaurant.totalRevenue || 0) / restaurant.totalOrders : 0,
          popularDishes: restaurant.popularDishes?.slice(0, 5) || [],
          dailyTrend: restaurant.dailyTrend || []
        },
        staff: {
          totalStaff: 49,
          presentToday: 42,
          onLeave: 3,
          attendanceRate: 85.7,
          departmentWise
        },
        complaints: {
          total: complaints.total || 0,
          resolved: complaints.resolved || 0,
          pending: complaints.pending || 0,
          inProgress: complaints.inProgress || 0,
          avgResolutionTime: complaints.avgResolutionTime || 0
        }
      });

    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrend = (bookings: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      bookings: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 100000) + 50000
    }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const exportToCSV = () => {
    if (!reportData) {
      toast.error('No data available to export');
      return;
    }

    try {
      const csvContent: string[] = [];
      
      // Header
      csvContent.push('HOTEL MANAGEMENT SYSTEM - ANALYTICS REPORT');
      csvContent.push(`Generated on: ${new Date().toLocaleString()}`);
      csvContent.push(`Period: ${dateRange === 'week' ? 'Last 7 Days' : dateRange === 'month' ? 'Last 30 Days' : 'Last Year'}`);
      csvContent.push('');

      // Key Metrics Section
      csvContent.push('KEY METRICS');
      csvContent.push('Metric,Value');
      csvContent.push(`Room Occupancy Rate,${reportData.rooms.occupancyRate.toFixed(1)}%`);
      csvContent.push(`Occupied Rooms,${reportData.rooms.occupiedRooms}/${reportData.rooms.totalRooms}`);
      csvContent.push(`Total Revenue,₹${reportData.bookings.revenue.toLocaleString()}`);
      csvContent.push(`Total Bookings,${reportData.bookings.total}`);
      csvContent.push(`Average Booking Value,₹${reportData.bookings.averageBookingValue.toFixed(2)}`);
      csvContent.push(`Restaurant Orders,${reportData.restaurant.totalOrders}`);
      csvContent.push(`Restaurant Revenue,₹${reportData.restaurant.totalRevenue.toLocaleString()}`);
      csvContent.push(`Staff Attendance Rate,${reportData.staff.attendanceRate}%`);
      csvContent.push('');

      // Booking Status Section
      csvContent.push('BOOKING STATUS');
      csvContent.push('Status,Count');
      csvContent.push(`Confirmed,${reportData.bookings.confirmed}`);
      csvContent.push(`Pending,${reportData.bookings.pending}`);
      csvContent.push(`Cancelled,${reportData.bookings.cancelled}`);
      csvContent.push('');

      // Room Status Section
      csvContent.push('ROOM STATUS');
      csvContent.push('Status,Count');
      csvContent.push(`Occupied,${reportData.rooms.occupiedRooms}`);
      csvContent.push(`Available,${reportData.rooms.availableRooms}`);
      csvContent.push(`Maintenance,${reportData.rooms.maintenanceRooms}`);
      csvContent.push(`Cleaning,${reportData.rooms.cleaningRooms}`);
      csvContent.push('');

      // Room Type Occupancy Section
      csvContent.push('ROOM TYPE OCCUPANCY');
      csvContent.push('Room Type,Occupied,Total,Occupancy Rate');
      reportData.rooms.roomTypeOccupancy.forEach(room => {
        const rate = ((room.occupied / room.total) * 100).toFixed(1);
        csvContent.push(`${room.type},${room.occupied},${room.total},${rate}%`);
      });
      csvContent.push('');

      // Popular Dishes Section
      csvContent.push('TOP POPULAR DISHES');
      csvContent.push('Dish Name,Orders');
      reportData.restaurant.popularDishes.forEach(dish => {
        csvContent.push(`${dish.name},${dish.count}`);
      });
      csvContent.push('');

      // Staff by Department Section
      csvContent.push('STAFF BY DEPARTMENT');
      csvContent.push('Department,Staff Count');
      reportData.staff.departmentWise.forEach(dept => {
        csvContent.push(`${dept.department},${dept.count}`);
      });
      csvContent.push('');

      // Complaints Section
      csvContent.push('COMPLAINTS OVERVIEW');
      csvContent.push('Status,Count');
      csvContent.push(`Resolved,${reportData.complaints.resolved}`);
      csvContent.push(`In Progress,${reportData.complaints.inProgress}`);
      csvContent.push(`Pending,${reportData.complaints.pending}`);
      csvContent.push(`Total,${reportData.complaints.total}`);
      csvContent.push(`Average Resolution Time,${reportData.complaints.avgResolutionTime} hours`);
      csvContent.push('');

      // Monthly Trend Section
      csvContent.push('BOOKING MONTHLY TREND');
      csvContent.push('Month,Bookings,Revenue');
      reportData.bookings.monthlyTrend.forEach(month => {
        csvContent.push(`${month.month},${month.bookings},₹${month.revenue}`);
      });

      // Create and download CSV file
      const csvString = csvContent.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Hotel_Analytics_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV report downloaded successfully!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV report');
    }
  };

  const exportToPDF = () => {
    if (!reportData) {
      toast.error('No data available to export');
      return;
    }

    try {
      // Create a printable HTML document
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export PDF');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Hotel Analytics Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px;
              background: #fff;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding-bottom: 20px;
              border-bottom: 3px solid #3b82f6;
            }
            .header h1 { 
              color: #3b82f6; 
              font-size: 32px; 
              margin-bottom: 10px;
            }
            .header p { 
              color: #666; 
              font-size: 14px;
              margin: 5px 0;
            }
            .section { 
              margin: 30px 0; 
              page-break-inside: avoid;
            }
            .section-title { 
              background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); 
              color: white; 
              padding: 12px 20px; 
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              border-radius: 8px;
            }
            .metrics-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 20px; 
              margin: 20px 0;
            }
            .metric-card { 
              background: #f8fafc;
              padding: 20px; 
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .metric-label { 
              font-size: 12px; 
              color: #666; 
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .metric-value { 
              font-size: 28px; 
              font-weight: bold; 
              color: #1e40af;
            }
            .metric-subtitle { 
              font-size: 12px; 
              color: #888; 
              margin-top: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
              background: white;
            }
            th { 
              background: #3b82f6; 
              color: white; 
              padding: 12px; 
              text-align: left;
              font-weight: 600;
            }
            td { 
              padding: 12px; 
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) { 
              background: #f8fafc;
            }
            tr:hover { 
              background: #f1f5f9;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
            .status-confirmed { background: #d1fae5; color: #065f46; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Hotel Management System</h1>
            <h2 style="color: #666; font-size: 24px; margin: 10px 0;">Analytics Report</h2>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Period:</strong> ${dateRange === 'week' ? 'Last 7 Days' : dateRange === 'month' ? 'Last 30 Days' : 'Last Year'}</p>
          </div>

          <div class="section">
            <div class="section-title">📈 Key Performance Metrics</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Room Occupancy</div>
                <div class="metric-value">${reportData.rooms.occupancyRate.toFixed(1)}%</div>
                <div class="metric-subtitle">${reportData.rooms.occupiedRooms}/${reportData.rooms.totalRooms} Rooms</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">₹${reportData.bookings.revenue.toLocaleString()}</div>
                <div class="metric-subtitle">${reportData.bookings.total} Bookings</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Restaurant Orders</div>
                <div class="metric-value">${reportData.restaurant.totalOrders}</div>
                <div class="metric-subtitle">₹${reportData.restaurant.totalRevenue.toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Staff Attendance</div>
                <div class="metric-value">${reportData.staff.attendanceRate}%</div>
                <div class="metric-subtitle">${reportData.staff.presentToday}/${reportData.staff.totalStaff} Present</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🏨 Booking Overview</div>
            <table>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
              <tr>
                <td><span class="status-badge status-confirmed">Confirmed</span></td>
                <td>${reportData.bookings.confirmed}</td>
                <td>${((reportData.bookings.confirmed / reportData.bookings.total) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">Pending</span></td>
                <td>${reportData.bookings.pending}</td>
                <td>${((reportData.bookings.pending / reportData.bookings.total) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td><span class="status-badge status-cancelled">Cancelled</span></td>
                <td>${reportData.bookings.cancelled}</td>
                <td>${((reportData.bookings.cancelled / reportData.bookings.total) * 100).toFixed(1)}%</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">🛏️ Room Type Occupancy</div>
            <table>
              <tr>
                <th>Room Type</th>
                <th>Occupied</th>
                <th>Total</th>
                <th>Occupancy Rate</th>
              </tr>
              ${reportData.rooms.roomTypeOccupancy.map(room => `
                <tr>
                  <td>${room.type}</td>
                  <td>${room.occupied}</td>
                  <td>${room.total}</td>
                  <td>${((room.occupied / room.total) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">⭐ Top Popular Dishes</div>
            <table>
              <tr>
                <th>Rank</th>
                <th>Dish Name</th>
                <th>Orders</th>
              </tr>
              ${reportData.restaurant.popularDishes.map((dish, index) => `
                <tr>
                  <td><strong>#${index + 1}</strong></td>
                  <td>${dish.name}</td>
                  <td>${dish.count}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">👥 Staff Distribution</div>
            <table>
              <tr>
                <th>Department</th>
                <th>Staff Count</th>
                <th>Percentage</th>
              </tr>
              ${reportData.staff.departmentWise.map(dept => `
                <tr>
                  <td>${dept.department}</td>
                  <td>${dept.count}</td>
                  <td>${((dept.count / reportData.staff.totalStaff) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">🔔 Complaints Summary</div>
            <table>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
              <tr>
                <td>Resolved</td>
                <td>${reportData.complaints.resolved}</td>
              </tr>
              <tr>
                <td>In Progress</td>
                <td>${reportData.complaints.inProgress}</td>
              </tr>
              <tr>
                <td>Pending</td>
                <td>${reportData.complaints.pending}</td>
              </tr>
              <tr style="font-weight: bold; background: #f1f5f9;">
                <td>Total</td>
                <td>${reportData.complaints.total}</td>
              </tr>
            </table>
            <p style="margin-top: 10px; color: #666;">
              <strong>Average Resolution Time:</strong> ${reportData.complaints.avgResolutionTime} hours
            </p>
          </div>

          <div class="footer">
            <p><strong>Hotel Management System</strong> - Confidential Report</p>
            <p>This report is generated automatically and contains sensitive business information.</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        toast.success('PDF export initiated. Please save using the print dialog.');
        setShowExportMenu(false);
      }, 500);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all"
                >
                  <Download className="h-5 w-5" />
                  Export
                  <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl border-2 border-gray-200 py-2 z-50">
                    <button
                      onClick={exportToCSV}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
                    >
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Export as CSV</p>
                        <p className="text-xs text-gray-500">Spreadsheet format</p>
                      </div>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={exportToPDF}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                    >
                      <FileDown className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Export as PDF</p>
                        <p className="text-xs text-gray-500">Print-ready document</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate('/manager/dashboard')}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <BedDouble className="h-8 w-8" />
              </div>
              <TrendingUp className="h-6 w-6 text-blue-200" />
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-1">Room Occupancy</h3>
            <p className="text-4xl font-bold">{reportData?.rooms.occupancyRate.toFixed(1)}%</p>
            <p className="text-sm text-blue-100 mt-2">{reportData?.rooms.occupiedRooms}/{reportData?.rooms.totalRooms} Rooms</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <DollarSign className="h-8 w-8" />
              </div>
              <TrendingUp className="h-6 w-6 text-green-200" />
            </div>
            <h3 className="text-sm font-medium text-green-100 mb-1">Total Revenue</h3>
            <p className="text-4xl font-bold">₹{(reportData?.bookings.revenue || 0).toLocaleString()}</p>
            <p className="text-sm text-green-100 mt-2">From {reportData?.bookings.total} bookings</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Utensils className="h-8 w-8" />
              </div>
              <Activity className="h-6 w-6 text-orange-200" />
            </div>
            <h3 className="text-sm font-medium text-orange-100 mb-1">Restaurant Orders</h3>
            <p className="text-4xl font-bold">{reportData?.restaurant.totalOrders}</p>
            <p className="text-sm text-orange-100 mt-2">₹{(reportData?.restaurant.totalRevenue || 0).toLocaleString()} revenue</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Users className="h-8 w-8" />
              </div>
              <CheckCircle className="h-6 w-6 text-purple-200" />
            </div>
            <h3 className="text-sm font-medium text-purple-100 mb-1">Staff Attendance</h3>
            <p className="text-4xl font-bold">{reportData?.staff.attendanceRate}%</p>
            <p className="text-sm text-purple-100 mt-2">{reportData?.staff.presentToday}/{reportData?.staff.totalStaff} Present</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Booking Trend Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Booking Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData?.bookings.monthlyTrend}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="bookings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Room Status Distribution */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieChartIcon className="h-6 w-6 text-purple-600" />
              Room Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Occupied', value: reportData?.rooms.occupiedRooms || 0 },
                    { name: 'Available', value: reportData?.rooms.availableRooms || 0 },
                    { name: 'Maintenance', value: reportData?.rooms.maintenanceRooms || 0 },
                    { name: 'Cleaning', value: reportData?.rooms.cleaningRooms || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Dishes */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Top 5 Popular Dishes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.restaurant.popularDishes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" width={100} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Staff by Department */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              Staff by Department
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.staff.departmentWise}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="department" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Booking Breakdown */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Booking Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Confirmed</span>
                <span className="text-lg font-bold text-green-600">{reportData?.bookings.confirmed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Pending</span>
                <span className="text-lg font-bold text-yellow-600">{reportData?.bookings.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Cancelled</span>
                <span className="text-lg font-bold text-red-600">{reportData?.bookings.cancelled}</span>
              </div>
            </div>
          </div>

          {/* Room Type Occupancy */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-purple-600" />
              Room Type Occupancy
            </h3>
            <div className="space-y-3">
              {reportData?.rooms.roomTypeOccupancy.map((room, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{room.type}</span>
                    <span className="text-sm font-bold text-gray-900">{room.occupied}/{room.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${(room.occupied / room.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complaints Overview */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Complaints
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Resolved</span>
                <span className="text-lg font-bold text-green-600">{reportData?.complaints.resolved}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">In Progress</span>
                <span className="text-lg font-bold text-blue-600">{reportData?.complaints.inProgress}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Pending</span>
                <span className="text-lg font-bold text-red-600">{reportData?.complaints.pending}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Avg Resolution: {reportData?.complaints.avgResolutionTime}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
