import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MapPin, Star, CreditCard, Edit, X, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Booking {
  _id: string;
  type: 'room' | 'banquet' | 'table' | 'hotel';
  resourceId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
  services: string[];
  createdAt: string;
  updatedAt: string;
}

interface Resource {
  _id: string;
  roomNumber?: string;
  name?: string;
  type: string;
  capacity: number;
  price: number;
  amenities?: string[];
  features?: string[];
  images: string[];
  description: string;
}

const BookingDetails: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModifying, setIsModifying] = useState(false);
  const [modifyForm, setModifyForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: ''
  });

  useEffect(() => {
    if (!user) {
      toast.error('Please login to view booking details');
      navigate('/login');
      return;
    }
    fetchBookingDetails();
  }, [bookingId, user, navigate]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/bookings/${bookingId}`);
      const bookingData = response.data;
      setBooking(bookingData);
      
      // Pre-fill modify form
      setModifyForm({
        checkIn: bookingData.checkIn.split('T')[0],
        checkOut: bookingData.checkOut.split('T')[0],
        guests: bookingData.guests,
        specialRequests: bookingData.specialRequests || ''
      });
      
      // Fetch resource details
      await fetchResourceDetails(bookingData.type, bookingData.resourceId);
    } catch (error: any) {
      console.error('Fetch booking error:', error);
      
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this booking');
        // Redirect based on user role
        if (user?.role === 'staff') {
          navigate('/staff/dashboard');
        } else if (user?.role === 'reception') {
          navigate('/reception/dashboard');
        } else if (user?.role === 'admin') {
          navigate('/admin/bookings');
        } else {
          navigate('/dashboard');
        }
      } else if (error.response?.status === 404) {
        toast.error('Booking not found');
        navigate('/dashboard');
      } else {
        toast.error('Failed to fetch booking details');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchResourceDetails = async (type: string, resourceId: string) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'room':
          endpoint = `/rooms/${resourceId}`;
          break;
        case 'banquet':
          endpoint = `/banquets/${resourceId}`;
          break;
        case 'table':
          endpoint = `/restaurant/tables/${resourceId}`;
          break;
      }
      
      if (endpoint) {
        const response = await axios.get(endpoint);
        setResource(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch resource details:', error);
    }
  };

  const canCancelBooking = () => {
    if (!booking || !user) return false;
    
    // Staff cannot cancel bookings, only view them
    if (user.role === 'staff' || user.role === 'reception') {
      return false;
    }
    
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const timeDifference = checkInDate.getTime() - now.getTime();
    const hoursUntilCheckIn = timeDifference / (1000 * 3600);
    
    return hoursUntilCheckIn > 24 && booking.status !== 'cancelled' && booking.status !== 'completed';
  };

  const canModifyBooking = () => {
    if (!booking || !user) return false;
    
    // Staff cannot modify bookings, only view them
    if (user.role === 'staff' || user.role === 'reception') {
      return false;
    }
    
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const timeDifference = checkInDate.getTime() - now.getTime();
    const hoursUntilCheckIn = timeDifference / (1000 * 3600);
    
    return hoursUntilCheckIn > 24 && booking.status === 'confirmed';
  };

  const getTimeUntilCheckIn = () => {
    if (!booking) return '';
    
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const timeDifference = checkInDate.getTime() - now.getTime();
    const hoursUntilCheckIn = timeDifference / (1000 * 3600);
    
    if (hoursUntilCheckIn < 0) {
      return 'Check-in time has passed';
    } else if (hoursUntilCheckIn < 24) {
      return `${Math.round(hoursUntilCheckIn)} hours until check-in`;
    } else {
      const days = Math.floor(hoursUntilCheckIn / 24);
      const hours = Math.round(hoursUntilCheckIn % 24);
      return `${days} days, ${hours} hours until check-in`;
    }
  };

  const handleCancelBooking = async () => {
    if (!canCancelBooking()) {
      toast.error('Cannot cancel booking within 24 hours of check-in');
      return;
    }

    const confirmMessage = booking?.paymentStatus === 'paid' 
      ? 'Are you sure you want to cancel this booking? A refund will be processed.'
      : 'Are you sure you want to cancel this booking?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await axios.delete(`/bookings/${bookingId}`);
      
      // Show appropriate success message based on payment status
      if (response.data.paymentAction) {
        toast.success(`Booking cancelled successfully. ${response.data.paymentAction}`);
      } else {
        toast.success('Booking cancelled successfully');
      }
      
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleModifyBooking = async () => {
    if (!canModifyBooking()) {
      toast.error('Cannot modify booking within 24 hours of check-in');
      return;
    }

    if (new Date(modifyForm.checkIn) >= new Date(modifyForm.checkOut)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    try {
      const response = await axios.put(`/bookings/${bookingId}`, {
        checkIn: modifyForm.checkIn,
        checkOut: modifyForm.checkOut,
        guests: modifyForm.guests,
        specialRequests: modifyForm.specialRequests
      });
      
      setBooking(response.data);
      setIsModifying(false);
      toast.success('Booking updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              // Redirect back based on user role
              if (user?.role === 'staff') {
                navigate('/staff/banquets');
              } else if (user?.role === 'reception') {
                navigate('/reception/dashboard');
              } else if (user?.role === 'admin') {
                navigate('/admin/bookings');
              } else {
                navigate('/dashboard');
              }
            }}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to {user?.role === 'staff' ? 'Banquet Bookings' : 'Dashboard'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          {(user?.role === 'staff' || user?.role === 'reception') && (
            <p className="text-sm text-gray-600 mt-2">View-only mode (Staff Access)</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Booking #{booking._id.slice(-8).toUpperCase()}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {canModifyBooking() && (
                    <button
                      onClick={() => setIsModifying(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modify
                    </button>
                  )}
                  {canCancelBooking() && (
                    <button
                      onClick={handleCancelBooking}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Time Warning */}
              {!canCancelBooking() && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      Cancellation and modification not available within 24 hours of check-in
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{getTimeUntilCheckIn()}</span>
              </div>
            </div>

            {/* Resource Details */}
            {resource && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-300">
                  <img
                    src={resource.images?.[0] || '/placeholder/600/300'}
                    alt={resource.name || `Room ${resource.roomNumber}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {booking.type === 'room' 
                      ? `Room ${resource.roomNumber} - ${resource.type}` 
                      : resource.name
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-2" />
                      <span>Up to {resource.capacity} guests</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                      <span>${resource.price} per {booking.type === 'table' ? 'reservation' : 'night'}</span>
                    </div>
                  </div>

                  {(resource.amenities || resource.features) && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">
                        {booking.type === 'room' ? 'Amenities' : 'Features'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(resource.amenities || resource.features)?.map((item, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Dates and Details */}
            {!isModifying ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">Check-in</span>
                    </div>
                    <p className="text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">Check-out</span>
                    </div>
                    <p className="text-gray-900">{new Date(booking.checkOut).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">Guests</span>
                    </div>
                    <p className="text-gray-900">{booking.guests}</p>
                  </div>
                  
                  {booking.type !== 'table' && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium">Duration</span>
                      </div>
                      <p className="text-gray-900">{calculateNights()} nights</p>
                    </div>
                  )}
                </div>

                {booking.specialRequests && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Special Requests</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{booking.specialRequests}</p>
                  </div>
                )}

                {booking.services && booking.services.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Additional Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.services.map((service, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Modify Form
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Modify Booking</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        value={modifyForm.checkIn}
                        onChange={(e) => setModifyForm(prev => ({ ...prev, checkIn: e.target.value }))}
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
                        value={modifyForm.checkOut}
                        onChange={(e) => setModifyForm(prev => ({ ...prev, checkOut: e.target.value }))}
                        min={modifyForm.checkIn}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Guests
                    </label>
                    <select
                      value={modifyForm.guests}
                      onChange={(e) => setModifyForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {resource && Array.from({ length: resource.capacity }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      value={modifyForm.specialRequests}
                      onChange={(e) => setModifyForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any special requests or preferences..."
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setIsModifying(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModifyBooking}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {booking.type === 'table' ? 'Reservation' : `${calculateNights()} night${calculateNights() > 1 ? 's' : ''}`}
                  </span>
                  <span className="font-medium">₹{booking.totalAmount}</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">₹{booking.totalAmount}</span>
                </div>
                
                <div className="mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Payment {booking.paymentStatus}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                <p><strong>Cancellation Policy:</strong></p>
                <p className="mt-1">
                  Free cancellation up to 24 hours before check-in. 
                  No refund for cancellations within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
export {};
