import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Wifi, Car, Coffee, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  capacity: number;
  price: number;
  amenities: string[];
  images: string[];
  rating?: number;
  description: string;
  floor: number;
  isAvailable: boolean;
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
      
      // Ensure we're calling the right URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('Fetching rooms from:', `${apiUrl}/api/rooms`); // Debug log
      
      const response = await axios.get(`/api/rooms?${queryParams.toString()}`);
      
      // If no rooms found, try to seed some sample data
      if (!response.data.rooms || response.data.rooms.length === 0) {
        console.log('No rooms found, seeding sample data...');
        await seedSampleRooms();
        // Retry fetching after seeding
        const retryResponse = await axios.get(`/api/rooms?${queryParams.toString()}`);
        setRooms(retryResponse.data.rooms || []);
      } else {
        setRooms(response.data.rooms || []);
      }
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Unable to connect to server. Please make sure the backend is running on port 5000.');
      } else if (error.response?.status === 404) {
        toast.error('Rooms endpoint not found. Please check if the backend server is running.');
      } else {
        toast.error('Failed to fetch rooms');
      }
      setRooms([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const seedSampleRooms = async () => {
    try {
      console.log('Attempting to seed rooms...');
      const response = await axios.post('/api/rooms/seed');
      console.log('Seed response:', response.data);
      toast.success('Sample rooms have been created');
    } catch (error: any) {
      console.error('Error seeding rooms:', error);
      if (error.response?.status === 404) {
        toast.error('Seed endpoint not available. Please add sample rooms manually.');
      }
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
        guests: parseInt(filters.capacity) || 1,
        roomType: filters.type || undefined
      };

      const response = await axios.post('/api/rooms/availability', searchData);
      setRooms(response.data.availableRooms || []);
      
      if (response.data.availableRooms.length === 0) {
        toast('No rooms available for selected dates', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
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
    if (filters.capacity) params.append('guests', filters.capacity);
    
    return `/rooms/book/${roomId}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Rooms</h1>
          <p className="text-xl text-gray-600">Choose from our selection of comfortable and luxurious accommodations</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="presidential">Presidential</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <select
                value={filters.capacity}
                onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Capacity</option>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="6">6+ Guests</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={searchRooms}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Rooms'}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* No Rooms Found */}
        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-600">Try adjusting your search criteria or dates.</p>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && rooms.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div key={room._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-48 bg-gray-300 relative">
                  <img
                    src={room.images?.[0] || '/api/placeholder/400/300'}
                    alt={`Room ${room.roomNumber}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/400/300';
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-md">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{room.rating || 4.5}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 capitalize">
                      {room.type} Room {room.roomNumber}
                    </h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">${room.price}</div>
                      <div className="text-sm text-gray-500">per night</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{room.description}</p>
                  
                  <div className="flex items-center mb-4">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">Up to {room.capacity} guests</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities?.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {room.amenities?.length > 3 && (
                      <span className="text-blue-600 text-xs">+{room.amenities.length - 3} more</span>
                    )}
                  </div>
                  
                  <Link 
                    to={createBookingUrl(room._id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition block text-center font-medium"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
