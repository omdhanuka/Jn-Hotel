import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock, X, User, Phone, Mail, CreditCard } from 'lucide-react';
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
      
      const response = await axios.get('/api/bookings/admin/chart', {
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
      const response = await axios.get('/api/rooms?limit=100');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Booking Calendar</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Bookings</option>
              <option value="room">Room Bookings</option>
              <option value="banquet">Banquet Bookings</option>
            </select>
          </div>

          {filters.type !== 'banquet' && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Rooms</option>
                {rooms.map(room => (
                  <option key={room.roomNumber} value={room.roomNumber}>
                    Room {room.roomNumber} ({room.type})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button 
            onClick={fetchBookings}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendar.flat().map((cell, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(cell)}
              className={`min-h-[120px] border border-gray-200 p-2 transition-all ${
                !cell.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
              } ${cell.isToday ? 'ring-2 ring-blue-500' : ''} ${
                cell.bookings.length > 0 ? 'cursor-pointer hover:bg-blue-50 hover:shadow-md' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-2 flex justify-between items-center ${
                cell.isToday ? 'text-blue-600' : ''
              }`}>
                <span>{cell.date.getDate()}</span>
                {cell.bookings.length > 0 && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {cell.bookings.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {cell.bookings.slice(0, 2).map((booking, bookingIndex) => (
                  <div
                    key={bookingIndex}
                    className={`text-xs p-2 rounded text-white ${getStatusColor(booking.status)} ${
                      booking.bookingType === 'banquet' ? 'border-l-4 border-purple-300' : ''
                    }`}
                    title={`Click to view all bookings for ${cell.date.toLocaleDateString()}`}
                  >
                    <div className="font-medium truncate">
                      {booking.bookingType === 'room' 
                        ? (booking.roomNumber !== 'N/A' ? `Room ${booking.roomNumber}` : 'Room N/A')
                        : (booking.banquetName || 'Banquet Event')
                      }
                    </div>
                    <div className="opacity-90 truncate">{booking.guestName}</div>
                    {booking.eventType && (
                      <div className="opacity-75 text-xs truncate bg-white bg-opacity-20 rounded px-1 mt-1">
                        {booking.eventType}
                      </div>
                    )}
                    {booking.bookingType === 'banquet' && (
                      <TimeDisplay startTime={booking.checkIn} endTime={booking.checkOut} />
                    )}
                  </div>
                ))}
                {cell.bookings.length > 2 && (
                  <div className="text-xs text-center text-blue-600 font-medium py-1 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
                    +{cell.bookings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bookings for {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
            <div className="text-sm text-green-600">Confirmed</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {bookings.filter(b => b.status === 'completed').length}
            </div>
            <div className="text-sm text-blue-600">Completed</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {bookings.filter(b => b.status === 'cancelled').length}
            </div>
            <div className="text-sm text-red-600">Cancelled</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {bookings.filter(b => b.bookingType === 'room').length}
            </div>
            <div className="text-sm text-orange-600">Room Bookings</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {bookings.filter(b => b.bookingType === 'banquet').length}
            </div>
            <div className="text-sm text-purple-600">Banquet Events</div>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <p className="text-sm">Total bookings loaded: {bookings.length}</p>
          <p className="text-sm">Filter type: {filters.type}</p>
          <p className="text-sm">Current month: {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
          {bookings.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Sample booking:</p>
              <pre className="text-xs bg-white p-2 rounded mt-1">
                {JSON.stringify(bookings[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Date Bookings Modal */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Bookings for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Total: {getSelectedDateBookings().length} booking(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {getSelectedDateBookings().length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Room Bookings Section */}
                  {getSelectedDateBookings().some(b => b.bookingType === 'room') && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm mr-2">
                          Room Bookings
                        </span>
                        <span className="text-sm text-gray-500">
                          ({getSelectedDateBookings().filter(b => b.bookingType === 'room').length})
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {getSelectedDateBookings()
                          .filter(b => b.bookingType === 'room')
                          .map((booking) => (
                            <div
                              key={booking._id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                      Room {booking.roomNumber}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {booking.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                      booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {booking.paymentStatus}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 capitalize">{booking.roomType}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-700">
                                    {getBookingDuration(booking)}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <User className="h-4 w-4 mr-2" />
                                    <span className="font-medium">{booking.guestName}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 ml-6">
                                    ID: {booking._id.slice(-8)}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>Check-in: {new Date(booking.checkIn).toLocaleDateString()} at {formatTime(booking.checkIn)}</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>Check-out: {new Date(booking.checkOut).toLocaleDateString()} at {formatTime(booking.checkOut)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Banquet Bookings Section */}
                  {getSelectedDateBookings().some(b => b.bookingType === 'banquet') && (
                    <div className={getSelectedDateBookings().some(b => b.bookingType === 'room') ? 'mt-6' : ''}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm mr-2">
                          Banquet Events
                        </span>
                        <span className="text-sm text-gray-500">
                          ({getSelectedDateBookings().filter(b => b.bookingType === 'banquet').length})
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {getSelectedDateBookings()
                          .filter(b => b.bookingType === 'banquet')
                          .map((booking) => (
                            <div
                              key={booking._id}
                              className="border border-purple-200 rounded-lg p-4 hover:shadow-md transition bg-purple-50"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                      {booking.banquetName}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {booking.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                      booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {booking.paymentStatus}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <p className="text-sm text-gray-600 capitalize">{booking.banquetType} Hall</p>
                                    {booking.eventType && (
                                      <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                                        {booking.eventType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-700">
                                    {getBookingDuration(booking)}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <User className="h-4 w-4 mr-2" />
                                    <span className="font-medium">{booking.guestName}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 ml-6">
                                    ID: {booking._id.slice(-8)}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>Start: {formatTime(booking.checkIn)}</span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>End: {formatTime(booking.checkOut)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <TimeDisplay startTime={booking.checkIn} endTime={booking.checkOut} />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDateModal(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingChart;
