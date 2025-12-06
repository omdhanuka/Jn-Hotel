import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Users, Search, Eye, CheckCircle, XCircle, Edit, Plus, AlertTriangle, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface RestaurantBooking {
  _id: string;
  bookingId: string;
  bookingType: 'table' | 'order';
  fullName: string;
  email: string;
  phone: string;
  tableNumber?: string;
  date?: string;
  timeSlot?: string;
  numberOfGuests?: number;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  deliveryType?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface MenuItem {
  _id: string;
  itemId: string;
  name: string;
  category: string;
  description: string;
  dishType: string;
  price: number;
  isAvailable: boolean;
  images: string[];
}

const StaffRestaurant: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookings' | 'menu'>('bookings');
  const [bookings, setBookings] = useState<RestaurantBooking[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any>({});
  
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });

  const [menuFilters, setMenuFilters] = useState({
    category: 'all',
    dishType: 'all',
    search: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (permissions.viewRestaurant || permissions.manageRestaurant) {
      if (activeTab === 'bookings') {
        fetchBookings();
      } else {
        fetchMenuItems();
      }
    }
  }, [activeTab, permissions, filters, menuFilters]);

  const checkPermissions = async () => {
    try {
      const response = await axios.get('/auth/me/permissions');
      setPermissions(response.data.permissions || {});
      
      if (!response.data.permissions.viewRestaurant && !response.data.permissions.manageRestaurant) {
        toast.error('You do not have permission to access restaurant management');
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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      
      const response = await axios.get(`/restaurant/bookings/admin?${params.toString()}`);
      setBookings(response.data.bookings || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to view restaurant bookings.');
        navigate('/staff/dashboard');
      } else {
        toast.error('Failed to fetch restaurant bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      
      if (menuFilters.category !== 'all') params.append('category', menuFilters.category);
      if (menuFilters.dishType !== 'all') params.append('dishType', menuFilters.dishType);
      
      const response = await axios.get(`/restaurant/menu?${params.toString()}`);
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    if (!permissions.manageRestaurant) {
      toast.error('You do not have permission to update bookings');
      return;
    }

    try {
      await axios.put(`/restaurant/bookings/${bookingId}/status`, { status: newStatus });
      toast.success('Booking status updated successfully');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleMenuItemUpdate = async (itemId: string, updates: Partial<MenuItem>) => {
    if (!permissions.manageRestaurant) {
      toast.error('You do not have permission to update menu items');
      return;
    }

    try {
      await axios.put(`/restaurant/menu/${itemId}`, updates);
      toast.success('Menu item updated successfully');
      fetchMenuItems();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update menu item');
    }
  };

  const toggleMenuItemAvailability = async (itemId: string, currentStatus: boolean) => {
    if (!permissions.manageRestaurant) {
      toast.error('You do not have permission to update menu items');
      return;
    }

    try {
      await axios.put(`/restaurant/menu/${itemId}`, { isAvailable: !currentStatus });
      toast.success(`Menu item ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update menu item');
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

  const getDishTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      veg: 'text-green-600',
      'non-veg': 'text-red-600',
      vegan: 'text-blue-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const filteredBookings = bookings.filter(booking => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return booking.fullName.toLowerCase().includes(searchLower) ||
             booking.email.toLowerCase().includes(searchLower) ||
             booking.bookingId.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const filteredMenuItems = menuItems.filter(item => {
    if (menuFilters.search) {
      const searchLower = menuFilters.search.toLowerCase();
      return item.name.toLowerCase().includes(searchLower) ||
             item.description.toLowerCase().includes(searchLower);
    }
    return true;
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
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-gray-600 mt-2">
            {permissions.manageRestaurant ? 'View and manage' : 'View'} restaurant bookings and menu
          </p>
        </div>

        {/* Permission Notice */}
        {!permissions.manageRestaurant && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You have view-only access. Contact admin to request management permissions.
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="inline h-5 w-5 mr-2" />
                Table Bookings & Orders
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'menu'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Utensils className="inline h-5 w-5 mr-2" />
                Menu Management
              </button>
            </nav>
          </div>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <>
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
                      placeholder="Search by name, email, or ID..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="table">Table Bookings</option>
                    <option value="order">Food Orders</option>
                  </select>
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
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              #{booking.bookingId}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.fullName}
                            </div>
                            <div className="text-xs text-gray-500">{booking.email}</div>
                            <div className="text-xs text-gray-500">{booking.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <span className="font-medium capitalize">{booking.bookingType}</span>
                              {booking.bookingType === 'table' && booking.date && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  {new Date(booking.date).toLocaleDateString()} - {booking.timeSlot}
                                  <div>{booking.numberOfGuests} guests</div>
                                </div>
                              )}
                              {booking.bookingType === 'order' && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <div className="capitalize">{booking.deliveryType}</div>
                                  {booking.tableNumber && <div>Table: {booking.tableNumber}</div>}
                                  <div>{booking.items?.length || 0} items</div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{booking.totalAmount}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {booking.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {permissions.manageRestaurant && (
                                <>
                                  {booking.status === 'pending' && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                      className="text-green-600 hover:text-green-800"
                                      title="Confirm"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  {booking.status === 'confirmed' && booking.bookingType === 'order' && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'preparing')}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Mark as Preparing"
                                    >
                                      <Clock className="h-4 w-4" />
                                    </button>
                                  )}
                                  {booking.status === 'preparing' && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'ready')}
                                      className="text-purple-600 hover:text-purple-800"
                                      title="Mark as Ready"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  {(booking.status === 'ready' || booking.status === 'confirmed') && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                      className="text-gray-600 hover:text-gray-800"
                                      title="Mark as Completed"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  {booking.status === 'pending' && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                      className="text-red-600 hover:text-red-800"
                                      title="Cancel"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <>
            {/* Menu Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={menuFilters.search}
                      onChange={(e) => setMenuFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search menu items..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={menuFilters.category}
                    onChange={(e) => setMenuFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dish Type</label>
                  <select
                    value={menuFilters.dishType}
                    onChange={(e) => setMenuFilters(prev => ({ ...prev, dishType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200">
                    <img
                      src={item.images?.[0] || '/placeholder/300/200'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <span className={`text-xs capitalize ${getDishTypeColor(item.dishType)}`}>
                        ● {item.dishType}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-lg font-bold text-green-600">₹{item.price}</div>
                      <span className="text-sm text-gray-500">{item.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      {permissions.manageRestaurant && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleMenuItemAvailability(item._id, item.isAvailable)}
                            className={item.isAvailable ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                            title={item.isAvailable ? 'Disable' : 'Enable'}
                          >
                            {item.isAvailable ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredMenuItems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No menu items found</p>
              </div>
            )}
          </>
        )}

        {/* Edit Menu Item Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Menu Item</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingItem.isAvailable}
                      onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Available</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMenuItemUpdate(editingItem._id, {
                    price: editingItem.price,
                    description: editingItem.description,
                    isAvailable: editingItem.isAvailable
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffRestaurant;
