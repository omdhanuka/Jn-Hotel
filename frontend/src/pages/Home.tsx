import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Hotel, 
  Utensils, 
  Calendar, 
  Star, 
  Users, 
  MapPin,
  Phone,
  Mail,
  Award,
  Shield,
  CheckCircle,
  ArrowRight,
  Wine,
  Dumbbell,
  Wifi,
  Coffee,
  Car,
  Heart,
  Gift,
  Crown
} from 'lucide-react';
import axios from 'axios';

// Add Room interface
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
  images: string[];
  facilities: any;
  amenities: string[];
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // Add state for rooms
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  
  // Booking widget state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  // Fetch featured rooms on mount
  useEffect(() => {
    fetchFeaturedRooms();
  }, []);

  const fetchFeaturedRooms = async () => {
    try {
      setLoadingRooms(true);
      // Fetch 3 rooms for display
      const response = await axios.get('/rooms?limit=3&status=active');
      setFeaturedRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setFeaturedRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch real reviews
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await axios.get('/reviews?limit=4');
      const reviews = response.data.reviews || [];
      
      // Calculate average rating from all approved reviews
      if (response.data.stats) {
        setAvgRating(response.data.stats.avgRating || 0);
        setTotalReviews(response.data.stats.totalReviews || 0);
      }
      
      // Map reviews to testimonial format
      const mappedReviews = reviews.map((review: any) => ({
        name: `${review.user.firstName} ${review.user.lastName}`,
        role: review.experienceType === 'room' ? 'Hotel Guest' : 
              review.experienceType === 'banquet' ? 'Event Organizer' :
              review.experienceType === 'restaurant' ? 'Restaurant Guest' : 'Valued Guest',
        image: `https://ui-avatars.com/?name=${review.user.firstName}+${review.user.lastName}&background=random`,
        rating: review.rating,
        comment: review.comment
      }));

      setTestimonials(mappedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setTestimonials([]);
      setAvgRating(0);
      setTotalReviews(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Guests' },
    { icon: Award, value: '50+', label: 'Awards Won' },
    { icon: Hotel, value: '100+', label: 'Luxury Rooms' },
    { 
      icon: Star, 
      value: avgRating > 0 ? `${avgRating.toFixed(1)}/5` : '0.0/5', 
      label: totalReviews > 0 ? `${totalReviews} Reviews` : 'Guest Rating' 
    }
  ];

  // Helper function to get top amenities
  const getTopAmenities = (room: Room) => {
    const amenities: string[] = [];
    
    // Add bed info
    amenities.push(`${room.bedCount} ${room.bedType} Bed${room.bedCount > 1 ? 's' : ''}`);
    
    // Add key facilities
    if (room.facilities?.wifi) amenities.push('Free WiFi');
    if (room.facilities?.ac) amenities.push('Air Conditioning');
    if (room.facilities?.breakfast) amenities.push('Breakfast Included');
    if (room.facilities?.roomService) amenities.push('Room Service');
    if (room.facilities?.miniFridge) amenities.push('Mini Bar');
    if (room.facilities?.balcony) amenities.push('Private Balcony');
    
    // Add room size if not already 4 items
    if (amenities.length < 4) {
      amenities.push(room.roomSize);
    }
    
    return amenities.slice(0, 4);
  };

  // Calculate final price after discount
  const getFinalPrice = (room: Room) => {
    if (room.discount && room.discount > 0) {
      return Math.round(room.price - (room.price * room.discount / 100));
    }
    return room.price;
  };

  const handleVisitUsClick = () => {
    window.open(
      'https://www.google.com/maps/place/The+Taj+Mahal+Palace,+Mumbai/@18.9217,72.8330,17z/data=!3m1!4b1!4m6!3m5!1s0x3be7d1c73a0d5cad:0xc70a25a7209c733c!8m2!3d18.9216631!4d72.8330167!16zL20vMDZfcGhm',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:info@jnpalace.com';
  };

  const handleCallClick = () => {
    window.location.href = 'tel:+911234567890';
  };

  const handleCheckAvailability = () => {
    if (checkIn && checkOut) {
      navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    } else {
      navigate('/rooms');
    }
  };

  // Handle image error
  const handleImageError = (roomId: string) => {
    setImageErrors(prev => ({ ...prev, [roomId]: true }));
  };

  // Get image source with fallback
  const getImageSrc = (room: Room) => {
    if (imageErrors[room._id] || !room.images[0]) {
      return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500';
    }
    return room.images[0];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Booking Widget */}
      <div 
        className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url(https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Decorative overlay pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
        
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Logo/Crown Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-amber-500/20 backdrop-blur-sm p-4 rounded-full border-2 border-amber-400/50">
              <Crown className="h-16 w-16 text-amber-400" />
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center text-white mb-12">
            <h2 className="text-2xl md:text-3xl font-light text-amber-400 mb-3 tracking-wider uppercase">
              Welcome To
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight">
              HOTEL <span className="text-amber-400">JN PALACE</span>
            </h1>
            <p className="text-2xl md:text-3xl font-light italic text-gray-200 tracking-wide">
              Experience Royal Luxury
            </p>
          </div>

          {/* Booking Widget */}
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Check-In */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Check-In
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                  <Calendar className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Check-Out */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Check-Out
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                  <Calendar className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Guests */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Guests
                </label>
                <div className="relative">
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <Users className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Check Availability Button */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-transparent uppercase">
                  Action
                </label>
                <button
                  onClick={handleCheckAvailability}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 px-6 rounded-lg font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Check Availability
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              to="/rooms"
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-2 border-white/30 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center"
            >
              <Hotel className="mr-2 h-5 w-5" />
              View Rooms
            </Link>
            <Link
              to="/restaurant"
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-2 border-white/30 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center"
            >
              <Utensils className="mr-2 h-5 w-5" />
              Dining
            </Link>
            <Link
              to="/banquets"
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-2 border-white/30 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Events
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Services Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Luxurious Rooms */}
            <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="h-80 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600" 
                  alt="Luxurious Rooms"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-3xl font-bold mb-3 uppercase tracking-wide">Luxurious Rooms</h3>
                <p className="text-gray-200 mb-4">Elegantly designed accommodations for your comfort.</p>
                <Link
                  to="/rooms"
                  className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold uppercase text-sm tracking-wide transition"
                >
                  View Rooms
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Restaurant & Bar */}
            <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="h-80 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" 
                  alt="Restaurant & Bar"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-3xl font-bold mb-3 uppercase tracking-wide">Restaurant & Bar</h3>
                <p className="text-gray-200 mb-4">Exquisite dining with a royal touch.</p>
                <Link
                  to="/restaurant"
                  className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold uppercase text-sm tracking-wide transition"
                >
                  Explore Dining
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Spa & Wellness */}
            <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="h-80 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600" 
                  alt="Spa & Wellness"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-3xl font-bold mb-3 uppercase tracking-wide">Spa & Wellness</h3>
                <p className="text-gray-200 mb-4">Relax and rejuvenate in our serene spa.</p>
                <Link
                  to="/banquets"
                  className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold uppercase text-sm tracking-wide transition"
                >
                  Discover Spa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-105 transition-transform">
                <stat.icon className="h-12 w-12 mx-auto mb-4 text-amber-400" />
                <div className="text-4xl font-bold mb-2 text-amber-400">{stat.value}</div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Special Offers Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-amber-500/10 px-4 py-2 rounded-full mb-4">
              <span className="text-amber-600 font-semibold uppercase tracking-wide text-sm">Special Offers</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-4 uppercase tracking-tight">Exclusive Deals & Packages</h2>
            <p className="text-xl text-gray-600">Make your stay unforgettable with our curated packages</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Romantic Getaway */}
            <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="h-96 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800" 
                  alt="Romantic Getaway"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rose-900/90 via-rose-900/50 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center mb-3">
                  <Heart className="h-6 w-6 text-rose-400 mr-2" />
                  <span className="bg-rose-500 px-3 py-1 rounded-full text-sm font-bold uppercase">Limited Offer</span>
                </div>
                <h3 className="text-4xl font-bold mb-3 uppercase tracking-wide">Romantic Getaway</h3>
                <p className="text-rose-100 mb-4 text-lg">Enjoy a memorable stay with special perks. Includes champagne, spa access, and candlelit dinner.</p>
                <Link
                  to="/rooms"
                  className="inline-flex items-center bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wide transition"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Royal Retreat Package */}
            <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="h-96 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800" 
                  alt="Royal Retreat"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/50 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center mb-3">
                  <Crown className="h-6 w-6 text-amber-400 mr-2" />
                  <span className="bg-amber-500 px-3 py-1 rounded-full text-sm font-bold uppercase">Premium</span>
                </div>
                <h3 className="text-4xl font-bold mb-3 uppercase tracking-wide">Royal Retreat Package</h3>
                <p className="text-purple-100 mb-4 text-lg">Luxury stay with spa and dining included. Experience royal treatment with our finest amenities.</p>
                <Link
                  to="/rooms"
                  className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wide transition"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 uppercase tracking-tight">World-Class Amenities</h2>
            <p className="text-xl text-gray-600">Everything you need for a perfect stay</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Wifi, label: 'Free WiFi' },
              { icon: Coffee, label: 'Breakfast' },
              { icon: Car, label: 'Valet Parking' },
              { icon: Dumbbell, label: 'Fitness Center' },
              { icon: Wine, label: 'Mini Bar' },
              { icon: Shield, label: '24/7 Security' }
            ].map((amenity, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-xl bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full mb-4">
                  <amenity.icon className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {amenity.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Types Section - Updated */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Accommodations</h2>
            <p className="text-xl text-gray-600">Choose from our range of luxury rooms</p>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredRooms.map((room) => (
                <div key={room._id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <div className="h-64 bg-gray-300 overflow-hidden relative">
                    <img 
                      src={getImageSrc(room)} 
                      alt={room.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      onError={() => handleImageError(room._id)}
                    />
                    {room.discount && room.discount > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {room.discount}% OFF
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                      {room.type}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {room.roomName || room.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {room.description}
                    </p>
                    <div className="mb-4">
                      {room.discount && room.discount > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <div className="text-3xl font-bold text-blue-600">
                            ₹{getFinalPrice(room).toLocaleString()}
                          </div>
                          <div className="text-lg text-gray-400 line-through">
                            ₹{room.price.toLocaleString()}
                          </div>
                          <span className="text-sm text-gray-500 font-normal">/night</span>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-blue-600">
                          ₹{room.price.toLocaleString()}
                          <span className="text-sm text-gray-500 font-normal">/night</span>
                        </div>
                      )}
                    </div>
                    <div className="mb-4 flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Up to {room.maxGuests} guests</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {getTopAmenities(room).map((amenity, idx) => (
                        <li key={idx} className="flex items-center text-gray-600 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {amenity}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={`/rooms`}
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-semibold transition"
                    >
                      View Details & Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No rooms available at the moment</p>
              <Link
                to="/rooms"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Browse All Rooms
              </Link>
            </div>
          )}

          {featuredRooms.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/rooms"
                className="inline-flex items-center bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
              >
                View All Rooms
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Testimonials Section - Updated */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-amber-500/10 px-4 py-2 rounded-full mb-4">
              <span className="text-amber-600 font-semibold uppercase tracking-wide text-sm">Testimonials</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-4 uppercase tracking-tight">Guest Reviews</h2>
            <p className="text-xl text-gray-600 italic">"Hear from our delighted guests"</p>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-amber-500">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-amber-500"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                      <p className="text-sm text-amber-600 font-medium">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    "{testimonial.comment}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No reviews available yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="relative py-24 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.9), rgba(59, 130, 246, 0.9)), url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920)'
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Gift className="h-16 w-16 mx-auto mb-6 text-amber-400" />
          <h2 className="text-5xl font-bold mb-6 uppercase tracking-tight">Ready to Experience Royal Luxury?</h2>
          <p className="text-2xl mb-10 text-white/90 max-w-3xl mx-auto">
            Book your stay today and create unforgettable memories in our palace of hospitality
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/rooms"
              className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-5 rounded-xl text-lg font-bold uppercase tracking-wide shadow-2xl transition-all transform hover:scale-105 inline-flex items-center justify-center"
            >
              <Hotel className="mr-3 h-6 w-6" />
              Book Your Stay
            </Link>
            <Link
              to="/banquets"
              className="bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 rounded-xl text-lg font-bold uppercase tracking-wide transition-all transform hover:scale-105 inline-flex items-center justify-center"
            >
              <Calendar className="mr-3 h-6 w-6" />
              Plan Your Event
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 uppercase tracking-tight">Get In Touch</h2>
            <p className="text-xl text-gray-400">We're here to make your experience exceptional</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              onClick={handleCallClick}
              className="group text-center cursor-pointer transform transition-all hover:scale-105 bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-amber-500/50"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-6 group-hover:shadow-lg group-hover:shadow-amber-500/50 transition">
                <Phone className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase">Call Us</h3>
              <p className="text-amber-400 text-lg font-semibold">+91 123 456 7890</p>
              <p className="text-gray-400 mt-2">24/7 Support Available</p>
              <p className="text-amber-500 mt-4 text-sm font-semibold uppercase tracking-wide">Click to call →</p>
            </div>
            
            <div 
              onClick={handleEmailClick}
              className="group text-center cursor-pointer transform transition-all hover:scale-105 bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-amber-500/50"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-6 group-hover:shadow-lg group-hover:shadow-amber-500/50 transition">
                <Mail className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase">Email Us</h3>
              <p className="text-amber-400 text-lg font-semibold">info@jnpalace.com</p>
              <p className="text-gray-400">reservations@jnpalace.com</p>
              <p className="text-amber-500 mt-4 text-sm font-semibold uppercase tracking-wide">Click to send email →</p>
            </div>
            
            <div 
              onClick={handleVisitUsClick}
              className="group text-center cursor-pointer transform transition-all hover:scale-105 bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-amber-500/50"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-6 group-hover:shadow-lg group-hover:shadow-amber-500/50 transition">
                <MapPin className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3 uppercase">Visit Us</h3>
              <p className="text-amber-400 text-lg font-semibold">123 Royal Street</p>
              <p className="text-gray-400">New Delhi, India</p>
              <p className="text-amber-500 mt-4 text-sm font-semibold uppercase tracking-wide">View on Google Maps →</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
