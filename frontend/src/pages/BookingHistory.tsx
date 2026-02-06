import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CheckCircle, FileText, Star, XCircle, 
  Download, Users, Clock, CreditCard, MessageSquare
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  type: 'room' | 'banquet' | 'table';
  resourceId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'refunded' | 'cancelled';
  specialRequests?: string;
  services: string[];
  createdAt: string;
  source?: string;
  hasReview?: boolean;
}

const BookingHistory: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchPastBookings();
  }, []);

  const fetchPastBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allBookings = response.data.bookings || [];
      const past = allBookings.filter((b: Booking) => 
        b.status === 'completed' || b.status === 'cancelled'
      );
      
      setBookings(past);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch booking history');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg">
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold shadow-lg">
        <XCircle className="w-4 h-4" />
        <span>Cancelled</span>
      </div>
    );
  };

  const getPaymentBadge = (status: string) => {
    const config = {
      paid: {
        gradient: 'from-emerald-500 to-teal-500',
        text: 'Paid'
      },
      refunded: {
        gradient: 'from-blue-500 to-indigo-500',
        text: 'Refunded'
      },
      cancelled: {
        gradient: 'from-gray-500 to-slate-500',
        text: 'Cancelled'
      }
    };

    const statusConfig = config[status as keyof typeof config] || config.paid;

    return (
      <span className={`inline-flex px-3 py-1 rounded-full bg-gradient-to-r ${statusConfig.gradient} text-white text-sm font-medium`}>
        {statusConfig.text}
      </span>
    );
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalSpent = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1600&q=80')`,
        }}
      >
        <div className="text-center text-white z-10 px-4">
          <div className="inline-block bg-emerald-500/20 backdrop-blur-sm px-6 py-2 rounded-full mb-4 border-2 border-emerald-400/50">
            <CheckCircle className="inline h-6 w-6 mr-2 text-emerald-400" />
            <span className="text-xl font-bold uppercase tracking-wider">Booking History</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 tracking-wide">
            YOUR HISTORY
          </h1>
          <p className="text-2xl md:text-3xl font-serif italic text-amber-200">
            Review Your Past Stays
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <span className="text-3xl font-bold text-emerald-600">{completedCount}</span>
            </div>
            <p className="text-gray-700 font-semibold">Completed Stays</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <span className="text-3xl font-bold text-red-600">{cancelledCount}</span>
            </div>
            <p className="text-gray-700 font-semibold">Cancelled Bookings</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="h-8 w-8 text-amber-600" />
              <span className="text-3xl font-bold text-amber-600">₹{totalSpent.toLocaleString()}</span>
            </div>
            <p className="text-gray-700 font-semibold">Total Spent</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-semibold uppercase tracking-wide transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-500'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-3 rounded-lg font-semibold uppercase tracking-wide transition-all ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-500'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-6 py-3 rounded-lg font-semibold uppercase tracking-wide transition-all ${
              filter === 'cancelled'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-500'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-amber-100">
            <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Booking History</h3>
            <p className="text-gray-600 mb-6">You don't have any past bookings</p>
            <button
              onClick={() => navigate('/rooms')}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-8 py-3 rounded-lg font-semibold uppercase tracking-wide hover:shadow-lg transition-all"
            >
              Book Your First Stay
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div 
                key={booking._id} 
                className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-amber-100 hover:shadow-2xl transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                  {/* Left: Image */}
                  <div className="lg:col-span-1">
                    <img
                      src={booking.type === 'room' 
                        ? 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80'
                        : booking.type === 'banquet'
                        ? 'https://images.unsplash.com/photo-1519167758481-83f29da8c2b6?w=600&q=80'
                        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'
                      }
                      alt={booking.type}
                      className="w-full h-64 lg:h-full object-cover rounded-xl"
                    />
                  </div>

                  {/* Middle: Details */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                        {booking.type === 'room' ? 'Hotel Room' : booking.type === 'banquet' ? 'Banquet Hall' : 'Restaurant Table'}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Check-in</p>
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
                        <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Check-out</p>
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
                        <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Guests</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {booking.guests} {booking.guests > 1 ? 'Guests' : 'Guest'}
                          </p>
                        </div>
                      </div>

                      {booking.type !== 'table' && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {calculateNights(booking.checkIn, booking.checkOut)} Nights
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200 h-full flex flex-col">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600 uppercase tracking-wide">Payment</span>
                          {getPaymentBadge(booking.paymentStatus)}
                        </div>

                        <div className="mb-6">
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="text-4xl font-bold text-amber-600">
                            ₹{booking.totalAmount.toLocaleString()}
                          </p>
                        </div>

                        <div className="mb-4 text-sm text-gray-700">
                          <p><strong>Booking ID:</strong> #{booking._id.slice(-8).toUpperCase()}</p>
                          <p><strong>Booked on:</strong> {new Date(booking.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Link
                          to={`/booking/${booking._id}`}
                          className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3 rounded-lg font-semibold uppercase tracking-wide hover:shadow-xl transition-all"
                        >
                          View Details
                        </Link>

                        {booking.paymentStatus === 'paid' && (
                          <Link
                            to={`/invoice/room/${booking._id}`}
                            className="flex items-center justify-center gap-2 w-full bg-white text-emerald-600 border-2 border-emerald-600 text-center py-3 rounded-lg font-semibold uppercase tracking-wide hover:bg-emerald-50 transition-all"
                          >
                            <FileText className="h-4 w-4" />
                            View Invoice
                          </Link>
                        )}

                        {booking.status === 'completed' && !booking.hasReview && (
                          <button
                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-center py-3 rounded-lg font-semibold uppercase tracking-wide hover:shadow-xl transition-all"
                          >
                            <Star className="h-4 w-4" />
                            Leave Review
                          </button>
                        )}

                        {booking.status === 'completed' && (
                          <button
                            className="flex items-center justify-center gap-2 w-full bg-white text-amber-600 border-2 border-amber-600 text-center py-3 rounded-lg font-semibold uppercase tracking-wide hover:bg-amber-50 transition-all"
                          >
                            <Calendar className="h-4 w-4" />
                            Book Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
