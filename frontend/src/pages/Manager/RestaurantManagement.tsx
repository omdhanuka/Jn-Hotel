import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils, Users, DollarSign, Clock, Plus, Eye, Edit, Trash2,
  Check, X, ChefHat, Receipt, TrendingUp, Calendar, User, AlertCircle,
  Printer, Download, Filter, Search, Star
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
  taxPercent?: number;              // Add this
  serviceCharge?: number;
  serviceChargePercent?: number;    // Add this
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
  const [activeTab, setActiveTab] = useState<'tables' | 'orders' | 'kitchen' | 'bills' | 'reports' | 'menu'>('tables');
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
  const [billTaxPercent, setBillTaxPercent] = useState(5); // Add this
  const [billServiceChargePercent, setBillServiceChargePercent] = useState(10); // Add this

  // Menu
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuFilter, setMenuFilter] = useState<'all' | 'available' | 'out-of-stock'>('all');
  const [todaySpecials, setTodaySpecials] = useState<any[]>([]);
  const [showAddSpecialModal, setShowAddSpecialModal] = useState(false);
  const [showSpecialsModal, setShowSpecialsModal] = useState(false);
  const [selectedSpecialItems, setSelectedSpecialItems] = useState<string[]>([]);
  const [editingSpecial, setEditingSpecial] = useState<any>(null);
  const [specialForm, setSpecialForm] = useState({
    name: '',
    description: '',
    category: '',
    dishType: 'veg' as 'veg' | 'non-veg' | 'vegan',
    price: 0,
    originalPrice: 0,
    stockQuantity: 10,
    preparationTime: '',
    images: [] as string[],
    spiceLevels: [] as string[],
    addOns: [] as { name: string; price: number }[]
  });

  const categories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Soups', 'Salads', 'Snacks', 'Specials'];

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

  useEffect(() => {
    if (activeTab === 'menu') {
      fetchMenuItems();
      fetchTodaySpecials();
    }
  }, [activeTab, menuFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data sequentially to better handle errors
      const statsRes = await axios.get('/manager/restaurant/dashboard');
      setStats(statsRes.data);

      const tablesRes = await axios.get('/manager/restaurant/tables');
      setTables(tablesRes.data.tables);

      const ordersRes = await axios.get('/manager/restaurant/orders');
      setOrders(ordersRes.data.orders);

      const kitchenRes = await axios.get('/manager/restaurant/kitchen');
      setKitchenOrders(kitchenRes.data.orders);

      const waitersRes = await axios.get('/manager/restaurant/waiters');
      setWaiters(waitersRes.data.waiters);

      const billsRes = await axios.get('/manager/restaurant/bills');
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
      const response = await axios.get(`/manager/restaurant/reports?period=${period}`);
      setReports(response.data);
      setReportPeriod(period);
    } catch (error) {
      toast.error('Failed to load reports');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const params = new URLSearchParams();
      if (menuFilter === 'available') params.append('available', 'true');
      if (menuFilter === 'out-of-stock') params.append('available', 'false');
      
      const response = await axios.get(`/manager/restaurant/menu?${params.toString()}`);
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      toast.error('Failed to load menu items');
    }
  };

  const fetchTodaySpecials = async () => {
    try {
      const response = await axios.get('/manager/restaurant/specials/today');
      setTodaySpecials(response.data.specials || []);
    } catch (error) {
      console.error('Failed to fetch today specials:', error);
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
      await axios.put(`/manager/restaurant/tables/${tableId}/status`, { status });
      toast.success('Table status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update table status');
    }
  };

  const handleAssignWaiter = async (waiterId: string) => {
    if (!selectedTable) return;

    try {
      await axios.post(`/manager/restaurant/tables/${selectedTable._id}/assign-waiter`, {
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
      await axios.delete(`/manager/restaurant/tables/${tableId}/waiter`);
      toast.success('Waiter removed');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to remove waiter');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await axios.put(`/manager/restaurant/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleGenerateBillForTable = async (table: Table) => {
    try {
      const response = await axios.post('/manager/restaurant/bills/generate-for-table', {
        tableNumber: table.tableName,
        discount: billDiscount,
        notes: billNotes
      });

      toast.success('Bill generated successfully!');
      setShowBillModal(false);
      setSelectedOrderForBill(null);
      setBillDiscount(0);
      setBillNotes('');
      
      // Refresh all data including bills
      await fetchDashboardData();
      
      // Switch to generated bills tab
      setBillActiveTab('generated');
      
      if (response.data.bill) {
        handlePrintBill(response.data.bill);
      }
    } catch (error: any) {
      if (error.response?.data?.bill) {
        handlePrintBill(error.response.data.bill);
        toast('Bill already generated for this table', { icon: 'ℹ️' });
        await fetchDashboardData();
        setBillActiveTab('generated');
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate bill');
      }
    }
  };

  const handleGenerateBillFromOrder = async (order: Order) => {
    try {
      const response = await axios.post('/manager/restaurant/bills', {
        orderId: order._id,
        discount: billDiscount,
        taxPercent: billTaxPercent, // Add this
        serviceChargePercent: billServiceChargePercent, // Add this
        notes: billNotes
      });

      toast.success('Bill generated successfully!');
      setShowBillModal(false);
      setSelectedOrderForBill(null);
      setBillDiscount(0);
      setBillTaxPercent(5); // Reset
      setBillServiceChargePercent(10); // Reset
      setBillNotes('');
      
      // Refresh all data including bills
      await fetchDashboardData();
      
      // Switch to generated bills tab
      setBillActiveTab('generated');
      
      if (response.data.bill) {
        handlePrintBill(response.data.bill);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
      // Still refresh data in case bill was created
      await fetchDashboardData();
    }
  };

  const handlePrintBill = async (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              color: #000;
              background: #fff;
              font-size: 12px;
              line-height: 1.4;
            }
            
            .bill-container {
              max-width: 300mm;
              margin: 0 auto;
              border: 2px solid #000;
              padding: 15px;
            }
            
            /* Header */
            .header {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            
            .hotel-name {
              font-size: 20px;
              font-weight: bold;
              letter-spacing: 2px;
              margin-bottom: 5px;
            }
            
            .bill-type {
              font-size: 14px;
              font-weight: bold;
              margin-top: 5px;
            }
            
            .separator {
              border-top: 1px solid #000;
              margin: 10px 0;
            }
            
            /* Bill Info */
            .bill-info {
              margin-bottom: 15px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            
            .info-label {
              font-weight: bold;
              width: 120px;
            }
            
            .info-value {
              flex: 1;
              text-align: left;
            }
            
            /* Items Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              border: 1px solid #000;
            }
            
            .items-table th,
            .items-table td {
              border: 1px solid #000;
              padding: 8px 5px;
              text-align: left;
            }
            
            .items-table th {
              font-weight: bold;
              text-transform: uppercase;
              font-size: 11px;
              background: #fff;
            }
            
            .items-table td:nth-child(2),
            .items-table th:nth-child(2),
            .items-table td:nth-child(3),
            .items-table th:nth-child(3),
            .items-table td:nth-child(4),
            .items-table th:nth-child(4) {
              text-align: right;
            }
            
            .items-table td:first-child,
            .items-table th:first-child {
              width: 50%;
            }
            
            .addon-text {
              font-size: 10px;
              color: #333;
              margin-top: 2px;
            }
            
            /* Summary */
            .summary {
              margin: 15px 0;
              padding: 10px;
              border: 1px solid #000;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            
            .summary-label {
              text-align: left;
            }
            
            .summary-value {
              text-align: right;
              min-width: 100px;
            }
            
            .summary-total {
              border-top: 2px solid #000;
              margin-top: 8px;
              padding-top: 8px;
              font-weight: bold;
              font-size: 14px;
            }
            
            /* Payment Info */
            .payment-info {
              margin: 15px 0;
              padding: 10px;
              border: 1px solid #000;
            }
            
            .payment-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            
            /* Footer */
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #000;
              font-size: 11px;
            }
            
            .footer-message {
              margin-bottom: 10px;
              font-weight: bold;
            }
            
            .generated-by {
              font-size: 10px;
              color: #333;
            }
            
            /* Print Button */
            .print-button {
              display: block;
              margin: 20px auto 0;
              padding: 12px 30px;
              border: 2px solid #000;
              background: #fff;
              color: #000;
              font-weight: bold;
              font-size: 14px;
              cursor: pointer;
              font-family: 'Courier New', monospace;
            }
            
            .print-button:hover {
              background: #f0f0f0;
            }
            
            /* Print Styles */
            @media print {
              body {
                padding: 0;
              }
              
              .bill-container {
                border: none;
                max-width: 100%;
              }
              
              .print-button {
                display: none;
              }
              
              @page {
                margin: 10mm;
                size: A5;
              }
            }
            
            /* Thermal Printer (80mm) */
            @media print and (max-width: 80mm) {
              body {
                font-size: 11px;
                padding: 5px;
              }
              
              .bill-container {
                padding: 5px;
              }
              
              .hotel-name {
                font-size: 16px;
              }
              
              .bill-type {
                font-size: 12px;
              }
              
              .items-table th,
              .items-table td {
                padding: 5px 3px;
                font-size: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <!-- Header -->
            <div class="header">
              <div class="hotel-name">HOTEL RESTAURANT</div>
              <div class="bill-type">DINE-IN BILL</div>
            </div>
            
            <div class="separator"></div>
            
            <!-- Bill Information -->
            <div class="bill-info">
              <div class="info-row">
                <span class="info-label">Bill Number:</span>
                <span class="info-value">${bill.billNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Table Number:</span>
                <span class="info-value">${bill.tableNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Customer:</span>
                <span class="info-value">${bill.customerName}</span>
              </div>
              ${bill.customerPhone ? `
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${bill.customerPhone}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Date & Time:</span>
                <span class="info-value">${new Date(bill.generatedAt).toLocaleString()}</span>
              </div>
            </div>
            
            <div class="separator"></div>
            
            <!-- Items Table -->
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
                  const addOnsTotal = item.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0;
                  const unitPrice = item.price + addOnsTotal;
                  const itemTotal = unitPrice * item.quantity;
                  const addOnsText = item.addOns && item.addOns.length > 0 
                    ? `<div class="addon-text">+ ${item.addOns.map(a => a.name).join(', ')}</div>`
                    : '';
                  
                  return `
                    <tr>
                      <td>${item.name}${addOnsText}</td>
                      <td>${item.quantity}</td>
                      <td>₹${unitPrice.toFixed(2)}</td>
                      <td>₹${itemTotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="separator"></div>
            
            <!-- Summary -->
            <div class="summary">
              <div class="summary-row">
                <span class="summary-label">Subtotal:</span>
                <span class="summary-value">₹${bill.subtotal.toFixed(2)}</span>
              </div>
              ${bill.discount > 0 ? `
              <div class="summary-row">
                <span class="summary-label">Discount:</span>
                <span class="summary-value">-₹${bill.discount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="summary-row">
                <span class="summary-label">Tax (${bill.taxPercent || 5}%):</span>
                <span class="summary-value">₹${bill.tax.toFixed(2)}</span>
              </div>
              ${(bill.serviceCharge || 0) > 0 ? `
              <div class="summary-row">
                <span class="summary-label">Service Charge (${bill.serviceChargePercent || 10}%):</span>
                <span class="summary-value">₹${(bill.serviceCharge || 0).toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="summary-row summary-total">
                <span class="summary-label">Total Amount:</span>
                <span class="summary-value">₹${bill.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <!-- Payment Information -->
            <div class="payment-info">
              <div class="payment-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${bill.paymentMethod.toUpperCase()}</span>
              </div>
              <div class="payment-row">
                <span class="info-label">Payment Status:</span>
                <span class="info-value">${bill.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}</span>
              </div>
            </div>
            
            <div class="separator"></div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-message">Thank you for dining with us!</div>
              <div class="generated-by">Generated by: ${bill.generatedBy}</div>
            </div>
            
            <!-- Print Button (hidden during print) -->
            <button class="print-button" onclick="window.print()">Print Bill</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleMarkBillAsPaid = async (billId: string, paymentMethod: string = 'cash') => {
    try {
      await axios.put(`/manager/restaurant/bills/${billId}/paid`, {
        paymentMethod
      });
      
      toast.success('Bill marked as paid!');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update bill');
    }
  };

  const handleUpdateStock = async (menuItemId: string, newStock: number) => {
    try {
      await axios.put(`/manager/restaurant/menu/${menuItemId}/stock`, {
        stockQuantity: newStock
      });
      toast.success('Stock updated successfully');
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleToggleItemAvailability = async (menuItemId: string, currentStatus: boolean) => {
    try {
      await axios.put(`/manager/restaurant/menu/${menuItemId}/availability`, {
        isAvailable: !currentStatus
      });
      toast.success(`Item marked as ${!currentStatus ? 'available' : 'out of stock'}`);
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleToggleTodaySpecial = async (itemId: string, currentStatus: boolean) => {
    try {
      await axios.put(`/manager/restaurant/menu/${itemId}/today-special`, {
        isTodaySpecial: !currentStatus
      });
      
      toast.success(`Item ${!currentStatus ? 'added to' : 'removed from'} today's specials`);
      fetchMenuItems();
      fetchTodaySpecials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update today\'s special');
    }
  };

  const handleCreateSpecial = async () => {
    if (!specialForm.name || !specialForm.category || !specialForm.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingSpecial) {
        await axios.put(`/manager/restaurant/specials/today/${editingSpecial._id}`, specialForm);
        toast.success('Special updated successfully');
      } else {
        await axios.post('/manager/restaurant/specials/today', specialForm);
        toast.success('Today\'s special created successfully');
      }
      
      setShowAddSpecialModal(false);
      resetSpecialForm();
      fetchTodaySpecials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save special');
    }
  };

  const handleEditSpecial = (special: any) => {
    setEditingSpecial(special);
    setSpecialForm({
      name: special.name,
      description: special.description || '',
      category: special.category,
      dishType: special.dishType,
      price: special.price,
      originalPrice: special.originalPrice || 0,
      stockQuantity: special.stockQuantity,
      preparationTime: special.preparationTime || '',
      images: special.images || [],
      spiceLevels: special.spiceLevels || [],
      addOns: special.addOns || []
    });
    setShowAddSpecialModal(true);
  };

  const handleDeleteSpecial = async (specialId: string) => {
    if (!window.confirm('Remove this item from today\'s specials?')) return;

    try {
      await axios.delete(`/manager/restaurant/specials/today/${specialId}`);
      toast.success('Special removed successfully');
      fetchTodaySpecials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove special');
    }
  };

  const resetSpecialForm = () => {
    setEditingSpecial(null);
    setSpecialForm({
      name: '',
      description: '',
      category: '',
      dishType: 'veg',
      price: 0,
      originalPrice: 0,
      stockQuantity: 10,
      preparationTime: '',
      images: [],
      spiceLevels: [],
      addOns: []
    });
  };

  const handleSetBulkSpecials = async () => {
    if (selectedSpecialItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    try {
      await axios.post('/manager/restaurant/menu/specials/bulk', {
        itemIds: selectedSpecialItems
      });
      
      toast.success(`${selectedSpecialItems.length} items set as today's specials`);
      setShowSpecialsModal(false);
      setSelectedSpecialItems([]);
      fetchMenuItems();
      fetchTodaySpecials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set specials');
    }
  };

  const handleClearAllSpecials = async () => {
    if (!window.confirm('Clear all today\'s specials?')) return;

    try {
      await axios.delete('/manager/restaurant/menu/specials/clear');
      toast.success('All today\'s specials cleared');
      fetchMenuItems();
      fetchTodaySpecials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear specials');
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
                { id: 'reports', label: 'Reports', icon: TrendingUp },
                { id: 'menu', label: 'Menu Items', icon: Utensils }
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                              <div className="text-sm text-gray-500">{order.customerPhone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                              <span className={`px-2 py-1 text-xs rounded-full w-fit mb-1 ${
                                order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedOrderForBill(order);
                                  setShowBillModal(true);
                                }}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center"
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

            {reports && reports.totalOrders > 0 ? (
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

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Dishes Chart */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Popular Dishes</h3>
                    {reports.popularDishes && reports.popularDishes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reports.popularDishes.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="_id" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                            labelStyle={{ fontWeight: 'bold' }}
                          />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" name="Orders" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <AlertCircle className="h-16 w-16 mb-4" />
                        <p className="text-center">No dish data available for this period</p>
                      </div>
                    )}
                  </div>

                  {/* Table Usage Chart */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Usage Statistics</h3>
                    {reports.tableUsage && reports.tableUsage.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reports.tableUsage}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => {
                              const data = entry.payload || entry;
                              const percent = entry.percent !== undefined ? entry.percent : 0;
                              return `${data._id}: ${data.orders} (${(percent * 100).toFixed(0)}%)`;
                            }}
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
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <AlertCircle className="h-16 w-16 mb-4" />

                        <p className="text-center">No table usage data available for this period</p>
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
                    {reports.popularDishes && reports.popularDishes.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dish Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {((dish.count / reports.totalOrders) * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No dish orders recorded for this period</p>
                      </div>
                    )}
                  </div>

                  {/* Table Performance */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">Table Performance</h3>
                    </div>
                    {reports.tableUsage && reports.tableUsage.length > 0 ? (
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
                            {reports.tableUsage.map((table, index) => {
                              const maxOrders = Math.max(...reports.tableUsage.map(t => t.orders));
                              const utilization = (table.orders / maxOrders) * 100;
                              return (
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
                                          style={{ width: `${Math.min(utilization, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-gray-600 min-w-[40px]">
                                        {utilization.toFixed(0)}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No table usage data for this period</p>
                      </div>
                    )}
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
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="flex flex-col items-center">
                  <AlertCircle className="h-20 w-20 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-600 mb-4">
                    {reports ? 
                      'No orders found for the selected period. Orders will appear here once customers place orders.' :
                      'Loading report data...'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Selected Period: <span className="font-semibold capitalize">{reportPeriod}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div>
            {/* Today's Specials Section - ALWAYS AT TOP */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-yellow-900 flex items-center">
                  <Star className="h-7 w-7 text-yellow-500 mr-2" />
                  Today's Special Items
                </h2>
                <button
                  onClick={() => setShowAddSpecialModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Today's Special
                </button>
              </div>

              {todaySpecials.length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
                  <Star className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    No Today's Specials Yet
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Add new items that are available only for today!
                  </p>
                  <button
                    onClick={() => setShowAddSpecialModal(true)}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Add First Special
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {todaySpecials.map((special) => (
                    <div key={special._id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg overflow-hidden border-2 border-yellow-400">
                      <div className="h-48 bg-gray-200 relative">
                        {special.images?.[0] ? (
                          <img src={special.images[0]} alt={special.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="h-20 w-20 text-yellow-400" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-yellow-500 text-white px-4 py-2 rounded-full font-bold flex items-center shadow-lg">
                          <Star className="h-5 w-5 mr-1" />
                          TODAY'S SPECIAL
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{special.name}</h3>
                          <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                            special.dishType === 'veg' ? 'bg-green-100 text-green-800' :
                            special.dishType === 'non-veg' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {special.dishType}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{special.description}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-2xl font-bold text-green-600">₹{special.price}</span>
                            {special.originalPrice && special.originalPrice > special.price && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ₹{special.originalPrice}
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-semibold ${
                            special.stockQuantity > 5 ? 'text-green-600' :
                            special.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            Stock: {special.stockQuantity}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSpecial(special)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSpecial(special._id)}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 flex items-center justify-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Regular Menu Items Section */}
            <div className="border-t-4 border-gray-300 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Regular Menu Items</h2>
              
              {/* Filter Buttons */}
              <div className="mb-6 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMenuFilter('all')}
                    className={`px-4 py-2 rounded-md ${
                      menuFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    onClick={() => setMenuFilter('available')}
                    className={`px-4 py-2 rounded-md ${
                      menuFilter === 'available'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setMenuFilter('out-of-stock')}
                    className={`px-4 py-2 rounded-md ${
                      menuFilter === 'out-of-stock'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Out of Stock
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowSpecialsModal(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Manage Today's Specials
                  </button>
                  {todaySpecials.length > 0 && (
                    <button
                      onClick={handleClearAllSpecials}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Clear All Specials
                    </button>
                  )}
                </div>
              </div>

              {/* Today's Specials Banner */}
              {todaySpecials.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <Star className="h-6 w-6 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-bold text-yellow-900">Today's Special Items ({todaySpecials.length})</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {todaySpecials.map(item => (
                      <div key={item._id} className="bg-white rounded p-2 border border-yellow-200">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.category}</p>
                        <p className="text-sm font-bold text-green-600">₹{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div key={item._id} className={`bg-white rounded-lg shadow-md overflow-hidden ${
                    item.isTodaySpecial ? 'ring-2 ring-yellow-400' : ''
                  }`}>
                    <div className="h-40 bg-gray-200 relative">
                      {item.images && item.images[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      {item.isTodaySpecial && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          TODAY'S SPECIAL
                        </div>
                      )}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">OUT OF STOCK</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                          item.dishType === 'veg' ? 'bg-green-100 text-green-800' :
                          item.dishType === 'non-veg' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.dishType}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-green-600">₹{item.price}</span>
                        {item.stockQuantity !== undefined && (
                          <span className="text-sm text-gray-500">
                            Stock: {item.stockQuantity}
                          </span>
                        )}
                      </div>

                      {/* Stock Input */}
                      {item.stockQuantity !== undefined && (
                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1">Update Stock</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              min="0"
                              defaultValue={item.stockQuantity}
                              className="flex-1 border rounded px-2 py-1 text-sm"
                              onBlur={(e) => {
                                const newStock = parseInt(e.target.value);
                                if (newStock !== item.stockQuantity) {
                                  handleUpdateStock(item._id, newStock);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Availability Toggle */}
                      <div className="flex justify-between items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={() => handleToggleItemAvailability(item._id, item.isAvailable)}
                            className="mr-2 h-4 w-4"
                          />
                          <span className="text-sm font-medium">
                            {item.isAvailable ? 'Available' : 'Out of Stock'}
                          </span>
                        </label>
                        
                        <button
                          onClick={() => handleToggleItemAvailability(item._id, item.isAvailable)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            item.isAvailable
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {item.isAvailable ? 'Mark Out' : 'Mark Available'}
                        </button>
                      </div>

                      {/* Today's Special Toggle */}
                      <div className="mt-3 pt-3 border-t">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isTodaySpecial}
                            onChange={() => handleToggleTodaySpecial(item._id, item.isTodaySpecial)}
                            className="mr-2 h-4 w-4"
                          />
                          <Star className="h-4 w-4 mr-1 text-yellow-600" />
                          <span className="text-sm font-medium">
                            {item.isTodaySpecial ? 'Today\'s Special' : 'Mark as Special'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {menuItems.length === 0 && (
                <div className="text-center py-12">
                  <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Items</h3>
                  <p className="text-gray-600">
                    {menuFilter === 'out-of-stock' 
                      ? 'All items are currently in stock'
                      : 'No menu items found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bill Generation Modal */}
        {showBillModal && selectedOrderForBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Generate Bill</h2>
                  <button
                    onClick={() => {
                      setShowBillModal(false);
                      setSelectedOrderForBill(null);
                      setBillDiscount(0);
                      setBillTaxPercent(5);
                      setBillServiceChargePercent(10);
                      setBillNotes('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Order Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">{selectedOrderForBill.bookingId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Table:</span>
                      <span className="font-medium">{selectedOrderForBill.tableNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">{selectedOrderForBill.customerName}</span>
                    </div>
                    {selectedOrderForBill.customerPhone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedOrderForBill.customerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrderForBill.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{item.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charges Configuration */}
                <div className="mb-6 bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
                    Bill Adjustments
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Discount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={billDiscount}
                        onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                        min="0"
                        max={selectedOrderForBill.totalAmount}
                        step="0.01"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Tax Percentage Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax (%)
                      </label>
                      <input
                        type="number"
                        value={billTaxPercent}
                        onChange={(e) => setBillTaxPercent(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Amount: ₹{((selectedOrderForBill.totalAmount - billDiscount) * (billTaxPercent / 100)).toFixed(2)}
                      </p>
                    </div>

                    {/* Service Charge Percentage Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Charge (%)
                      </label>
                      <input
                        type="number"
                        value={billServiceChargePercent}
                        onChange={(e) => setBillServiceChargePercent(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Amount: ₹{((selectedOrderForBill.totalAmount - billDiscount) * (billServiceChargePercent / 100)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Tax and service charge are calculated on the subtotal after discount.
                    </p>
                  </div>
                </div>

                {/* Notes Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={billNotes}
                    onChange={(e) => setBillNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes for the bill..."
                  />
                </div>

                {/* Bill Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Bill Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{selectedOrderForBill.totalAmount.toFixed(2)}</span>
                    </div>
                    {billDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span className="font-medium">-₹{billDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">After Discount:</span>
                      <span className="font-medium">₹{(selectedOrderForBill.totalAmount - billDiscount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (${billTaxPercent}%):</span>
                      <span className="font-medium">
                        ₹{((selectedOrderForBill.totalAmount - billDiscount) * (billTaxPercent / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Charge (${billServiceChargePercent}%):</span>
                      <span className="font-medium">
                        ₹{((selectedOrderForBill.totalAmount - billDiscount) * (billServiceChargePercent / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t-2 border-blue-300 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Grand Total:</span>
                        <span className="text-2xl font-bold text-green-600">
                          ₹{(
                            (selectedOrderForBill.totalAmount - billDiscount) * 
                            (1 + (billTaxPercent / 100) + (billServiceChargePercent / 100))
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowBillModal(false);
                      setSelectedOrderForBill(null);
                      setBillDiscount(0);
                      setBillTaxPercent(5);
                      setBillServiceChargePercent(10);
                      setBillNotes('');
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleGenerateBillFromOrder(selectedOrderForBill)}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center"
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    Generate Bill & Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waiter Assignment Modal */}
        {showWaiterModal && selectedTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Assign Waiter</h2>
                  <button
                    onClick={() => {
                      setShowWaiterModal(false);
                      setSelectedTable(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Table: {selectedTable.tableName}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {waiters.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No waiters available</p>
                ) : (
                  waiters.map((waiter) => (
                    <button
                      key={waiter._id}
                      onClick={() => handleAssignWaiter(waiter._id)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {waiter.firstName} {waiter.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {waiter.position || 'Waiter'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-6 border-t">
                <button
                  onClick={() => {
                    setShowWaiterModal(false);
                    setSelectedTable(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantManagement;
