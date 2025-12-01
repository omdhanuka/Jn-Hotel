import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils, Users, DollarSign, Clock, Plus, Eye, Edit, Trash2,
  Check, X, ChefHat, Receipt, TrendingUp, Calendar, User, AlertCircle,
  Printer, Download, Filter, Search
} from 'lucide-react';
import axios from '../../utils/axios'; // Fixed import path
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface RestaurantStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  cleaningTables: number;
  todayOrders: number;
  todayRevenue: number;
}

interface Table {
  _id: string;
  tableName: string;
  seatingCapacity: number;
  status: 'available' | 'reserved' | 'cleaning' | 'maintenance';
  currentOrderId?: string;
  runningBill?: number;
  assignedWaiter?: string;
  guestName?: string;
}

interface Order {
  _id: string;
  bookingId: string;
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  assignedWaiterName?: string;
  specialRequests?: string;
  createdAt: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  orderId: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    addOns?: Array<{ name: string; price: number }>;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  generatedAt: string;
  generatedBy: string;
  deliveryType: 'dine-in';
}

interface RestaurantReports {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  popularDishes: Array<{ _id: string; count: number }>;
  tableUsage: Array<{ _id: string; orders: number }>;
}

const RestaurantManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tables' | 'orders' | 'kitchen' | 'bills' | 'reports'>('tables');
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState<RestaurantStats>({
    totalTables: 0,
    availableTables: 0,
    occupiedTables: 0,
    cleaningTables: 0,
    todayOrders: 0,
    todayRevenue: 0
  });

  // Tables
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [waiters, setWaiters] = useState<any[]>([]);

  // Bills and Reports
  const [bills, setBills] = useState<Bill[]>([]);
  const [reports, setReports] = useState<RestaurantReports | null>(null);
  const [reportPeriod, setReportPeriod] = useState('day');
  const [billSearch, setBillSearch] = useState('');
  const [billFilter, setBillFilter] = useState('all');
  const [billActiveTab, setBillActiveTab] = useState<'pending' | 'generated'>('pending');
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billNotes, setBillNotes] = useState('');

  useEffect(() => {
    // Check if user is logged in
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

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports(reportPeriod);
    }
  }, [activeTab, reportPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data sequentially to better handle errors
      const statsRes = await axios.get('/api/manager/restaurant/dashboard');
      setStats(statsRes.data);

      const tablesRes = await axios.get('/api/manager/restaurant/tables');
      setTables(tablesRes.data.tables);

      const ordersRes = await axios.get('/api/manager/restaurant/orders');
      setOrders(ordersRes.data.orders);

      const kitchenRes = await axios.get('/api/manager/restaurant/kitchen');
      setKitchenOrders(kitchenRes.data.orders);

      const waitersRes = await axios.get('/api/manager/restaurant/waiters');
      setWaiters(waitersRes.data.waiters);

      const billsRes = await axios.get('/api/manager/restaurant/bills');
      setBills(billsRes.data.bills || []);
    } catch (error: any) {
      console.error('Fetch data error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/manager/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load restaurant data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (period: string) => {
    try {
      const response = await axios.get(`/api/manager/restaurant/reports?period=${period}`);
      setReports(response.data);
      setReportPeriod(period);
    } catch (error) {
      toast.error('Failed to load reports');
    }
  };

  // Add CSV export function
  const exportToCSV = () => {
    if (!reports) {
      toast.error('No report data to export');
      return;
    }

    // Create CSV content
    let csvContent = 'Restaurant Analytics Report\n\n';
    csvContent += `Period: ${reportPeriod}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Summary
    csvContent += 'Summary\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Orders,${reports.totalOrders}\n`;
    csvContent += `Total Revenue,₹${reports.totalRevenue.toFixed(2)}\n`;
    csvContent += `Average Order Value,₹${reports.totalOrders > 0 ? (reports.totalRevenue / reports.totalOrders).toFixed(2) : 0}\n\n`;
    
    // Popular Dishes
    csvContent += 'Popular Dishes\n';
    csvContent += 'Rank,Dish Name,Orders\n';
    reports.popularDishes.forEach((dish, index) => {
      csvContent += `${index + 1},"${dish._id}",${dish.count}\n`;
    });
    csvContent += '\n';
    
    // Table Usage
    csvContent += 'Table Performance\n';
    csvContent += 'Table,Orders,Utilization %\n';
    const maxOrders = Math.max(...reports.tableUsage.map(t => t.orders));
    reports.tableUsage.forEach((table) => {
      const utilization = Math.round((table.orders / maxOrders) * 100);
      csvContent += `"${table._id}",${table.orders},${utilization}%\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `restaurant-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Report exported to CSV successfully');
  };

  // Add print report function
  const printReport = () => {
    if (!reports) {
      toast.error('No report data to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report');
      return;
    }

    const maxOrders = Math.max(...reports.tableUsage.map(t => t.orders));

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Restaurant Analytics Report - ${reportPeriod}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
              .page-break { page-break-after: always; }
            }
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #4f46e5; 
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .header p { 
              color: #666; 
              margin: 5px 0;
              font-size: 14px;
            }
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .card {
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              background: #f9fafb;
            }
            .card-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .card-value {
              font-size: 32px;
              font-weight: bold;
              color: #1f2937;
            }
            .section {
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              background: white;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border: 1px solid #e5e7eb;
            }
            th {
              background-color: #4f46e5;
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .rank {
              width: 50px;
              text-align: center;
              font-weight: bold;
              color: #4f46e5;
            }
            .utilization-bar {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .bar-container {
              flex: 1;
              background: #e5e7eb;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
            }
            .bar-fill {
              height: 100%;
              background: #4f46e5;
              transition: width 0.3s ease;
            }
            .bar-label {
              font-size: 12px;
              color: #6b7280;
              min-width: 40px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .highlight-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
            }
            .highlight-box h4 {
              margin: 0 0 10px 0;
              color: #92400e;
            }
            .grid-3 {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .stat-item {
              padding: 10px;
              background: white;
              border-radius: 5px;
            }
            .stat-label {
              font-size: 12px;
              color: #6b7280;
            }
            .stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Restaurant Analytics Report</h1>
            <p><strong>Hotel Restaurant Management</strong></p>
            <p>Period: <strong>${reportPeriod.toUpperCase()}</strong> | Generated: ${new Date().toLocaleString()}</p>
          </div>

          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="card">
              <div class="card-label">Total Orders</div>
              <div class="card-value">${reports.totalOrders}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Revenue</div>
              <div class="card-value">₹${reports.totalRevenue.toFixed(0)}</div>
            </div>
            <div class="card">
              <div class="card-label">Avg Order Value</div>
              <div class="card-value">₹${reports.totalOrders > 0 ? (reports.totalRevenue / reports.totalOrders).toFixed(0) : 0}</div>
            </div>
            <div class="card">
              <div class="card-label">Menu Items</div>
              <div class="card-value">${reports.popularDishes.length}</div>
            </div>
          </div>

          <!-- Highlights -->
          <div class="highlight-box">
            <h4>📊 Performance Highlights</h4>
            <div class="grid-3">
              <div class="stat-item">
                <div class="stat-label">Most Popular Dish</div>
                <div class="stat-value">${reports.popularDishes[0]?._id || 'N/A'}</div>
                <div class="stat-label">${reports.popularDishes[0]?.count || 0} orders</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Most Active Table</div>
                <div class="stat-value">Table ${reports.tableUsage[0]?._id || 'N/A'}</div>
                <div class="stat-label">${reports.tableUsage[0]?.orders || 0} orders</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Report Period</div>
                <div class="stat-value">${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}</div>
                <div class="stat-label">Analysis scope</div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>

          <!-- Popular Dishes -->
          <div class="section">
            <div class="section-title">🏆 Top Performing Dishes</div>
            <table>
              <thead>
                <tr>
                  <th class="rank">Rank</th>
                  <th>Dish Name</th>
                  <th style="text-align: right; width: 150px;">Total Orders</th>
                  <th style="text-align: right; width: 150px;">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${reports.popularDishes.slice(0, 15).map((dish, index) => {
                  const percentage = reports.totalOrders > 0 ? ((dish.count / reports.totalOrders) * 100).toFixed(1) : 0;
                  return `
                    <tr>
                      <td class="rank">${index + 1}</td>
                      <td><strong>${dish._id}</strong></td>
                      <td style="text-align: right;">${dish.count}</td>
                      <td style="text-align: right;">${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Table Performance -->
          <div class="section">
            <div class="section-title">📍 Table Utilization Report</div>
            <table>
              <thead>
                <tr>
                  <th>Table Number</th>
                  <th style="text-align: center; width: 150px;">Orders Served</th>
                  <th style="width: 300px;">Utilization</th>
                </tr>
              </thead>
              <tbody>
                ${reports.tableUsage.map((table) => {
                  const utilization = Math.round((table.orders / maxOrders) * 100);
                  return `
                    <tr>
                      <td><strong>Table ${table._id}</strong></td>
                      <td style="text-align: center;">${table.orders}</td>
                      <td>
                        <div class="utilization-bar">
                          <div class="bar-container">
                            <div class="bar-fill" style="width: ${utilization}%"></div>
                          </div>
                          <span class="bar-label">${utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>Hotel Restaurant Management System</strong></p>
            <p>This is a computer-generated report. For any queries, please contact the restaurant manager.</p>
            <p>Report ID: RPT-${Date.now().toString().slice(-8)}</p>
          </div>

          <button class="no-print" onclick="window.print()" 
            style="position: fixed; top: 20px; right: 20px; padding: 12px 24px; 
                   background: #4f46e5; color: white; border: none; border-radius: 6px; 
                   cursor: pointer; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            🖨️ Print Report
          </button>
        </body>
      </html>
    `);

    printWindow.document.close();
    toast.success('Print preview opened');
  };

  const handleTableStatusChange = async (tableId: string, status: string) => {
    try {
      await axios.put(`/api/manager/restaurant/tables/${tableId}/status`, { status });
      toast.success('Table status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update table status');
    }
  };

  const handleAssignWaiter = async (waiterId: string) => {
    if (!selectedTable) return;

    try {
      await axios.post(`/api/manager/restaurant/tables/${selectedTable._id}/assign-waiter`, {
        waiterId
      });
      toast.success('Waiter assigned successfully');
      setShowWaiterModal(false);
      setSelectedTable(null);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to assign waiter');
    }
  };

  const handleRemoveWaiter = async (tableId: string) => {
    if (!confirm('Remove waiter from this table?')) return;

    try {
      await axios.delete(`/api/manager/restaurant/tables/${tableId}/waiter`);
      toast.success('Waiter removed');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to remove waiter');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await axios.put(`/api/manager/restaurant/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleGenerateBillForTable = async (table: Table) => {
    try {
      const response = await axios.post('/api/manager/restaurant/bills/generate-for-table', {
        tableNumber: table.tableName,
        discount: billDiscount,
        notes: billNotes
      });

      toast.success('Bill generated successfully!');
      setShowBillModal(false);
      setSelectedOrderForBill(null);
      setBillDiscount(0);
      setBillNotes('');
      
      fetchDashboardData();
      
      if (response.data.bill) {
        handlePrintBill(response.data.bill);
      }
    } catch (error: any) {
      if (error.response?.data?.bill) {
        handlePrintBill(error.response.data.bill);
        toast('Bill already generated for this table', { icon: 'ℹ️' });
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate bill');
      }
    }
  };

  const handleGenerateBillFromOrder = async (order: Order) => {
    try {
      const response = await axios.post('/api/manager/restaurant/bills', {
        orderId: order._id,
        discount: billDiscount,
        notes: billNotes
      });

      toast.success('Bill generated successfully!');
      setShowBillModal(false);
      setSelectedOrderForBill(null);
      setBillDiscount(0);
      setBillNotes('');
      
      fetchDashboardData();
      
      if (response.data.bill) {
        handlePrintBill(response.data.bill);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handlePrintBill = async (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .bill-title { color: #2563eb; font-weight: bold; font-size: 24px; margin-bottom: 10px; }
            .bill-details { margin-bottom: 20px; background-color: #f8fafc; padding: 15px; border-radius: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total-section { text-align: right; border-top: 2px solid #333; padding-top: 15px; }
            .total-row { font-weight: bold; font-size: 18px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hotel Restaurant</h1>
            <div class="bill-title">DINE-IN BILL</div>
          </div>
          
          <div class="bill-details">
            <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
            <p><strong>Table Number:</strong> ${bill.tableNumber}</p>
            <p><strong>Customer:</strong> ${bill.customerName}</p>
            ${bill.customerPhone ? `<p><strong>Phone:</strong> ${bill.customerPhone}</p>` : ''}
            <p><strong>Date & Time:</strong> ${new Date(bill.generatedAt).toLocaleString()}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => {
                const addOnsText = item.addOns && item.addOns.length > 0 
                  ? `<br><small style="color: #666;">+ ${item.addOns.map(a => a.name).join(', ')}</small>`
                  : '';
                const addOnsTotal = item.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0;
                const itemTotal = (item.price + addOnsTotal) * item.quantity;
                
                return `
                  <tr>
                    <td>${item.name}${addOnsText}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price + addOnsTotal).toFixed(2)}</td>
                    <td>₹${itemTotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <p>Subtotal: ₹${bill.subtotal.toFixed(2)}</p>
            ${bill.discount > 0 ? `<p>Discount: -₹${bill.discount.toFixed(2)}</p>` : ''}
            <p>Tax (5%): ₹${bill.tax.toFixed(2)}</p>
            ${(bill.serviceCharge || 0) > 0 ? `<p>Service Charge (10%): ₹${(bill.serviceCharge || 0).toFixed(2)}</p>` : ''}
            <p class="total-row">Total Amount: ₹${bill.totalAmount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}</p>
            <p><strong>Payment Status:</strong> ${bill.paymentStatus === 'paid' ? '✓ PAID' : '⏳ PENDING'}</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p>Thank you for dining with us!</p>
            <p>Generated by: ${bill.generatedBy}</p>
          </div>
          
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px;">Print Bill</button>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleMarkBillAsPaid = async (billId: string, paymentMethod: string = 'cash') => {
    try {
      await axios.put(`/api/manager/restaurant/bills/${billId}/paid`, {
        paymentMethod
      });
      
      toast.success('Bill marked as paid!');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update bill');
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = billSearch === '' || 
      bill.billNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(billSearch.toLowerCase()) ||
      bill.tableNumber.toLowerCase().includes(billSearch.toLowerCase());
    
    const matchesFilter = billFilter === 'all' || bill.paymentStatus === billFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-300';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant data...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
              <p className="text-gray-600 mt-2">Dine-In Operations Only</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tables</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTables}</p>
              </div>
              <Utensils className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Available</p>
                <p className="text-2xl font-bold text-green-900">{stats.availableTables}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Occupied</p>
                <p className="text-2xl font-bold text-blue-900">{stats.occupiedTables}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Cleaning</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.cleaningTables}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Today's Orders</p>
                <p className="text-2xl font-bold text-purple-900">{stats.todayOrders}</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg shadow-md border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600">Revenue</p>
                <p className="text-2xl font-bold text-indigo-900">₹{stats.todayRevenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'tables', label: 'Table Management', icon: Utensils },
                { id: 'orders', label: 'Orders', icon: Receipt },
                { id: 'kitchen', label: 'Kitchen Display', icon: ChefHat },
                { id: 'bills', label: 'Billing', icon: DollarSign },
                { id: 'reports', label: 'Reports', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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

        {/* Table Management */}
        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div
                key={table._id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${getStatusColor(table.status)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{table.tableName}</h3>
                    <p className="text-sm text-gray-600">
                      <Users className="inline h-4 w-4 mr-1" />
                      Seats: {table.seatingCapacity}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                    {table.status}
                  </span>
                </div>

                {table.guestName && (
                  <div className="mb-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-900">{table.guestName}</p>
                    <p className="text-xs text-gray-600">Running Bill: ₹{table.runningBill}</p>
                  </div>
                )}

                {table.assignedWaiter && (
                  <div className="mb-3 flex items-center justify-between bg-blue-50 p-2 rounded">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-900">{table.assignedWaiter}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveWaiter(table._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setShowWaiterModal(true);
                    }}
                    className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
                  >
                    {table.assignedWaiter ? 'Change Waiter' : 'Assign Waiter'}
                  </button>
                  
                  <select
                    value={table.status}
                    onChange={(e) => handleTableStatusChange(table._id, e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                {table.currentOrderId && (
                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      // Scroll to order
                    }}
                    className="w-full mt-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    View Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waiter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.bookingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.tableNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.assignedWaiterName || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/manager/restaurant/orders/${order._id}`)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kitchen Display */}
        {activeTab === 'kitchen' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kitchenOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.bookingId}</h3>
                    <p className="text-sm text-gray-600">Table: {order.tableNumber}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.specialRequests && (
                  <div className="mb-4 p-2 bg-yellow-50 rounded">
                    <p className="text-xs text-gray-600">Notes: {order.specialRequests}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Cooking
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Ready
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'bills' && (
          <div>
            {/* Bill Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setBillActiveTab('pending')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      billActiveTab === 'pending'
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Pending Orders ({orders.filter(o => o.paymentStatus === 'pending').length})
                  </button>
                  <button
                    onClick={() => setBillActiveTab('generated')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      billActiveTab === 'generated'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Generated Bills ({bills.length})
                  </button>
                </nav>
              </div>
            </div>

            {billActiveTab === 'pending' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {orders.filter(o => o.paymentStatus === 'pending').length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Orders</h3>
                    <p className="text-gray-600">All orders have been billed.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.filter(o => o.paymentStatus === 'pending').map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Utensils className="h-5 w-5 text-blue-500 mr-2" />
                                <div className="text-sm font-bold text-blue-600">Table {order.tableNumber}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                              <div className="text-sm text-gray-500">{order.customerPhone}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{order.items.length} items</div>
                              <div className="text-xs text-gray-500">
                                {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                {order.items.length > 2 && '...'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedOrderForBill(order);
                                  setShowBillModal(true);
                                }}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700 flex items-center"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Generate Bill
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {billActiveTab === 'generated' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {bills.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Generated Bills</h3>
                    <p className="text-gray-600">Bills will appear here once generated.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bills.map((bill) => (
                          <tr key={bill._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">{bill.billNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">Table {bill.tableNumber}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{bill.customerName}</div>
                              {bill.customerPhone && (
                                <div className="text-sm text-gray-500">{bill.customerPhone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-green-600">₹{bill.totalAmount.toFixed(2)}</div>
                              {bill.discount > 0 && (
                                <div className="text-xs text-gray-500">Discount: -₹{bill.discount.toFixed(2)}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className={`px-2 py-1 text-xs rounded-full w-fit mb-1 ${
                                  bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {bill.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                </span>
                                <span className="text-xs text-gray-600 uppercase">{bill.paymentMethod}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handlePrintBill(bill)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                                  title="Print Bill"
                                >
                                  <Printer className="h-4 w-4 mr-1" />
                                  Print
                                </button>
                                {bill.paymentStatus === 'pending' && (
                                  <button
                                    onClick={() => handleMarkBillAsPaid(bill._id)}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                                    title="Mark as Paid"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark Paid
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Restaurant Analytics</h2>
                <div className="flex space-x-2">
                  {['day', 'week', 'month'].map((period) => (
                    <button
                      key={period}
                      onClick={() => fetchReports(period)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        reportPeriod === period
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {reports ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-3xl font-bold text-indigo-600">{reports.totalOrders}</p>
                      </div>
                      <Receipt className="h-12 w-12 text-indigo-200" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600">₹{reports.totalRevenue.toFixed(0)}</p>
                      </div>
                      <DollarSign className="h-12 w-12 text-green-200" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Order Value</p>
                        <p className="text-3xl font-bold text-blue-600">
                          ₹{reports.totalOrders > 0 ? (reports.totalRevenue / reports.totalOrders).toFixed(0) : 0}
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-blue-200" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Popular Items</p>
                        <p className="text-3xl font-bold text-purple-600">{reports.popularDishes.length}</p>
                      </div>
                      <Utensils className="h-12 w-12 text-purple-200" />
                    </div>
                  </div>
                </div>

                {/* Charts Row 1: Popular Dishes & Table Usage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Dishes */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Popular Dishes</h3>
                    {reports.popularDishes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reports.popularDishes.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="_id" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" name="Orders" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        No data available for this period
                      </div>
                    )}
                  </div>

                  {/* Table Usage */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Usage Statistics</h3>
                    {reports.tableUsage.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reports.tableUsage}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ _id, orders }) => `${_id}: ${orders}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="orders"
                          >
                            {reports.tableUsage.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        No data available for this period
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Dishes Table */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">Most Ordered Items</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dish Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reports.popularDishes.slice(0, 10).map((dish, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{dish._id}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-full">
                                  {dish.count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table Performance */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">Table Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reports.tableUsage.map((table, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Utensils className="h-5 w-5 text-blue-500 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">{table._id}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 text-sm font-semibold text-green-600 bg-green-100 rounded-full">
                                  {table.orders}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{
                                        width: `${Math.min((table.orders / Math.max(...reports.tableUsage.map(t => t.orders))) * 100, 100)}%`
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {Math.round((table.orders / Math.max(...reports.tableUsage.map(t => t.orders))) * 100)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <p className="text-sm text-gray-600">Most Popular Dish</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${reports.popularDishes[0]?._id || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${reports.popularDishes[0]?.count || 0} orders
                      </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <p className="text-sm text-gray-600">Most Active Table</p>
                      <p className="text-xl font-bold text-gray-900">
                        Table ${reports.tableUsage[0]?._id || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${reports.tableUsage[0]?.orders || 0} orders
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <p className="text-sm text-gray-600">Period</p>
                      <p className="text-xl font-bold text-gray-900 capitalize">
                        ${reportPeriod}
                      </p>
                      <p className="text-sm text-gray-500">
                        Analysis period
                      </p>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
                      <p className="text-sm text-gray-600 mt-1">Download detailed analytics for your records</p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={exportToCSV}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          const dataStr = JSON.stringify(reports, null, 2);
                          const dataBlob = new Blob([dataStr], { type: 'application/json' });
                          const url = URL.createObjectURL(dataBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `restaurant-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.json`;
                          link.click();
                          URL.revokeObjectURL(url);
                          toast.success('Report exported to JSON successfully');
                        }}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </button>
                      <button
                        onClick={printReport}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Waiter Assignment Modal */}
                {showWaiterModal && selectedTable && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h3 className="text-lg font-bold mb-4">Assign Waiter to {selectedTable.tableName}</h3>
                      
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {waiters.map((waiter) => (
                          <button
                            key={waiter._id}
                            onClick={() => handleAssignWaiter(waiter._id)}
                            className="w-full text-left p-3 border border-gray-300 rounded hover:bg-indigo-50 hover:border-indigo-500"
                          >
                            <p className="font-medium">{waiter.firstName} {waiter.lastName}</p>
                            <p className="text-sm text-gray-600">{waiter.department}</p>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setShowWaiterModal(false);
                          setSelectedTable(null);
                        }}
                        className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Bill Generation Modal */}
                {showBillModal && selectedOrderForBill && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold">Generate Bill - Table {selectedOrderForBill.tableNumber}</h2>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Order Details</h3>
                          <p className="text-sm text-gray-600">Customer: {selectedOrderForBill.customerName}</p>
                          <p className="text-sm text-gray-600">Phone: {selectedOrderForBill.customerPhone}</p>
                          <p className="text-sm text-gray-600">Table: {selectedOrderForBill.tableNumber}</p>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Items Ordered</h3>
                          <div className="space-y-2">
                            {selectedOrderForBill.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm border-b pb-2">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Discount (₹)</label>
                          <input
                            type="number"
                            value={billDiscount}
                            onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                            className="w-full border rounded-md px-3 py-2"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                          <textarea
                            value={billNotes}
                            onChange={(e) => setBillNotes(e.target.value)}
                            className="w-full border rounded-md px-3 py-2"
                            rows={3}
                            placeholder="Any special notes for the bill..."
                          />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Bill Summary</h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{selectedOrderForBill.totalAmount.toFixed(2)}</span>
                            </div>
                            {billDiscount > 0 && (
                              <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>-₹{billDiscount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Tax (5%):</span>
                              <span>₹{((selectedOrderForBill.totalAmount - billDiscount) * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Service Charge (10%):</span>
                              <span>₹{((selectedOrderForBill.totalAmount - billDiscount) * 0.10).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-1">
                              <span>Total:</span>
                              <span>₹{((selectedOrderForBill.totalAmount - billDiscount) * 1.15).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-t flex justify-end space-x-4">
                        <button
                          onClick={() => {
                            setShowBillModal(false);
                            setSelectedOrderForBill(null);
                            setBillDiscount(0);
                            setBillNotes('');
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleGenerateBillFromOrder(selectedOrderForBill)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Generate & Print Bill
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Reports...</h3>
                <p className="text-gray-600">Please wait while we fetch the analytics data</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Waiter Assignment Modal - MOVED OUTSIDE TABS */}
      {showWaiterModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Assign Waiter to {selectedTable.tableName}</h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {waiters.map((waiter) => (
                <button
                  key={waiter._id}
                  onClick={() => handleAssignWaiter(waiter._id)}
                  className="w-full text-left p-3 border border-gray-300 rounded hover:bg-indigo-50 hover:border-indigo-500"
                >
                  <p className="font-medium">{waiter.firstName} {waiter.lastName}</p>
                  <p className="text-sm text-gray-600">{waiter.department}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowWaiterModal(false);
                setSelectedTable(null);
              }}
              className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bill Generation Modal - MOVED OUTSIDE TABS */}
      {showBillModal && selectedOrderForBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Generate Bill - Table {selectedOrderForBill.tableNumber}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Order Details</h3>
                <p className="text-sm text-gray-600">Customer: {selectedOrderForBill.customerName}</p>
                <p className="text-sm text-gray-600">Phone: {selectedOrderForBill.customerPhone}</p>
                <p className="text-sm text-gray-600">Table: {selectedOrderForBill.tableNumber}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Items Ordered</h3>
                <div className="space-y-2">
                  {selectedOrderForBill.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm border-b pb-2">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Discount (₹)</label>
                <input
                  type="number"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded-md px-3 py-2"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Any special notes for the bill..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Bill Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrderForBill.totalAmount.toFixed(2)}</span>
                  </div>
                  {billDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{billDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (5%):</span>
                    <span>₹{((selectedOrderForBill.totalAmount - billDiscount) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge (10%):</span>
                    <span>₹{((selectedOrderForBill.totalAmount - billDiscount) * 0.10).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-1">
                    <span>Total:</span>
                    <span>₹{((selectedOrderForBill.totalAmount - billDiscount) * 1.15).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setSelectedOrderForBill(null);
                  setBillDiscount(0);
                  setBillNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerateBillFromOrder(selectedOrderForBill)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Generate & Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;
