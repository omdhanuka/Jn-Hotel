import React, { useState } from 'react';
import { Users, Calendar, Clock, MapPin, Star } from 'lucide-react';

const Banquets: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [guestCount, setGuestCount] = useState('');

  const venues = [
    {
      id: 1,
      name: 'Grand Ballroom',
      capacity: 300,
      area: '3,500 sq ft',
      price: 2500,
      image: '/api/placeholder/600/400',
      features: ['Dance Floor', 'Stage', 'Premium Lighting', 'Sound System'],
      description: 'Our flagship ballroom perfect for weddings and large corporate events'
    },
    {
      id: 2,
      name: 'Executive Conference Hall',
      capacity: 100,
      area: '1,800 sq ft',
      price: 1200,
      image: '/api/placeholder/600/400',
      features: ['AV Equipment', 'Projection Screen', 'WiFi', 'Climate Control'],
      description: 'Professional conference space ideal for business meetings and seminars'
    },
    {
      id: 3,
      name: 'Garden Pavilion',
      capacity: 150,
      area: '2,200 sq ft',
      price: 1800,
      image: '/api/placeholder/600/400',
      features: ['Outdoor Setting', 'Garden Views', 'Natural Lighting', 'Weather Protection'],
      description: 'Beautiful outdoor venue perfect for intimate weddings and celebrations'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Spaces & Banquet Halls</h1>
          <p className="text-xl text-gray-600">Create unforgettable memories in our stunning venues</p>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Capacity</option>
                <option value="50">Up to 50 guests</option>
                <option value="100">Up to 100 guests</option>
                <option value="200">Up to 200 guests</option>
                <option value="300">300+ guests</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Type</option>
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="conference">Conference</option>
                <option value="party">Private Party</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                Check Availability
              </button>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="space-y-8">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="h-64 md:h-full w-full object-cover"
                  />
                </div>
                <div className="md:w-2/3 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{venue.name}</h3>
                      <p className="text-gray-600 mb-4">{venue.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">${venue.price}</div>
                      <div className="text-sm text-gray-500">per event</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">Up to {venue.capacity} guests</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">{venue.area}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 mr-2" />
                      <span className="text-gray-700">Premium Venue</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Included Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {venue.features.map((feature, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition">
                      Book This Venue
                    </button>
                    <button className="flex-1 border border-blue-600 text-blue-600 py-2 px-6 rounded-md hover:bg-blue-50 transition">
                      Request Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Services */}
        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Additional Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Catering Services</h3>
              <p className="text-gray-600 text-sm">Premium catering with customizable menus</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Event Planning</h3>
              <p className="text-gray-600 text-sm">Professional event coordination and planning</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Round-the-clock event support and assistance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banquets;
