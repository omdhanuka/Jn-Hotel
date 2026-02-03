import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Wifi, Tv, Coffee, Crown, Wind, Shield, ChevronRight, Home, Maximize, Eye } from 'lucide-react';
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
  facilities?: any;
  amenities?: string[];
  rating?: number;
}

const Rooms: React.FC = () => {
  const [filters, setFilters] = useState({
    type: '',
    priceRange: '',
    capacity: ''
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  // Set default dates (today and tomorrow)
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.capacity) queryParams.append('capacity', filters.capacity);
      
      const response = await axios.get(`/rooms?${queryParams.toString()}`);
      setRooms(response.data.rooms || []);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      
      if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 404) {
        toast.error('Rooms service not available');
      } else {
        toast.error('Failed to fetch rooms');
      }
      
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const searchRooms = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    try {
      setLoading(true);
      const searchData = {
        checkIn,
        checkOut,
        guests: parseInt(guests) || 2,
        roomType: filters.type || undefined
      };

      const response = await axios.post('/rooms/availability', searchData);
      setRooms(response.data.availableRooms || []);
      
      if (response.data.availableRooms.length === 0) {
        toast('No rooms available for selected dates', {
          icon: 'ℹ️',
          style: {
            background: '#d97706',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error('Failed to search rooms');
      console.error('Error searching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBookingUrl = (roomId: string) => {
    const params = new URLSearchParams();
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests);
    
    return `/rooms/book/${roomId}?${params.toString()}`;
  };

  // Handle image error
  const handleImageError = (roomId: string) => {
    setImageErrors(prev => ({ ...prev, [roomId]: true }));
  };

  // Get image source with fallback
  const getImageSrc = (room: Room) => {
    if (imageErrors[room._id] || !room.images?.[0]) {
      return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80';
    }
    return room.images[0];
  };

  // Get room type display name
  const getRoomTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'standard': 'Premier Room',
      'deluxe': 'Executive Room',
      'suite': 'Royal Suite',
      'presidential': 'Presidential Suite'
    };
    return typeMap[type.toLowerCase()] || type;
  };

  // Room amenities list for display
  const roomAmenities = [
    { icon: Wifi, label: 'Complimentary Wi-Fi' },
    { icon: Tv, label: 'Flat Screen TV' },
    { icon: Wind, label: '24-Hour Room Service' },
    { icon: Coffee, label: 'Tea/Coffee Maker' },
    { icon: Shield, label: 'In-Room Safe' },
    { icon: Crown, label: 'Luxurious Bath Amenities' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-[500px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80')`,
        }}
      >
        <div className="text-center text-white z-10 px-4">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 tracking-wide">
            ROOMS & SUITES
          </h1>
          <p className="text-2xl md:text-3xl font-serif italic text-amber-200">
            Experience Royal Comfort
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-amber-600 transition-colors flex items-center">
              <Home className="h-4 w-4 mr-1" />
              HOME
            </Link>
            <span>/</span>
            <span className="text-amber-600 font-medium">ROOMS & SUITES</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
              Experience Luxurious Accommodations
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              At Hotel JN Palace, our elegantly designed rooms and suites provide the perfect blend of luxury, comfort, and traditional charm. Explore our range of accommodations below.
            </p>
          </div>

          {/* Booking Widget */}
          <div className="bg-white rounded-xl shadow-2xl p-6 mb-12 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Check-in */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-amber-600" />
                  Check-In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Check-out */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-amber-600" />
                  Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-amber-600" />
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none bg-white cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="1">1 Adult</option>
                  <option value="2">2 Adults</option>
                  <option value="3">Upto 3 Guests</option>
                  <option value="4">Upto 4 Guests</option>
                </select>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none bg-white cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="">All Types</option>
                  <option value="standard">Premier Room</option>
                  <option value="deluxe">Executive Room</option>
                  <option value="suite">Royal Suite</option>
                  <option value="presidential">Presidential Suite</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button 
                  onClick={searchRooms}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-wide text-sm"
                >
                  {loading ? 'Searching...' : (
                    <>
                      Check Availability
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
                <Crown className="h-6 w-6 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* No Rooms Found */}
          {!loading && rooms.length === 0 && (
            <div className="text-center py-20">
              <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-2">No Rooms Available</h3>
              <p className="text-gray-600">Try adjusting your search criteria or select different dates.</p>
            </div>
          )}

          {/* Rooms Grid */}
          {!loading && rooms.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {rooms.map((room) => (
                <div key={room._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 group">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {/* Room Image */}
                    <div className="relative h-64 md:h-auto overflow-hidden">
                      <img
                        src={getImageSrc(room)}
                        alt={getRoomTypeName(room.type)}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        onError={() => handleImageError(room._id)}
                      />
                      <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                        {room.rating || '4.5'} ⭐
                      </div>
                    </div>

                    {/* Room Details */}
                    <div className="p-6 flex flex-col justify-between bg-gradient-to-br from-white to-amber-50/30">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                          {getRoomTypeName(room.type)}
                        </h3>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3 space-x-4">
                          <div className="flex items-center">
                            <Maximize className="h-4 w-4 mr-1 text-amber-600" />
                            <span className="font-medium">ROOM SIZE: {room.roomSize || '350 SQ.FT'}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-amber-600" />
                            <span className="font-medium">UP TO {room.maxGuests} GUESTS</span>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                          {room.description || `${getRoomTypeName(room.type)}s offer a king size bed or twin bed, modern amenities, and elegant decor.`}
                        </p>

                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Room size: {room.roomSize || '350 sq.ft'}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-end justify-between mb-4">
                          <div className="text-right">
                            <div className="text-3xl font-bold text-amber-600">₹{room.price}</div>
                            <div className="text-xs text-gray-500">per night</div>
                          </div>
                        </div>

                        <Link
                          to={createBookingUrl(room._id)}
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center uppercase tracking-wide text-sm group"
                        >
                          Read More
                          <ChevronRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Room Amenities Section */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-12 border-2 border-amber-200">
            <h3 className="text-3xl font-serif font-bold text-center text-gray-900 mb-8">
              ROOM AMENITIES
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {roomAmenities.map((amenity, index) => (
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

export default Rooms;
