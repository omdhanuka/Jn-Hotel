import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Heart, Gift, Calendar, Users, Star, ArrowRight, Sparkles, Award, Percent } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  image: string;
  features: string[];
  validUntil: string;
  category: 'romantic' | 'luxury' | 'family' | 'business';
  price: number;
  originalPrice: number;
  code: string;
}

const SpecialOffers: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const offers: Offer[] = [
    {
      id: '1',
      title: 'Romantic Getaway Package',
      description: 'Enjoy a memorable stay with special perks. Includes champagne, spa access, and candlelit dinner for two.',
      discount: 15,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      features: [
        'Complimentary champagne on arrival',
        '2-hour couple spa session',
        'Candlelit dinner at our rooftop restaurant',
        'Rose petal decoration',
        'Late checkout (2 PM)'
      ],
      validUntil: '2026-03-31',
      category: 'romantic',
      price: 8499,
      originalPrice: 9999,
      code: 'ROMANCE15'
    },
    {
      id: '2',
      title: 'Royal Retreat Package',
      description: 'Luxury stay with spa and dining included. Experience royal treatment with our finest amenities.',
      discount: 20,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      features: [
        'Presidential Suite accommodation',
        'Full-day spa access for 2',
        'Breakfast, lunch & dinner included',
        'Personal butler service',
        'Airport pickup & drop',
        'Complimentary wine tasting'
      ],
      validUntil: '2026-04-30',
      category: 'luxury',
      price: 15999,
      originalPrice: 19999,
      code: 'ROYAL20'
    },
    {
      id: '3',
      title: 'Family Fun Package',
      description: 'Perfect for families! Enjoy spacious rooms, kids activities, and family-friendly amenities.',
      discount: 25,
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      features: [
        'Interconnecting family rooms',
        'Free meals for kids under 12',
        'Access to kids club & activities',
        'Welcome gifts for children',
        'Family pool access',
        'Board games & entertainment'
      ],
      validUntil: '2026-05-15',
      category: 'family',
      price: 7499,
      originalPrice: 9999,
      code: 'FAMILY25'
    },
    {
      id: '4',
      title: 'Business Excellence Package',
      description: 'Designed for business travelers. Meeting facilities, high-speed internet, and executive lounge access.',
      discount: 10,
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      features: [
        'Executive room with workspace',
        'High-speed WiFi (100 Mbps)',
        'Meeting room access (4 hours)',
        'Business center facilities',
        'Express laundry service',
        'Continental breakfast'
      ],
      validUntil: '2026-06-30',
      category: 'business',
      price: 5399,
      originalPrice: 5999,
      code: 'BIZEXCEL10'
    }
  ];

  const filteredOffers = selectedCategory === 'all' 
    ? offers 
    : offers.filter(offer => offer.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Offers', icon: Sparkles },
    { id: 'romantic', label: 'Romantic', icon: Heart },
    { id: 'luxury', label: 'Luxury', icon: Crown },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'business', label: 'Business', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80')`,
        }}
      >
        <div className="text-center text-white z-10 px-4">
          <div className="inline-block bg-amber-500/20 backdrop-blur-sm px-6 py-2 rounded-full mb-4 border-2 border-amber-400/50">
            <Gift className="inline h-6 w-6 mr-2 text-amber-400" />
            <span className="text-xl font-bold uppercase tracking-wider">Exclusive Offers</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 tracking-wide">
            SPECIAL OFFERS
          </h1>
          <p className="text-2xl md:text-3xl font-serif italic text-amber-200">
            Unlock Amazing Deals & Packages
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-amber-600 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold uppercase tracking-wide transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-500 hover:shadow-md'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredOffers.map((offer) => (
            <div 
              key={offer.id} 
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-amber-100"
            >
              {/* Image */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                {/* Discount Badge */}
                <div className="absolute top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  {offer.discount}% OFF
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-3xl font-bold mb-2 uppercase tracking-wide">
                    {offer.title}
                  </h2>
                  <p className="text-lg text-gray-200">
                    {offer.description}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Price Section */}
                <div className="mb-6 flex items-baseline gap-3">
                  <div className="text-4xl font-bold text-amber-600">
                    ₹{offer.price.toLocaleString()}
                  </div>
                  <div className="text-xl text-gray-400 line-through">
                    ₹{offer.originalPrice.toLocaleString()}
                  </div>
                  <span className="text-sm text-gray-600">per night</span>
                </div>

                {/* Promo Code */}
                <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Promo Code</p>
                      <p className="text-xl font-bold text-amber-600">{offer.code}</p>
                    </div>
                    <Gift className="h-8 w-8 text-amber-500" />
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center">
                    <Star className="h-5 w-5 mr-2 text-amber-500" />
                    What's Included
                  </h3>
                  <ul className="space-y-2">
                    {offer.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <ArrowRight className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Valid Until */}
                <div className="mb-6 flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                  <span>Valid until {new Date(offer.validUntil).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>

                {/* CTA Button */}
                <Link
                  to={`/rooms?offer=${offer.code}`}
                  className="block w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-center py-4 rounded-lg font-bold uppercase tracking-wide transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  Book This Offer <ArrowRight className="inline h-5 w-5 ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-20">
            <Gift className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Offers Available</h3>
            <p className="text-gray-600 mb-6">Check back soon for new exciting offers!</p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-8 py-3 rounded-lg font-semibold uppercase tracking-wide hover:shadow-lg transition-all"
            >
              View All Offers
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-8 border-2 border-amber-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide text-center">
            How to Redeem Your Offer
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Choose Your Package</h4>
              <p className="text-gray-700 text-sm">Select the special offer that suits your needs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Enter Promo Code</h4>
              <p className="text-gray-700 text-sm">Apply the promo code during booking to get your discount</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Enjoy Your Stay</h4>
              <p className="text-gray-700 text-sm">Experience luxury with exclusive benefits and savings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialOffers;
