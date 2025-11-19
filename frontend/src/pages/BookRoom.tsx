import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, Wifi, Car, Coffee, Star, CreditCard, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Room {
  _id: string;
  roomNumber: string;
  roomName?: string;
  type: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  maxGuests: number; // Changed from capacity to maxGuests
  bedCount: number;
  bedType: string;
  roomSize: string;
  viewType: string;
  floor: number;
  isAvailable: boolean;
  status: string;
  images: string[];
  facilities?: any;
  amenities: string[];
  rating?: number;
}

interface BookingForm {
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests: string;
  services: string[];
}

const BookRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
    services: []
  });
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const additionalServices = [
    { id: 'breakfast', name: 'Breakfast included', price: 25 },
    { id: 'parking', name: 'Valet parking', price: 15 },
    { id: 'spa', name: 'Spa access', price: 50 },
    { id: 'airport', name: 'Airport transfer', price: 40 },
    { id: 'laundry', name: 'Laundry service', price: 20 }
  ];

  useEffect(() => {
    if (!user) {
      toast.error('Please login to book a room');
      navigate('/login');
      return;
    }
    
    // Pre-fill dates from URL parameters
    const urlCheckIn = searchParams.get('checkIn');
    const urlCheckOut = searchParams.get('checkOut');
    const urlGuests = searchParams.get('guests');
    
    if (urlCheckIn) {
      setBookingForm(prev => ({ ...prev, checkIn: urlCheckIn }));
    }
    if (urlCheckOut) {
      setBookingForm(prev => ({ ...prev, checkOut: urlCheckOut }));
    }
    if (urlGuests) {
      setBookingForm(prev => ({ ...prev, guests: parseInt(urlGuests) }));
    }
    
    fetchRoom();
  }, [roomId, user, navigate, searchParams]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}`);
      setRoom(response.data);
    } catch (error) {
      toast.error('Room not found');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const calculateTotal = () => {
    if (!room) return 0;
    const nights = calculateNights();
    const roomTotal = room.price * nights;
    const servicesTotal = bookingForm.services.reduce((total, serviceId) => {
      const service = additionalServices.find(s => s.id === serviceId);
      return total + (service ? service.price * nights : 0);
    }, 0);
    return roomTotal + servicesTotal;
  };

  const handleServiceToggle = (serviceId: string) => {
    setBookingForm(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!bookingForm.checkIn || !bookingForm.checkOut) {
        toast.error('Please select check-in and check-out dates');
        return;
      }
      if (new Date(bookingForm.checkIn) >= new Date(bookingForm.checkOut)) {
        toast.error('Check-out date must be after check-in date');
        return;
      }
      const roomCapacity = room?.maxGuests || 2; // Fallback value
      if (bookingForm.guests > roomCapacity) {
        toast.error(`This room can accommodate maximum ${roomCapacity} guests`);
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBooking = async () => {
    setBookingLoading(true);
    try {
      const bookingData = {
        type: 'room',
        resourceId: roomId,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: bookingForm.guests,
        specialRequests: bookingForm.specialRequests,
        services: bookingForm.services
      };

      const response = await axios.post('/api/bookings', bookingData);
      toast.success('Booking confirmed successfully!');
      navigate('/dashboard', { state: { newBooking: response.data } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  // Auto-slide images every 3 seconds
  useEffect(() => {
    if (!room || !room.images || room.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === room.images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [room]);

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Get image source with fallback
  const getImageSrc = (index: number = currentImageIndex) => {
    if (imageError || !room?.images?.[index]) {
      return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500';
    }
    return room.images[index];
  };

  // Navigate to specific image
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Room not found</h2>
          <button
            onClick={() => navigate('/rooms')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Rooms
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
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step ? <Check className="h-6 w-6" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-16 text-sm text-gray-600">
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>
                Room Details
              </span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>
                Services
              </span>
              <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>
                Confirmation
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-64 bg-gray-300 relative overflow-hidden">
                {/* Image Slider */}
                <div className="relative w-full h-full">
                  {room?.images && room.images.length > 0 ? (
                    room.images.map((image, index) => (
                      <img
                        key={index}
                        src={getImageSrc(index)}
                        alt={`${room.roomNumber} - Image ${index + 1}`}
                        className={`absolute w-full h-full object-cover transition-opacity duration-500 ${
                          index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                        onError={handleImageError}
                      />
                    ))
                  ) : (
                    <img
                      src={getImageSrc(0)}
                      alt={room?.roomNumber}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  )}
                </div>

                {/* Image Indicators */}
                {room?.images && room.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {room.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex
                            ? 'bg-white w-8'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Image Counter */}
                {room?.images && room.images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {room.images.length}
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Room {room.roomNumber} - {room.type} 
                    </h1>
                    <p className="text-gray-600 mt-1">{room.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">₹{room.price}</div>
                    <div className="text-sm text-gray-500">per night</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Up to {room.maxGuests || 'N/A'} guests</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <span>Floor {room.floor}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {room.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{amenity}</span>
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
              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        value={bookingForm.checkIn}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        value={bookingForm.checkOut}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                        min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Guests
                      </label>
                      <select
                        value={bookingForm.guests}
                        onChange={(e) => {
                          console.log('Guest selection changed:', e.target.value);
                          const newValue = parseInt(e.target.value);
                          console.log('Parsed value:', newValue);
                          setBookingForm(prev => ({ ...prev, guests: newValue }));
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                        onClick={() => console.log('Dropdown clicked, room data:', room)}
                        onFocus={() => console.log('Dropdown focused')}
                      >
                        <option value={1}>1 Guest</option>
                        <option value={2}>2 Guests</option>
                        <option value={3}>3 Guests</option>
                        <option value={4}>4 Guests</option>
                        <option value={5}>5 Guests</option>
                        <option value={6}>6 Guests</option>
                        {room && room.maxGuests && room.maxGuests > 6 && 
                          Array.from({ length: room.maxGuests - 6 }, (_, i) => i + 7).map(num => (
                            <option key={num} value={num}>
                              {num} Guests
                            </option>
                          ))
                        }
                      </select>
                      <div className="mt-1 text-xs text-gray-500">
                        Room capacity: {room?.maxGuests || 'Loading...'} guests
                        {/* Debug info */}
                        <div className="text-xs text-red-500 mt-1">
                          Debug: maxGuests={room?.maxGuests}, room loaded={!!room}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requests
                      </label>
                      <textarea
                        value={bookingForm.specialRequests}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special requests or preferences..."
                      />
                    </div>
                  </div>
                  
                  {calculateNights() > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>{calculateNights()} nights × ₹{room.price}</span>
                        <span>₹{room.price * calculateNights()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Services</h3>
                  
                  <div className="space-y-3">
                    {additionalServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={bookingForm.services.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-gray-500">₹{service.price} per night</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Room ({calculateNights()} nights)</span>
                        <span>₹{room.price * calculateNights()}</span>
                      </div>
                      {bookingForm.services.length > 0 && (
                        <div className="flex justify-between">
                          <span>Services</span>
                          <span>₹{bookingForm.services.reduce((total, serviceId) => {
                            const service = additionalServices.find(s => s.id === serviceId);
                            return total + (service ? service.price * calculateNights() : 0);
                          }, 0)}</span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h4 className="font-medium">Room Details</h4>
                      <p className="text-sm text-gray-600">Room {room.roomNumber} - {room.type}</p>
                      <p className="text-sm text-gray-600">{bookingForm.guests} guest{bookingForm.guests > 1 ? 's' : ''}</p>
                    </div>
                    
                    <div className="border-b pb-4">
                      <h4 className="font-medium">Dates</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(bookingForm.checkIn).toLocaleDateString()} - {new Date(bookingForm.checkOut).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{calculateNights()} nights</p>
                    </div>
                    
                    {bookingForm.services.length > 0 && (
                      <div className="border-b pb-4">
                        <h4 className="font-medium">Additional Services</h4>
                        {bookingForm.services.map(serviceId => {
                          const service = additionalServices.find(s => s.id === serviceId);
                          return service ? (
                            <p key={serviceId} className="text-sm text-gray-600">{service.name}</p>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount</span>
                        <span className="text-blue-600">₹{calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex space-x-3">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < 3 ? (
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

export default BookRoom;
