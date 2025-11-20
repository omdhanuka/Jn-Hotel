import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Check, X, Building, Users, DollarSign, Upload, Link2, Trash } from 'lucide-react';
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

  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadMethod, setImageUploadMethod] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [compressionQuality, setCompressionQuality] = useState(80);
  const [showCompressionStats, setShowCompressionStats] = useState(false);
  const [compressionStats, setCompressionStats] = useState<Array<{
    url: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }>>([]);

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

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    // Add compression settings
    formData.append('quality', compressionQuality.toString());
    formData.append('maxWidth', '1920');
    formData.append('maxHeight', '1080');

    try {
      const response = await axios.post('/api/banquets/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const uploadedData = response.data.images;
      
      // Store compression stats
      setCompressionStats(uploadedData);
      setShowCompressionStats(true);

      // Add URLs to banquet form
      const uploadedUrls = uploadedData.map((img: any) => img.url);
      setBanquetForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCompressionQualityLabel = (quality: number): string => {
    if (quality <= 50) return 'Low Quality (Highest Compression)';
    if (quality <= 70) return 'Medium Quality (Balanced)';
    if (quality <= 85) return 'High Quality (Recommended)';
    return 'Maximum Quality (Low Compression)';
  };

  const getCompressionColor = (quality: number): string => {
    if (quality <= 50) return 'text-red-600';
    if (quality <= 70) return 'text-orange-600';
    if (quality <= 85) return 'text-green-600';
    return 'text-blue-600';
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    setBanquetForm(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));

    setImageUrl('');
    toast.success('Image URL added');
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    // If it's an uploaded image (starts with /uploads/), delete from server
    if (imageUrl.startsWith('/uploads/')) {
      try {
        const filename = imageUrl.split('/').pop();
        await axios.delete(`/api/banquets/images/${filename}`);
      } catch (error) {
        console.error('Failed to delete image from server:', error);
      }
    }

    setBanquetForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    toast.success('Image removed');
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

              {/* Media & Images - Updated Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Media & Images</h3>
                
                {/* Upload Method Toggle */}
                <div className="mb-4 flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod('upload')}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      imageUploadMethod === 'upload'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMethod('url')}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      imageUploadMethod === 'url'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Add URL
                  </button>
                </div>

                {/* Upload Images with Compression Control */}
                {imageUploadMethod === 'upload' && (
                  <div className="mb-4">
                    {/* Compression Quality Slider */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                          Image Compression Quality
                        </label>
                        <span className={`text-sm font-semibold ${getCompressionColor(compressionQuality)}`}>
                          {compressionQuality}%
                        </span>
                      </div>
                      
                      <input
                        type="range"
                        min="30"
                        max="100"
                        value={compressionQuality}
                        onChange={(e) => setCompressionQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, 
                            #ef4444 0%, 
                            #f97316 25%, 
                            #22c55e 50%, 
                            #3b82f6 75%, 
                            #3b82f6 100%)`
                        }}
                      />
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>30%</span>
                        <span>50%</span>
                        <span>70%</span>
                        <span>85%</span>
                        <span>100%</span>
                      </div>
                      
                      <div className={`text-center text-sm mt-2 font-medium ${getCompressionColor(compressionQuality)}`}>
                        {getCompressionQualityLabel(compressionQuality)}
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-600 bg-blue-50 p-3 rounded">
                        <p className="font-semibold mb-1">💡 Compression Guide:</p>
                        <ul className="space-y-1 ml-4">
                          <li>• <strong>30-50%:</strong> Smallest file size, noticeable quality loss</li>
                          <li>• <strong>50-70%:</strong> Good balance, suitable for web thumbnails</li>
                          <li>• <strong>70-85%:</strong> Recommended - Great quality with good compression</li>
                          <li>• <strong>85-100%:</strong> Maximum quality, larger file sizes</li>
                        </ul>
                      </div>
                    </div>

                    <label className="block text-sm font-medium mb-2">
                      Upload Images (Max 10)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImages}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          {uploadingImages ? 'Uploading and Compressing...' : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WEBP up to 10MB
                        </span>
                        <span className="text-xs text-blue-600 mt-2 font-medium">
                          Quality: {compressionQuality}% | Max: 1920x1080px
                        </span>
                      </label>
                    </div>

                    {/* Compression Stats Display */}
                    {showCompressionStats && compressionStats.length > 0 && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-green-800">
                            Compression Results
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowCompressionStats(false)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {compressionStats.map((stat, index) => (
                            <div key={index} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                              <span className="text-gray-600">Image {index + 1}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-gray-500">
                                  {formatFileSize(stat.originalSize)} → {formatFileSize(stat.compressedSize)}
                                </span>
                                <span className="font-semibold text-green-600">
                                  {stat.compressionRatio}% smaller
                                </span>
                              </div>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="flex justify-between items-center text-sm font-semibold">
                              <span className="text-green-800">Total Saved:</span>
                              <span className="text-green-600">
                                {formatFileSize(
                                  compressionStats.reduce((acc, stat) => acc + (stat.originalSize - stat.compressedSize), 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Add Image URL */}
                {imageUploadMethod === 'url' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Image URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1 border rounded-md px-3 py-2"
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Image Preview Grid */}
                {banquetForm.images.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Uploaded Images ({banquetForm.images.length})
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                      {banquetForm.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.startsWith('/uploads/') ? `http://localhost:5000${image}` : image}
                            alt={`Banquet ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(image, index)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Tour URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">Video Tour URL</label>
                  <input
                    type="url"
                    value={banquetForm.videoTour}
                    onChange={(e) => handleInputChange('videoTour', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              {/* Availability & Status */}
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
