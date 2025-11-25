import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, User, Mail, Phone, Shield } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'staff' | 'reception' | 'admin';
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
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff' as 'staff' | 'reception' | 'admin',
    department: '',
    position: '',
    isActive: true,
    permissions: {
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
    }
  });

  const departments = [
    'Front Desk',
    'Housekeeping',
    'Food & Beverage',
    'Kitchen',
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
      const response = await axios.get('/api/admin/staff');
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
      if (editingStaff) {
        // Update staff
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          isActive: formData.isActive,
          permissions: formData.permissions
        };
        
        // Only include password if it's being changed
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await axios.put(`/api/admin/staff/${editingStaff._id}`, updateData);
        toast.success('Staff updated successfully');
      } else {
        // Create new staff
        if (!formData.password) {
          toast.error('Password is required for new staff');
          return;
        }
        
        await axios.post('/api/admin/staff', formData);
        toast.success('Staff registered successfully');
      }
      
      fetchStaff();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save staff');
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
      permissions: {
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
      }
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
      await axios.delete(`/api/admin/staff/${staffId}`);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete staff');
    }
  };

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/admin/staff/${staffId}/status`, {
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
          <p className="text-gray-600 mt-1">Register and manage hotel staff members</p>
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
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Register Staff
          </button>
        </div>
      </div>

      {/* Add/Edit Staff Form */}
      {showAddForm && (
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {editingStaff ? 'Edit Staff Member' : 'Register New Staff'}
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="staff">Staff</option>
                  <option value="reception">Reception Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'staff' && 'General staff access'}
                  {formData.role === 'reception' && 'Front desk operations'}
                  {formData.role === 'admin' && 'Full system access'}
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

            {/* Permissions Section - Only show for staff and reception roles */}
            {(formData.role === 'staff' || formData.role === 'reception') && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Permissions</h3>
                  <p className="text-sm text-gray-600">
                    Select which sections and features this {formData.role} member can access
                  </p>
                </div>

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
                    <strong>Note:</strong> Admin role has full access to all sections by default. 
                    Permissions only apply to Staff and Reception Manager roles.
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                {editingStaff ? 'Update Staff' : 'Register Staff'}
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

      {/* Staff List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {staff.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members</h3>
            <p className="text-gray-600 mb-4">Register your first staff member to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Register Staff
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
                {staff.map((staffMember) => (
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
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(staffMember.role)}`}>
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
          <div className="text-sm font-medium text-blue-600">Active Staff</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {staff.filter(s => s.isActive).length}
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-purple-600">Reception Managers</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {staff.filter(s => s.role === 'reception').length}
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-green-600">General Staff</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {staff.filter(s => s.role === 'staff').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
