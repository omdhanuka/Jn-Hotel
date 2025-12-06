import React, { useState } from 'react';
import { Search, User, Mail, Phone, Calendar, Users, DollarSign, Upload } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  bookingId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  type: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  paymentStatus: string;
  resourceId?: any;
}

interface CheckInTabProps {
  onSuccess?: () => void;
}

const CheckInTab: React.FC<CheckInTabProps> = ({ onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [checkInData, setCheckInData] = useState({
    numberOfGuests: '',
    paymentStatus: 'pending',
    paymentMode: 'cash',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get(`/manager/booking/search?query=${searchQuery}`);
      
      if (response.data.bookings && response.data.bookings.length > 0) {
        const foundBooking = response.data.bookings[0];
        setBooking(foundBooking);
        
        // Fetch available rooms if not assigned
        if (!foundBooking.resourceId) {
          await fetchAvailableRooms(foundBooking);
        }
        
        setCheckInData(prev => ({
          ...prev,
          numberOfGuests: foundBooking.guests.toString()
        }));
      } else {
        toast.error('No booking found');
        setBooking(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Search failed');
      setBooking(null);
    } finally {
      setSearching(false);
    }
  };

  const fetchAvailableRooms = async (booking: Booking) => {
    try {
      const response = await axios.get('/manager/rooms/available', {
        params: {
          type: booking.type === 'room' ? 'all' : booking.type,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut
        }
      });
      setAvailableRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedRoom || !booking) return;

    try {
      await axios.patch('/manager/booking/assign-room', {
        bookingId: booking._id,
        roomId: selectedRoom
      });
      toast.success('Room assigned successfully');
      
      // Refresh booking data
      setBooking(prev => prev ? { ...prev, resourceId: selectedRoom } : null);
      setSelectedRoom('');
      setAvailableRooms([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign room');
    }
  };

  const handleCompleteCheckIn = async () => {
    if (!booking) return;

    if (!booking.resourceId) {
      toast.error('Please assign a room first');
      return;
    }

    try {
      setProcessing(true);
      await axios.post('/manager/booking/checkin', {
        bookingId: booking._id,
        numberOfGuests: parseInt(checkInData.numberOfGuests),
        notes: checkInData.notes,
        paymentStatus: checkInData.paymentStatus,
        paymentMode: checkInData.paymentMode
      });
      
      toast.success('Check-in completed successfully!');
      
      // Call onSuccess callback to refresh activity list
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setBooking(null);
      setSearchQuery('');
      setCheckInData({
        numberOfGuests: '',
        paymentStatus: 'pending',
        paymentMode: 'cash',
        notes: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Search Booking</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Booking ID, Phone, or Guest Name..."
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Booking Details */}
      {booking && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Booking ID</p>
                <p className="font-medium">#{booking._id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Guest Name</p>
                <p className="font-medium">{booking.user.firstName} {booking.user.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-1 text-gray-400" />
                  {booking.user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                  {booking.user.phone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-out</p>
                <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Guests</p>
                <p className="font-medium">{booking.guests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium">₹{booking.totalAmount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Room Assignment */}
          {!booking.resourceId && availableRooms.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Assign Room</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRooms.map((room) => (
                  <div
                    key={room._id}
                    onClick={() => setSelectedRoom(room._id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      selectedRoom === room._id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-semibold">Room {room.roomNumber}</p>
                    <p className="text-sm text-gray-600 capitalize">{room.type}</p>
                    <p className="text-sm text-gray-600">Floor {room.floor}</p>
                    <p className="text-sm font-medium mt-2">₹{room.price}/night</p>
                  </div>
                ))}
              </div>
              {selectedRoom && (
                <button
                  onClick={handleAssignRoom}
                  className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                >
                  Assign Selected Room
                </button>
              )}
            </div>
          )}

          {/* Check-in Form */}
          {booking.resourceId && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Complete Check-In</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    value={checkInData.numberOfGuests}
                    onChange={(e) => setCheckInData(prev => ({ ...prev, numberOfGuests: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={checkInData.paymentStatus}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={checkInData.paymentMode}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, paymentMode: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={checkInData.notes}
                    onChange={(e) => setCheckInData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Any special requests or notes..."
                  />
                </div>

                <button
                  onClick={handleCompleteCheckIn}
                  disabled={processing}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {processing ? 'Processing...' : '✓ Complete Check-In'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CheckInTab;
