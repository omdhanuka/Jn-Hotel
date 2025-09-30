import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, Users, Utensils, Star, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Welcome to GrandStay
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Experience luxury, comfort, and exceptional hospitality in the heart of the city
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/rooms"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105"
              >
                Book Your Stay
              </Link>
              <Link
                to="/restaurant"
                className="border-2 border-white hover:bg-white hover:text-blue-900 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Explore Dining
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose GrandStay?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our premium services designed to make your stay unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-50 rounded-xl hover:shadow-lg transition">
              <Bed className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Luxury Rooms</h3>
              <p className="text-gray-600 mb-6">
                Spacious rooms with modern amenities, premium bedding, and stunning city views.
              </p>
              <Link
                to="/rooms"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
              >
                Explore Rooms <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-xl hover:shadow-lg transition">
              <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Event Spaces</h3>
              <p className="text-gray-600 mb-6">
                Perfect venues for weddings, conferences, and special events with full-service catering.
              </p>
              <Link
                to="/banquets"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
              >
                View Venues <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-xl hover:shadow-lg transition">
              <Utensils className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Fine Dining</h3>
              <p className="text-gray-600 mb-6">
                Award-winning restaurant with world-class cuisine and exceptional service.
              </p>
              <Link
                to="/restaurant"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
              >
                Reserve Table <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Guests Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Exceptional service and beautiful accommodations. The staff went above and beyond to make our stay memorable."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-semibold">Sarah Johnson</h4>
                    <p className="text-sm text-gray-500">Business Traveler</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Experience GrandStay?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book your stay today and discover the perfect blend of luxury and comfort.
          </p>
          <Link
            to="/rooms"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105"
          >
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
