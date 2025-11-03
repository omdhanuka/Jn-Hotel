import React, { useState, useEffect } from 'react';
import { Search, Printer, Eye, Calculator, Clock, Check, Filter, Home, ShoppingBag, Utensils } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface OrderItem {
  _id: string;
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  addOns?: { name: string; price: number }[];
  spiceLevel?: string;
}

interface DineInOrder {
  _id: string;
  bookingId: string;
  fullName: string;
  phone: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  createdAt: string;
  discount?: number;
  couponCode?: string;
  deliveryType?: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
}

interface Bill {
  _id: string;
  orderId: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  generatedAt: string;
  generatedBy: string;
  deliveryType: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  customerPhone?: string;
  billNumber?: string;
  deliveryCharges?: number;
}

const BillManagement: React.FC = () => {
  const [dineInOrders, setDineInOrders] = useState<DineInOrder[]>([]);
  const [takeawayOrders, setTakeawayOrders] = useState<DineInOrder[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DineInOrder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DineInOrder | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'bills'>('orders');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  
  // Bill generation form
  const [billForm, setBillForm] = useState({
    discount: 0,
    discountType: 'percentage', // 'percentage' or 'fixed'
    tax: 10, // Default 10% tax
    deliveryCharges: 0,
    paymentMethod: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchAllOrders();
    fetchBills();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/restaurant/bookings/admin');
      const allOrders = response.data.bookings.filter((booking: any) => 
        booking.status !== 'cancelled' && booking.paymentStatus !== 'paid'
      );
      
      // Separate orders by delivery type
      setDineInOrders(allOrders.filter((order: any) => order.deliveryType === 'dine-in'));
      setTakeawayOrders(allOrders.filter((order: any) => order.deliveryType === 'takeaway'));
      setDeliveryOrders(allOrders.filter((order: any) => order.deliveryType === 'delivery'));
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await axios.get('/api/bills?billType=restaurant');
      setBills(response.data.bills || []);
    } catch (error) {
      console.error('Failed to fetch bills');
    }
  };

  const calculateBillAmount = () => {
    if (!selectedOrder) return { subtotal: 0, discount: 0, tax: 0, deliveryCharges: 0, total: 0 };
    
    const subtotal = selectedOrder.totalAmount;
    let discountAmount = 0;
    
    if (billForm.discountType === 'percentage') {
      discountAmount = (subtotal * billForm.discount) / 100;
    } else {
      discountAmount = billForm.discount;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * billForm.tax) / 100;
    const deliveryCharges = selectedOrder.deliveryType === 'delivery' ? billForm.deliveryCharges : 0;
    const total = afterDiscount + taxAmount + deliveryCharges;
    
    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      deliveryCharges,
      total
    };
  };

  const generateBill = async () => {
    if (!selectedOrder) return;
    
    try {
      const billCalculation = calculateBillAmount();
      
      const billData = {
        orderId: selectedOrder._id,
        customerName: selectedOrder.fullName,
        customerPhone: selectedOrder.phone,
        tableNumber: selectedOrder.deliveryType === 'dine-in' ? selectedOrder.tableNumber : undefined,
        deliveryType: selectedOrder.deliveryType,
        deliveryAddress: selectedOrder.deliveryAddress,
        items: selectedOrder.items,
        subtotal: billCalculation.subtotal,
        discount: billCalculation.discount,
        discountPercentage: billForm.discountType === 'percentage' ? billForm.discount : 0,
        taxPercentage: billForm.tax,
        deliveryCharges: billCalculation.deliveryCharges,
        paymentMethod: billForm.paymentMethod,
        notes: billForm.notes
      };
      
      await axios.post('/api/bills/restaurant', billData);
      
      // Update order payment status
      await axios.put(`/api/restaurant/bookings/${selectedOrder._id}/status`, { 
        status: 'completed',
        paymentStatus: 'paid'
      });
      
      toast.success('Bill generated successfully');
      setShowBillModal(false);
      setSelectedOrder(null);
      fetchAllOrders();
      fetchBills();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    }
  };

  const printBill = async (bill: Bill) => {
    try {
      await axios.post(`/api/bills/${bill._id}/print`);
    } catch (error) {
      console.error('Failed to update print count');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const getBillTitle = () => {
      if (bill.deliveryType === 'dine-in') return 'DINE-IN BILL';
      if (bill.deliveryType === 'takeaway') return 'TAKEAWAY BILL';
      if (bill.deliveryType === 'delivery') return 'HOME DELIVERY BILL';
      return 'RESTAURANT BILL';
    };

    const getLocationInfo = () => {
      if (bill.deliveryType === 'dine-in') {
        return `<p><strong>Table Number:</strong> ${bill.tableNumber}</p>`;
      } else if (bill.deliveryType === 'delivery') {
        return `<p><strong>Delivery Address:</strong> ${bill.deliveryAddress || 'N/A'}</p>`;
      } else {
        return '<p><strong>Type:</strong> Takeaway Order</p>';
      }
    };
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${getBillTitle()} - ${bill.billNumber || bill._id.slice(-6)}</title>
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
            .delivery-info { background-color: #fef3cd; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hotel Restaurant</h1>
            <div class="bill-title">${getBillTitle()}</div>
          </div>
          
          <div class="bill-details">
            <p><strong>Bill Number:</strong> ${bill.billNumber || bill._id.slice(-6)}</p>
            <p><strong>Customer:</strong> ${bill.customerName}</p>
            ${bill.customerPhone ? `<p><strong>Phone:</strong> ${bill.customerPhone}</p>` : ''}
            ${getLocationInfo()}
            <p><strong>Date & Time:</strong> ${new Date(bill.generatedAt).toLocaleString()}</p>
          </div>
          
          ${bill.deliveryType === 'delivery' ? `
            <div class="delivery-info">
              <h4>🏠 Delivery Information</h4>
              <p><strong>Address:</strong> ${bill.deliveryAddress || 'N/A'}</p>
              <p><strong>Phone:</strong> ${bill.customerPhone || 'N/A'}</p>
            </div>
          ` : ''}
          
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
            <p>Tax: ₹${bill.tax.toFixed(2)}</p>
            ${(bill.deliveryCharges ?? 0) > 0 ? `<p>Delivery Charges: ₹${(bill.deliveryCharges ?? 0).toFixed(2)}</p>` : ''}
            <p class="total-row">Total Amount: ₹${bill.totalAmount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p>Thank you for ${bill.deliveryType === 'dine-in' ? 'dining' : 'ordering'} with us!</p>
            ${bill.deliveryType === 'delivery' ? '<p>🚚 Your order is on the way!</p>' : ''}
            ${bill.deliveryType === 'takeaway' ? '<p>📦 Thank you for your takeaway order!</p>' : ''}
          </div>
          
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px;">Print Bill</button>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCurrentOrders = () => {
    switch (orderType) {
      case 'dine-in': return dineInOrders;
      case 'takeaway': return takeawayOrders;
      case 'delivery': return deliveryOrders;
      default: return dineInOrders;
    }
  };

  const filteredOrders = getCurrentOrders().filter(order =>
    (order.tableNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    order.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.phone?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
  );

  const filteredBills = bills.filter(bill =>
    (bill.tableNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bill.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Bill Management</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by table, customer, phone, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Orders ({dineInOrders.length + takeawayOrders.length + deliveryOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Generated Bills ({filteredBills.length})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'orders' && (
        <>
          {/* Order Type Filter */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={() => setOrderType('dine-in')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                orderType === 'dine-in'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Utensils className="h-4 w-4 mr-2" />
              Dine-In ({dineInOrders.length})
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                orderType === 'takeaway'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Takeaway ({takeawayOrders.length})
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                orderType === 'delivery'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Delivery ({deliveryOrders.length})
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {orderType === 'dine-in' ? 'Table' : orderType === 'takeaway' ? 'Order' : 'Delivery'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-bold ${
                          orderType === 'dine-in' ? 'text-blue-600' :
                          orderType === 'takeaway' ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {orderType === 'dine-in' ? `Table ${order.tableNumber}` :
                           orderType === 'takeaway' ? `TO-${order._id.slice(-4)}` :
                           `DL-${order._id.slice(-4)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.fullName}
                        </div>
                        <div className="text-sm text-gray-500">{order.phone}</div>
                        {orderType === 'delivery' && order.deliveryAddress && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            📍 {order.deliveryAddress}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items.length} items
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items.slice(0, 2).map(item => item.name).join(', ')}
                          {order.items.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600">
                          ₹{order.totalAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowBillModal(true);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                        >
                          <Calculator className="h-4 w-4 mr-1" />
                          Generate Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'bills' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {bill.billNumber || bill._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bill.deliveryType === 'dine-in' ? 'bg-blue-100 text-blue-800' :
                        bill.deliveryType === 'takeaway' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {bill.deliveryType === 'dine-in' ? `Table ${bill.tableNumber}` :
                         bill.deliveryType === 'takeaway' ? 'Takeaway' : 'Delivery'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{bill.customerName}</div>
                      {bill.deliveryType === 'delivery' && bill.deliveryAddress && (
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          📍 {bill.deliveryAddress}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">
                        ₹{bill.totalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {bill.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bill.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => printBill(bill)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bill Generation Modal */}
      {showBillModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Generate {selectedOrder.deliveryType === 'dine-in' ? 'Dine-in' : 
                         selectedOrder.deliveryType === 'takeaway' ? 'Takeaway' : 'Delivery'} Bill
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Order Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Order Details</h3>
                <p className="text-sm text-gray-600">Customer: {selectedOrder.fullName}</p>
                <p className="text-sm text-gray-600">Phone: {selectedOrder.phone}</p>
                <p className="text-sm text-gray-600">Order ID: {selectedOrder.bookingId}</p>
                {selectedOrder.deliveryType === 'dine-in' && (
                  <p className="text-sm text-gray-600">Table: {selectedOrder.tableNumber}</p>
                )}
                {selectedOrder.deliveryType === 'delivery' && selectedOrder.deliveryAddress && (
                  <p className="text-sm text-gray-600">Address: {selectedOrder.deliveryAddress}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium mb-2">Items Ordered</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm border-b pb-2">
                      <span>
                        {item.name} x {item.quantity}
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="text-xs text-gray-500">
                            + {item.addOns.map(addon => addon.name).join(', ')}
                          </div>
                        )}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Adjustments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discountType" className="block text-sm font-medium mb-1">Discount</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={billForm.discount}
                      onChange={(e) => setBillForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 border rounded-md px-3 py-2"
                      placeholder="0"
                      title="Discount amount (enter percentage value if % selected, or fixed amount)"
                      aria-label="Discount amount"
                    />
                      <select
                        id="discountType"
                        title="Discount Type"
                        aria-label="Discount Type"
                        value={billForm.discountType}
                        onChange={(e) => setBillForm(prev => ({ ...prev, discountType: e.target.value }))}
                        className="border rounded-md px-3 py-2"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tax (%)</label>
                  <input
                    type="number"
                    value={billForm.tax}
                    onChange={(e) => setBillForm(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="10"
                    title="Tax percentage to apply to the bill"
                    aria-label="Tax percentage"
                  />
                </div>
              </div>

              {/* Delivery charges for delivery orders */}
              {selectedOrder.deliveryType === 'delivery' && (
                <div>
                  <label htmlFor="deliveryCharges" className="block text-sm font-medium mb-1">Delivery Charges (₹)</label>
                  <input
                    id="deliveryCharges"
                    type="number"
                    value={billForm.deliveryCharges}
                    onChange={(e) => setBillForm(prev => ({ ...prev, deliveryCharges: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded-md px-3 py-2"
                    step="0.01"
                    placeholder="0.00"
                    title="Delivery charges in dollars"
                    aria-label="Delivery charges"
                  />
                </div>
              )}

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  id="paymentMethod"
                  title="Payment Method"
                  aria-label="Payment Method"
                  value={billForm.paymentMethod}
                  onChange={(e) => setBillForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              {/* Bill Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Bill Summary</h3>
                {(() => {
                  const calculation = calculateBillAmount();
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{calculation.subtotal.toFixed(2)}</span>
                      </div>
                      {calculation.discount > 0 && (
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span>-₹{calculation.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{calculation.tax.toFixed(2)}</span>
                      </div>
                      {calculation.deliveryCharges > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery Charges:</span>
                          <span>₹{calculation.deliveryCharges.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>₹{calculation.total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={() => setShowBillModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={generateBill}
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

export default BillManagement;
