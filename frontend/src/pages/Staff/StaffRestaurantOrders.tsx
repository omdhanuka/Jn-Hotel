import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Search, Clock, CheckCircle, XCircle, AlertTriangle, Package, ChefHat } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface OrderItem {
  menuItem: {
    _id: string;
    name: string;
    category: string;
  };
  name: string;
  quantity: number;
  price: number;
  addOns?: { name: string; price: number }[];
  spiceLevel?: string;
}

interface RestaurantOrder {
  _id: string;
  bookingId: string;
  bookingType: 'order';
  fullName: string;
  email: string;
  phone: string;
  tableNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryType: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: string;
  paymentMethod: string;
  specialRequests?: string;
  createdAt: string;
}

const StaffRestaurantOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any>({});
  
  const [filters, setFilters] = useState({
    status: 'all',
    deliveryType: 'all',
    search: ''
  });

  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (permissions.viewOrders || permissions.manageOrders) {
      fetchOrders();
    }
  }, [filters, permissions]);

  const checkPermissions = async () => {
    try {
      const response = await axios.get('/auth/me/permissions');
      setPermissions(response.data.permissions || {});
      
      if (!response.data.permissions.viewOrders && !response.data.permissions.manageOrders) {
        toast.error('You do not have permission to view restaurant orders');
        navigate('/staff/dashboard');
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      toast.error('Failed to verify permissions');
      navigate('/staff/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'order'
      });
      
      if (filters.status !== 'all') params.append('status', filters.status);
      
      const response = await axios.get(`/restaurant/bookings/admin?${params.toString()}`);
      
      // Filter by delivery type if needed
      let filteredOrders = response.data.bookings || [];
      if (filters.deliveryType !== 'all') {
        filteredOrders = filteredOrders.filter((order: RestaurantOrder) => 
          order.deliveryType === filters.deliveryType
        );
      }
      
      setOrders(filteredOrders);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to view orders.');
        navigate('/staff/dashboard');
      } else {
        toast.error('Failed to fetch restaurant orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!permissions.manageOrders) {
      toast.error('You do not have permission to update orders');
      return;
    }

    try {
      await axios.put(`/restaurant/bookings/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setShowOrderDetails(false);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: JSX.Element } = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      preparing: <ChefHat className="h-4 w-4" />,
      ready: <Package className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />
    };
    return icons[status] || <Clock className="h-4 w-4" />;
  };

  const getDeliveryTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'dine-in': 'bg-blue-100 text-blue-800',
      'takeaway': 'bg-green-100 text-green-800',
      'delivery': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const calculateOrderTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return order.fullName.toLowerCase().includes(searchLower) ||
             order.email.toLowerCase().includes(searchLower) ||
             order.bookingId.toLowerCase().includes(searchLower) ||
             order.tableNumber?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Sort orders by status priority (pending/confirmed/preparing first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const statusPriority: { [key: string]: number } = {
      pending: 1,
      confirmed: 2,
      preparing: 3,
      ready: 4,
      completed: 5,
      cancelled: 6
    };
    return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Orders</h1>
          <p className="text-gray-600 mt-2">
            {permissions.manageOrders ? 'View and manage' : 'View'} restaurant orders
          </p>
        </div>

        {/* Permission Notice */}
        {!permissions.manageOrders && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You have view-only access. Contact admin to request order management permissions.
              </span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Preparing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'preparing').length}
                </p>
              </div>
              <ChefHat className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'ready').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by name, email, ID, or table..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Type</label>
              <select
                value={filters.deliveryType}
                onChange={(e) => setFilters(prev => ({ ...prev, deliveryType: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="dine-in">Dine In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedOrders.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg shadow-md p-12 text-center">
              <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            sortedOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{order.bookingId}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getDeliveryTypeColor(order.deliveryType)}`}>
                        {order.deliveryType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.fullName}</p>
                    {order.tableNumber && (
                      <p className="text-sm text-blue-600 font-medium">Table: {order.tableNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium capitalize">{order.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {calculateOrderTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items ({order.items.length})</p>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
                    )}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">₹{order.totalAmount}</p>
                  </div>
                  
                  {permissions.manageOrders && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order._id, 'confirmed');
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order._id, 'preparing');
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order._id, 'ready');
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order._id, 'completed');
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Order #{selectedOrder.bookingId}</h2>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getDeliveryTypeColor(selectedOrder.deliveryType)}`}>
                        {selectedOrder.deliveryType}
                      </span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="capitalize">{selectedOrder.status}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Details */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><span className="font-medium">Name:</span> {selectedOrder.fullName}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedOrder.email}</p>
                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedOrder.phone}</p>
                    {selectedOrder.tableNumber && (
                      <p className="text-sm"><span className="font-medium">Table:</span> {selectedOrder.tableNumber}</p>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <p className="text-sm"><span className="font-medium">Address:</span> {selectedOrder.deliveryAddress}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.menuItem.category}</p>
                            {item.spiceLevel && (
                              <p className="text-xs text-gray-500 mt-1">Spice: {item.spiceLevel}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Add-ons:</p>
                            {item.addOns.map((addon, idx) => (
                              <p key={idx} className="text-xs text-gray-500">
                                + {addon.name} (₹{addon.price})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Requests */}
                {selectedOrder.specialRequests && (
                  <div>
                    <h3 className="font-semibold mb-3">Special Requests</h3>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedOrder.specialRequests}</p>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold mb-3">Payment Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Method:</span>
                      <span className="text-sm font-medium capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <span className="text-sm font-medium capitalize">{selectedOrder.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {permissions.manageOrders && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <div className="flex gap-3">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'confirmed')}
                          className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-medium"
                        >
                          Confirm Order
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                          className="flex-1 bg-red-600 text-white py-3 rounded-md hover:bg-red-700 font-medium"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder._id, 'preparing')}
                        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium"
                      >
                        Start Preparing
                      </button>
                    )}
                    {selectedOrder.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder._id, 'ready')}
                        className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 font-medium"
                      >
                        Mark as Ready
                      </button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder._id, 'completed')}
                        className="w-full bg-gray-600 text-white py-3 rounded-md hover:bg-gray-700 font-medium"
                      >
                        Complete Order
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffRestaurantOrders;
