import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, Wifi, Tv, Coffee, Crown, Wind, Shield, CreditCard, Check, Home, Maximize, MinusCircle, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

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
  facilities?: any;
  amenities: string[];
  rating?: number;
}

interface BookingForm {
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  specialRequests: string;
}

const BookRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    specialRequests: ''
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to book a room');
      navigate('/login');
      return;
    }
    
    // Pre-fill dates from URL parameters
    const urlCheckIn = searchParams.get('checkIn');
    const urlCheckOut = searchParams.get('checkOut');
    const urlGuests = searchParams.get('guests');
    
    if (urlCheckIn) {
      setBookingForm(prev => ({ ...prev, checkIn: urlCheckIn }));
    }
    if (urlCheckOut) {
      setBookingForm(prev => ({ ...prev, checkOut: urlCheckOut }));
    }
    if (urlGuests) {
      setBookingForm(prev => ({ ...prev, guests: parseInt(urlGuests) }));
    }
    
    fetchRoom();
  }, [roomId, user, navigate, searchParams]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`/rooms/${roomId}`);
      setRoom(response.data);
    } catch (error) {
      toast.error('Room not found');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const calculateRoomRate = () => {
    if (!room) return 0;
    return room.price * calculateNights() * bookingForm.rooms;
  };

  const calculateTaxes = () => {
    return calculateRoomRate() * 0.18; // 18% tax
  };

  const calculateTotal = () => {
    return calculateRoomRate() + calculateTaxes();
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!bookingForm.checkIn || !bookingForm.checkOut) {
        toast.error('Please select check-in and check-out dates');
        return;
      }
      if (new Date(bookingForm.checkIn) >= new Date(bookingForm.checkOut)) {
        toast.error('Check-out date must be after check-in date');
        return;
      }
      if (bookingForm.rooms < 1) {
        toast.error('Please select at least one room');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBooking = async () => {
    setBookingLoading(true);
    try {
      const bookingData = {
        type: 'room',
        resourceId: roomId,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: bookingForm.guests,
        specialRequests: bookingForm.specialRequests,
        services: []
      };

      const response = await axios.post('/bookings', bookingData);
      toast.success('Booking confirmed successfully!');
      navigate('/dashboard', { state: { newBooking: response.data } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSrc = () => {
    if (imageError || !room?.images?.[0]) {
      return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80';
    }
    return room.images[0];
  };

  const getRoomTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'standard': 'Premier Room',
      'deluxe': 'Executive Room',
      'suite': 'Royal Suite',
      'presidential': 'Presidential Suite'
    };
    return typeMap[type.toLowerCase()] || type;
  };

  const amenitiesList = [
    { icon: Wifi, label: 'Complimentary Wi-Fi' },
    { icon: Tv, label: 'Flat Screen TV' },
    { icon: Wind, label: '24-Hour Room Service' },
    { icon: Coffee, label: 'Tea/Coffee Maker' },
    { icon: Shield, label: 'In-Room Safe' },
    { icon: Crown, label: 'Luxurious Bath Amenities' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
          <Crown className="h-6 w-6 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Room not found</h2>
          <button
            onClick={() => navigate('/rooms')}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-2 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80')`,
        }}
      >
        <div className="text-center text-white z-10 px-4">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 tracking-wide">
            BOOK YOUR STAY
          </h1>
          <p className="text-2xl md:text-3xl font-serif italic text-amber-200">
            Experience Royal Luxury
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            <span>/</span>
            <span className="hover:text-amber-600 cursor-pointer" onClick={() => navigate('/rooms')}>ROOMS & SUITES</span>
            <span>/</span>
            <span className="text-amber-600 font-medium">BOOKING</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 py-8 border-b-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 1 
                  ? 'bg-amber-500 text-white shadow-lg' 
                  : 'bg-white text-gray-400 border-2 border-gray-300'
              }`}>
                {currentStep > 1 ? <Check className="h-6 w-6" /> : '1'}
              </div>
              <span className="ml-3 font-semibold text-gray-700 uppercase tracking-wide">
                {currentStep === 1 && <span className="text-amber-600">✦ </span>}
                STEP 1 <span className="font-normal">SELECT YOUR ROOM</span>
              </span>
            </div>
            
            <span className="text-gray-400 font-bold">—</span>
            
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 2 
                  ? 'bg-amber-500 text-white shadow-lg' 
                  : 'bg-white text-gray-400 border-2 border-gray-300'
              }`}>
                {currentStep > 2 ? <Check className="h-6 w-6" /> : '2'}
              </div>
              <span className="ml-3 font-semibold text-gray-700 uppercase tracking-wide">
                {currentStep === 2 && <span className="text-amber-600">✦ </span>}
                STEP 2 <span className="font-normal">GUEST DETAILS</span>
              </span>
            </div>
            
            <span className="text-gray-400 font-bold">—</span>
            
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 3 
                  ? 'bg-amber-500 text-white shadow-lg' 
                  : 'bg-white text-gray-400 border-2 border-gray-300'
              }`}>
                3
              </div>
              <span className="ml-3 font-semibold text-gray-700 uppercase tracking-wide">
                {currentStep === 3 && <span className="text-amber-600">✦ </span>}
                STEP 3 <span className="font-normal">PAYMENT</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Room Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Room Card */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Room Image */}
                  <div className="relative h-64 md:h-auto">
                    <img
                      src={getImageSrc()}
                      alt={getRoomTypeName(room.type)}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </div>

                  {/* Room Info */}
                  <div className="p-6 bg-gradient-to-br from-white to-amber-50/30">
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                      {getRoomTypeName(room.type)}
                    </h2>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      {room.description || `Elegant room with a king size or twin bed, modern amenities, and sophisticated decor.`}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Maximize className="h-4 w-4 mr-2 text-amber-600" />
                        <span className="font-medium">ROOM SIZE: {room.roomSize || '350 SQ.FT.'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-amber-600" />
                        <span className="font-medium">UP TO {room.maxGuests} GUESTS</span>
                      </div>
                    </div>

                    {/* Amenity Icons */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center space-x-1 text-gray-600" title="Flat Screen TV">
                        <Tv className="h-5 w-5" />
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600" title="Coffee Maker">
                        <Coffee className="h-5 w-5" />
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600" title="Wi-Fi">
                        <Wifi className="h-5 w-5" />
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600" title="24-Hour Service">
                        <Wind className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <div>
                        <div className="text-3xl font-bold text-amber-600">₹ {room.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">per night</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details Form */}
              {currentStep === 1 && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-8">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-amber-600" />
                    BOOKING DETAILS
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 mr-1 text-amber-600" />
                        Check-In
                      </label>
                      <input
                        type="date"
                        value={bookingForm.checkIn}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {bookingForm.checkIn ? new Date(bookingForm.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 mr-1 text-amber-600" />
                        Check-Out
                      </label>
                      <input
                        type="date"
                        value={bookingForm.checkOut}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                        min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {bookingForm.checkOut ? new Date(bookingForm.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Users className="h-4 w-4 mr-1 text-amber-600" />
                        Guests
                      </label>
                      <select
                        value={bookingForm.guests}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="1">1 Adult, 0 Child</option>
                        <option value="2">2 Adults, 0 Child</option>
                        <option value="3">2 Adults, 1 Child</option>
                        <option value="4">2 Adults, 2 Children</option>
                      </select>
                    </div>
                  </div>

                  {calculateNights() > 0 && (
                    <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">{calculateNights()}</span> night{calculateNights() > 1 ? 's' : ''} selected
                        {bookingForm.checkIn && bookingForm.checkOut && (
                          <span className="ml-2 text-gray-600">
                            ({new Date(bookingForm.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(bookingForm.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Guest Details Form */}
              {currentStep === 2 && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-8">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                    GUEST DETAILS
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={bookingForm.specialRequests}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                        rows={4}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Any special requests or preferences (e.g., high floor, quiet room, early check-in)..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Confirmation */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-8">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                    CONFIRM YOUR BOOKING
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-700">Room Type</span>
                      <span className="font-semibold">{getRoomTypeName(room.type)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-700">Check-In</span>
                      <span className="font-semibold">{new Date(bookingForm.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-700">Check-Out</span>
                      <span className="font-semibold">{new Date(bookingForm.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-700">Guests</span>
                      <span className="font-semibold">{bookingForm.guests}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-gray-700">Nights</span>
                      <span className="font-semibold">{calculateNights()}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Cancellation Policy:</strong>
                    </p>
                    <p className="text-xs text-gray-600">
                      Free cancellation up to 24 hours before check-in. No refund for cancellations within 24 hours.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 overflow-hidden sticky top-6">
                {/* Room Selection */}
                <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-6">
                  <h3 className="text-xl font-serif font-bold text-white mb-4">
                    {getRoomTypeName(room.type)}
                  </h3>
                  <div className="flex items-center justify-between bg-white/20 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-white text-sm font-medium">Space</span>
                      <div className="flex items-center space-x-2 bg-white rounded px-2 py-1">
                        <button 
                          onClick={() => setBookingForm(prev => ({ ...prev, rooms: Math.max(1, prev.rooms - 1) }))}
                          className="text-gray-600 hover:text-amber-600 transition-colors"
                        >
                          <MinusCircle className="h-5 w-5" />
                        </button>
                        <span className="text-gray-900 font-semibold w-8 text-center">{bookingForm.rooms}</span>
                        <button 
                          onClick={() => setBookingForm(prev => ({ ...prev, rooms: prev.rooms + 1 }))}
                          className="text-gray-600 hover:text-amber-600 transition-colors"
                        >
                          <PlusCircle className="h-5 w-5" />
                        </button>
                      </div>
                      <span className="text-white text-sm font-medium">Room{bookingForm.rooms > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Check-In</div>
                      <div className="text-xs text-gray-500">
                        {bookingForm.checkIn ? new Date(bookingForm.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-700">Check-Out</div>
                      <div className="text-xs text-gray-500">
                        {bookingForm.checkOut ? new Date(bookingForm.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Guests</span>
                      <span className="font-medium">{bookingForm.guests}</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{getRoomTypeName(room.type)}</div>
                        <div className="text-xs text-gray-500">Room {bookingForm.rooms}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">₹ {room.price.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span>Room Rate</span>
                      <span className="font-medium">₹ {calculateRoomRate().toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span>Taxes & Fees</span>
                      <span className="font-medium">₹ {calculateTaxes().toLocaleString()}</span>
                    </div>

                    <div className="border-t-2 border-amber-200 pt-3 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-amber-600">₹ {calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 space-y-3">
                    {currentStep < 3 ? (
                      <>
                        {currentStep > 1 && (
                          <button
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-all uppercase tracking-wide"
                          >
                            Back
                          </button>
                        )}
                        <button
                          onClick={handleNextStep}
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold py-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl uppercase tracking-wide"
                        >
                          {currentStep === 1 ? 'SELECT ROOM' : 'NEXT: GUEST DETAILS'} →
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-all uppercase tracking-wide"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleBooking}
                          disabled={bookingLoading}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-wide"
                        >
                          {bookingLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <CreditCard className="h-5 w-5 mr-2" />
                              CONFIRM BOOKING
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Amenities Section */}
          <div className="mt-12 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-12 border-2 border-amber-200">
            <h3 className="text-3xl font-serif font-bold text-center text-gray-900 mb-8">
              ROOM AMENITIES
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {amenitiesList.map((amenity, index) => (
                <div key={index} className="flex flex-col items-center text-center group">
                  <div className="bg-white p-4 rounded-full shadow-md mb-3 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <amenity.icon className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{amenity.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">Daily Housekeeping • Luxurious Bath Amenities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRoom;
