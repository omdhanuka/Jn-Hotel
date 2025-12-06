import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, Star, Wifi, Car, Music, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
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
  images: string[];
  rating?: number;
}

const Banquets: React.FC = () => {
  const [banquets, setBanquets] = useState<Banquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    capacity: '',
    priceRange: ''
  });
  const [hoveredBanquetId, setHoveredBanquetId] = useState<string | null>(null);
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchBanquets();
  }, []);

  // Auto-rotate images on hover
  useEffect(() => {
    if (!hoveredBanquetId) return;

    const interval = setInterval(() => {
      setImageIndices(prev => {
        const banquet = banquets.find(b => b._id === hoveredBanquetId);
        if (!banquet || !banquet.images || banquet.images.length <= 1) return prev;

        const currentIndex = prev[hoveredBanquetId] || 0;
        const nextIndex = (currentIndex + 1) % banquet.images.length;

        return {
          ...prev,
          [hoveredBanquetId]: nextIndex
        };
      });
    }, 2000); // Change image every 2 seconds on hover

    return () => clearInterval(interval);
  }, [hoveredBanquetId, banquets]);

  const fetchBanquets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.capacity) queryParams.append('capacity', filters.capacity);
      
      console.log('Fetching banquets with params:', queryParams.toString()); // Debug log
      
      const response = await axios.get(`/banquets?${queryParams.toString()}`);
      console.log('Banquets response:', response.data); // Debug log
      
      setBanquets(response.data.banquets || []);
    } catch (error) {
      console.error('Error fetching banquets:', error); // Debug log
      toast.error('Failed to fetch banquets');
      setBanquets([]);
    } finally {
      setLoading(false);
    }
  };

  const createBookingUrl = (banquetId: string) => {
    return `/banquets/book/${banquetId}`;
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility) {
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'parking': return <Car className="h-4 w-4" />;
      case 'dj': return <Music className="h-4 w-4" />;
      case 'photography': return <Camera className="h-4 w-4" />;
      default: return <span className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:5000${imageUrl}`;
    }
    return imageUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Banquet Halls</h1>
          <p className="text-xl text-gray-600">Perfect venues for your special events and celebrations</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hall Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="wedding">Wedding Hall</option>
                <option value="conference">Conference Hall</option>
                <option value="party">Party Hall</option>
                <option value="reception">Reception Hall</option>
                <option value="corporate">Corporate Hall</option>
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
                <option value="50">50+ Guests</option>
                <option value="100">100+ Guests</option>
                <option value="200">200+ Guests</option>
                <option value="500">500+ Guests</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Price</option>
                <option value="0-10000">Under ₹10,000</option>
                <option value="10000-25000">₹10,000 - ₹25,000</option>
                <option value="25000-50000">₹25,000 - ₹50,000</option>
                <option value="50000+">₹50,000+</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={fetchBanquets}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Halls'}
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

        {/* No Banquets Found */}
        {!loading && banquets.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No banquet halls available</h3>
            <p className="text-gray-600">Try adjusting your search criteria.</p>
          </div>
        )}

        {/* Banquets Grid */}
        {!loading && banquets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {banquets.map((banquet) => {
              const currentImageIndex = imageIndices[banquet._id] || 0;
              const hasMultipleImages = banquet.images && banquet.images.length > 1;

              return (
                <div 
                  key={banquet._id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                  onMouseEnter={() => setHoveredBanquetId(banquet._id)}
                  onMouseLeave={() => setHoveredBanquetId(null)}
                >
                  <div className="h-48 bg-gray-300 relative group">
                    <img
                      src={getImageUrl(banquet.images?.[currentImageIndex] || '/placeholder/400/300')}
                      alt={banquet.name}
                      className="w-full h-full object-cover transition-opacity duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder/400/300';
                      }}
                    />

                    {/* Image Counter Badge */}
                    {hasMultipleImages && (
                      <div className="absolute top-12 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs">
                        {currentImageIndex + 1}/{banquet.images.length}
                      </div>
                    )}

                    {/* Progress Dots */}
                    {hasMultipleImages && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                        {banquet.images.slice(0, 5).map((_, index) => (
                          <div
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              currentImageIndex === index
                                ? 'bg-white w-4'
                                : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                        {banquet.images.length > 5 && (
                          <div className="text-white text-xs ml-1">+{banquet.images.length - 5}</div>
                        )}
                      </div>
                    )}

                    <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-md">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{banquet.rating || 4.8}</span>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded-md">
                      <span className="text-xs font-medium capitalize">{banquet.type} Hall</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {banquet.name}
                      </h3>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">₹{banquet.pricePerDay}</div>
                        <div className="text-xs text-gray-500">per day</div>
                        <div className="text-sm text-gray-600">₹{banquet.pricePerHour}/hr</div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm">{banquet.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">Up to {banquet.capacity} guests</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">{banquet.area}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">Min {banquet.minimumHours}hrs</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">Floor {banquet.floor}</span>
                      </div>
                    </div>

                    {/* Seating Arrangements */}
                    {banquet.seatingArrangements && banquet.seatingArrangements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Seating Options</h4>
                        <div className="flex flex-wrap gap-1">
                          {banquet.seatingArrangements.slice(0, 3).map((arrangement, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                            >
                              {arrangement}
                            </span>
                          ))}
                          {banquet.seatingArrangements.length > 3 && (
                            <span className="text-blue-600 text-xs">+{banquet.seatingArrangements.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Facilities */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(banquet.facilities || {})
                          .filter(([key, value]) => value && ['wifi', 'parking', 'dj', 'photography'].includes(key))
                          .slice(0, 4)
                          .map(([key]) => (
                            <div key={key} className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                              {getFacilityIcon(key)}
                              <span className="ml-1 capitalize">{key}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    <Link 
                      to={createBookingUrl(banquet._id)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition block text-center font-medium"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Banquets;
