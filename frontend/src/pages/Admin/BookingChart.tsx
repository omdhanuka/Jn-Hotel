import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock, X, User, Phone, Mail, CreditCard, MapPin, TrendingUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ClockIcon from '../../components/ClockIcon';

interface BookingData {
  _id: string;
  checkIn: string;
  checkOut: string;
  roomNumber?: string;
  roomType?: string;
  banquetName?: string;
  banquetType?: string;
  guestName: string;
  status: string;
  paymentStatus: string;
  bookingType: 'room' | 'banquet';
  eventType?: string;
}

interface DateCell {
  date: Date;
  bookings: BookingData[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

const BookingChart: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [rooms, setRooms] = useState<{roomNumber: string, type: string}[]>([]);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'room', 'banquet'
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [currentDate, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      console.log('Fetching bookings for:', startOfMonth, 'to', endOfMonth); // Debug log
      console.log('Current filter type:', filters.type); // Debug log
      
      const response = await axios.get('/bookings/admin/chart', {
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          type: filters.type === 'all' ? undefined : filters.type
        }
      });
      
      console.log('Received bookings:', response.data.bookings); // Debug log
      console.log('Number of bookings:', response.data.bookings?.length || 0); // Debug log
      
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch booking data');
      setBookings([]); // Ensure bookings is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/rooms?limit=100');
      setRooms(response.data.rooms.map((room: any) => ({
        roomNumber: room.roomNumber,
        type: room.type
      })));
    } catch (error) {
      console.error('Failed to fetch rooms');
    }
  };

  const generateCalendar = (): DateCell[][] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar: DateCell[][] = [];
    const today = new Date();
    
    for (let week = 0; week < 6; week++) {
      const weekDays: DateCell[] = [];
      
      for (let day = 0; day < 7; day++) {
        const currentDateCell = new Date(startDate);
        currentDateCell.setDate(startDate.getDate() + week * 7 + day);
        
        // Set time to start of day for comparison
        const cellDateStart = new Date(currentDateCell);
        cellDateStart.setHours(0, 0, 0, 0);
        
        // Set time to end of day for comparison
        const cellDateEnd = new Date(currentDateCell);
        cellDateEnd.setHours(23, 59, 59, 999);
        
        const dayBookings = bookings.filter(booking => {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);
          
          // For banquet bookings, also check if it's the same date
          const isSameDay = checkIn.toDateString() === currentDateCell.toDateString();
          
          // Check if booking overlaps with this calendar day
          const bookingOverlaps = (
            // Booking starts on this day
            (checkIn >= cellDateStart && checkIn <= cellDateEnd) ||
            // Booking ends on this day
            (checkOut >= cellDateStart && checkOut <= cellDateEnd) ||
            // Booking spans across this day (multi-day bookings)
            (checkIn <= cellDateStart && checkOut >= cellDateEnd) ||
            // Same day events (especially for banquets)
            isSameDay
          );
          
          // Debug logging for banquet bookings
          if (booking.bookingType === 'banquet') {
            console.log(`Banquet booking ${booking._id} for date ${currentDateCell.toDateString()}:`, {
              checkIn: checkIn.toISOString(),
              checkOut: checkOut.toISOString(),
              isSameDay,
              bookingOverlaps,
              banquetName: booking.banquetName
            });
          }
          
          return bookingOverlaps;
        }).filter(booking => {
          // Filter by room selection (only for room bookings)
          if (selectedRoom === 'all') return true;
          if (booking.bookingType === 'room') {
            return booking.roomNumber === selectedRoom;
          }
          return true; // Show all banquet bookings regardless of room filter
        });
        
        weekDays.push({
          date: currentDateCell,
          bookings: dayBookings,
          isToday: currentDateCell.toDateString() === today.toDateString(),
          isCurrentMonth: currentDateCell.getMonth() === month
        });
      }
      
      calendar.push(weekDays);
    }
    
    return calendar;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const TimeDisplay: React.FC<{ startTime: string; endTime: string }> = ({ startTime, endTime }) => {
    const start = formatTime(startTime);
    const end = formatTime(endTime);
    
    return (
      <div className="flex items-center justify-between mt-1 bg-white bg-opacity-20 rounded px-1 py-0.5">
        <div className="flex items-center space-x-1">
          <ClockIcon time={start} size="sm" className="text-white opacity-80" />
          <span className="text-xs font-mono">{start}</span>
        </div>
        <span className="text-xs mx-1">→</span>
        <div className="flex items-center space-x-1">
          <ClockIcon time={end} size="sm" className="text-white opacity-80" />
          <span className="text-xs font-mono">{end}</span>
        </div>
      </div>
    );
  };

  const handleDateClick = (cell: DateCell) => {
    if (cell.bookings.length > 0) {
      setSelectedDate(cell.date);
      setShowDateModal(true);
    }
  };

  const getBookingTypeLabel = (booking: BookingData) => {
    if (booking.bookingType === 'room') {
      return `Room ${booking.roomNumber || 'N/A'}`;
    }
    return booking.banquetName || 'Banquet';
  };

  const getBookingDuration = (booking: BookingData) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const duration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
    
    if (booking.bookingType === 'banquet') {
      return `${duration} hours`;
    }
    const days = Math.ceil(duration / 24);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const getSelectedDateBookings = () => {
    if (!selectedDate) return [];
    
    const cellDateStart = new Date(selectedDate);
    cellDateStart.setHours(0, 0, 0, 0);
    
    const cellDateEnd = new Date(selectedDate);
    cellDateEnd.setHours(23, 59, 59, 999);
    
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const isSameDay = checkIn.toDateString() === selectedDate.toDateString();
      
      return (
        (checkIn >= cellDateStart && checkIn <= cellDateEnd) ||
        (checkOut >= cellDateStart && checkOut <= cellDateEnd) ||
        (checkIn <= cellDateStart && checkOut >= cellDateEnd) ||
        isSameDay
      );
    }).sort((a, b) => {
      // Sort by booking type (room first, then banquet)
      if (a.bookingType !== b.bookingType) {
        return a.bookingType === 'room' ? -1 : 1;
      }
      // Then sort by check-in time
      return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendar = generateCalendar();

  const stats = {
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    rooms: bookings.filter(b => b.bookingType === 'room').length,
    banquets: bookings.filter(b => b.bookingType === 'banquet').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Calendar</h1>
        <p className="text-gray-600">Visual timeline of all bookings and events</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.confirmed}</div>
          <div className="text-xs text-green-100 mt-1">Confirmed</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.pending}</div>
          <div className="text-xs text-yellow-100 mt-1">Pending</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.completed}</div>
          <div className="text-xs text-blue-100 mt-1">Completed</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.cancelled}</div>
          <div className="text-xs text-red-100 mt-1">Cancelled</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.rooms}</div>
          <div className="text-xs text-orange-100 mt-1">Rooms</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.banquets}</div>
          <div className="text-xs text-purple-100 mt-1">Banquets</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-3 flex-1 lg:justify-end">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Bookings</option>
              <option value="room">Room Bookings</option>
              <option value="banquet">Banquet Bookings</option>
            </select>

            {filters.type !== 'banquet' && (
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Rooms</option>
                {rooms.map(room => (
                  <option key={room.roomNumber} value={room.roomNumber}>
                    Room {room.roomNumber} ({room.type})
                  </option>
                ))}
              </select>
            )}
            
            <button 
              onClick={fetchBookings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {bookings.length} total booking{bookings.length !== 1 ? 's' : ''} this month
              </p>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center">
                <span className="text-sm font-bold text-gray-700">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendar.flat().map((cell, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(cell)}
                className={`min-h-[140px] border-2 rounded-xl p-3 transition-all duration-200 ${
                  !cell.isCurrentMonth 
                    ? 'bg-gray-50 border-gray-200 text-gray-400' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                } ${
                  cell.isToday 
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                    : ''
                } ${
                  cell.bookings.length > 0 
                    ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' 
                    : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold ${
                    cell.isToday 
                      ? 'text-blue-600 text-lg' 
                      : cell.isCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                  }`}>
                    {cell.date.getDate()}
                  </span>
                  {cell.bookings.length > 0 && (
                    <span className="flex items-center justify-center h-6 w-6 text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full font-bold shadow-md">
                      {cell.bookings.length}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  {cell.bookings.slice(0, 2).map((booking, bookingIndex) => (
                    <div
                      key={bookingIndex}
                      className={`text-xs p-2 rounded-lg text-white shadow-sm transition-transform hover:scale-105 ${
                        getStatusColor(booking.status)
                      } ${
                        booking.bookingType === 'banquet' 
                          ? 'border-l-4 border-purple-300' 
                          : 'border-l-4 border-orange-300'
                      }`}
                      title={`Click to view all bookings for ${cell.date.toLocaleDateString()}`}
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        {booking.bookingType === 'room' ? (
                          <>
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {booking.roomNumber !== 'N/A' ? `Room ${booking.roomNumber}` : 'Room N/A'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{booking.banquetName || 'Banquet'}</span>
                          </>
                        )}
                      </div>
                      <div className="opacity-90 truncate flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{booking.guestName}</span>
                      </div>
                      {booking.eventType && (
                        <div className="opacity-75 text-[10px] truncate bg-white bg-opacity-20 rounded px-1.5 py-0.5 mt-1">
                          {booking.eventType}
                        </div>
                      )}
                      {booking.bookingType === 'banquet' && (
                        <div className="flex items-center justify-between mt-1 text-[10px] bg-white bg-opacity-20 rounded px-1.5 py-0.5">
                          <span>{formatTime(booking.checkIn)}</span>
                          <span>→</span>
                          <span>{formatTime(booking.checkOut)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {cell.bookings.length > 2 && (
                    <div className="text-xs text-center text-blue-600 font-semibold py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors shadow-sm">
                      +{cell.bookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-bold text-gray-700">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-md shadow-sm"></div>
                <span className="text-xs text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-md shadow-sm"></div>
                <span className="text-xs text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-md shadow-sm"></div>
                <span className="text-xs text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-md shadow-sm"></div>
                <span className="text-xs text-gray-600">Cancelled</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-4 h-4 bg-orange-400 border-l-4 border-orange-300 rounded-md shadow-sm"></div>
                <span className="text-xs text-gray-600">Room</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-400 border-l-4 border-purple-300 rounded-md shadow-sm"></div>
                <span className="text-xs text-gray-600">Banquet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Bookings Modal */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <p className="text-sm text-blue-100">
                    {getSelectedDateBookings().length} booking{getSelectedDateBookings().length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {getSelectedDateBookings().length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">No bookings for this date</p>
                  <p className="text-sm text-gray-500 mt-2">Check other dates or add a new booking</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Room Bookings Section */}
                  {getSelectedDateBookings().some(b => b.bookingType === 'room') && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md">
                          <MapPin className="h-5 w-5" />
                          Room Bookings
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {getSelectedDateBookings().filter(b => b.bookingType === 'room').length} room{getSelectedDateBookings().filter(b => b.bookingType === 'room').length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {getSelectedDateBookings()
                          .filter(b => b.bookingType === 'room')
                          .map((booking) => (
                            <div
                              key={booking._id}
                              className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900">
                                      Room {booking.roomNumber}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 capitalize">{booking.roomType}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-orange-600">
                                    {getBookingDuration(booking)}
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {booking.paymentStatus}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 pt-3 border-t border-orange-200">
                                <div className="flex items-center text-sm text-gray-700">
                                  <User className="h-4 w-4 mr-2 text-orange-600" />
                                  <span className="font-medium">{booking.guestName}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Check-in: {formatTime(booking.checkIn)}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Check-out: {formatTime(booking.checkOut)}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded">
                                  ID: {booking._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Banquet Bookings Section */}
                  {getSelectedDateBookings().some(b => b.bookingType === 'banquet') && (
                    <div className={getSelectedDateBookings().some(b => b.bookingType === 'room') ? 'mt-8' : ''}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-md">
                          <Calendar className="h-5 w-5" />
                          Banquet Events
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {getSelectedDateBookings().filter(b => b.bookingType === 'banquet').length} event{getSelectedDateBookings().filter(b => b.bookingType === 'banquet').length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {getSelectedDateBookings()
                          .filter(b => b.bookingType === 'banquet')
                          .map((booking) => (
                            <div
                              key={booking._id}
                              className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900">
                                      {booking.banquetName}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-600 capitalize">{booking.banquetType} Hall</p>
                                    {booking.eventType && (
                                      <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                        {booking.eventType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-purple-600">
                                    {getBookingDuration(booking)}
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {booking.paymentStatus}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 pt-3 border-t border-purple-200">
                                <div className="flex items-center text-sm text-gray-700">
                                  <User className="h-4 w-4 mr-2 text-purple-600" />
                                  <span className="font-medium">{booking.guestName}</span>
                                </div>
                                <div className="bg-purple-100 rounded-lg p-2">
                                  <div className="flex items-center justify-between text-xs text-gray-700">
                                    <div className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1 text-purple-600" />
                                      <span className="font-medium">{formatTime(booking.checkIn)}</span>
                                    </div>
                                    <span className="text-purple-600">→</span>
                                    <div className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1 text-purple-600" />
                                      <span className="font-medium">{formatTime(booking.checkOut)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded">
                                  ID: {booking._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDateModal(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingChart;
