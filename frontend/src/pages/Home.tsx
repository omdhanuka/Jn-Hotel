import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Hotel, 
  Utensils, 
  Calendar, 
  Star, 
  Users, 
  MapPin,
  Phone,
  Mail,
  Clock,
  Award,
  Shield,
  Sparkles,
  CheckCircle,
  ArrowRight
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
  // Add state for rooms
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch featured rooms on mount
  useEffect(() => {
    fetchFeaturedRooms();
  }, []);

  const fetchFeaturedRooms = async () => {
    try {
      setLoadingRooms(true);
      // Fetch 3 rooms for display
      const response = await axios.get('/api/rooms?limit=3&status=active');
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
      const response = await axios.get('/api/reviews?limit=4');
      const reviews = response.data.reviews || [];
      
      // Map reviews to testimonial format
      const mappedReviews = reviews.map((review: any) => ({
        name: `${review.user.firstName} ${review.user.lastName}`,
        role: review.experienceType === 'room' ? 'Hotel Guest' : 
              review.experienceType === 'banquet' ? 'Event Organizer' :
              review.experienceType === 'restaurant' ? 'Restaurant Guest' : 'Valued Guest',
        image: `https://ui-avatars.com/api/?name=${review.user.firstName}+${review.user.lastName}&background=random`,
        rating: review.rating,
        comment: review.comment
      }));

      setTestimonials(mappedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Keep testimonials empty if fetch fails
      setTestimonials([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const features = [
    {
      icon: Hotel,
      title: 'Luxury Accommodations',
      description: 'Premium rooms with modern amenities and breathtaking views'
    },
    {
      icon: Utensils,
      title: 'Fine Dining',
      description: 'Multi-cuisine restaurant serving delectable dishes'
    },
    {
      icon: Calendar,
      title: 'Event Spaces',
      description: 'State-of-the-art banquet halls for your special occasions'
    },
    {
      icon: Shield,
      title: '24/7 Security',
      description: 'Round-the-clock security and safety measures'
    }
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Guests' },
    { icon: Award, value: '50+', label: 'Awards Won' },
    { icon: Hotel, value: '100+', label: 'Luxury Rooms' },
    { icon: Star, value: '4.9/5', label: 'Guest Rating' }
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920)'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="h-12 w-12 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              Welcome to J.N Palace Hotel
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Experience Luxury, Comfort & Hospitality Redefined
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/rooms"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 flex items-center justify-center"
              >
                Book Your Stay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/restaurant"
                className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 flex items-center justify-center"
              >
                Explore Dining
                <Utensils className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-xl text-gray-600">Discover what makes us exceptional</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-white"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Types Section - Updated */}
      <div className="py-20 bg-gray-50">
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
                      src={room.images[0] || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500'} 
                      alt={room.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
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
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Guest Experiences</h2>
            <p className="text-xl text-gray-600">What our valued guests say about us</p>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Experience Luxury?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Book your stay today and create unforgettable memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/rooms"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 inline-flex items-center justify-center"
            >
              <Hotel className="mr-2 h-6 w-6" />
              Browse Rooms
            </Link>
            <Link
              to="/banquets"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 inline-flex items-center justify-center"
            >
              <Calendar className="mr-2 h-6 w-6" />
              Book Events
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div 
              onClick={handleCallClick}
              className="text-center cursor-pointer transform transition-transform hover:scale-105"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Call Us</h3>
              <p className="text-gray-400">+91 123 456 7890</p>
              <p className="text-gray-400">24/7 Support Available</p>
              <p className="text-blue-400 mt-2 text-sm">Click to call</p>
            </div>
            
            <div 
              onClick={handleEmailClick}
              className="text-center cursor-pointer transform transition-transform hover:scale-105"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Us</h3>
              <p className="text-gray-400">info@jnpalace.com</p>
              <p className="text-gray-400">reservations@jnpalace.com</p>
              <p className="text-blue-400 mt-2 text-sm">Click to send email</p>
            </div>
            
            <div 
              onClick={handleVisitUsClick}
              className="text-center cursor-pointer transform transition-transform hover:scale-105"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
              <p className="text-gray-400">123 Luxury Avenue</p>
              <p className="text-gray-400">City Center, State 12345</p>
              <p className="text-blue-400 mt-2 text-sm">Click to open in Google Maps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
