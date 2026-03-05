import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, QrCode, Download, Tag, Users, Clock, Eye, EyeOff, PowerOff, Power, PackageX } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

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
  dishType: 'veg' | 'non-veg';
  price: number;
  isAvailable: boolean;
  // kept for API compatibility
  description: string;
  discount: number;
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

// ── Default categories ────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  'North Indian', 'South Indian', 'Chinese', 'Continental',
  'Beverages', 'Desserts', 'Starters', 'Main Course',
];

const loadCategories = (): string[] => {
  try {
    const saved = localStorage.getItem('restaurant_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

const saveCategories = (cats: string[]) => {
  localStorage.setItem('restaurant_categories', JSON.stringify(cats));
};

const loadDisabledCategories = (): Set<string> => {
  try {
    const saved = localStorage.getItem('restaurant_categories_disabled');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch { return new Set(); }
};

const saveDisabledCategories = (set: Set<string>) => {
  localStorage.setItem('restaurant_categories_disabled', JSON.stringify(Array.from(set)));
};

const loadOutOfStock = (): Set<string> => {
  try {
    const saved = localStorage.getItem('restaurant_out_of_stock');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch { return new Set(); }
};

const saveOutOfStock = (set: Set<string>) => {
  localStorage.setItem('restaurant_out_of_stock', JSON.stringify(Array.from(set)));
};

// ── Component ─────────────────────────────────────────────────────────────────

const RestaurantManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'tables' | 'categories'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<RestaurantTable | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // categories
  const [categories, setCategories] = useState<string[]>(loadCategories);
  const [newCategory, setNewCategory] = useState('');
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(loadDisabledCategories);
  const [outOfStockItems, setOutOfStockItems] = useState<Set<string>>(loadOutOfStock);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...categories, trimmed];
    setCategories(updated);
    saveCategories(updated);
    setNewCategory('');
    toast.success('Category added');
  };

  const handleRemoveCategory = (cat: string) => {
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    saveCategories(updated);
    const newDisabled = new Set(disabledCategories);
    newDisabled.delete(cat);
    setDisabledCategories(newDisabled);
    saveDisabledCategories(newDisabled);
  };

  const handleToggleCategoryVisibility = (cat: string) => {
    const updated = new Set(disabledCategories);
    if (updated.has(cat)) { updated.delete(cat); toast.success(`"${cat}" visible to customers`); }
    else { updated.add(cat); toast.success(`"${cat}" hidden from customers`); }
    setDisabledCategories(updated);
    saveDisabledCategories(updated);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await axios.put(`/restaurant/menu/${item._id}`, { isAvailable: !item.isAvailable });
      setMenuItems((prev) => prev.map((m) => m._id === item._id ? { ...m, isAvailable: !m.isAvailable } : m));
      toast.success(item.isAvailable ? `"${item.name}" set inactive` : `"${item.name}" set active`);
    } catch { toast.error('Failed to update item'); }
  };

  const handleToggleOutOfStock = (item: MenuItem) => {
    const updated = new Set(outOfStockItems);
    if (updated.has(item._id)) { updated.delete(item._id); toast.success(`"${item.name}" back in stock`); }
    else { updated.add(item._id); toast.success(`"${item.name}" marked out of stock`); }
    setOutOfStockItems(updated);
    saveOutOfStock(updated);
  };

  const [menuForm, setMenuForm] = useState<MenuForm>({
    name: '',
    category: '',
    dishType: 'veg',
    price: 0,
    isAvailable: true,
    description: '',
    discount: 0,
    preparationTime: '',
    images: [],
    spiceLevels: [],
    addOns: [],
    isFeatured: false,
    calories: 0,
  });

  const [tableForm, setTableForm] = useState<TableForm>({
    tableName: '',
    seatingCapacity: 2,
    tableType: 'indoor',
    isAvailable: true,
    status: 'available',
    location: '',
    price: 0,
  });

  useEffect(() => {
    fetchMenuItems();
    fetchTables();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/restaurant/menu?limit=100');
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
      const response = await axios.get('/restaurant/tables');
      setTables(response.data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to fetch tables');
    }
  };

  const handleMenuSubmit = async () => {
    if (!menuForm.name.trim()) { toast.error('Item name is required'); return; }
    if (!menuForm.category) { toast.error('Category is required'); return; }
    if (!menuForm.price || menuForm.price <= 0) { toast.error('Price must be greater than 0'); return; }

    // Backend requires description (non-empty) and itemId — fill automatically
    const payload = {
      ...menuForm,
      description: menuForm.description?.trim() || menuForm.name.trim(),
      itemId: editingMenuItem
        ? undefined
        : `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };

    try {
      if (editingMenuItem) {
        await axios.put(`/restaurant/menu/${editingMenuItem}`, payload);
        toast.success('Menu item updated');
      } else {
        await axios.post('/restaurant/menu', payload);
        toast.success('Menu item created');
      }
      resetMenuForm();
      fetchMenuItems();
    } catch (error: any) {
      const msg = error.response?.data?.errors?.[0]?.msg
        || error.response?.data?.message
        || 'Failed to save menu item';
      toast.error(msg);
    }
  };

  const handleTableSubmit = async () => {
    try {
      if (editingTable) {
        await axios.put(`/restaurant/tables/${editingTable}`, tableForm);
        toast.success('Table updated successfully');
        resetTableForm();
        fetchTables();
      } else {
        const { data } = await axios.post('/restaurant/tables', tableForm);
        toast.success('Table created successfully — scan the QR code below');
        resetTableForm();
        // Refresh and auto-open QR for the new table
        const refreshed = await axios.get('/restaurant/tables');
        const allTables: RestaurantTable[] = refreshed.data.tables || [];
        setTables(allTables);
        // Find the newly created table by tableId from response
        const created: RestaurantTable | undefined =
          data.table || allTables.find((t) => t._id === data._id) || allTables[allTables.length - 1];
        if (created) setQrModal(created);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save table');
    }
  };

  const downloadQR = () => {
    const svgEl = qrRef.current?.querySelector('svg');
    if (!svgEl || !qrModal) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 460;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 400, 460);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 40, 30, 320, 320);
      ctx.fillStyle = '#111827'; ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(qrModal.tableName, 200, 385);
      ctx.fillStyle = '#6b7280'; ctx.font = '13px Arial';
      ctx.fillText(`${qrModal.tableId} · ${qrModal.seatingCapacity} seats`, 200, 410);
      ctx.fillText('Scan to order', 200, 432);
      const link = document.createElement('a');
      link.download = `QR-${qrModal.tableId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleMenuEdit = (item: MenuItem) => {
    setMenuForm({
      name: item.name,
      category: item.category,
      description: item.description,
      dishType: item.dishType === 'vegan' ? 'veg' : item.dishType,
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
      await axios.delete(`/restaurant/menu/${id}`);
      toast.success('Menu item deleted successfully');
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete menu item');
    }
  };

  const handleTableDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await axios.delete(`/restaurant/tables/${id}`);
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
      {/* ── Header + Tabs ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
        <div className="flex gap-2">
          {(['menu', 'tables', 'categories'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors
                ${ (activeTab as string) === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tab === 'menu' ? 'Menu Items' : tab === 'tables' ? 'Tables' : 'Categories'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu Items Tab ─────────────────────────────────────────────── */}
      {activeTab === 'menu' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold text-gray-700">Menu Items <span className="text-gray-400 font-normal">({menuItems.length})</span></h2>
            <button
              onClick={() => setShowMenuForm(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Tag className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No menu items yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menuItems.map((item) => {
                const isVeg = item.dishType === 'veg' || item.dishType === 'vegan';
                const isOOS = outOfStockItems.has(item._id);
                const inactive = !item.isAvailable;
                return (
                  <div key={item._id} className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2.5 transition-opacity ${
                    inactive ? 'border-gray-100 opacity-60' : 'border-gray-100'
                  }`}>
                    {/* Name + veg dot */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{item.name}</h3>
                      <span className={`flex-shrink-0 h-4 w-4 rounded-sm border-2 flex items-center justify-center mt-0.5 ${
                        isVeg ? 'border-green-600' : 'border-red-600'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                      </span>
                    </div>

                    {/* Price + category */}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-green-700">₹{item.price}</span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{item.category || '—'}</span>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-1">
                      {inactive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">Inactive</span>
                      )}
                      {isOOS && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Out of Stock</span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pt-2 border-t border-gray-50">
                      {/* Active / Inactive toggle */}
                      <button
                        title={item.isAvailable ? 'Set Inactive' : 'Set Active'}
                        onClick={() => handleToggleAvailability(item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          item.isAvailable
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {item.isAvailable ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                        {item.isAvailable ? 'Active' : 'Inactive'}
                      </button>

                      {/* Out of Stock toggle */}
                      <button
                        title={isOOS ? 'Mark In Stock' : 'Mark Out of Stock'}
                        onClick={() => handleToggleOutOfStock(item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          isOOS
                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <PackageX className="h-3 w-3" />
                        {isOOS ? 'In Stock' : 'Stock Out'}
                      </button>

                      <div className="flex-1" />
                      <button title="Edit" onClick={() => handleMenuEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button title="Delete" onClick={() => handleMenuDelete(item._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                          title="View QR Code"
                          onClick={() => setQrModal(table)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit Table"
                          onClick={() => handleTableEdit(table)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete Table"
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

      {/* ── Categories Tab ─────────────────────────────────────────────── */}
      {(activeTab as string) === 'categories' && (
        <div className="max-w-lg">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Categories <span className="text-gray-400 font-normal">({categories.length})</span></h2>

          {/* Add form */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Category name"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Category rows */}
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const isDisabled = disabledCategories.has(cat);
              return (
                <div key={cat} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${
                  isDisabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                }`}>
                  <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{cat}</span>
                  <div className="flex items-center gap-2">
                    {/* ON/OFF toggle */}
                    <button
                      title={isDisabled ? 'Show to customers' : 'Hide from customers'}
                      onClick={() => handleToggleCategoryVisibility(cat)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isDisabled
                          ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {isDisabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {isDisabled ? 'Off' : 'On'}
                    </button>
                    {/* Delete */}
                    <button title="Remove category" onClick={() => handleRemoveCategory(cat)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-gray-400">No categories yet. Add one above.</p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">* <strong>Off</strong> hides the category from the customer menu. It still appears in the admin &ldquo;Add Item&rdquo; form.</p>
        </div>
      )}

      {/* ── Menu Item Form Modal ───────────────────────────────────────── */}
      {showMenuForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button title="Close" onClick={resetMenuForm} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Item Name</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Paneer Butter Masala"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={menuForm.price === 0 ? '' : `₹${menuForm.price}`}
                  onChange={(e) => {
                    // Allow typing ₹ symbol — strip it and any non-numeric chars except dot
                    const raw = e.target.value.replace(/[₹\u20b9]/g, '').replace(/[^0-9.]/g, '');
                    setMenuForm((p) => ({ ...p, price: parseFloat(raw) || 0 }));
                  }}
                  placeholder="₹ 0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                <select
                  value={menuForm.category}
                  onChange={(e) => setMenuForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Veg / Non-Veg Toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMenuForm((p) => ({ ...p, dishType: 'veg' }))}
                    className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors
                      ${menuForm.dishType === 'veg' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className={`h-3.5 w-3.5 rounded-sm border-2 flex items-center justify-center ${
                      menuForm.dishType === 'veg' ? 'border-white' : 'border-green-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${menuForm.dishType === 'veg' ? 'bg-white' : 'bg-green-600'}`} />
                    </span>
                    Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuForm((p) => ({ ...p, dishType: 'non-veg' }))}
                    className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-l border-gray-200
                      ${menuForm.dishType === 'non-veg' ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className={`h-3.5 w-3.5 rounded-sm border-2 flex items-center justify-center ${
                      menuForm.dishType === 'non-veg' ? 'border-white' : 'border-red-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${menuForm.dishType === 'non-veg' ? 'bg-white' : 'bg-red-600'}`} />
                    </span>
                    Non-Veg
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={resetMenuForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMenuSubmit}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                {editingMenuItem ? 'Update' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">QR Code</h3>
              <button title="Close" onClick={() => setQrModal(null)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="text-center mb-3">
              <p className="font-bold text-gray-800">{qrModal.tableName}</p>
              <p className="text-xs text-gray-400">{qrModal.tableId} · {qrModal.seatingCapacity} seats · {qrModal.tableType}</p>
            </div>

            <div ref={qrRef} className="flex justify-center mb-4 p-4 bg-white border-2 border-gray-100 rounded-xl">
              <QRCodeSVG
                value={`${window.location.origin}/menu?table=${qrModal.tableId}`}
                size={210}
                level="H"
                includeMargin
              />
            </div>

            <p className="text-xs text-gray-400 text-center break-all mb-4">
              {window.location.origin}/menu?table={qrModal.tableId}
            </p>

            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white py-2.5 rounded-xl font-bold transition-colors"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
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
