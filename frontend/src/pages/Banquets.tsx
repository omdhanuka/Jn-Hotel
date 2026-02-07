import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, Star, Wifi, Car, Music, Camera, Heart, Briefcase, PartyPopper, ChevronRight, CheckCircle2 } from 'lucide-react';
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

interface QuoteForm {
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  capacity: string;
  message: string;
}

const Banquets: React.FC = () => {
  const [banquets, setBanquets] = useState<Banquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState('wedding');
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState('');
  const [quoteForm, setQuoteForm] = useState<QuoteForm>({
    fullName: '',
    email: '',
    phone: '',
    eventType: 'wedding',
    capacity: '100-150',
    message: ''
  });
  const [hoveredBanquetId, setHoveredBanquetId] = useState<string | null>(null);
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});
  const [filteredBanquets, setFilteredBanquets] = useState<Banquet[]>([]);
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  const [guestInputValue, setGuestInputValue] = useState<string>('2');

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
    }, 2000);

    return () => clearInterval(interval);
  }, [hoveredBanquetId, banquets]);

  const fetchBanquets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/banquets');
      setBanquets(response.data.banquets || []);
    } catch (error) {
      console.error('Error fetching banquets:', error);
      toast.error('Failed to fetch banquets');
      setBanquets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.fullName || !quoteForm.email || !quoteForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Quote request submitted! We will contact you soon.');
    setQuoteForm({
      fullName: '',
      email: '',
      phone: '',
      eventType: 'wedding',
      capacity: '100-150',
      message: ''
    });
  };

  const handleCheckAvailability = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    
    // Filter banquets based on guest capacity
    const available = banquets.filter(banquet => banquet.capacity >= selectedGuests);
    
    setFilteredBanquets(available);
    setShowFilteredResults(true);
    
    if (available.length > 0) {
      toast.success(`Found ${available.length} available venue(s) for ${selectedGuests} guests!`);
      // Scroll to the venues section
      setTimeout(() => {
        document.getElementById('banquet-venues')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      toast.error(`Sorry, no venues available for ${selectedGuests} guests on the selected date.`);
    }
  };

  const createBookingUrl = (banquetId: string) => {
    return `/banquets/book/${banquetId}`;
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:5000${imageUrl}`;
    }
    return imageUrl;
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wedding': return <Heart className="h-5 w-5 text-white" />;
      case 'corporate': return <Briefcase className="h-5 w-5 text-white" />;
      case 'party': return <PartyPopper className="h-5 w-5 text-white" />;
      default: return <Calendar className="h-5 w-5 text-white" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f1ed]">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .luxury-gradient {
          background: linear-gradient(135deg, #d4a574 0%, #c9964b 100%);
        }

        .luxury-text {
          color: #8b6f47;
        }

        .luxury-border {
          border-color: #d4a574;
        }

        .luxury-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4a574 0%, #c9964b 100%);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .luxury-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4a574 0%, #c9964b 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .luxury-slider::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #d4a574 0%, #d4a574 var(--value), #e5e7eb var(--value), #e5e7eb 100%);
        }
      `}</style>

      {/* Hero Section with Palace Image */}
      <div 
        className="relative h-[600px] bg-cover bg-center" 
        style={{
          backgroundImage: 'linear-gradient(rgba(61,52,70,0.4), rgba(61,52,70,0.5)), url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=80)',
          backgroundColor: '#3d3446'
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 text-center">
            Banquets & Events
          </h1>
          <h2 className="text-3xl md:text-4xl font-serif mb-6 text-center">
            at Hotel JN PALACE
          </h2>
          <p className="text-xl md:text-2xl text-center max-w-3xl mb-12 font-light">
            Luxurious Venues for Weddings, Corporate & Social Gatherings
          </p>

          {/* Inline Booking Bar */}
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Event Type</label>
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate</option>
                  <option value="party">Party</option>
                  <option value="reception">Reception</option>
                  <option value="conference">Conference</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Guests</label>
                <input
                  type="number"
                  value={guestInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGuestInputValue(value);
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 2) {
                      setSelectedGuests(numValue);
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  onBlur={() => {
                    if (guestInputValue === '' || parseInt(guestInputValue) < 2) {
                      setGuestInputValue('2');
                      setSelectedGuests(2);
                    }
                  }}
                  min="2"
                  placeholder="Number of guests"
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleCheckAvailability}
                className="luxury-gradient text-white px-6 py-3 rounded-md font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                CHECK AVAILABILITY
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4">
            Banquets & Events at Hotel JN Palace
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Host your grand events at Hotel JN Palace, where luxury meets elegance. Our exquisite venues are perfect for weddings, corporate events, conferences, and social gatherings.
          </p>
        </div>

        {/* Three Event Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Exquisite Weddings */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
            <div className="h-64 bg-cover bg-center" style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800")'
            }}></div>
            <div className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="luxury-gradient p-3 rounded-full">
                  <Heart className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mb-3">EXQUISITE WEDDINGS</h3>
              <p className="text-gray-600 leading-relaxed">
                Host your dream wedding in our regal, opulent ballrooms and elegant outdoor settings
              </p>
            </div>
          </div>

          {/* Corporate Events */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
            <div className="h-64 bg-cover bg-center" style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1511578314322-379afb476865?w=800")'
            }}></div>
            <div className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="luxury-gradient p-3 rounded-full">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mb-3">CORPORATE EVENTS</h3>
              <p className="text-gray-600 leading-relaxed">
                State-of-the-art facilities for conferences, meetings, and corporate galas
              </p>
            </div>
          </div>

          {/* Social Gatherings */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
            <div className="h-64 bg-cover bg-center" style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800")'
            }}></div>
            <div className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="luxury-gradient p-3 rounded-full">
                  <PartyPopper className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mb-3">SOCIAL GATHERINGS</h3>
              <p className="text-gray-600 leading-relaxed">
                Perfect venues for birthdays, anniversaries, and grand celebrations
              </p>
            </div>
          </div>
        </div>

        {/* Plan Your Event & Request Quote - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* Left: Plan Your Event Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">
                PLAN YOUR EVENT
              </h2>
              <p className="text-gray-600">Select your event type and estimate the number of guests</p>
            </div>

            <div className="max-w-lg mx-auto">
              {/* Event Type Selection */}
              <div className="mb-8">
                <label className="block text-gray-700 font-semibold mb-4 text-center">Event Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'wedding', label: 'Weddings', icon: Heart },
                    { type: 'corporate', label: 'Corporate', icon: Briefcase },
                    { type: 'party', label: 'Celebrations', icon: PartyPopper }
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setQuoteForm({ ...quoteForm, eventType: type })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        quoteForm.eventType === type
                          ? 'luxury-border luxury-gradient text-white shadow-lg'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-amber-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full mb-2 ${
                          quoteForm.eventType === type
                            ? 'bg-white/20'
                            : 'luxury-gradient'
                        }`}>
                          <Icon className={`h-6 w-6 text-white`} />
                        </div>
                        <h3 className="text-xs font-semibold">{label}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count with Range */}
              <div className="mb-8">
                <label className="block text-gray-700 font-semibold mb-4 text-center">
                  Number of Guests
                </label>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold luxury-text">{selectedGuests}</span>
                    <span className="text-gray-500 text-xl ml-2">Guests</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={selectedGuests}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSelectedGuests(value);
                      setGuestInputValue(value.toString());
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer luxury-slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-3">
                    <span>10</span>
                    <span>250</span>
                    <span>500</span>
                    <span>750</span>
                    <span>1000</span>
                  </div>
                </div>
              </div>

              {/* Event Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="luxury-gradient p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">Weddings</p>
                  <p className="text-xs text-gray-500">Luxury Celebrations</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="luxury-gradient p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">Corporate</p>
                  <p className="text-xs text-gray-500">Professional Spaces</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="luxury-gradient p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <PartyPopper className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">Social Events</p>
                  <p className="text-xs text-gray-500">Grand Gatherings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Request Quote Form */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 luxury-border">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-amber-500 w-12"></div>
              <h3 className="text-2xl font-serif font-bold luxury-text mx-4 whitespace-nowrap">REQUEST A QUOTE</h3>
              <div className="h-px bg-amber-500 w-12"></div>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={quoteForm.fullName}
                onChange={(e) => setQuoteForm({ ...quoteForm, fullName: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                value={quoteForm.email}
                onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />

              <input
                type="tel"
                placeholder="Phone Number"
                value={quoteForm.phone}
                onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />

              <select
                value={quoteForm.eventType}
                onChange={(e) => setQuoteForm({ ...quoteForm, eventType: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="party">Party/Celebration</option>
                <option value="reception">Reception</option>
                <option value="conference">Conference</option>
              </select>

              <select
                value={quoteForm.capacity}
                onChange={(e) => setQuoteForm({ ...quoteForm, capacity: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="50-100">50-100 Guests</option>
                <option value="100-150">100-150 Guests</option>
                <option value="150-300">150-300 Guests</option>
                <option value="300-500">300-500 Guests</option>
                <option value="500+">500+ Guests</option>
              </select>

              <textarea
                placeholder="Additional Requirements (optional)"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <button
                type="submit"
                className="w-full luxury-gradient text-white py-4 rounded-md font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                SUBMIT REQUEST
                <ChevronRight className="ml-2 h-6 w-6" />
              </button>
            </form>
          </div>
        </div>

        {/* Our Banquet Venues */}
        <div className="mb-16" id="banquet-venues">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4">
              {showFilteredResults ? 'AVAILABLE VENUES' : 'OUR BANQUET VENUES'}
            </h2>
            {showFilteredResults && (
              <div className="flex items-center justify-center space-x-4">
                <p className="text-lg text-gray-600">
                  Showing {filteredBanquets.length} venue(s) for {selectedGuests} guests
                </p>
                <button
                  onClick={() => setShowFilteredResults(false)}
                  className="text-amber-600 text-sm font-semibold hover:underline flex items-center"
                >
                  View All Venues
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-600 absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading venues...</p>
            </div>
          ) : (showFilteredResults ? filteredBanquets : banquets).length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {showFilteredResults ? 'No matching venues found' : 'No venues available'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {showFilteredResults 
                    ? `Sorry, we don't have venues that can accommodate ${selectedGuests} guests. Please try adjusting your guest count.` 
                    : 'Check back soon for our premium banquet venues.'}
                </p>
                {showFilteredResults && (
                  <button
                    onClick={() => setShowFilteredResults(false)}
                    className="luxury-gradient text-white px-6 py-2 rounded-md font-semibold hover:opacity-90"
                  >
                    View All Venues
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(showFilteredResults ? filteredBanquets : banquets).map((banquet, index) => {
                const currentImageIndex = imageIndices[banquet._id] || 0;

                return (
                  <div
                    key={banquet._id}
                    className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={() => setHoveredBanquetId(banquet._id)}
                    onMouseLeave={() => setHoveredBanquetId(null)}
                  >
                    {/* Venue Image */}
                    <div className="h-64 bg-gray-300 relative overflow-hidden group">
                      <img
                        src={getImageUrl(banquet.images?.[currentImageIndex] || 'https://images.unsplash.com/photo-1519167758481-83f29da8a1c4?w=800')}
                        alt={banquet.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1519167758481-83f29da8a1c4?w=800';
                        }}
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Rating Badge */}
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-amber-500 fill-current mr-1" />
                          <span className="text-sm font-bold text-gray-800">{banquet.rating || 4.8}</span>
                        </div>
                      </div>
                    </div>

                    {/* Venue Details */}
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        <div className="luxury-gradient p-2 rounded-full mr-3">
                          {getEventIcon(banquet.type)}
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-gray-800">
                          {banquet.name}
                        </h3>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {banquet.description || 'Elegant and spacious, ideal for grand weddings and large corporate events.'}
                      </p>

                      {/* Venue Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center text-gray-700">
                          <Users className="h-4 w-4 luxury-text mr-2" />
                          <span className="text-sm font-medium">{banquet.capacity} guests</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <MapPin className="h-4 w-4 luxury-text mr-2" />
                          <span className="text-sm font-medium">{banquet.area}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 luxury-text mr-2" />
                          <span className="text-sm font-medium">Min {banquet.minimumHours}hrs</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-sm font-medium">Floor {banquet.floor}</span>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-amber-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-2xl font-bold luxury-text">₹{banquet.pricePerDay.toLocaleString()}</div>
                            <div className="text-xs text-gray-600">per day</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold luxury-text">₹{banquet.pricePerHour.toLocaleString()}</div>
                            <div className="text-xs text-gray-600">per hour</div>
                          </div>
                        </div>
                      </div>

                      {/* View Offer Button */}
                      <Link
                        to={createBookingUrl(banquet._id)}
                        className="w-full luxury-gradient text-white py-3 rounded-md font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        VIEW OFFER
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Amenities Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-serif font-bold text-center luxury-text mb-8">Event Amenities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Customizable Decor</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Audio Visual</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Catering Services</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Bridal Suite</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">High-Speed Wi-Fi</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Dedicated Event Planning</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Valet Parking</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Professional Photography</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banquets;
