import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  Hotel, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Utensils, 
  BedDouble,
  Building,
  Calculator
} from 'lucide-react';
import BookingManagement from './BookingManagement';
import RoomManagement from './RoomManagement';
import BookingChart from './BookingChart';
import BanquetManagement from './BanquetManagement';
import RestaurantManagement from './RestaurantManagement';
import RestaurantOrderManagement from './RestaurantOrderManagement';
import BillManagement from './BillManagement';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

// Types
interface ChartPoint {
  date: string;
  room: number;
  banquet: number;
  total: number;
}

interface StatsState {
  totalBookings: number;
  roomBookings: number;
  banquetBookings: number;
  todayBookings: number;
  totalRevenue: number;
  totalUsers: number;
}

interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Bill {
  items: BillItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  grandTotal: number;
  currency: string;
  notes?: string;
}

interface Booking {
  _id: string;
  type: string;
  resourceId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  eventDetails?: {
    eventType?: string;
    fullName?: string;
    bookingType?: string;
  };
  bill?: Bill;
}

interface Resource {
  _id?: string;
  roomNumber?: string | number;
  name?: string;
  price?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  minimumHours?: number;
  discount?: number;
}

const AdminPanel: React.FC = () => {
  const location = useLocation();
  const [bookingChartData, setBookingChartData] = useState<ChartPoint[]>([]);
  const [stats, setStats] = useState<StatsState>({
    totalBookings: 0,
    roomBookings: 0,
    banquetBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin' },
    { id: 'rooms', label: 'Rooms', icon: BedDouble, path: '/admin/rooms' },
    { id: 'banquets', label: 'Banquets', icon: Building, path: '/admin/banquets' },
    { id: 'restaurant', label: 'Restaurant', icon: Utensils, path: '/admin/restaurant' },
    { id: 'restaurant-orders', label: 'Restaurant Orders', icon: Utensils, path: '/admin/restaurant-orders' },
    { id: 'bills', label: 'Bills', icon: Calculator, path: '/admin/bills' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/admin/bookings' },
    { id: 'chart', label: 'Booking Chart', icon: Calendar, path: '/admin/booking-chart' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const fetchBookingStats = async () => {
    try {
      console.log('Fetching booking stats...');
      const response = await axios.get('/api/bookings/stats');
      console.log('Booking stats response:', response.data);
      
      const { chartData, totalBookings, roomBookings, banquetBookings, todayBookings } = response.data;
      
      setBookingChartData(chartData || []);
      setStats(prev => ({
        ...prev,
        totalBookings: totalBookings || 0,
        roomBookings: roomBookings || 0,
        banquetBookings: banquetBookings || 0,
        todayBookings: todayBookings || 0
      }));
    } catch (error) {
      console.error('Failed to fetch booking stats:', error);
      setStats({
        totalBookings: 0,
        roomBookings: 0,
        banquetBookings: 0,
        todayBookings: 0,
        totalRevenue: 0,
        totalUsers: 0
      });
    }
  };

  useEffect(() => {
    fetchBookingStats();
  }, []);

  const statsData = [
    { label: 'Total Bookings', value: stats.totalBookings.toString(), change: '+5%', color: 'blue' },
    { label: 'Room Bookings', value: stats.roomBookings.toString(), change: '+12%', color: 'green' },
    { label: 'Banquet Bookings', value: stats.banquetBookings.toString(), change: '+8%', color: 'purple' },
    { label: 'Today\'s Bookings', value: stats.todayBookings.toString(), change: '+3%', color: 'orange' }
  ];

  const recentBookings = [
    { id: 1, guest: 'John Doe', type: 'Room', date: '2024-03-15', status: 'confirmed' },
    { id: 2, guest: 'Jane Smith', type: 'Banquet', date: '2024-03-16', status: 'pending' },
    { id: 3, guest: 'Mike Johnson', type: 'Restaurant', date: '2024-03-17', status: 'confirmed' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <div className="flex items-center space-x-2">
              <Hotel className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
          </div>
          
          <nav className="mt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={
              <div>
                {/* Dashboard Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600">Overview of hotel operations</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statsData.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <span className={`text-sm font-medium text-${stat.color}-600`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Booking Trends (Last 30 Days)</h3>
                    <span className="text-sm text-gray-500">
                      Total: {bookingChartData.reduce((sum, day) => sum + day.total, 0)} bookings
                    </span>
                  </div>
                  
                  {bookingChartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={bookingChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value, name) => [
                              value, 
                              name === 'room' ? 'Room Bookings' : 
                              name === 'banquet' ? 'Banquet Bookings' : 'Total Bookings'
                            ]}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="room" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            name="Room Bookings"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="banquet" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            name="Banquet Bookings"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            name="Total Bookings"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading booking data...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
                    <div className="space-y-4">
                      {recentBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{booking.guest}</p>
                            <p className="text-sm text-gray-600">{booking.type} - {booking.date}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                      <Link 
                        to="/admin/rooms"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition block text-center"
                      >
                        Add New Room
                      </Link>
                      <Link 
                        to="/admin/bookings"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition block text-center"
                      >
                        Manage Bookings
                      </Link>
                      <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition">
                        Generate Report
                      </button>
                      <Link 
                        to="/admin/restaurant"
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition block text-center"
                      >
                        Update Menu
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            } />
            
            <Route path="/rooms" element={<RoomManagement />} />
            
            <Route path="/banquets" element={<BanquetManagement />} />
            
            <Route path="/restaurant" element={<RestaurantManagement />} />
            
            <Route path="/restaurant-orders" element={<RestaurantOrderManagement />} />

            <Route path="/bills" element={<BillManagement />} />

            <Route path="/bookings" element={<BookingManagement />} />
            <Route path="/bookings/:id/bill" element={<BillCreator />} />
            
            <Route path="/booking-chart" element={<BookingChart />} />
            
            <Route path="/users" element={
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600">User management interface coming soon...</p>
                </div>
              </div>
            } />
            
            <Route path="/settings" element={
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600">Settings interface coming soon...</p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Bill Creator Component
const BillCreator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(12);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(10);
  const [currency, setCurrency] = useState<string>('INR');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const bookingRes = await axios.get(`/api/bookings/${id}`);
        const b = bookingRes.data;
        setBooking(b);

        // Fetch resource (room or banquet) to get pricing
        if (b.type === 'room') {
          try {
            const roomRes = await axios.get(`/api/rooms/${b.resourceId}`);
            setResource(roomRes.data);
            const nights = Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
            const unit = roomRes.data.price || 0;
            const amt = unit * nights;
            setItems([{ description: `Room ${roomRes.data.roomNumber} - ${nights} night(s)`, quantity: nights, unitPrice: unit, amount: amt }]);
            if (typeof roomRes.data.discount === 'number') setDiscount(roomRes.data.discount);
          } catch (roomError) {
            console.error('Failed to fetch room details:', roomError);
            setItems([{ description: `Room booking - ${b.guests} guests`, quantity: 1, unitPrice: b.totalAmount || 0, amount: b.totalAmount || 0 }]);
          }
        } else if (b.type === 'banquet') {
          try {
            const banRes = await axios.get(`/api/banquets/${b.resourceId}`);
            setResource(banRes.data);
            const start = new Date(b.checkIn).getTime();
            const end = new Date(b.checkOut).getTime();
            const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
            const bookingType = b.eventDetails?.bookingType === 'daily' ? 'daily' : 'hourly';
            if (bookingType === 'daily') {
              const unit = banRes.data.pricePerDay || 0;
              setItems([{ description: `${banRes.data.name} - 1 day`, quantity: 1, unitPrice: unit, amount: unit }]);
            } else {
              const minH = banRes.data.minimumHours || 4;
              const qty = Math.max(hours, minH);
              const unit = banRes.data.pricePerHour || 0;
              setItems([{ description: `${banRes.data.name} - ${qty} hour(s)`, quantity: qty, unitPrice: unit, amount: unit * qty }]);
            }
          } catch (banquetError) {
            console.error('Failed to fetch banquet details:', banquetError);
            setItems([{ description: `Banquet booking - ${b.guests} guests`, quantity: 1, unitPrice: b.totalAmount || 0, amount: b.totalAmount || 0 }]);
          }
        } else {
          setItems([{ description: `${b.type} booking`, quantity: 1, unitPrice: b.totalAmount || 0, amount: b.totalAmount || 0 }]);
        }

        // Prefill from existing bill if present
        if (b.bill) {
          setItems(b.bill.items || []);
          setDiscount(typeof b.bill.discount === 'number' ? b.bill.discount : 0);
          setTaxRate(typeof b.bill.taxRate === 'number' ? b.bill.taxRate : 12);
          setServiceChargeRate(typeof b.bill.serviceChargeRate === 'number' ? b.bill.serviceChargeRate : 10);
          setCurrency(b.bill.currency || 'INR');
          setNotes(b.bill.notes || '');
        }
      } catch (err: any) {
        console.error('Error loading booking:', err);
        if (err.response?.status === 401) {
          toast.error('Authentication required. Please log in.');
          navigate('/admin/login');
        } else if (err.response?.status === 403) {
          toast.error('Access denied. Admin privileges required.');
          navigate('/admin');
        } else if (err.response?.status === 404) {
          setError('Booking not found');
        } else {
          setError('Failed to load booking details');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      load();
    } else {
      setError('Invalid booking ID');
      setLoading(false);
    }
  }, [id, navigate]);

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<{ description: string; quantity: number; unitPrice: number }>) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      const qty = Number(next.quantity) || 0;
      const unit = Number(next.unitPrice) || 0;
      return { ...next, amount: qty * unit };
    }));
  };

  const totals = (() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const discountAmount = subtotal * (Math.max(0, Math.min(100, discount)) / 100);
    const afterDiscount = subtotal - discountAmount;
    const serviceChargeAmount = afterDiscount * (Math.max(0, Math.min(100, serviceChargeRate)) / 100);
    const taxable = afterDiscount + serviceChargeAmount;
    const taxAmount = taxable * (Math.max(0, Math.min(100, taxRate)) / 100);
    const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;
    return { subtotal, discountAmount, serviceChargeAmount, taxAmount, grandTotal };
  })();

  const saveBill = async () => {
    if (!booking) return;
    try {
      setSaving(true);
      const bill: Bill = {
        items,
        subtotal: totals.subtotal,
        discount,
        taxRate,
        taxAmount: totals.taxAmount,
        serviceChargeRate,
        serviceChargeAmount: totals.serviceChargeAmount,
        grandTotal: totals.grandTotal,
        currency,
        notes
      };
      
      await axios.put(`/api/bookings/${booking._id}`, {
        ...booking,
        bill,
        totalAmount: bill.grandTotal
      });
      
      setBooking(prev => ({ ...prev!, bill }));
      toast.success('Bill saved successfully');
    } catch (err: any) {
      console.error('Error saving bill:', err);
      if (err.response?.status === 401) {
        toast.error('Authentication required. Please log in.');
        navigate('/admin/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to save bill');
      }
    } finally {
      setSaving(false);
    }
  };

  const printBill = () => {
    if (!booking || (!booking.bill && items.length === 0)) {
      toast.error('No bill data to print. Please save the bill first.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the bill');
      return;
    }

    const billHTML = generateBillHTML();
    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadBill = () => {
    if (!booking || (!booking.bill && items.length === 0)) {
      toast.error('No bill data to download. Please save the bill first.');
      return;
    }

    const billHTML = generateBillHTML();
    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `bill-${booking._id.slice(-8)}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Bill downloaded successfully');
  };

  const generateBillHTML = () => {
    const bill: Bill = booking!.bill || {
      items,
      subtotal: totals.subtotal,
      discount,
      taxRate,
      taxAmount: totals.taxAmount,
      serviceChargeRate,
      serviceChargeAmount: totals.serviceChargeAmount,
      grandTotal: totals.grandTotal,
      currency,
      notes
    };
    
    const resourceName = booking!.type === 'room' 
      ? (resource?.roomNumber ? `Room ${resource.roomNumber}` : 'Room')
      : (resource?.name || 'Banquet Hall');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hotel Bill - ${booking!._id.slice(-8)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #2563eb; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-info > div { flex: 1; margin-right: 20px; }
          .bill-info > div:last-child { margin-right: 0; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
          .info-row { margin-bottom: 5px; }
          .info-label { font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
          .items-table th { background-color: #f8fafc; font-weight: bold; }
          .items-table .text-right { text-align: right; }
          .totals { margin-left: auto; width: 350px; }
          .totals table { width: 100%; border-collapse: collapse; }
          .totals td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
          .totals .total-row { font-weight: bold; }
          .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; background-color: #f8fafc; }
          .notes { margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; }
          .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { 
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Hotel Bill</h1>
          <p>Booking Reference: #${booking!._id.slice(-8)}</p>
          <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="bill-info">
          <div>
            <div class="section-title">Booking Details</div>
            <div class="info-row"><span class="info-label">Type:</span> ${booking!.type.toUpperCase()}</div>
            <div class="info-row"><span class="info-label">Resource:</span> ${resourceName}</div>
            <div class="info-row"><span class="info-label">Check-in:</span> ${new Date(booking!.checkIn).toLocaleDateString()} ${new Date(booking!.checkIn).toLocaleTimeString()}</div>
            <div class="info-row"><span class="info-label">Check-out:</span> ${new Date(booking!.checkOut).toLocaleDateString()} ${new Date(booking!.checkOut).toLocaleTimeString()}</div>
            <div class="info-row"><span class="info-label">Guests:</span> ${booking!.guests}</div>
            <div class="info-row"><span class="info-label">Booking Status:</span> ${booking!.status.toUpperCase()}</div>
          </div>
          <div>
            <div class="section-title">Customer Details</div>
            <div class="info-row"><span class="info-label">Name:</span> ${booking!.user?.firstName || 'N/A'} ${booking!.user?.lastName || ''}</div>
            <div class="info-row"><span class="info-label">Email:</span> ${booking!.user?.email || 'N/A'}</div>
            <div class="info-row"><span class="info-label">Payment Status:</span> ${booking!.paymentStatus.toUpperCase()}</div>
            ${booking!.eventDetails?.eventType ? `<div class="info-row"><span class="info-label">Event Type:</span> ${booking!.eventDetails.eventType}</div>` : ''}
            ${booking!.eventDetails?.fullName ? `<div class="info-row"><span class="info-label">Event Contact:</span> ${booking!.eventDetails.fullName}</div>` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">₹${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr><td>Subtotal:</td><td class="text-right">₹${bill.subtotal.toFixed(2)}</td></tr>
            ${bill.discount > 0 ? `<tr><td>Discount (${bill.discount}%):</td><td class="text-right">- ₹${(bill.subtotal * bill.discount / 100).toFixed(2)}</td></tr>` : ''}
            ${bill.serviceChargeRate > 0 ? `<tr><td>Service Charge (${bill.serviceChargeRate}%):</td><td class="text-right">₹${bill.serviceChargeAmount.toFixed(2)}</td></tr>` : ''}
            ${bill.taxRate > 0 ? `<tr><td>Tax (${bill.taxRate}%):</td><td class="text-right">₹${bill.taxAmount.toFixed(2)}</td></tr>` : ''}
            <tr class="grand-total"><td>Grand Total:</td><td class="text-right">₹${bill.grandTotal.toFixed(2)}</td></tr>
          </table>
        </div>

        ${bill.notes ? `
          <div class="notes">
            <h4 style="margin-top: 0;">Additional Notes:</h4>
            <p style="margin-bottom: 0;">${bill.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>Thank you for choosing our hotel!</strong></p>
          <p>For any queries regarding this bill, please contact our front desk.</p>
          <p>This is a computer-generated bill and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/admin/bookings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Booking not found</div>
          <button
            onClick={() => navigate('/admin/bookings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {booking.bill ? 'Edit Bill' : 'Create Bill'}
          </h1>
          <p className="text-gray-600 text-sm">
            Booking #{booking._id.slice(-8)} • {booking.type.toUpperCase()} • {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
          </p>
          {resource && (
            <p className="text-gray-500 text-sm">
              {booking.type === 'room' ? `Room ${resource.roomNumber}` : resource.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {(booking.bill || items.length > 0) && (
            <>
              <button
                onClick={printBill}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                title="Print Bill"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={downloadBill}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1"
                title="Download Bill"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/admin/bookings')}
            className="px-3 py-2 border rounded-md hover:bg-gray-50"
          >
            Back to Bookings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-1">Currency</label>
          <input
            id="currency"
            className="w-full border rounded-md px-3 py-2"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            placeholder="e.g. INR"
            title="Currency code, e.g. INR"
          />
        </div>
        <div>
          <label htmlFor="discount" className="block text-sm font-medium mb-1">Discount (%)</label>
          <input
            id="discount"
            type="number"
            className="w-full border rounded-md px-3 py-2"
            value={discount}
            onChange={e => setDiscount(Number(e.target.value) || 0)}
            min={0}
            max={100}
            placeholder="0"
            title="Discount percentage (0-100)"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="serviceChargeRate" className="block text-sm font-medium mb-1">Service Charge (%)</label>
            <input
              id="serviceChargeRate"
              type="number"
              className="w-full border rounded-md px-3 py-2"
              value={serviceChargeRate}
              onChange={e => setServiceChargeRate(Number(e.target.value) || 0)}
              min={0}
              max={100}
              placeholder="e.g. 10"
              title="Service charge percentage"
            />
          </div>
          <div>
            <label htmlFor="taxRate" className="block text-sm font-medium mb-1">Tax (%)</label>
            <input
              id="taxRate"
              type="number"
              className="w-full border rounded-md px-3 py-2"
              value={taxRate}
              onChange={e => setTaxRate(Number(e.target.value) || 0)}
              min={0}
              max={100}
              placeholder="e.g. 12"
              title="Tax percentage"
            />
          </div>
        </div>
      </div>
 
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Items</h3>
          <button onClick={addItem} className="px-3 py-2 bg-gray-800 text-white rounded-md">Add Item</button>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input className="col-span-5 border rounded-md px-3 py-2" placeholder="Description" value={it.description} onChange={e => updateItem(idx, { description: e.target.value })} />
              <input type="number" className="col-span-2 border rounded-md px-3 py-2" placeholder="Qty" value={it.quantity} onChange={e => updateItem(idx, { quantity: Number(e.target.value) || 0 })} />
              <input type="number" className="col-span-2 border rounded-md px-3 py-2" placeholder="Unit Price" value={it.unitPrice} onChange={e => updateItem(idx, { unitPrice: Number(e.target.value) || 0 })} />
              <div className="col-span-2 text-right font-medium">₹{it.amount.toFixed(2)}</div>
              <button onClick={() => removeItem(idx)} className="col-span-1 text-red-600">Remove</button>
            </div>
          ))}
        </div>
      </div>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full border rounded-md px-3 py-2" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." />
        </div>
        <div className="bg-gray-50 p-4 rounded-md space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount ({discount}%)</span><span>- ₹{totals.discountAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Service Charge ({serviceChargeRate}%)</span><span>₹{totals.serviceChargeAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>₹{totals.taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>₹{totals.grandTotal.toFixed(2)}</span></div>
        </div>
      </div>
 
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate('/admin/bookings')}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          onClick={saveBill}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : (booking.bill ? 'Update Bill' : 'Save Bill')}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
