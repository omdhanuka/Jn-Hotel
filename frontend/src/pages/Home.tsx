import React from 'react';
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

const Home: React.FC = () => {
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

  const roomTypes = [
    {
      name: 'Deluxe Room',
      image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500',
      price: 3999,
      features: ['King Size Bed', 'City View', 'Free WiFi', 'Mini Bar']
    },
    {
      name: 'Executive Suite',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500',
      price: 7999,
      features: ['Separate Living Area', 'Premium Amenities', 'Complimentary Breakfast', 'Butler Service']
    },
    {
      name: 'Presidential Suite',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500',
      price: 15999,
      features: ['Panoramic Views', 'Private Terrace', 'Jacuzzi', 'Personal Chef']
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Business Executive',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      rating: 5,
      comment: 'Exceptional service and luxurious ambiance. The staff went above and beyond to make our stay memorable. The rooms are spacious and well-maintained.'
    },
    {
      name: 'Priya Sharma',
      role: 'Event Organizer',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      comment: 'Hosted our corporate event here and it was flawless! The banquet facilities are top-notch and the catering was absolutely delicious. Highly recommended!'
    },
    {
      name: 'Amit Patel',
      role: 'Travel Blogger',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      rating: 5,
      comment: 'One of the finest hotels I\'ve stayed at. Perfect blend of luxury and comfort. The restaurant serves amazing food and the location is very convenient.'
    },
    {
      name: 'Sneha Reddy',
      role: 'Wedding Planner',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      rating: 5,
      comment: 'Organized multiple weddings here and each time the experience has been outstanding. The event team is professional and the venues are beautiful!'
    }
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Guests' },
    { icon: Award, value: '50+', label: 'Awards Won' },
    { icon: Hotel, value: '100+', label: 'Luxury Rooms' },
    { icon: Star, value: '4.9/5', label: 'Guest Rating' }
  ];

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

      {/* Room Types Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Accommodations</h2>
            <p className="text-xl text-gray-600">Choose from our range of luxury rooms</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roomTypes.map((room, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="h-64 bg-gray-300 overflow-hidden">
                  <img 
                    src={room.image} 
                    alt={room.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{room.name}</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    ₹{room.price.toLocaleString()}
                    <span className="text-sm text-gray-500 font-normal">/night</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {room.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-600">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/rooms"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-semibold transition"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Guest Experiences</h2>
            <p className="text-xl text-gray-600">What our valued guests say about us</p>
          </div>

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
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Call Us</h3>
              <p className="text-gray-400">+91 123 456 7890</p>
              <p className="text-gray-400">24/7 Support Available</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Us</h3>
              <p className="text-gray-400">info@jnpalace.com</p>
              <p className="text-gray-400">reservations@jnpalace.com</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
              <p className="text-gray-400">123 Luxury Avenue</p>
              <p className="text-gray-400">City Center, State 12345</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
