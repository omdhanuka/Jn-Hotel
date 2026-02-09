import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Users, MapPin, Star, CreditCard, Edit, X, Clock, AlertTriangle, 
  ArrowLeft, CheckCircle2, XCircle, HourglassIcon, CheckCheck, FileText, Mail, Phone 
} from 'lucide-react';
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
  maxGuests?: number;
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
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookingData = response.data;
      setBooking(bookingData);

      // Set initial form values
      setModifyForm({
        checkIn: bookingData.checkIn.split('T')[0],
        checkOut: bookingData.checkOut.split('T')[0],
        guests: bookingData.guests,
        specialRequests: bookingData.specialRequests || ''
      });

      // Fetch resource details
      let resourceEndpoint = '';
      if (bookingData.type === 'room' || bookingData.type === 'hotel') {
        resourceEndpoint = `http://localhost:5000/api/rooms/${bookingData.resourceId}`;
      } else if (bookingData.type === 'banquet') {
        resourceEndpoint = `http://localhost:5000/api/banquets/${bookingData.resourceId}`;
      } else if (bookingData.type === 'table') {
        resourceEndpoint = `http://localhost:5000/api/restaurant/tables/${bookingData.resourceId}`;
      }

      if (resourceEndpoint) {
        const resourceResponse = await axios.get(resourceEndpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResource(resourceResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      console.log('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        code: error.response?.data?.code
      });
      
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this booking');
      } else if (error.response?.status === 404) {
        toast.error('Booking not found');
      } else {
        toast.error('Failed to load booking details');
      }
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const canModifyBooking = () => {
    if (!booking || !user) return false;
    if (user.role === 'staff' || user.role === 'reception') return false;
    if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilCheckIn > 48;
  };

  const canCancelBooking = () => {
    if (!booking || !user) return false;
    if (user.role === 'staff' || user.role === 'reception') return false;
    if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilCheckIn > 24;
  };

  const handleModifyBooking = async () => {
    try {
      const checkInDate = new Date(modifyForm.checkIn);
      const checkOutDate = new Date(modifyForm.checkOut);
      
      if (checkInDate >= checkOutDate) {
        toast.error('Check-out date must be after check-in date');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}`,
        modifyForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBooking(response.data);
      setIsModifying(false);
      toast.success('Booking updated successfully!');
      
      // Refetch to get updated data
      fetchBookingDetails();
    } catch (error: any) {
      console.error('Error modifying booking:', error);
      toast.error(error.response?.data?.message || 'Failed to modify booking');
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Booking cancelled successfully');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        icon: <HourglassIcon className="w-4 h-4" />,
        gradient: 'from-yellow-500 via-amber-500 to-orange-500',
        text: 'Pending'
      },
      confirmed: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        text: 'Confirmed'
      },
      cancelled: {
        icon: <XCircle className="w-4 h-4" />,
        gradient: 'from-red-500 via-rose-500 to-pink-500',
        text: 'Cancelled'
      },
      completed: {
        icon: <CheckCheck className="w-4 h-4" />,
        gradient: 'from-blue-500 via-indigo-500 to-purple-500',
        text: 'Completed'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.gradient} text-white font-semibold shadow-lg`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
    );
  };

  const getPaymentBadge = (status: string) => {
    const config = {
      paid: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        gradient: 'from-emerald-500 to-teal-500',
        text: 'Payment Completed'
      },
      pending: {
        icon: <Clock className="w-4 h-4" />,
        gradient: 'from-amber-500 to-orange-500',
        text: 'Payment Pending'
      },
      refunded: {
        icon: <XCircle className="w-4 h-4" />,
        gradient: 'from-gray-500 to-slate-500',
        text: 'Refunded'
      }
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${statusConfig.gradient} text-white font-medium shadow-md`}>
        {statusConfig.icon}
        <span>{statusConfig.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gradient-to-r from-blue-600 to-indigo-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Loading Booking Details...
          </p>
        </div>
      </div>
    );
  }

  if (!booking || !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Booking Details
              </h1>
              <p className="text-gray-600">Reference #{booking._id.slice(-8).toUpperCase()}</p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        {/* Warning Banner */}
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <div className="mb-6 space-y-3">
            {!canModifyBooking() && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mr-3" />
                  <p className="text-blue-800 font-medium">
                    Booking modifications are not available within 48 hours of check-in
                  </p>
                </div>
              </div>
            )}
            {!canCancelBooking() && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-3" />
                  <p className="text-amber-800 font-medium">
                    Booking cancellations are not available within 24 hours of check-in
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resource Information Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {resource.images && resource.images.length > 0 && (
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={resource.images[0].startsWith('http') ? resource.images[0] : `http://localhost:5000${resource.images[0]}`}
                    alt={resource.name || `Room ${resource.roomNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="text-3xl font-bold mb-1">
                      {resource.name || `Room ${resource.roomNumber}`}
                    </h2>
                    <p className="text-lg opacity-90">{resource.type}</p>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-6">{resource.description}</p>
                
                {resource.amenities && resource.amenities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Amenities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resource.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Information Card */}
            {!isModifying ? (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Booking Information</h3>
                  <div className="flex gap-3">
                    {canModifyBooking() && (
                      <button
                        onClick={() => setIsModifying(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition-all font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Modify
                      </button>
                    )}
                    {canCancelBooking() && (
                      <button
                        onClick={handleCancelBooking}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-xl transition-all font-medium"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Check-in</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(booking.checkIn).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Check-out</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(booking.checkOut).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Guests</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {booking.guests} {booking.guests > 1 ? 'Guests' : 'Guest'}
                      </p>
                    </div>
                  </div>

                  {booking.type !== 'table' && (
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Duration</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {calculateNights()} {calculateNights() > 1 ? 'Nights' : 'Night'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {booking.specialRequests && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                    <p className="text-gray-700">{booking.specialRequests}</p>
                  </div>
                )}

                {booking.services && booking.services.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Additional Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.services.map((service, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-medium"
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
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Modify Booking</h3>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        value={modifyForm.checkIn}
                        onChange={(e) => setModifyForm(prev => ({ ...prev, checkIn: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        value={modifyForm.checkOut}
                        onChange={(e) => setModifyForm(prev => ({ ...prev, checkOut: e.target.value }))}
                        min={modifyForm.checkIn}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Guests
                    </label>
                    <select
                      value={modifyForm.guests}
                      onChange={(e) => setModifyForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {Array.from({ length: resource.maxGuests || resource.capacity || 10 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Requests
                    </label>
                    <textarea
                      value={modifyForm.specialRequests}
                      onChange={(e) => setModifyForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      rows={4}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Any special requests or preferences..."
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setIsModifying(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModifyBooking}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition-all font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Payment Summary
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">
                    {booking.type === 'table' ? 'Reservation' : `${calculateNights()} night${calculateNights() > 1 ? 's' : ''}`}
                  </span>
                  <span className="font-semibold text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-xl font-bold pt-2">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ₹{booking.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {getPaymentBadge(booking.paymentStatus)}
              
              {booking.status !== 'cancelled' && booking.paymentStatus === 'paid' && (
                <button
                  onClick={() => navigate(`/invoice/room/${booking._id}`)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-xl transition-all font-medium"
                >
                  <FileText className="w-5 h-5" />
                  View Invoice
                </button>
              )}
              
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-2">Booking Policy</p>
                <ul className="text-xs text-gray-600 leading-relaxed space-y-1">
                  <li>• Modifications allowed up to 48 hours before check-in</li>
                  <li>• Free cancellation up to 24 hours before check-in</li>
                  <li>• No refund for cancellations within 24 hours</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
