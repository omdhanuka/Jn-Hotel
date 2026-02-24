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
  ArrowRight,
  Wifi,
  Coffee,
  Car,
  Crown,
  ChevronDown,
  Gift,
  Dumbbell,
  Sparkles,
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

      {/* â”€â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="relative min-h-screen flex items-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.52), rgba(0,0,0,0.38)), url(https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920)',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Crown badge */}
          <div className="flex justify-center mb-8">
            <div className="bg-amber-500/20 backdrop-blur-sm p-4 rounded-full border-2 border-amber-400/50 shadow-xl">
              <Crown className="h-14 w-14 text-amber-400" />
            </div>
          </div>

          {/* Headline */}
          <div className="text-center text-white mb-14">
            <p className="text-xl md:text-2xl font-light text-amber-400 mb-3 tracking-[0.25em] uppercase">
              Welcome To
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 tracking-tight leading-none">
              HOTEL <span className="text-amber-400">JN PALACE</span>
            </h1>
            <p className="text-xl md:text-2xl font-light italic text-gray-200 tracking-widest">
              Experience Royal Luxury
            </p>
          </div>

          {/* Booking widget */}
          <div className="max-w-4xl mx-auto bg-white/96 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Check-In */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Check-In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-800"
                />
              </div>

              {/* Check-Out */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-800"
                />
              </div>

              {/* Guests */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Guests
                </label>
                <div className="relative">
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition appearance-none text-gray-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                  <Users className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-transparent uppercase">Action</label>
                <button
                  onClick={handleCheckAvailability}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 px-4 rounded-xl font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Check Availability
                </button>
              </div>
            </div>
          </div>

          {/* Quick nav links */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              { to: '/rooms', icon: Hotel, label: 'Rooms' },
              { to: '/restaurant', icon: Utensils, label: 'Dining' },
              { to: '/banquets', icon: Calendar, label: 'Events' },
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2 text-sm uppercase tracking-wide"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <ChevronDown className="h-8 w-8" />
        </div>
      </div>

      {/* â”€â”€â”€ SERVICES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              Our Services
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-tight">
              Everything You Need
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                to: '/rooms',
                img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700',
                title: 'Luxurious Rooms',
                subtitle: 'Elegantly designed accommodations tailored to perfection.',
                cta: 'View Rooms',
              },
              {
                to: '/restaurant',
                img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700',
                title: 'Fine Dining',
                subtitle: 'Exquisite cuisine crafted by world-class chefs.',
                cta: 'Explore Dining',
              },
              {
                to: '/banquets',
                img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=700',
                title: 'Grand Banquets',
                subtitle: 'Unforgettable venues for weddings & corporate events.',
                cta: 'Book an Event',
              },
            ].map((svc) => (
              <div
                key={svc.to}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-80"
              >
                <img
                  src={svc.img}
                  alt={svc.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                  <h3 className="text-2xl font-bold mb-1 uppercase tracking-wide">{svc.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">{svc.subtitle}</p>
                  <Link
                    to={svc.to}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition"
                  >
                    {svc.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-full mb-4 group-hover:bg-amber-500/20 transition">
                  <stat.icon className="h-8 w-8 text-amber-400" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-amber-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* â”€â”€â”€ AMENITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              Amenities
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-tight">
              World-Class Facilities
            </h2>
            <p className="text-gray-500 mt-3 text-lg">Everything you need for a perfect stay</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {[
              { icon: Wifi, label: 'Free Wi-Fi' },
              { icon: Coffee, label: 'Breakfast' },
              { icon: Car, label: 'Valet Parking' },
              { icon: Shield, label: '24/7 Security' },
              { icon: Dumbbell, label: 'Fitness Centre' },
              { icon: Gift, label: 'Concierge' },
            ].map((item, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 text-amber-600 rounded-full mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  {item.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

     
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              Accommodations
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-tight">
              Our Rooms & Suites
            </h2>
            <p className="text-gray-500 mt-3 text-lg italic">"Choose from our range of luxury rooms"</p>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
            </div>
          ) : featuredRooms.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredRooms.map((room) => (
                  <div
                    key={room._id}
                    className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="h-[440px] overflow-hidden relative">
                      <img
                        src={getImageSrc(room)}
                        alt={room.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={() => handleImageError(room._id)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/50 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                        <span className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow">
                          {room.type}
                        </span>
                        {Number(room.discount) > 0 && (
                          <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow">
                            {room.discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2 uppercase tracking-wide">
                        {room.roomName || room.title}
                      </h3>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-extrabold text-amber-400">
                          {`\u20B9${getFinalPrice(room).toLocaleString()}`}
                        </span>
                        {Number(room.discount) > 0 && (
                          <span className="text-sm text-gray-300 line-through">
                            {`\u20B9${room.price.toLocaleString()}`}
                          </span>
                        )}
                        <span className="text-xs text-gray-300">/night</span>
                      </div>

                      <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">
                        {room.description && room.description.trim().length > 15
                          ? room.description
                          : 'Experience ultimate luxury and comfort in this beautifully designed room.'}
                      </p>

                      <div className="flex items-center gap-3 mb-4 text-xs text-gray-300">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-amber-400" />
                          Up to {room.maxGuests} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          Premium
                        </span>
                      </div>

                      {/* Amenity pills */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {getTopAmenities(room).map((a, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-white/15 backdrop-blur-sm text-white rounded-full text-xs border border-white/25"
                          >
                            {a}
                          </span>
                        ))}
                      </div>

                      <Link
                        to="/rooms"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all hover:scale-105 shadow-lg"
                      >
                        View & Book
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  to="/rooms"
                  className="inline-flex items-center gap-2 border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white px-8 py-4 rounded-xl text-base font-bold uppercase tracking-wide transition-all hover:scale-105 shadow-sm hover:shadow-lg"
                >
                  View All Rooms
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <Award className="h-14 w-14 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-500 mb-6 text-lg">No rooms available at the moment</p>
              <Link
                to="/rooms"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wide transition hover:scale-105"
              >
                Browse All Rooms
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€â”€ TESTIMONIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-tight">
              Guest Reviews
            </h2>
            <p className="text-gray-500 mt-3 text-lg italic">"Hear from our delighted guests"</p>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-amber-500 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-amber-600 text-xs font-semibold">{t.role}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(Math.min(Math.max(Math.round(t.rating || 0), 1), 5))].map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed italic flex-1">
                    {t.comment && t.comment.trim().length > 10
                      ? `"${t.comment}"`
                      : '"A truly wonderful stay — exceptional service and beautiful surroundings."'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No reviews yet. Be the first to share your experience!
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="relative py-24 bg-cover bg-center bg-fixed overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920)',
        }}
      >
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Crown className="h-14 w-14 mx-auto mb-6 text-amber-400" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Ready to Experience Royal Luxury?
          </h2>
          <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Book your stay today and create unforgettable memories in our palace of hospitality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/rooms"
              className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-xl text-base font-bold uppercase tracking-wide shadow-lg transition-all hover:scale-105 inline-flex items-center justify-center gap-3"
            >
              <Hotel className="h-5 w-5" />
              Book Your Stay
            </Link>
            <Link
              to="/banquets"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-10 py-4 rounded-xl text-base font-bold uppercase tracking-wide transition-all hover:scale-105 inline-flex items-center justify-center gap-3"
            >
              <Calendar className="h-5 w-5" />
              Plan Your Event
            </Link>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ CONTACT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-3 uppercase tracking-tight">Get In Touch</h2>
            <p className="text-gray-400 text-lg">We're here to make your experience exceptional</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Phone,
                title: 'Call Us',
                line1: '+91 123 456 7890',
                line2: '24/7 Support Available',
                cta: 'Click to call â†’',
                onClick: () => { window.location.href = 'tel:+911234567890'; },
              },
              {
                icon: Mail,
                title: 'Email Us',
                line1: 'info@jnpalace.com',
                line2: 'reservations@jnpalace.com',
                cta: 'Send an email â†’',
                onClick: () => { window.location.href = 'mailto:info@jnpalace.com'; },
              },
              {
                icon: MapPin,
                title: 'Visit Us',
                line1: '123 Royal Street',
                line2: 'New Delhi, India',
                cta: 'View on Google Maps â†’',
                onClick: () => {
                  window.open(
                    'https://www.google.com/maps/place/The+Taj+Mahal+Palace,+Mumbai/@18.9217,72.8330,17z',
                    '_blank',
                    'noopener,noreferrer'
                  );
                },
              },
            ].map((item, i) => (
              <div
                key={i}
                onClick={item.onClick}
                className="group text-center cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 p-8 rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 group-hover:bg-amber-500 rounded-full mb-5 transition-colors duration-300">
                  <item.icon className="h-8 w-8 text-amber-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold mb-2 uppercase tracking-wide">{item.title}</h3>
                <p className="text-amber-400 font-semibold">{item.line1}</p>
                <p className="text-gray-400 text-sm mt-1">{item.line2}</p>
                <p className="text-amber-500 mt-4 text-xs font-bold uppercase tracking-wide">{item.cta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
