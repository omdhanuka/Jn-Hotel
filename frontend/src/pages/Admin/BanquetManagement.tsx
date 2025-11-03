import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Check, X, Building, Users, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Banquet {
  _id: string;
  banquetId: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  pricePerDay: number;
  pricePerHour: number;
  minimumHours: number;
  amenities: string[];
  facilities: any;
  seatingArrangements: string[];
  area: string;
  floor: number;
  location: string;
  isAvailable: boolean;
  status: string;
  images: string[];
  videoTour?: string;
  discount?: number;
  advancePaymentRequired?: number;
  availableFrom?: string;
  cateringMenuDetails?: string;
  decorationThemes?: string[];
  termsAndConditions?: string;
  createdBy?: string;
  createdAt: string;
}

interface BanquetForm {
  // Basic Information
  name: string;
  type: string;
  description: string;
  
  // Location & Capacity
  location: string;
  floor: number;
  capacity: number;
  area: string;
  
  // Pricing
  pricePerDay: number;
  pricePerHour: number;
  minimumHours: number;
  discount: number;
  advancePaymentRequired: number;
  
  // Facilities
  facilities: {
    ac: boolean;
    projector: boolean;
    soundSystem: boolean;
    wifi: boolean;
    parking: boolean;
    catering: boolean;
    decoration: boolean;
    dj: boolean;
    photography: boolean;
    powerBackup: boolean;
    stage: boolean;
    changingRoom: boolean;
    washroom: boolean;
    security: boolean;
  };
  
  // Seating & Amenities
  seatingArrangements: string[];
  amenities: string[];
  
  // Media
  images: string[];
  videoTour: string;
  
  // Availability
  isAvailable: boolean;
  availableFrom: string;
  status: string;
  
  // Additional Information
  cateringMenuDetails: string;
  decorationThemes: string[];
  termsAndConditions: string;
}

const BanquetManagement: React.FC = () => {
  const [banquets, setBanquets] = useState<Banquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanquet, setEditingBanquet] = useState<string | null>(null);
  
  const [banquetForm, setBanquetForm] = useState<BanquetForm>({
    name: '',
    type: 'wedding',
    description: '',
    location: '',
    floor: 1,
    capacity: 100,
    area: '',
    pricePerDay: 0,
    pricePerHour: 0,
    minimumHours: 4,
    discount: 0,
    advancePaymentRequired: 20,
    facilities: {
      ac: false,
      projector: false,
      soundSystem: false,
      wifi: false,
      parking: false,
      catering: false,
      decoration: false,
      dj: false,
      photography: false,
      powerBackup: false,
      stage: false,
      changingRoom: false,
      washroom: false,
      security: false
    },
    seatingArrangements: [],
    amenities: [],
    images: [],
    videoTour: '',
    isAvailable: true,
    availableFrom: '',
    status: 'active',
    cateringMenuDetails: '',
    decorationThemes: [],
    termsAndConditions: ''
  });

  const banquetTypes = [
    { value: 'wedding', label: 'Wedding Hall' },
    { value: 'conference', label: 'Conference Hall' },
    { value: 'party', label: 'Party Hall' },
    { value: 'meeting', label: 'Meeting Room' },
    { value: 'reception', label: 'Reception Hall' },
    { value: 'corporate', label: 'Corporate Hall' }
  ];

  const seatingOptions = [
    'Theatre Style',
    'Round Table',
    'U-Shape',
    'Classroom',
    'Boardroom',
    'Cocktail',
    'Banquet',
    'Custom'
  ];

  const commonAmenities = [
    'Stage/Podium',
    'Dance Floor',
    'Bar Counter',
    'Kitchen Access',
    'Bridal Room',
    'Green Room',
    'Storage Space',
    'Natural Lighting',
    'Garden View',
    'Balcony Access'
  ];

  const decorationThemeOptions = [
    'Traditional Indian',
    'Modern Contemporary',
    'Royal & Elegant',
    'Garden & Floral',
    'Corporate Professional',
    'Vintage Classic',
    'Bohemian',
    'Minimalist'
  ];

  useEffect(() => {
    fetchBanquets();
  }, []);

  const fetchBanquets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/banquets?limit=50');
      setBanquets(response.data.banquets || []);
    } catch (error) {
      toast.error('Failed to fetch banquets');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setBanquetForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFacilityToggle = (facility: string) => {
    setBanquetForm(prev => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facility]: !prev.facilities[facility as keyof typeof prev.facilities]
      }
    }));
  };

  const handleArrayToggle = (field: 'seatingArrangements' | 'amenities' | 'decorationThemes', value: string) => {
    setBanquetForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingBanquet) {
        await axios.put(`/api/banquets/${editingBanquet}`, banquetForm);
        toast.success('Banquet updated successfully');
      } else {
        await axios.post('/api/banquets', banquetForm);
        toast.success('Banquet created successfully');
      }
      
      resetForm();
      fetchBanquets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save banquet');
    }
  };

  const handleEdit = (banquet: Banquet) => {
    setBanquetForm({
      name: banquet.name,
      type: banquet.type,
      description: banquet.description,
      location: banquet.location,
      floor: banquet.floor,
      capacity: banquet.capacity,
      area: banquet.area,
      pricePerDay: banquet.pricePerDay,
      pricePerHour: banquet.pricePerHour,
      minimumHours: banquet.minimumHours,
      discount: banquet.discount || 0,
      advancePaymentRequired: banquet.advancePaymentRequired || 20,
      facilities: banquet.facilities || {
        ac: false, projector: false, soundSystem: false, wifi: false,
        parking: false, catering: false, decoration: false, dj: false,
        photography: false, powerBackup: false, stage: false,
        changingRoom: false, washroom: false, security: false
      },
      seatingArrangements: banquet.seatingArrangements || [],
      amenities: banquet.amenities || [],
      images: banquet.images || [],
      videoTour: banquet.videoTour || '',
      isAvailable: banquet.isAvailable,
      availableFrom: banquet.availableFrom || '',
      status: banquet.status,
      cateringMenuDetails: banquet.cateringMenuDetails || '',
      decorationThemes: banquet.decorationThemes || [],
      termsAndConditions: banquet.termsAndConditions || ''
    });
    setEditingBanquet(banquet._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banquet?')) return;
    
    try {
      await axios.delete(`/api/banquets/${id}`);
      toast.success('Banquet deleted successfully');
      fetchBanquets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete banquet');
    }
  };

  const resetForm = () => {
    setBanquetForm({
      name: '', type: 'wedding', description: '', location: '', floor: 1,
      capacity: 100, area: '', pricePerDay: 0, pricePerHour: 0, minimumHours: 4,
      discount: 0, advancePaymentRequired: 20,
      facilities: {
        ac: false, projector: false, soundSystem: false, wifi: false,
        parking: false, catering: false, decoration: false, dj: false,
        photography: false, powerBackup: false, stage: false,
        changingRoom: false, washroom: false, security: false
      },
      seatingArrangements: [], amenities: [], images: [], videoTour: '',
      isAvailable: true, availableFrom: '', status: 'active',
      cateringMenuDetails: '', decorationThemes: [], termsAndConditions: ''
    });
    setEditingBanquet(null);
    setShowForm(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Banquet Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Banquet
        </button>
      </div>

      {/* Banquet Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingBanquet ? 'Edit Banquet' : 'Add New Banquet'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Banquet Name *</label>
                      <input
                        type="text"
                        value={banquetForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="e.g., Emerald Grand Hall"
                      />
                    </div>
                    
                    <div>
                      <label id="banquet-type-label" htmlFor="banquet-type" className="block text-sm font-medium mb-1">Banquet Type *</label>
                      <select
                        id="banquet-type"
                        aria-labelledby="banquet-type-label"
                        title="Banquet Type"
                        value={banquetForm.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                      >
                        {banquetTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Description *</label>
                      <textarea
                        value={banquetForm.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Detailed description of the hall..."
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Capacity */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Location & Capacity</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Location *</label>
                        <input
                          type="text"
                          value={banquetForm.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full border rounded-md px-3 py-2"
                          placeholder="e.g., Ground Floor"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Floor *</label>
                        <input
                          type="number"
                          value={banquetForm.floor}
                          onChange={(e) => handleInputChange('floor', parseInt(e.target.value))}
                          className="w-full border rounded-md px-3 py-2"
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Capacity *</label>
                        <input
                          type="number"
                          value={banquetForm.capacity}
                          onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                          className="w-full border rounded-md px-3 py-2"
                          placeholder="e.g., 300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Area *</label>
                        <input
                          type="text"
                          value={banquetForm.area}
                          onChange={(e) => handleInputChange('area', e.target.value)}
                          className="w-full border rounded-md px-3 py-2"
                          placeholder="e.g., 2000 sq. ft."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Pricing Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price per Day *</label>
                    <input
                      type="number"
                      value={banquetForm.pricePerDay}
                      onChange={(e) => handleInputChange('pricePerDay', parseFloat(e.target.value))}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price per Hour *</label>
                    <input
                      type="number"
                      value={banquetForm.pricePerHour}
                      onChange={(e) => handleInputChange('pricePerHour', parseFloat(e.target.value))}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Hours</label>
                    <input
                      type="number"
                      value={banquetForm.minimumHours}
                      onChange={(e) => handleInputChange('minimumHours', parseInt(e.target.value))}
                      className="w-full border rounded-md px-3 py-2"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={banquetForm.discount}
                      onChange={(e) => handleInputChange('discount', parseFloat(e.target.value))}
                      className="w-full border rounded-md px-3 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Advance Required (%)</label>
                    <input
                      type="number"
                      value={banquetForm.advancePaymentRequired}
                      onChange={(e) => handleInputChange('advancePaymentRequired', parseFloat(e.target.value))}
                      className="w-full border rounded-md px-3 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Facilities */}
              <div>
                <h3 className="text-lg font-medium mb-4">Facilities & Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(banquetForm.facilities).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handleFacilityToggle(key)}
                        className="rounded"
                        title={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        placeholder={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        aria-label={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      />
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seating Arrangements */}
              <div>
                <h3 className="text-lg font-medium mb-4">Seating Arrangements</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {seatingOptions.map(option => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={banquetForm.seatingArrangements.includes(option)}
                        onChange={() => handleArrayToggle('seatingArrangements', option)}
                        className="rounded"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Amenities */}
              <div>
                <h3 className="text-lg font-medium mb-4">Additional Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {commonAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={banquetForm.amenities.includes(amenity)}
                        onChange={() => handleArrayToggle('amenities', amenity)}
                        className="rounded"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Media & Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Media</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Images (URLs)</label>
                      <textarea
                        value={banquetForm.images.join('\n')}
                        onChange={(e) => handleInputChange('images', e.target.value.split('\n').filter(url => url.trim()))}
                        rows={3}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Enter image URLs, one per line"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Video Tour URL</label>
                      <input
                        type="url"
                        value={banquetForm.videoTour}
                        onChange={(e) => handleInputChange('videoTour', e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Availability & Status</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label id="banquet-status-label" htmlFor="banquet-status" className="block text-sm font-medium mb-1">Status</label>
                        <select
                          id="banquet-status"
                          aria-labelledby="banquet-status-label"
                          title="Status"
                          value={banquetForm.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full border rounded-md px-3 py-2"
                        >
                          <option value="active">Active</option>
                          <option value="hidden">Hidden</option>
                          <option value="maintenance">Under Maintenance</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2 mt-6">
                          <input
                            type="checkbox"
                            checked={banquetForm.isAvailable}
                            onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Available for Booking</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Available From (if future)</label>
                      <input
                        type="date"
                        value={banquetForm.availableFrom}
                        onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Decoration Themes</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {decorationThemeOptions.map(theme => (
                        <label key={theme} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={banquetForm.decorationThemes.includes(theme)}
                            onChange={() => handleArrayToggle('decorationThemes', theme)}
                            className="rounded"
                          />
                          <span className="text-sm">{theme}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Catering Menu Details</label>
                    <textarea
                      value={banquetForm.cateringMenuDetails}
                      onChange={(e) => handleInputChange('cateringMenuDetails', e.target.value)}
                      rows={3}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="Details about available catering options..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
                    <textarea
                      value={banquetForm.termsAndConditions}
                      onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                      rows={3}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="Rules, restrictions, terms..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingBanquet ? 'Update' : 'Create'} Banquet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banquets Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Banquet Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type & Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banquets.map((banquet) => (
                <tr key={banquet._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{banquet.name}</div>
                      <div className="text-sm text-gray-500">{banquet.banquetId}</div>
                      <div className="text-sm text-gray-500">{banquet.location} - Floor {banquet.floor}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{banquet.type}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {banquet.capacity} guests
                      </div>
                      <div className="text-sm text-gray-500">{banquet.area}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">₹{banquet.pricePerDay}/day</div>
                      <div className="text-sm text-gray-500">₹{banquet.pricePerHour}/hour</div>
                      <div className="text-sm text-gray-500">Min {banquet.minimumHours}hrs</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        banquet.status === 'active' ? 'bg-green-100 text-green-800' :
                        banquet.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {banquet.status}
                      </span>
                      {banquet.isAvailable && (
                        <div className="text-xs text-green-600">Available</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(banquet)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banquet._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
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
    </div>
  );
};

export default BanquetManagement;
