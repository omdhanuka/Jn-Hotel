import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, Clock, MapPin, Check, CreditCard, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import ClockTimePicker from '../components/ClockTimePicker';

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
  floor: string; // Added floor property
}

interface BookingForm {
  // Customer Details
  fullName: string;
  email: string;
  phone: string;
  address: string;
  
  // Event Details
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  numberOfGuests: number;
  additionalRequirements: string;
  
  // Preferences
  cateringPreference: string;
  decorationTheme: string;
  seatingArrangement: string;
  parkingRequired: boolean;
  numberOfVehicles: number;
  musicDjRequired: boolean;
  
  // Pricing
  bookingType: 'hourly' | 'daily';
  advanceAmount: number;
  paymentMethod: string;
}

const BookBanquet: React.FC = () => {
  const { banquetId } = useParams<{ banquetId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [banquet, setBanquet] = useState<Banquet | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    eventType: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    numberOfGuests: 1,
    additionalRequirements: '',
    cateringPreference: 'both',
    decorationTheme: 'simple',
    seatingArrangement: '',
    parkingRequired: false,
    numberOfVehicles: 0,
    musicDjRequired: false,
    bookingType: 'daily',
    advanceAmount: 0,
    paymentMethod: 'online'
  });

  const eventTypes = [
    'Wedding', 'Birthday Party', 'Corporate Meeting', 'Reception', 
    'Conference', 'Anniversary', 'Engagement', 'Baby Shower', 
    'Graduation Party', 'Business Launch', 'Other'
  ];

  useEffect(() => {
    if (!user) {
      toast.error('Please login to book a banquet');
      navigate('/login');
      return;
    }
    
    // Pre-fill user details
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
      
      // Set default seating arrangement
      if (response.data.seatingArrangements.length > 0) {
        setBookingForm(prev => ({
          ...prev,
          seatingArrangement: response.data.seatingArrangements[0]
        }));
      }
    } catch (error) {
      toast.error('Banquet not found');
      navigate('/banquets');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!bookingForm.startTime || !bookingForm.endTime) return 0;
    const start = new Date(`2000-01-01 ${bookingForm.startTime}`);
    const end = new Date(`2000-01-01 ${bookingForm.endTime}`);
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours < 0) hours += 24; // Handle overnight events
    return Math.max(hours, banquet?.minimumHours || 4);
  };

  const calculateTotal = () => {
    if (!banquet) return 0;
    
    if (bookingForm.bookingType === 'daily') {
      return banquet.pricePerDay;
    } else {
      const hours = calculateDuration();
      return banquet.pricePerHour * hours;
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!bookingForm.fullName || !bookingForm.email || !bookingForm.phone) {
        toast.error('Please fill in all required customer details');
        return;
      }
    } else if (currentStep === 2) {
      if (!bookingForm.eventType || !bookingForm.eventDate || !bookingForm.startTime || !bookingForm.endTime) {
        toast.error('Please fill in all required event details');
        return;
      }
      if (bookingForm.numberOfGuests > (banquet?.capacity || 0)) {
        toast.error(`This hall can accommodate maximum ${banquet?.capacity} guests`);
        return;
      }
      
      // Calculate and set advance amount (20% of total)
      const total = calculateTotal();
      setBookingForm(prev => ({
        ...prev,
        advanceAmount: Math.round(total * 0.2)
      }));
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBooking = async () => {
    setBookingLoading(true);
    try {
      console.log('Starting booking process...'); // Debug log
      
      const bookingData = {
        type: 'banquet',
        resourceId: banquetId,
        checkIn: `${bookingForm.eventDate}T${bookingForm.startTime}`,
        checkOut: `${bookingForm.eventDate}T${bookingForm.endTime}`,
        guests: bookingForm.numberOfGuests,
        totalAmount: calculateTotal(),
        eventDetails: {
          eventType: bookingForm.eventType,
          fullName: bookingForm.fullName,
          phone: bookingForm.phone,
          address: bookingForm.address,
          cateringPreference: bookingForm.cateringPreference,
          decorationTheme: bookingForm.decorationTheme,
          seatingArrangement: bookingForm.seatingArrangement,
          parkingRequired: bookingForm.parkingRequired,
          numberOfVehicles: bookingForm.numberOfVehicles,
          musicDjRequired: bookingForm.musicDjRequired,
          bookingType: bookingForm.bookingType,
          advanceAmount: bookingForm.advanceAmount,
          paymentMethod: bookingForm.paymentMethod
        },
        specialRequests: bookingForm.additionalRequirements
      };

      console.log('Booking data:', bookingData); // Debug log

      const response = await axios.post('/bookings', bookingData);
      console.log('Booking response:', response.data); // Debug log
      
      toast.success('Banquet booking confirmed successfully!');
      navigate('/dashboard', { state: { newBooking: response.data } });
    } catch (error: any) {
      console.error('Booking error:', error); // Debug log
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

  // Auto-play image slider
  useEffect(() => {
    if (!banquet || !banquet.images || banquet.images.length <= 1 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % banquet.images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [banquet, isAutoPlaying]);

  const handlePreviousImage = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => 
      prev === 0 ? (banquet?.images.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => 
      (prev + 1) % (banquet?.images.length || 1)
    );
  };

  const handleThumbnailClick = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!banquet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Banquet not found</h2>
          <button
            onClick={() => navigate('/banquets')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Banquets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step ? <Check className="h-6 w-6" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-12 text-sm text-gray-600">
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>
                Customer Details
              </span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>
                Event Details
              </span>
              <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>
                Preferences
              </span>
              <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : ''}>
                Confirmation
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Image Slider Section */}
              <div className="relative h-96 bg-gray-300 group">
                {/* Main Image Display */}
                <img
                  src={getImageUrl(banquet.images?.[currentImageIndex] || '/placeholder/600/300')}
                  alt={`${banquet.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />

                {/* Image Counter */}
                {banquet.images && banquet.images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {banquet.images.length}
                  </div>
                )}

                {/* Auto-play Indicator */}
                {banquet.images && banquet.images.length > 1 && isAutoPlaying && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs flex items-center">
                    <span className="animate-pulse mr-2">●</span>
                    Auto-playing
                  </div>
                )}

                {/* Navigation Arrows */}
                {banquet.images && banquet.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Thumbnail Navigation */}
                {banquet.images && banquet.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-lg max-w-full overflow-x-auto">
                    {banquet.images.slice(0, 5).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => handleThumbnailClick(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                          currentImageIndex === index
                            ? 'border-blue-500 scale-110'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    {banquet.images.length > 5 && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-md bg-black bg-opacity-70 flex items-center justify-center text-white text-xs">
                        +{banquet.images.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Dots */}
                {banquet.images && banquet.images.length > 1 && banquet.images.length <= 5 && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2">
                    {banquet.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleThumbnailClick(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentImageIndex === index
                            ? 'bg-blue-500 w-8'
                            : 'bg-white bg-opacity-60 hover:bg-opacity-100'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {banquet.name}
                    </h1>
                    <p className="text-gray-600 mt-1 capitalize">{banquet.type} Hall</p>
                    <p className="text-gray-600 mt-1">{banquet.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">₹{banquet.pricePerDay}</div>
                    <div className="text-sm text-gray-500">per day</div>
                    <div className="text-lg font-semibold text-gray-900">₹{banquet.pricePerHour}/hr</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Up to {banquet.capacity} guests</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{banquet.area}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Min {banquet.minimumHours} hours</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <span>Floor {banquet.floor}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Available Facilities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(banquet.facilities || {})
                      .filter(([key, value]) => value)
                      .map(([key]) => (
                        <div key={key} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' ₹1')}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              {/* Step 1: Customer Details */}
              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingForm.fullName}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address (Optional)
                      </label>
                      <textarea
                        value={bookingForm.address}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter address for billing"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Event Details */}
              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Type *
                      </label>
                      <select
                        required
                        value={bookingForm.eventType}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, eventType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select event type</option>
                        {eventTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingForm.eventDate}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, eventDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <ClockTimePicker
                        label="Start Time *"
                        value={bookingForm.startTime}
                        onChange={(time) => setBookingForm(prev => ({ ...prev, startTime: time }))}
                      />
                      
                      <ClockTimePicker
                        label="End Time *"
                        value={bookingForm.endTime}
                        onChange={(time) => setBookingForm(prev => ({ ...prev, endTime: time }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Guests *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={banquet.capacity}
                        value={bookingForm.numberOfGuests || ''}
                        onChange={(e) => setBookingForm(prev => ({ 
                          ...prev, 
                          numberOfGuests: parseInt(e.target.value) || 1 
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Booking Type
                      </label>
                      <select
                        value={bookingForm.bookingType}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, bookingType: e.target.value as 'hourly' | 'daily' }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Full Day</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Requirements
                      </label>
                      <textarea
                        value={bookingForm.additionalRequirements}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Special requirements or notes..."
                      />
                    </div>
                  </div>
                  
                  {calculateDuration() > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm">
                        <div className="flex justify-between mb-2">
                          <span>Duration: {calculateDuration()} hours</span>
                          <span>Type: {bookingForm.bookingType}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total Amount:</span>
                          <span>₹{calculateTotal()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Preferences */}
              {currentStep === 3 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Event Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catering Preference
                      </label>
                      <select
                        value={bookingForm.cateringPreference}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, cateringPreference: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="veg">Vegetarian</option>
                        <option value="non-veg">Non-Vegetarian</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Decoration Theme
                      </label>
                      <select
                        value={bookingForm.decorationTheme}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, decorationTheme: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="simple">Simple</option>
                        <option value="premium">Premium</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seating Arrangement
                      </label>
                      <select
                        value={bookingForm.seatingArrangement}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, seatingArrangement: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {banquet.seatingArrangements.map(arrangement => (
                          <option key={arrangement} value={arrangement}>{arrangement}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bookingForm.parkingRequired}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, parkingRequired: e.target.checked }))}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700">Parking Required</label>
                    </div>
                    
                    {bookingForm.parkingRequired && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Vehicles
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={bookingForm.numberOfVehicles || ''}
                          onChange={(e) => setBookingForm(prev => ({ 
                            ...prev, 
                            numberOfVehicles: parseInt(e.target.value) || 0 
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bookingForm.musicDjRequired}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, musicDjRequired: e.target.checked }))}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700">Music/DJ Setup Required</label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={bookingForm.paymentMethod}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="online">Online Payment</option>
                        <option value="upi">UPI</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span>Total Amount:</span>
                        <span className="font-semibold">₹{calculateTotal()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Amount (20%):</span>
                        <span className="font-semibold text-green-600">₹{bookingForm.advanceAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h4 className="font-medium">Banquet Details</h4>
                      <p className="text-sm text-gray-600">{banquet.name} - {banquet.type} Hall</p>
                      <p className="text-sm text-gray-600">{bookingForm.numberOfGuests} guests</p>
                    </div>
                    
                    <div className="border-b pb-4">
                      <h4 className="font-medium">Event Details</h4>
                      <p className="text-sm text-gray-600">{bookingForm.eventType}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(bookingForm.eventDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bookingForm.startTime} - {bookingForm.endTime} ({calculateDuration()} hours)
                      </p>
                    </div>
                    
                    <div className="border-b pb-4">
                      <h4 className="font-medium">Customer Details</h4>
                      <p className="text-sm text-gray-600">{bookingForm.fullName}</p>
                      <p className="text-sm text-gray-600">{bookingForm.email}</p>
                      <p className="text-sm text-gray-600">{bookingForm.phone}</p>
                    </div>
                    
                    <div className="border-b pb-4">
                      <h4 className="font-medium">Preferences</h4>
                      <p className="text-sm text-gray-600">Catering: {bookingForm.cateringPreference}</p>
                      <p className="text-sm text-gray-600">Decoration: {bookingForm.decorationTheme}</p>
                      <p className="text-sm text-gray-600">Seating: {bookingForm.seatingArrangement}</p>
                      {bookingForm.parkingRequired && (
                        <p className="text-sm text-gray-600">Parking: {bookingForm.numberOfVehicles} vehicles</p>
                      )}
                      {bookingForm.musicDjRequired && (
                        <p className="text-sm text-gray-600">Music/DJ: Required</p>
                      )}
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-semibold">${calculateTotal()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Advance Payment:</span>
                          <span className="font-semibold text-blue-600">${bookingForm.advanceAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="capitalize">{bookingForm.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-6 flex space-x-3">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    onClick={handleNextStep}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {bookingLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookBanquet;
