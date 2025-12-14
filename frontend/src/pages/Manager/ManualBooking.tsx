import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, FileText, CheckCircle, AlertCircle, Plus, Search, User, Phone, Mail, Home } from 'lucide-react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  title: string;
  price: number;
  discount?: number;
  maxGuests: number;
  isAvailable: boolean;
  images: string[];
}

const ManualBooking: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  const [bookingData, setBookingData] = useState({
    // Customer Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    idProofType: 'aadhaar',
    idProofNumber: '',
    
    // Booking Details
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: 'any',
    
    // Payment Details
    totalAmount: 0,
    advanceAmount: 0,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    transactionId: '',
    
    // Additional Details
    specialRequests: '',
    managerNotes: '',
    bookingSource: 'walk-in'
  });

  useEffect(() => {
    // Check if user is logged in as manager
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast.error('Please login to access this page');
      navigate('/manager/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'manager' && userData.role !== 'admin') {
      toast.error('Access denied. Manager privileges required.');
      navigate('/');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedRoom && bookingData.checkIn && bookingData.checkOut) {
      calculateAmount();
    }
  }, [selectedRoom, bookingData.checkIn, bookingData.checkOut, bookingData.guests]);

  const calculateAmount = () => {
    if (!selectedRoom || !bookingData.checkIn || !bookingData.checkOut) return;

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    const roomPrice = selectedRoom.discount 
      ? selectedRoom.price - (selectedRoom.price * selectedRoom.discount / 100)
      : selectedRoom.price;

    const totalAmount = roomPrice * nights;
    const advanceAmount = totalAmount * 0.3; // 30% advance

    setBookingData(prev => ({
      ...prev,
      totalAmount,
      advanceAmount
    }));
  };

  const checkAvailability = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    
    if (checkOut <= checkIn) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    try {
      setCheckingAvailability(true);
      const response = await axios.get('/rooms/available', {
        params: {
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guests: bookingData.guests,
          type: bookingData.roomType !== 'any' ? bookingData.roomType : undefined
        }
      });

      setAvailableRooms(response.data.rooms || []);
      
      if (response.data.rooms.length === 0) {
        toast.error('No rooms available for selected dates');
      } else {
        toast.success(`${response.data.rooms.length} room(s) available`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoom) {
      toast.error('Please select a room');
      return;
    }

    // Validation
    if (!bookingData.firstName || !bookingData.lastName) {
      toast.error('Customer name is required');
      return;
    }

    if (!bookingData.phone || bookingData.phone.length < 10) {
      toast.error('Valid phone number is required');
      return;
    }

    if (!bookingData.email) {
      toast.error('Email is required');
      return;
    }

    if (!bookingData.idProofNumber) {
      toast.error('ID proof number is required');
      return;
    }

    try {
      setLoading(true);

      const bookingPayload = {
        // Customer details
        customerName: `${bookingData.firstName} ${bookingData.lastName}`,
        customerEmail: bookingData.email,
        customerPhone: bookingData.phone,
        customerAddress: {
          street: bookingData.address,
          city: bookingData.city,
          state: bookingData.state,
          country: bookingData.country,
          pincode: bookingData.pincode
        },
        idProof: {
          type: bookingData.idProofType,
          number: bookingData.idProofNumber
        },
        
        // Booking details
        roomId: selectedRoom._id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        
        // Payment details
        totalAmount: bookingData.totalAmount,
        advanceAmount: bookingData.advanceAmount,
        paymentMethod: bookingData.paymentMethod,
        paymentStatus: bookingData.paymentStatus,
        transactionId: bookingData.transactionId || undefined,
        
        // Additional details
        specialRequests: bookingData.specialRequests,
        managerNotes: bookingData.managerNotes,
        bookingSource: bookingData.bookingSource,
        isManualBooking: true
      };

      const response = await axios.post('/manager/bookings/manual', bookingPayload);

      toast.success('Booking created successfully!');
      
      // Navigate to booking details or bookings list
      navigate(`/manager/bookings/${response.data.booking._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manual Booking</h1>
              <p className="text-gray-600 mt-2">Create booking for walk-in customers or phone bookings</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">Offline Booking Entry</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={bookingData.firstName}
                  onChange={(e) => setBookingData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={bookingData.lastName}
                  onChange={(e) => setBookingData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={bookingData.email}
                    onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={bookingData.phone}
                    onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={bookingData.address}
                    onChange={(e) => setBookingData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={bookingData.city}
                  onChange={(e) => setBookingData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={bookingData.state}
                  onChange={(e) => setBookingData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Type *
                </label>
                <select
                  required
                  value={bookingData.idProofType}
                  onChange={(e) => setBookingData(prev => ({ ...prev, idProofType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving-license">Driving License</option>
                  <option value="voter-id">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Number *
                </label>
                <input
                  type="text"
                  required
                  value={bookingData.idProofNumber}
                  onChange={(e) => setBookingData(prev => ({ ...prev, idProofNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="ID Number"
                />
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingData.checkIn}
                  onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  required
                  min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                  value={bookingData.checkOut}
                  onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={bookingData.guests}
                  onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type Preference
              </label>
              <select
                value={bookingData.roomType}
                onChange={(e) => setBookingData(prev => ({ ...prev, roomType: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="any">Any Available</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="family">Family</option>
                <option value="presidential">Presidential</option>
              </select>
            </div>

            <button
              type="button"
              onClick={checkAvailability}
              disabled={checkingAvailability || !bookingData.checkIn || !bookingData.checkOut}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
            >
              {checkingAvailability ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Checking Availability...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Check Available Rooms
                </>
              )}
            </button>

            {/* Available Rooms */}
            {availableRooms.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Rooms ({availableRooms.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.map((room) => (
                    <div
                      key={room._id}
                      onClick={() => setSelectedRoom(room)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedRoom?._id === room._id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Room {room.roomNumber}</h4>
                          <p className="text-sm text-gray-600 capitalize">{room.type} - {room.title}</p>
                          <p className="text-sm text-gray-500 mt-1">Max {room.maxGuests} guests</p>
                          <p className="text-lg font-bold text-indigo-600 mt-2">
                            ₹{room.discount ? room.price - (room.price * room.discount / 100) : room.price}/night
                          </p>
                          {room.discount && (
                            <p className="text-sm text-green-600">{room.discount}% off</p>
                          )}
                        </div>
                        {selectedRoom?._id === room._id && (
                          <CheckCircle className="h-6 w-6 text-indigo-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          {selectedRoom && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{bookingData.totalAmount.toFixed(2)}</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-indigo-600 mb-1">Advance Required (30%)</p>
                  <p className="text-2xl font-bold text-indigo-900">₹{bookingData.advanceAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={bookingData.paymentMethod}
                    onChange={(e) => setBookingData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status *
                  </label>
                  <select
                    required
                    value={bookingData.paymentStatus}
                    onChange={(e) => setBookingData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial (Advance Paid)</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>

                {bookingData.paymentMethod !== 'cash' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID / Reference Number
                    </label>
                    <input
                      type="text"
                      value={bookingData.transactionId}
                      onChange={(e) => setBookingData(prev => ({ ...prev, transactionId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Transaction/Reference ID"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Source *
                </label>
                <select
                  required
                  value={bookingData.bookingSource}
                  onChange={(e) => setBookingData(prev => ({ ...prev, bookingSource: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="walk-in">Walk-in</option>
                  <option value="phone">Phone Booking</option>
                  <option value="email">Email Inquiry</option>
                  <option value="referral">Referral</option>
                  <option value="agent">Travel Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Customer)
                </label>
                <textarea
                  rows={3}
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any special requests from customer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Notes (Internal)
                </label>
                <textarea
                  rows={3}
                  value={bookingData.managerNotes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, managerNotes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Internal notes for staff reference..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-yellow-700 bg-yellow-50 px-4 py-3 rounded-lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  Please verify all details before creating the booking
                </span>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/manager/dashboard')}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedRoom}
                  className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualBooking;
