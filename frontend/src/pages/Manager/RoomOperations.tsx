import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, BedDouble, X, User, Mail, Phone, Calendar, Users as UsersIcon, DollarSign, FileText, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import axios from '../../utils/axios'; // Update import
import toast from 'react-hot-toast';
import RoomCard from '../../components/Manager/RoomCard';
import RoomFilters from '../../components/Manager/RoomFilters';
import RoomStatusBadge from '../../components/Manager/RoomStatusBadge';

// ...existing interfaces...

const RoomOperations: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    floor: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0
  });

  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedNewRoom, setSelectedNewRoom] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [movingGuest, setMovingGuest] = useState(false);

  // Manual booking states
  const [manualBookingForm, setManualBookingForm] = useState({
    roomId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
    paymentMethod: 'cash',
    advanceAmount: 0
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [availableRoomsForBooking, setAvailableRoomsForBooking] = useState<any[]>([]);

  useEffect(() => {
    fetchRooms();
  }, [filters]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.floor) params.append('floor', filters.floor);

      const response = await axios.get(`/manager/rooms?${params.toString()}`);
      
      setRooms(response.data.rooms || []);
      
      // Calculate stats
      const roomList = response.data.rooms || [];
      setStats({
        total: roomList.length,
        available: roomList.filter((r: any) => !r.isBooked && r.status === 'active').length,
        occupied: roomList.filter((r: any) => r.isBooked).length,
        cleaning: roomList.filter((r: any) => r.status === 'cleaning').length,
        maintenance: roomList.filter((r: any) => r.status === 'maintenance').length
      });
    } catch (error: any) {
      console.error('Failed to fetch rooms:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/manager/login');
      } else {
        toast.error('Failed to fetch rooms');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRooms();
    toast.success('Rooms refreshed');
  };

  const handleViewDetails = async (room: any) => {
    try {
      const response = await axios.get(`/manager/rooms/${room._id}`);
      setSelectedRoom(response.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to fetch room details');
    }
  };

  const handleCompleteTask = async (roomId: string) => {
    try {
      await axios.patch(`/manager/rooms/${roomId}/complete`);
      toast.success('Task completed successfully');
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleReleaseRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to checkout the guest from this room?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/manager/rooms/${roomId}/release`); // Changed from patch to post
      toast.success('Guest checked out successfully. Room marked for cleaning.');
      fetchRooms();
    } catch (error: any) {
      console.error('Release room error:', error);
      toast.error(error.response?.data?.message || 'Failed to release room');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveGuest = (room: any) => {
    setSelectedRoom(room);
    setShowMoveModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRoom || !newStatus) return;

    try {
      setUpdatingStatus(true);
      await axios.patch(`/manager/rooms/${selectedRoom._id}/status`, { 
        status: newStatus 
      });
      toast.success('Room status updated successfully');
      setShowStatusModal(false);
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMoveGuestSubmit = async () => {
    if (!selectedRoom || !selectedNewRoom || !moveReason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setMovingGuest(true);
      await axios.patch(`/manager/rooms/${selectedRoom._id}/move-guest`, {
        newRoomId: selectedNewRoom,
        reason: moveReason
      });
      toast.success('Guest moved successfully');
      setShowMoveModal(false);
      setMoveReason('');
      setSelectedNewRoom('');
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to move guest');
    } finally {
      setMovingGuest(false);
    }
  };

  const fetchAvailableRooms = async () => {
    if (!selectedRoom) return;
    
    try {
      const response = await axios.get('/manager/rooms/available/for-move', {
        params: {
          roomType: selectedRoom.type,
          minGuests: selectedRoom.maxGuests
        }
      });
      setAvailableRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
    }
  };

  useEffect(() => {
    if (showMoveModal && selectedRoom) {
      fetchAvailableRooms();
    }
  }, [showMoveModal, selectedRoom]);

  const handleOpenManualBooking = () => {
    // Get available rooms for booking
    const available = rooms.filter(r => !r.isBooked && r.status === 'active');
    setAvailableRoomsForBooking(available);
    setShowManualBookingModal(true);
  };

  const handleManualBookingSubmit = async () => {
    // Validate form
    if (!manualBookingForm.roomId || !manualBookingForm.firstName || !manualBookingForm.lastName || 
        !manualBookingForm.phone || !manualBookingForm.checkIn || !manualBookingForm.checkOut) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate phone number
    if (!/^\d{10}$/.test(manualBookingForm.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate dates
    const checkIn = new Date(manualBookingForm.checkIn);
    const checkOut = new Date(manualBookingForm.checkOut);
    if (checkIn >= checkOut) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    try {
      setSubmittingBooking(true);
      const response = await axios.post('/manager/rooms/manual-booking', {
        roomId: manualBookingForm.roomId,
        customerDetails: {
          firstName: manualBookingForm.firstName,
          lastName: manualBookingForm.lastName,
          email: manualBookingForm.email,
          phone: manualBookingForm.phone
        },
        checkIn: manualBookingForm.checkIn,
        checkOut: manualBookingForm.checkOut,
        guests: manualBookingForm.guests,
        specialRequests: manualBookingForm.specialRequests,
        paymentMethod: manualBookingForm.paymentMethod,
        advanceAmount: manualBookingForm.advanceAmount
      });

      toast.success('Manual booking created successfully!');
      setShowManualBookingModal(false);
      
      // Reset form
      setManualBookingForm({
        roomId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: 1,
        specialRequests: '',
        paymentMethod: 'cash',
        advanceAmount: 0
      });

      // Refresh rooms
      fetchRooms();
    } catch (error: any) {
      console.error('Manual booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create manual booking');
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Room Operations</h1>
              <p className="text-gray-600 mt-2">Manage all hotel rooms and their current status</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleOpenManualBooking}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manual Booking
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <BedDouble className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <p className="text-sm font-medium text-green-600">Available</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.available}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
            <p className="text-sm font-medium text-red-600">Occupied</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats.occupied}</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <p className="text-sm font-medium text-yellow-600">Cleaning</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.cleaning}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <p className="text-sm font-medium text-blue-600">Maintenance</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.maintenance}</p>
          </div>
        </div>

        {/* Filters */}
        <RoomFilters
          filters={filters}
          onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
        />

        {/* Room Grid */}
        {rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BedDouble className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                onViewDetails={() => handleViewDetails(room)}
                onUpdateStatus={() => {
                  setSelectedRoom(room);
                  setShowStatusModal(true);
                }}
                onMoveGuest={room.isBooked ? () => handleMoveGuest(room) : undefined}
                onCompleteTask={
                  (room.status === 'cleaning' || room.status === 'maintenance') 
                    ? () => handleCompleteTask(room._id) 
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Room Detail Modal */}
        {showDetailModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold">Room {selectedRoom.room?.roomNumber || 'Details'}</h2>
                  <p className="text-gray-600">Complete room information</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Room Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Room Status</p>
                      <RoomStatusBadge status={selectedRoom.room?.status} isBooked={selectedRoom.room?.isBooked} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Room Type</p>
                      <p className="font-medium capitalize">{selectedRoom.room?.type}</p>
                    </div>
                  </div>
                </div>

                {/* Current Guest Info */}
                {selectedRoom.currentBooking && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-indigo-600" />
                      Current Guest
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Guest Name</div>
                        <div className="font-medium">{selectedRoom.currentBooking.guestName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Check-out Date</div>
                        <div className="font-medium">
                          {new Date(selectedRoom.currentBooking.checkOut).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Room Details */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Room Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Floor</div>
                      <div className="font-medium">Floor {selectedRoom.room?.floor}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Max Guests</div>
                      <div className="font-medium">{selectedRoom.room?.maxGuests} guests</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Price</div>
                      <div className="font-medium">₹{selectedRoom.room?.price}/night</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Room Size</div>
                      <div className="font-medium">{selectedRoom.room?.roomSize}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedRoom.room?.isBooked && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReleaseRoom(selectedRoom.room._id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                    >
                      Checkout Guest
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleMoveGuest(selectedRoom.room);
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                    >
                      Move Guest
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 border rounded-md hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex justify-between items-start p-6 border-b">
                <h2 className="text-xl font-bold">Update Room Status</h2>
                <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Room: {selectedRoom.roomNumber}</p>
                  <p className="text-sm text-gray-600">Current Status: <RoomStatusBadge status={selectedRoom.status} isBooked={selectedRoom.isBooked} /></p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select status...</option>
                    <option value="active">Active / Available</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    disabled={updatingStatus}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus || !newStatus}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Move Guest Modal */}
        {showMoveModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold">Move Guest to Another Room</h2>
                  <p className="text-sm text-gray-600">Current Room: {selectedRoom.roomNumber}</p>
                </div>
                <button onClick={() => setShowMoveModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {selectedRoom.currentGuest && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Current Guest</h4>
                    <p className="text-sm text-blue-800">{selectedRoom.currentGuest.name}</p>
                    <p className="text-xs text-blue-700">Booking: #{selectedRoom.currentGuest.bookingId}</p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Room
                  </label>
                  <select
                    value={selectedNewRoom}
                    onChange={(e) => setSelectedNewRoom(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose a room...</option>
                    {availableRooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        Room {room.roomNumber} - {room.type} (Floor {room.floor}) - ₹{room.price}/night
                      </option>
                    ))}
                  </select>
                  {availableRooms.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No available rooms of similar type found</p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Moving
                  </label>
                  <textarea
                    value={moveReason}
                    onChange={(e) => setMoveReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Room maintenance required, Guest request, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    disabled={movingGuest}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMoveGuestSubmit}
                    disabled={movingGuest || !selectedNewRoom || !moveReason}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
                  >
                    {movingGuest ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Moving...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Move Guest
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Booking Modal */}
        {showManualBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start p-6 border-b bg-indigo-50">
                <div>
                  <h2 className="text-2xl font-bold text-indigo-900 flex items-center">
                    <User className="h-6 w-6 mr-2" />
                    Manual Booking - Offline Guest
                  </h2>
                  <p className="text-sm text-indigo-700 mt-1">Enter customer details for walk-in booking</p>
                </div>
                <button onClick={() => setShowManualBookingModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <form className="space-y-6">
                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-indigo-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualBookingForm.firstName}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, firstName: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualBookingForm.lastName}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, lastName: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={manualBookingForm.phone}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="9876543210"
                          maxLength={10}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={manualBookingForm.email}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="john.doe@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                      Booking Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Room <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={manualBookingForm.roomId}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, roomId: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Choose an available room...</option>
                          {availableRoomsForBooking.map((room) => (
                            <option key={room._id} value={room._id}>
                              Room {room.roomNumber} - {room.type} (Floor {room.floor}) - ₹{room.price}/night - Max {room.maxGuests} guests
                            </option>
                          ))}
                        </select>
                        {availableRoomsForBooking.length === 0 && (
                          <p className="text-sm text-red-500 mt-1">No available rooms found</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check-in Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={manualBookingForm.checkIn}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, checkIn: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check-out Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={manualBookingForm.checkOut}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, checkOut: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min={manualBookingForm.checkIn || new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          Number of Guests <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={manualBookingForm.guests}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, guests: parseInt(e.target.value)})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Method
                        </label>
                        <select
                          value={manualBookingForm.paymentMethod}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, paymentMethod: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Advance Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={manualBookingForm.advanceAmount}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, advanceAmount: parseFloat(e.target.value)})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min="0"
                          placeholder="Enter advance amount paid"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          Special Requests (Optional)
                        </label>
                        <textarea
                          value={manualBookingForm.specialRequests}
                          onChange={(e) => setManualBookingForm({...manualBookingForm, specialRequests: e.target.value})}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Any special requirements or notes..."
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  <span className="text-red-500">*</span> Required fields
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowManualBookingModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                    disabled={submittingBooking}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualBookingSubmit}
                    disabled={submittingBooking || !manualBookingForm.roomId || !manualBookingForm.firstName || 
                             !manualBookingForm.lastName || !manualBookingForm.phone || !manualBookingForm.checkIn || 
                             !manualBookingForm.checkOut}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                  >
                    {submittingBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomOperations;
