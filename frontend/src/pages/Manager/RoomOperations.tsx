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
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
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
                <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">
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
                <button onClick={() => setShowMoveModal(false)} className="text-gray-400 hover:text-gray-600">
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
      </div>
    </div>
  );
};

export default RoomOperations;
