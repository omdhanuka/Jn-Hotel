import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, User, Mail, Phone, Shield, Users, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'staff' | 'reception' | 'admin' | 'manager';
  department?: string;
  position?: string;
  isActive: boolean;
  createdAt: string;
  permissions?: {
    viewBookings?: boolean;
    manageBookings?: boolean;
    viewRooms?: boolean;
    manageRooms?: boolean;
    viewBanquets?: boolean;
    manageBanquets?: boolean;
    viewRestaurant?: boolean;
    manageRestaurant?: boolean;
    viewOrders?: boolean;
    manageOrders?: boolean;
    viewReviews?: boolean;
    manageReviews?: boolean;
    viewUsers?: boolean;
    manageUsers?: boolean;
    viewReports?: boolean;
    manageBills?: boolean;
  };
}

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'staff' | 'managers'>('staff');
  
  // Helper function to get default permissions
  const getDefaultPermissions = () => ({
    viewBookings: false,
    manageBookings: false,
    viewRooms: false,
    manageRooms: false,
    viewBanquets: false,
    manageBanquets: false,
    viewRestaurant: false,
    manageRestaurant: false,
    viewOrders: false,
    manageOrders: false,
    viewReviews: false,
    manageReviews: false,
    viewUsers: false,
    manageUsers: false,
    viewReports: false,
    manageBills: false
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff' as 'staff' | 'reception' | 'admin' | 'manager',
    department: '',
    position: '',
    isActive: true,
    permissions: getDefaultPermissions()
  });

  const departments = [
    'Front Desk',
    'Housekeeping',
    'Food & Beverage',
    'Kitchen',
    'Waiter',
    'Chef',
    'Maintenance',
    'Security',
    'Management',
    'Accounting',
    'Human Resources',
    'Marketing'
  ];

  const permissionSections = [
    { 
      title: 'Bookings', 
      permissions: [
        { key: 'viewBookings', label: 'View Bookings', description: 'Can view all bookings' },
        { key: 'manageBookings', label: 'Manage Bookings', description: 'Can create, edit, and cancel bookings' }
      ]
    },
    { 
      title: 'Rooms', 
      permissions: [
        { key: 'viewRooms', label: 'View Rooms', description: 'Can view room details' },
        { key: 'manageRooms', label: 'Manage Rooms', description: 'Can add, edit, and delete rooms' }
      ]
    },
    { 
      title: 'Banquets', 
      permissions: [
        { key: 'viewBanquets', label: 'View Banquets', description: 'Can view banquet halls' },
        { key: 'manageBanquets', label: 'Manage Banquets', description: 'Can add, edit, and delete banquet halls' }
      ]
    },
    { 
      title: 'Restaurant', 
      permissions: [
        { key: 'viewRestaurant', label: 'View Restaurant', description: 'Can view menu and tables' },
        { key: 'manageRestaurant', label: 'Manage Restaurant', description: 'Can manage menu items and tables' }
      ]
    },
    { 
      title: 'Orders', 
      permissions: [
        { key: 'viewOrders', label: 'View Orders', description: 'Can view restaurant orders' },
        { key: 'manageOrders', label: 'Manage Orders', description: 'Can update order status' }
      ]
    },
    { 
      title: 'Reviews', 
      permissions: [
        { key: 'viewReviews', label: 'View Reviews', description: 'Can view guest reviews' },
        { key: 'manageReviews', label: 'Manage Reviews', description: 'Can approve/reject reviews' }
      ]
    },
    { 
      title: 'Users', 
      permissions: [
        { key: 'viewUsers', label: 'View Users', description: 'Can view user list' },
        { key: 'manageUsers', label: 'Manage Users', description: 'Can edit user information' }
      ]
    },
    { 
      title: 'Reports & Bills', 
      permissions: [
        { key: 'viewReports', label: 'View Reports', description: 'Can access analytics and reports' },
        { key: 'manageBills', label: 'Manage Bills', description: 'Can create and edit bills' }
      ]
    }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/staff');
      setStaff(response.data.staff || []);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // IMPORTANT: Ensure role is set correctly based on active tab
      const roleToSubmit = activeTab === 'managers' ? 'manager' : formData.role;
      
      // Prepare data based on role
      const staffData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: roleToSubmit, // Use the determined role
        department: formData.department,
        position: formData.position,
        isActive: formData.isActive
      };

      // Add permissions for non-admin roles
      if (roleToSubmit !== 'admin') {
        staffData.permissions = formData.permissions;
      }

      // Add password if creating new or if password field is filled
      if (!editingStaff || formData.password) {
        if (!formData.password && !editingStaff) {
          toast.error('Password is required for new staff/manager');
          return;
        }
        staffData.password = formData.password;
      }

      console.log('Submitting data:', { ...staffData, password: '***', activeTab, roleToSubmit }); // Debug log

      if (editingStaff) {
        const response = await axios.put(`/admin/staff/${editingStaff._id}`, staffData);
        console.log('Update response:', response.data);
        toast.success(`${roleToSubmit === 'manager' ? 'Manager' : 'Staff'} updated successfully`);
      } else {
        const response = await axios.post('/admin/staff', staffData);
        console.log('Create response:', response.data);
        toast.success(`${roleToSubmit === 'manager' ? 'Manager' : 'Staff'} registered successfully`);
      }
      
      await fetchStaff(); // Wait for fetch to complete
      resetForm();
    } catch (error: any) {
      console.error('Submit error:', error.response?.data);
      toast.error(error.response?.data?.message || `Failed to save ${formData.role === 'manager' ? 'manager' : 'staff'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'staff',
      department: '',
      position: '',
      isActive: true,
      permissions: getDefaultPermissions()
    });
    setShowAddForm(false);
    setEditingStaff(null);
    setShowPassword(false);
  };

  const handleEdit = (staffMember: Staff) => {
    // Create default permissions object with all false values
    const defaultPermissions = {
      viewBookings: false,
      manageBookings: false,
      viewRooms: false,
      manageRooms: false,
      viewBanquets: false,
      manageBanquets: false,
      viewRestaurant: false,
      manageRestaurant: false,
      viewOrders: false,
      manageOrders: false,
      viewReviews: false,
      manageReviews: false,
      viewUsers: false,
      manageUsers: false,
      viewReports: false,
      manageBills: false
    };

    // Merge staff permissions with defaults to ensure all keys exist
    const mergedPermissions = {
      ...defaultPermissions,
      ...(staffMember.permissions || {})
    };

    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone || '',
      password: '',
      role: staffMember.role,
      department: staffMember.department || '',
      position: staffMember.position || '',
      isActive: staffMember.isActive,
      permissions: mergedPermissions
    });
    setEditingStaff(staffMember);
    setShowAddForm(true);
  };

  const handleDelete = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/admin/staff/${staffId}`);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete staff');
    }
  };

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      await axios.put(`/admin/staff/${staffId}/status`, {
        isActive: !currentStatus
      });
      toast.success(`Staff ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchStaff();
    } catch (error) {
      toast.error('Failed to update staff status');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'reception':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      case 'manager':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !(prev.permissions as any)[permission]
      }
    }));
  };

  const selectAllPermissions = (section: typeof permissionSections[0]) => {
    const updates: any = {};
    section.permissions.forEach(perm => {
      updates[perm.key] = true;
    });
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        ...updates
      }
    }));
  };

  const clearAllPermissions = (section: typeof permissionSections[0]) => {
    const updates: any = {};
    section.permissions.forEach(perm => {
      updates[perm.key] = false;
    });
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        ...updates
      }
    }));
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Register and manage hotel staff members and managers</p>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="/staff/login"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
          >
            <Shield className="h-5 w-5 mr-2" />
            Staff Login Page
          </a>
          <a
            href="/manager/login"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Shield className="h-5 w-5 mr-2" />
            Manager Login Page
          </a>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Register {activeTab === 'staff' ? 'Staff' : 'Manager'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab('staff');
                if (showAddForm) {
                  // When switching tabs while form is open, reset to appropriate role
                  setFormData(prev => ({ ...prev, role: 'staff' }));
                }
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline h-5 w-5 mr-2" />
              Staff & Reception ({staff.filter(s => s.role === 'staff' || s.role === 'reception').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('managers');
                if (showAddForm) {
                  // When switching tabs while form is open, set role to manager
                  setFormData(prev => ({ ...prev, role: 'manager' }));
                }
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'managers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="inline h-5 w-5 mr-2" />
              Managers ({staff.filter(s => s.role === 'manager').length})
            </button>
          </nav>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {editingStaff 
              ? `Edit ${editingStaff.role === 'manager' ? 'Manager' : editingStaff.role === 'reception' ? 'Reception Manager' : 'Staff'}` 
              : `Register New ${activeTab === 'managers' ? 'Manager' : activeTab === 'staff' ? 'Staff/Reception' : 'Staff'}`
            }
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@hotel.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingStaff ? '(Leave blank to keep current)' : '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required={!editingStaff}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!editingStaff && (
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters. Staff will use this to login.
                </p>
              )}
            </div>

            {/* Role & Department */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as any;
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      permissions: getDefaultPermissions()
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {activeTab === 'managers' ? (
                    <>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin (Full Access)</option>
                    </>
                  ) : (
                    <>
                      <option value="staff">Staff</option>
                      <option value="reception">Reception Manager</option>
                      <option value="admin">Admin (Full Access)</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'staff' && 'General staff with custom permissions'}
                  {formData.role === 'reception' && 'Front desk operations manager'}
                  {formData.role === 'manager' && 'Hotel manager with supervisory access'}
                  {formData.role === 'admin' && 'Full system access - no restrictions'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Manager, Supervisor"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2 h-4 w-4"
              />
              <label className="text-sm text-gray-700">
                Active (Staff can login when active)
              </label>
            </div>

            {/* Permissions Section - Show for staff, reception, and manager roles */}
            {formData.role !== 'admin' && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {formData.role === 'manager' ? 'Manager Permissions' : 'Access Permissions'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formData.role === 'manager' 
                      ? 'Managers have elevated permissions to supervise operations but cannot modify system settings'
                      : `Select which sections and features this ${formData.role === 'reception' ? 'reception manager' : 'staff member'} can access`
                    }
                  </p>
                </div>

                {formData.role === 'manager' && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-3">✨ Manager Capabilities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-indigo-800">
                      <div className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>View and manage all bookings (rooms, banquets, restaurant)</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Supervise room operations and staff tasks</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Handle guest check-ins and check-outs</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Approve/reject bookings and tasks</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Manage complaints and issues</span>
                      </div>
                      <div className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>View reports and analytics</span>
                      </div>
                      <div className="flex items-start text-red-700">
                        <span className="mr-2">✗</span>
                        <span>Cannot add/delete rooms or staff</span>
                      </div>
                      <div className="flex items-start text-red-700">
                        <span className="mr-2">✗</span>
                        <span>Cannot access admin-only settings</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border border-indigo-100">
                      <p className="text-xs text-indigo-900 font-medium">
                        💡 <strong>Manager Login:</strong> Managers use the dedicated manager portal at{' '}
                        <a href="/manager/login" target="_blank" className="underline hover:text-indigo-700">
                          /manager/login
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Permission Sections */}
                <div className="space-y-6">
                  {permissionSections.map((section) => (
                    <div key={section.title} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900">{section.title}</h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => selectAllPermissions(section)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => clearAllPermissions(section)}
                            className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {section.permissions.map((perm) => (
                          <label key={perm.key} className="flex items-start space-x-3 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={(formData.permissions as any)[perm.key]}
                              onChange={() => handlePermissionToggle(perm.key)}
                              className="mt-1 h-4 w-4 text-blue-600 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{perm.label}</div>
                              <div className="text-xs text-gray-500">{perm.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> {formData.role === 'manager' 
                      ? 'Managers typically need most permissions enabled. They supervise operations but cannot modify system structure.'
                      : formData.role === 'reception'
                      ? 'Reception managers usually need booking, room, and bill management permissions.'
                      : 'Select only the permissions required for this staff member\'s job role.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Admin Role Notice */}
            {formData.role === 'admin' && (
              <div className="border-t pt-6">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2">⚠️ Admin Role - Full System Access</h4>
                      <p className="text-sm text-red-800 mb-2">
                        Admin users have unrestricted access to all system features including:
                      </p>
                      <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                        <li>Add/Edit/Delete rooms, banquet halls, and menu items</li>
                        <li>Create and manage all staff members and managers</li>
                        <li>Access all bookings, bills, and financial reports</li>
                        <li>Modify system settings and configurations</li>
                        <li>View and manage all guest data</li>
                      </ul>
                      <p className="text-sm text-red-900 font-medium mt-3">
                        Only assign admin role to trusted personnel with full operational responsibility.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                {editingStaff 
                  ? `Update ${formData.role === 'manager' ? 'Manager' : formData.role === 'reception' ? 'Reception Manager' : 'Staff'}` 
                  : `Register ${formData.role === 'manager' ? 'Manager' : formData.role === 'reception' ? 'Reception Manager' : 'Staff'}`
                }
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff/Manager List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {staff.filter(s => 
          activeTab === 'managers' ? s.role === 'manager' : (s.role === 'staff' || s.role === 'reception')
        ).length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === 'managers' ? 'managers' : 'staff members'} registered
            </h3>
            <p className="text-gray-600 mb-4">
              Register your first {activeTab === 'managers' ? 'manager' : 'staff member'} to get started
            </p>
            <button
              onClick={() => {
                setShowAddForm(true);
                // Set default role based on active tab
                setFormData(prev => ({
                  ...prev,
                  role: activeTab === 'managers' ? 'manager' : 'staff' // Set role to 'manager' when on managers tab
                }));
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register {activeTab === 'managers' ? 'Manager' : 'Staff'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff
                  .filter(s => 
                    activeTab === 'managers' ? s.role === 'manager' : (s.role === 'staff' || s.role === 'reception')
                  )
                  .map((staffMember) => (
                    <tr key={staffMember._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {staffMember.firstName} {staffMember.lastName}
                            </div>
                            {staffMember.position && (
                              <div className="text-sm text-gray-500">{staffMember.position}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {staffMember.email}
                        </div>
                        {staffMember.phone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {staffMember.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            staffMember.role === 'manager' ? 'bg-indigo-100 text-indigo-800' :
                            staffMember.role === 'reception' ? 'bg-blue-100 text-blue-800' :
                            staffMember.role === 'admin' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {staffMember.role.toUpperCase()}
                          </span>
                          {staffMember.department && (
                            <div className="text-xs text-gray-500">{staffMember.department}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStaffStatus(staffMember._id, staffMember.isActive)}
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            staffMember.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {staffMember.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {staffMember.role === 'admin' ? (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Full Access
                          </span>
                        ) : (
                          <div className="text-xs">
                            {Object.entries(staffMember.permissions || {})
                              .filter(([_, value]) => value)
                              .length > 0 ? (
                              <span className="text-green-600 font-medium">
                                {Object.entries(staffMember.permissions || {})
                                  .filter(([_, value]) => value)
                                  .length} permissions
                              </span>
                            ) : (
                              <span className="text-red-600">No permissions</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(staffMember)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Staff"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(staffMember._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Staff"
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
        )}
      </div>

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">Total Staff</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{staff.length}</div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-blue-600">Active</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {staff.filter(s => s.isActive).length}
          </div>
        </div>
        <div className="bg-indigo-50 p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-indigo-600">Managers</div>
          <div className="text-3xl font-bold text-indigo-900 mt-2">
            {staff.filter(s => s.role === 'manager').length}
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-purple-600">Reception</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {staff.filter(s => s.role === 'reception').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
