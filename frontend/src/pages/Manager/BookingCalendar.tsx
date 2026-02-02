import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, ChevronLeft, ChevronRight, BedDouble, Building, 
  Users, DollarSign, Phone, Mail, CheckCircle, Clock, 
  Filter, RefreshCw, Eye
} from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';

interface CalendarBooking {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'room' | 'banquet';
  status: string;
  resourceName: string;
  resourceType?: string;
  resourceCapacity?: number;
  guestName: string;
  guestPhone: string;
  guests: number;
  totalAmount: number;
  paymentStatus: string;
  isCheckedIn?: boolean;
  isCheckedOut?: boolean;
  eventType?: string;
}

const BookingCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'room' | 'banquet'>('all');
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    roomBookings: 0,
    banquetBookings: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [currentDate, filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await axios.get('/manager/bookings/calendar', {
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          type: filter
        }
      });

      console.log('Calendar bookings response:', response.data);
      console.log('Total bookings fetched:', response.data.bookings?.length);
      console.log('Room bookings:', response.data.roomBookings?.length);
      console.log('Banquet bookings:', response.data.banquetBookings?.length);
      
      // Debug: Log ALL bookings with their dates
      if (response.data.bookings && response.data.bookings.length > 0) {
        console.log('=== ALL BOOKINGS ===');
        response.data.bookings.forEach((booking: any, index: number) => {
          console.log(`Booking ${index + 1}:`, {
            title: booking.title,
            start: booking.start,
            end: booking.end,
            startDate: new Date(booking.start).toLocaleDateString(),
            endDate: new Date(booking.end).toLocaleDateString(),
            status: booking.status,
            type: booking.type
          });
        });
      }

      setBookings(response.data.bookings || []);
      setStats(response.data.stats || { totalBookings: 0, roomBookings: 0, banquetBookings: 0 });
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date | null; bookings: CalendarBooking[] }> = [];

    // Add empty days for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, bookings: [] });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      
      const dayBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.start);
        const bookingEnd = new Date(booking.end);
        
        // Normalize dates to compare only year, month, and day (ignore time)
        const bookingStartDate = new Date(bookingStart.getFullYear(), bookingStart.getMonth(), bookingStart.getDate());
        const bookingEndDate = new Date(bookingEnd.getFullYear(), bookingEnd.getMonth(), bookingEnd.getDate());
        const currentDayDate = new Date(year, month, day);
        
        // Debug logging for Room 102
        if (booking.title?.includes('Room 102') && day === 1) {
          console.log(`Room 102 Debug (Day ${day}):`, {
            bookingTitle: booking.title,
            bookingStartDate: bookingStartDate.toLocaleDateString(),
            bookingEndDate: bookingEndDate.toLocaleDateString(),
            currentDayDate: currentDayDate.toLocaleDateString(),
            startCheck: currentDayDate >= bookingStartDate,
            endCheck: currentDayDate <= bookingEndDate,
            willShow: currentDayDate >= bookingStartDate && currentDayDate <= bookingEndDate
          });
        }
        
        // Check if current day falls within the booking date range (inclusive)
        return currentDayDate >= bookingStartDate && currentDayDate <= bookingEndDate;
      });
      days.push({ date: currentDay, bookings: dayBookings });
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'room' ? <BedDouble className="h-3 w-3" /> : <Building className="h-3 w-3" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'room' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-8 w-8 mr-3 text-indigo-600" />
                Booking Calendar
              </h1>
              <p className="text-gray-600 mt-2">View all room and banquet bookings in calendar format</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchBookings}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
              </div>
              <Calendar className="h-12 w-12 text-indigo-400" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Room Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.roomBookings}</p>
              </div>
              <BedDouble className="h-12 w-12 text-blue-400" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Banquet Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.banquetBookings}</p>
              </div>
              <Building className="h-12 w-12 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => setFilter('room')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  filter === 'room'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BedDouble className="h-4 w-4 mr-1" />
                Rooms Only
              </button>
              <button
                onClick={() => setFilter('banquet')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  filter === 'banquet'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building className="h-4 w-4 mr-1" />
                Banquets Only
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
              >
                Go to Today
              </button>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {dayNames.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-32 p-2 border-r border-b last:border-r-0 ${
                    day.date ? 'bg-white' : 'bg-gray-50'
                  } ${
                    day.date && day.date.toDateString() === new Date().toDateString()
                      ? 'bg-indigo-50'
                      : ''
                  }`}
                >
                  {day.date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        day.date.toDateString() === new Date().toDateString()
                          ? 'text-indigo-600 font-bold'
                          : 'text-gray-700'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.bookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailModal(true);
                            }}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity border ${getStatusColor(booking.status)}`}
                            title={`${booking.resourceName} - ${booking.guestName} (${booking.status})`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className={`w-2 h-2 rounded-full ${getTypeColor(booking.type)}`} />
                              <span className="font-medium truncate">
                                {booking.resourceName || (booking.type === 'room' ? 'Room' : 'Banquet')}
                              </span>
                            </div>
                            <div className="text-xs truncate">{booking.guestName || 'Guest'}</div>
                          </div>
                        ))}
                        {day.bookings.length > 3 && (
                          <div className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">
                            +{day.bookings.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700">Room Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-700">Banquet Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-4 rounded bg-green-100 border border-green-300"></div>
              <span className="text-sm text-gray-700">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
              <span className="text-sm text-gray-700">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-sm text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-4 rounded bg-red-100 border border-red-300"></div>
              <span className="text-sm text-gray-700">Cancelled</span>
            </div>
          </div>
        </div>

        {/* Booking Detail Modal */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    {selectedBooking.type === 'room' ? (
                      <BedDouble className="h-6 w-6 mr-2 text-blue-600" />
                    ) : (
                      <Building className="h-6 w-6 mr-2 text-purple-600" />
                    )}
                    {selectedBooking.resourceName}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Booking ID: {selectedBooking.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                  {selectedBooking.isCheckedIn && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Checked In
                    </span>
                  )}
                  {selectedBooking.isCheckedOut && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      Checked Out
                    </span>
                  )}
                </div>

                {/* Guest Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Guest Name</p>
                      <p className="font-medium">{selectedBooking.guestName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {selectedBooking.guestPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Number of Guests</p>
                      <p className="font-medium">{selectedBooking.guests} guests</p>
                    </div>
                    {selectedBooking.eventType && (
                      <div>
                        <p className="text-sm text-gray-600">Event Type</p>
                        <p className="font-medium capitalize">{selectedBooking.eventType}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="font-medium">{new Date(selectedBooking.start).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="font-medium">{new Date(selectedBooking.end).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</p>
                    </div>
                    {selectedBooking.resourceType && (
                      <div>
                        <p className="text-sm text-gray-600">Room Type</p>
                        <p className="font-medium capitalize">{selectedBooking.resourceType}</p>
                      </div>
                    )}
                    {selectedBooking.resourceCapacity && (
                      <div>
                        <p className="text-sm text-gray-600">Hall Capacity</p>
                        <p className="font-medium">{selectedBooking.resourceCapacity} people</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">₹{selectedBooking.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        selectedBooking.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : selectedBooking.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedBooking.paymentStatus === 'paid' ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <Clock className="h-4 w-4 mr-1" />
                        )}
                        {selectedBooking.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => navigate(`/manager/bookings`)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;
