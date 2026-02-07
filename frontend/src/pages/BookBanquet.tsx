import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Briefcase, PartyPopper, Calendar, Users, MapPin, CheckCircle2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

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
  images: string[];
  floor: string;
}

interface BookingForm {
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  numberOfGuests: number;
  additionalRequirements: string;
  specialPackage: boolean;
}

const BookBanquet: React.FC = () => {
  const { banquetId } = useParams<{ banquetId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [banquet, setBanquet] = useState<Banquet | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    fullName: '',
    email: '',
    phone: '',
    eventType: 'wedding',
    eventDate: '',
    numberOfGuests: 100,
    additionalRequirements: '',
    specialPackage: false
  });

  useEffect(() => {
    if (!user) {
      toast.error('Please login to book a banquet');
      navigate('/login');
      return;
    }
    
    if (user) {
      setBookingForm(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }
    
    fetchBanquet();
  }, [banquetId, user, navigate]);

  const fetchBanquet = async () => {
    try {
      const response = await axios.get(`/banquets/${banquetId}`);
      setBanquet(response.data);
    } catch (error) {
      toast.error('Banquet not found');
      navigate('/banquets');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!banquet) return 0;
    let basePrice = banquet.pricePerDay;
    if (bookingForm.specialPackage) {
      basePrice += 2000; // Add package price
    }
    return basePrice;
  };

  const handleBooking = async () => {
    if (!bookingForm.fullName || !bookingForm.email || !bookingForm.phone || !bookingForm.eventDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        type: 'banquet',
        resourceId: banquetId,
        checkIn: `${bookingForm.eventDate}T09:00`,
        checkOut: `${bookingForm.eventDate}T23:00`,
        guests: bookingForm.numberOfGuests,
        totalAmount: calculateTotal(),
        eventDetails: {
          eventType: bookingForm.eventType,
          fullName: bookingForm.fullName,
          phone: bookingForm.phone,
          specialPackage: bookingForm.specialPackage
        },
        specialRequests: bookingForm.additionalRequirements
      };

      const response = await axios.post('/bookings', bookingData);
      toast.success('Banquet booking confirmed successfully!');
      navigate('/dashboard', { state: { newBooking: response.data } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Booking failed';
      toast.error(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:5000${imageUrl}`;
    }
    return imageUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1ed]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!banquet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1ed]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Banquet not found</h2>
          <button
            onClick={() => navigate('/banquets')}
            className="luxury-gradient text-white px-6 py-2 rounded-md hover:opacity-90"
          >
            Back to Banquets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1ed]">
      <style>{`
        .luxury-gradient {
          background: linear-gradient(135deg, #d4a574 0%, #c9964b 100%);
        }
        .luxury-text {
          background: linear-gradient(135deg, #d4a574 0%, #c9964b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .luxury-border {
          border-color: #d4a574;
        }
      `}</style>

      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center" 
        style={{
          backgroundImage: `linear-gradient(rgba(61,52,70,0.4), rgba(61,52,70,0.5)), url(${getImageUrl(banquet.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f29da8c3a0?w=1920&q=80')})`,
          backgroundColor: '#3d3446'
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 text-center">
            Book A Banquet
          </h1>
          <p className="text-2xl md:text-3xl text-center font-light">
            Plan Your Grand Event
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-gray-800 mb-4">
            Book Your Banquet
          </h2>
          <p className="text-lg text-gray-600">
            Plan Your Grand Event
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Left: Event Details Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6 pb-4 border-b-2 luxury-border">
              <div className="h-px luxury-gradient w-12"></div>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mx-4">Event Details</h3>
              <div className="h-px luxury-gradient w-12"></div>
            </div>

            {/* Event Type Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">Event Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'wedding', label: 'Wedding', icon: Heart },
                  { type: 'corporate', label: 'Corporate', icon: Briefcase },
                  { type: 'party', label: 'Party', icon: PartyPopper }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setBookingForm({ ...bookingForm, eventType: type })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bookingForm.eventType === type
                        ? 'luxury-border luxury-gradient text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full mb-2 ${
                        bookingForm.eventType === type
                          ? 'bg-white/20'
                          : 'luxury-gradient'
                      }`}>
                        <Icon className={`h-5 w-5 text-white`} />
                      </div>
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={bookingForm.fullName}
                  onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Additional Requests</label>
                <textarea
                  value={bookingForm.additionalRequirements}
                  onChange={(e) => setBookingForm({ ...bookingForm, additionalRequirements: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Special requirements or notes..."
                />
              </div>

              {/* Special Package Option */}
              <div className="border border-amber-300 rounded-lg p-4 bg-amber-50">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={bookingForm.specialPackage}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialPackage: e.target.checked })}
                    className="mt-1 mr-3"
                    id="specialPackage"
                  />
                  <label htmlFor="specialPackage" className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">
                      Opt for our all-inclusive Special Banquet Package
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      ₹2,000 per guest inc. tax
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        Gourmet catering
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        State-of-art AV setup
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        Customizable decor
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        Floral arrangements
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        Floral arrangements
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        +43 more
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Event Summary */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 luxury-border">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-amber-500 w-12"></div>
              <h3 className="text-2xl font-serif font-bold luxury-text mx-4">Event Summary</h3>
              <div className="h-px bg-amber-500 w-12"></div>
            </div>

            {/* Banquet Image */}
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={getImageUrl(banquet.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f29da8c3a0?w=800')}
                alt={banquet.name}
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Event Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 luxury-text mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Venue:</div>
                  <div className="font-semibold">{banquet.name}</div>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Heart className="h-5 w-5 luxury-text mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Event Type:</div>
                  <div className="font-semibold capitalize">{bookingForm.eventType}</div>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 luxury-text mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Event Date:</div>
                  <input
                    type="date"
                    value={bookingForm.eventDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="font-semibold border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 luxury-text mr-3" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Number of Guests:</div>
                  <select
                    value={bookingForm.numberOfGuests}
                    onChange={(e) => setBookingForm({ ...bookingForm, numberOfGuests: parseInt(e.target.value) })}
                    className="font-semibold border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                  >
                    <option value="50">50 Guests</option>
                    <option value="100">100 Guests</option>
                    <option value="150">150 Guests</option>
                    <option value="200">200 Guests</option>
                    <option value="300">300 Guests</option>
                    <option value="500">500 Guests</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Package Pricing */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Package:</span>
                <span className="text-2xl font-bold luxury-text">₹ {calculateTotal().toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500">
                Base: ₹{banquet.pricePerDay.toLocaleString()}
                {bookingForm.specialPackage && ` + Special Package: ₹2,000`}
              </div>
            </div>

            {/* Book Now Button */}
            <button
              onClick={handleBooking}
              disabled={bookingLoading}
              className="w-full luxury-gradient text-white py-4 rounded-md font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
            >
              {bookingLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  BOOK NOW
                  <span className="ml-2">→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Banquet Amenities Included */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="h-px bg-amber-500 w-16"></div>
            <h2 className="text-3xl font-serif font-bold text-gray-800 mx-6">Banquet Amenities Included</h2>
            <div className="h-px bg-amber-500 w-16"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: '🏛️', title: 'Opulent', subtitle: 'Ballroom Decor' },
              { icon: '🎪', title: 'Customized', subtitle: 'Event Setup' },
              { icon: '🔔', title: 'Gourmet', subtitle: 'Catering' },
              { icon: '🍽️', title: 'Dedicated', subtitle: 'Event Planner' },
              { icon: '📋', title: 'State-of-', subtitle: 'The-AV Equipment' },
              { icon: '⛺', title: 'Bridal Suite', subtitle: 'for Preparation' }
            ].map((amenity, index) => (
              <div key={index} className="text-center">
                <div className="luxury-gradient p-4 rounded-full w-20 h-20 mx-auto mb-3 flex items-center justify-center text-3xl">
                  {amenity.icon}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{amenity.title}</p>
                <p className="text-xs text-gray-600">{amenity.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Booking Button */}
        <div className="text-center">
          <button
            onClick={handleBooking}
            disabled={bookingLoading}
            className="luxury-gradient text-white px-12 py-4 rounded-md font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center"
          >
            {bookingLoading ? 'Processing...' : 'CONFIRM BOOKING'}
            <span className="ml-2">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookBanquet;
