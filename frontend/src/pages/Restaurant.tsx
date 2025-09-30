import React, { useState } from 'react';
import { Clock, Users, MapPin, Star, Utensils } from 'lucide-react';

const Restaurant: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [partySize, setPartySize] = useState('');

  const timeSlots = [
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'
  ];

  const menuCategories = [
    {
      name: 'Appetizers',
      items: [
        { name: 'Truffle Arancini', price: 18, description: 'Crispy risotto balls with truffle oil' },
        { name: 'Seared Scallops', price: 24, description: 'Pan-seared with cauliflower puree' }
      ]
    },
    {
      name: 'Main Courses',
      items: [
        { name: 'Wagyu Beef Tenderloin', price: 65, description: 'Grilled to perfection with seasonal vegetables' },
        { name: 'Pan-Seared Salmon', price: 42, description: 'Atlantic salmon with lemon herb butter' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-r from-amber-900 to-amber-700">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl font-bold mb-4">The Grand Restaurant</h1>
            <p className="text-xl text-amber-100">
              Experience culinary excellence with our award-winning cuisine
            </p>
            <div className="flex items-center justify-center mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-lg">Michelin Recommended</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Reservation Form */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Make a Reservation</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select Time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Guests</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <option key={size} value={size}>{size} {size === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition">
                Check Availability
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About Our Restaurant</h2>
            <p className="text-gray-600 mb-6">
              The Grand Restaurant offers an exceptional dining experience with modern interpretations 
              of classic dishes. Our chef combines the finest seasonal ingredients with innovative 
              culinary techniques to create memorable meals.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-amber-600 mr-3" />
                <div>
                  <div className="font-semibold">Dinner Service</div>
                  <div className="text-gray-600">6:00 PM - 10:30 PM daily</div>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-amber-600 mr-3" />
                <div>
                  <div className="font-semibold">Location</div>
                  <div className="text-gray-600">Hotel Ground Floor, East Wing</div>
                </div>
              </div>
              <div className="flex items-center">
                <Utensils className="h-5 w-5 text-amber-600 mr-3" />
                <div>
                  <div className="font-semibold">Cuisine</div>
                  <div className="text-gray-600">Modern International</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-200 rounded-lg h-96">
            <img
              src="/api/placeholder/600/400"
              alt="Restaurant Interior"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Sample Menu */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Sample Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {menuCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-xl font-bold text-amber-600 mb-4 border-b border-amber-200 pb-2">
                  {category.name}
                </h3>
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                      <div className="text-amber-600 font-bold ml-4">${item.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button className="bg-amber-600 text-white px-8 py-3 rounded-md hover:bg-amber-700 transition">
              View Full Menu
            </button>
          </div>
        </div>

        {/* Special Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Star className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2">Award-Winning Chef</h3>
            <p className="text-gray-600 text-sm">Our executive chef has received multiple culinary awards</p>
          </div>
          
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Utensils className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2">Farm-to-Table</h3>
            <p className="text-gray-600 text-sm">Fresh, locally sourced ingredients from partner farms</p>
          </div>
          
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="font-semibold mb-2">Private Dining</h3>
            <p className="text-gray-600 text-sm">Exclusive private dining rooms for special occasions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
