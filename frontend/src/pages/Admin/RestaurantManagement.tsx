import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Check, X, Utensils, Users, DollarSign, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface MenuItem {
  _id: string;
  itemId: string;
  name: string;
  category: string;
  description: string;
  dishType: 'veg' | 'non-veg' | 'vegan';
  price: number;
  discount?: number;
  isAvailable: boolean;
  preparationTime?: string;
  images: string[];
  video?: string;
  spiceLevels: string[];
  addOns: { name: string; price: number }[];
  isFeatured: boolean;
  calories?: number;
  createdAt: string;
}

interface RestaurantTable {
  _id: string;
  tableId: string;
  tableName: string;
  seatingCapacity: number;
  tableType: 'indoor' | 'outdoor' | 'rooftop' | 'private';
  isAvailable: boolean;
  status: 'available' | 'reserved' | 'cleaning' | 'maintenance';
  location?: string;
  price?: number;
  createdAt: string;
}

interface MenuForm {
  name: string;
  category: string;
  description: string;
  dishType: 'veg' | 'non-veg' | 'vegan';
  price: number;
  discount: number;
  isAvailable: boolean;
  preparationTime: string;
  images: string[];
  spiceLevels: string[];
  addOns: { name: string; price: number }[];
  isFeatured: boolean;
  calories: number;
}

interface TableForm {
  tableName: string;
  seatingCapacity: number;
  tableType: 'indoor' | 'outdoor' | 'rooftop' | 'private';
  isAvailable: boolean;
  status: 'available' | 'reserved' | 'cleaning' | 'maintenance';
  location: string;
  price: number;
}

const RestaurantManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);

  const [menuForm, setMenuForm] = useState<MenuForm>({
    name: '',
    category: '',
    description: '',
    dishType: 'veg',
    price: 0,
    discount: 0,
    isAvailable: true,
    preparationTime: '',
    images: [],
    spiceLevels: [],
    addOns: [],
    isFeatured: false,
    calories: 0
  });

  const [tableForm, setTableForm] = useState<TableForm>({
    tableName: '',
    seatingCapacity: 2,
    tableType: 'indoor',
    isAvailable: true,
    status: 'available',
    location: '',
    price: 0
  });

  const categories = [
    'North Indian', 'South Indian', 'Chinese', 'Continental', 
    'Italian', 'Mexican', 'Thai', 'Japanese', 'Beverages', 
    'Desserts', 'Starters', 'Main Course'
  ];

  const spiceLevelOptions = ['Mild', 'Medium', 'Spicy', 'Extra Spicy'];

  useEffect(() => {
    fetchMenuItems();
    fetchTables();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/restaurant/menu?limit=100');
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/restaurant/tables');
      setTables(response.data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to fetch tables');
    }
  };

  const handleMenuSubmit = async () => {
    try {
      if (editingMenuItem) {
        await axios.put(`/api/restaurant/menu/${editingMenuItem}`, menuForm);
        toast.success('Menu item updated successfully');
      } else {
        await axios.post('/api/restaurant/menu', menuForm);
        toast.success('Menu item created successfully');
      }
      resetMenuForm();
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleTableSubmit = async () => {
    try {
      if (editingTable) {
        await axios.put(`/api/restaurant/tables/${editingTable}`, tableForm);
        toast.success('Table updated successfully');
      } else {
        await axios.post('/api/restaurant/tables', tableForm);
        toast.success('Table created successfully');
      }
      resetTableForm();
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save table');
    }
  };

  const handleMenuEdit = (item: MenuItem) => {
    setMenuForm({
      name: item.name,
      category: item.category,
      description: item.description,
      dishType: item.dishType,
      price: item.price,
      discount: item.discount || 0,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || '',
      images: item.images || [],
      spiceLevels: item.spiceLevels || [],
      addOns: item.addOns || [],
      isFeatured: item.isFeatured,
      calories: item.calories || 0
    });
    setEditingMenuItem(item._id);
    setShowMenuForm(true);
  };

  const handleTableEdit = (table: RestaurantTable) => {
    setTableForm({
      tableName: table.tableName,
      seatingCapacity: table.seatingCapacity,
      tableType: table.tableType,
      isAvailable: table.isAvailable,
      status: table.status,
      location: table.location || '',
      price: table.price || 0
    });
    setEditingTable(table._id);
    setShowTableForm(true);
  };

  const handleMenuDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      await axios.delete(`/api/restaurant/menu/${id}`);
      toast.success('Menu item deleted successfully');
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete menu item');
    }
  };

  const handleTableDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await axios.delete(`/api/restaurant/tables/${id}`);
      toast.success('Table deleted successfully');
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete table');
    }
  };

  const resetMenuForm = () => {
    setMenuForm({
      name: '', category: '', description: '', dishType: 'veg', price: 0,
      discount: 0, isAvailable: true, preparationTime: '', images: [],
      spiceLevels: [], addOns: [], isFeatured: false, calories: 0
    });
    setEditingMenuItem(null);
    setShowMenuForm(false);
  };

  const resetTableForm = () => {
    setTableForm({
      tableName: '', seatingCapacity: 2, tableType: 'indoor',
      isAvailable: true, status: 'available', location: '', price: 0
    });
    setEditingTable(null);
    setShowTableForm(false);
  };

  const getDishTypeColor = (type: string) => {
    switch (type) {
      case 'veg': return 'bg-green-100 text-green-800';
      case 'non-veg': return 'bg-red-100 text-red-800';
      case 'vegan': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'cleaning': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-md ${activeTab === 'menu' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-md ${activeTab === 'tables' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Tables
          </button>
        </div>
      </div>

      {/* Menu Items Tab */}
      {activeTab === 'menu' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Menu Items ({menuItems.length})</h2>
            <button
              onClick={() => setShowMenuForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Menu Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200">
                  <img
                    src={item.images?.[0] || '/api/placeholder/300/200'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getDishTypeColor(item.dishType)}`}>
                      {item.dishType}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-green-600">₹{item.price}</span>
                    <span className="text-sm text-gray-500">{item.category}</span>
                  </div>
                  {item.preparationTime && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      {item.preparationTime}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMenuEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMenuDelete(item._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Tab */}
      {activeTab === 'tables' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Restaurant Tables ({tables.length})</h2>
            <button
              onClick={() => setShowTableForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Table
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tables.map((table) => (
                  <tr key={table._id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium">{table.tableName}</div>
                        <div className="text-sm text-gray-500">{table.tableId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{table.tableType}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {table.seatingCapacity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTableStatusColor(table.status)}`}>
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {table.price ? `₹${table.price}` : 'Free'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTableEdit(table)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleTableDelete(table._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Menu Form Modal */}
      {showMenuForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., Paneer Butter Masala"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Dish Type *</label>
                  <select
                    value={menuForm.dishType}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, dishType: e.target.value as any }))}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Preparation Time</label>
                  <input
                    type="text"
                    value={menuForm.preparationTime}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, preparationTime: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., 20 mins"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={menuForm.discount}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded-md px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Calories</label>
                  <input
                    type="number"
                    value={menuForm.calories}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-md px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={menuForm.isAvailable}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="mr-2"
                  />
                  Available
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={menuForm.isFeatured}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="mr-2"
                  />
                  Featured Item
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={resetMenuForm}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMenuSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingMenuItem ? 'Update' : 'Create'} Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Form Modal */}
      {showTableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Table Name *</label>
                  <input
                    type="text"
                    value={tableForm.tableName}
                    onChange={(e) => setTableForm(prev => ({ ...prev, tableName: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., Table 1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Seating Capacity *</label>
                  <input
                    type="number"
                    value={tableForm.seatingCapacity}
                    onChange={(e) => setTableForm(prev => ({ ...prev, seatingCapacity: parseInt(e.target.value) || 2 }))}
                    className="w-full border rounded-md px-3 py-2"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Table Type *</label>
                  <select
                    value={tableForm.tableType}
                    onChange={(e) => setTableForm(prev => ({ ...prev, tableType: e.target.value as any }))}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="rooftop">Rooftop</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={tableForm.status}
                    onChange={(e) => setTableForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={tableForm.location}
                    onChange={(e) => setTableForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., Main Dining Area"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Special Price</label>
                  <input
                    type="number"
                    value={tableForm.price}
                    onChange={(e) => setTableForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                    placeholder="0 for free seating"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={tableForm.isAvailable}
                    onChange={(e) => setTableForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="mr-2"
                  />
                  Available for booking
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={resetTableForm}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTableSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingTable ? 'Update' : 'Create'} Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;
