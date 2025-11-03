import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Room {
  _id: string;
  roomNumber: string;
  roomName?: string;
  type: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  maxGuests: number;
  bedCount: number;
  bedType: string;
  roomSize: string;
  viewType: string;
  floor: number;
  isAvailable: boolean;
  status: string;
  images: string[];
  facilities: any;
  createdBy?: string;
  createdAt: string;
}

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const [formData, setFormData] = useState({
    // Basic Information
    roomNumber: '',
    roomName: '',
    type: 'single',
    title: '',
    description: '',
    
    // Pricing & Capacity
    price: '',
    discount: '',
    discountType: 'percentage',
    maxGuests: '',
    bedCount: '',
    bedType: 'king',
    
    // Room Details
    roomSize: '',
    viewType: 'city',
    floor: '',
    
    // Status
    isAvailable: true,
    status: 'active',
    availableFrom: '',
    
    // Media
    images: [''],
    videoTour: '',
    
    // Facilities
    facilities: {
      ac: false,
      geyser: false,
      wifi: false,
      tv: false,
      roomService: false,
      powerBackup: false,
      laundryService: false,
      parking: false,
      attachedBathroom: false,
      balcony: false,
      miniFridge: false,
      breakfast: false,
      cctvSecurity: false,
      elevatorAccess: false
    }
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/rooms?limit=100');
      setRooms(response.data.rooms || []);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const roomData = {
        ...formData,
        price: parseFloat(formData.price),
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        maxGuests: parseInt(formData.maxGuests),
        bedCount: parseInt(formData.bedCount),
        floor: parseInt(formData.floor),
        amenities: Object.entries(formData.facilities)
          .filter(([key, value]) => value)
          .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
      };

      if (editingRoom) {
        await axios.put(`/api/rooms/${editingRoom._id}`, roomData);
        toast.success('Room updated successfully');
      } else {
        await axios.post('/api/rooms', roomData);
        toast.success('Room created successfully');
      }
      
      fetchRooms();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save room');
    }
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      roomName: '',
      type: 'single',
      title: '',
      description: '',
      price: '',
      discount: '',
      discountType: 'percentage',
      maxGuests: '',
      bedCount: '',
      bedType: 'king',
      roomSize: '',
      viewType: 'city',
      floor: '',
      isAvailable: true,
      status: 'active',
      availableFrom: '',
      images: [''],
      videoTour: '',
      facilities: {
        ac: false,
        geyser: false,
        wifi: false,
        tv: false,
        roomService: false,
        powerBackup: false,
        laundryService: false,
        parking: false,
        attachedBathroom: false,
        balcony: false,
        miniFridge: false,
        breakfast: false,
        cctvSecurity: false,
        elevatorAccess: false
      }
    });
    setShowAddForm(false);
    setEditingRoom(null);
  };

  const handleEdit = (room: Room) => {
    setFormData({
      roomNumber: room.roomNumber,
      roomName: room.roomName || '',
      type: room.type,
      title: room.title,
      description: room.description,
      price: room.price.toString(),
      discount: room.discount?.toString() || '',
      discountType: 'percentage',
      maxGuests: room.maxGuests.toString(),
      bedCount: room.bedCount.toString(),
      bedType: room.bedType,
      roomSize: room.roomSize,
      viewType: room.viewType,
      floor: room.floor.toString(),
      isAvailable: room.isAvailable,
      status: room.status,
      availableFrom: '',
      images: room.images.length > 0 ? room.images : [''],
      videoTour: '',
      facilities: room.facilities || {
        ac: false,
        geyser: false,
        wifi: false,
        tv: false,
        roomService: false,
        powerBackup: false,
        laundryService: false,
        parking: false,
        attachedBathroom: false,
        balcony: false,
        miniFridge: false,
        breakfast: false,
        cctvSecurity: false,
        elevatorAccess: false
      }
    });
    setEditingRoom(room);
    setShowAddForm(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await axios.delete(`/api/rooms/${roomId}`);
      toast.success('Room deleted successfully');
      fetchRooms();
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImageField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
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
        <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Room
        </button>
      </div>

      {/* Add/Edit Room Form */}
      {showAddForm && (
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {editingRoom ? 'Edit Room' : 'Add New Room'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 101"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={formData.roomName}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Presidential Suite"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="family">Family</option>
                  <option value="presidential">Presidential</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title / Short Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Luxury Sea View Suite"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Size *
                </label>
                <input
                  type="text"
                  required
                  value={formData.roomSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomSize: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 400 sq. ft"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full details about the room..."
              />
            </div>

            {/* Pricing & Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Night *
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Guests *
                </label>
                <input
                  type="number"
                  required
                  value={formData.maxGuests}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor *
                </label>
                <input
                  type="number"
                  required
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bed Count *
                </label>
                <input
                  type="number"
                  required
                  value={formData.bedCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedCount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bed Type *
                </label>
                <select
                  required
                  value={formData.bedType}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="king">King</option>
                  <option value="queen">Queen</option>
                  <option value="twin">Twin</option>
                  <option value="single">Single</option>
                  <option value="sofa">Sofa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Type *
                </label>
                <select
                  required
                  value={formData.viewType}
                  onChange={(e) => setFormData(prev => ({ ...prev, viewType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sea">Sea View</option>
                  <option value="garden">Garden View</option>
                  <option value="city">City View</option>
                  <option value="mountain">Mountain View</option>
                  <option value="pool">Pool View</option>
                  <option value="courtyard">Courtyard View</option>
                </select>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Facilities & Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(formData.facilities).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        facilities: {
                          ...prev.facilities,
                          [key]: e.target.checked
                        }
                      }))}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Room Images
              </label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => updateImageField(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Image URL"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm"
              >
                Add Image
              </button>
            </div>

            {/* Video Tour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Tour (optional)
              </label>
              <input
                type="url"
                value={formData.videoTour}
                onChange={(e) => setFormData(prev => ({ ...prev, videoTour: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="YouTube or video URL"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="hidden">Hidden</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From
                </label>
                <input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableFrom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Currently Available</label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                {editingRoom ? 'Update Room' : 'Create Room'}
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

      {/* Rooms List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600 mb-4">Add your first room to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Add New Room
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
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
                {rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Room {room.roomNumber}
                        </div>
                        <div className="text-sm text-gray-500">{room.title}</div>
                        <div className="text-xs text-gray-400">Floor {room.floor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {room.type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {room.bedCount} {room.bedType} bed{room.bedCount > 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500">{room.roomSize}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{room.price}/night
                      </div>
                      {room.discount && room.discount > 0 && (
                        <div className="text-sm text-green-600">
                          {room.discount}% off
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {room.maxGuests} guests
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        room.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : room.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {room.status}
                      </span>
                      <div className="mt-1">
                        {room.isAvailable ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(room)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(room._id)}
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
        )}
      </div>
    </div>
  );
};

export default RoomManagement;
