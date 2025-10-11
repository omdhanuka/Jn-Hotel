import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock } from 'lucide-react';
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
          
          // Fix for same-day events where checkOut might be before checkIn (time-wise)
          let actualCheckOut = new Date(checkOut);
          if (checkOut.getTime() < checkIn.getTime()) {
            // If check-out time is before check-in time, it's the next day
            actualCheckOut = new Date(checkOut);
            actualCheckOut.setDate(actualCheckOut.getDate() + 1);
          }
          
          // Check if booking overlaps with this calendar day
          const bookingOverlaps = (
            // Booking starts on this day
            (checkIn >= cellDateStart && checkIn <= cellDateEnd) ||
            // Booking ends on this day
            (actualCheckOut >= cellDateStart && actualCheckOut <= cellDateEnd) ||
            // Booking spans across this day
            (checkIn <= cellDateStart && actualCheckOut >= cellDateEnd) ||
            // For same-day events, check if the day matches
            (checkIn.toDateString() === currentDateCell.toDateString())
          );
          
          console.log(`Checking booking ${booking._id} for date ${currentDateCell.toDateString()}:`, {
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            actualCheckOut: actualCheckOut.toISOString(),
            cellDateStart: cellDateStart.toISOString(),
            cellDateEnd: cellDateEnd.toISOString(),
            overlaps: bookingOverlaps
          });
          
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
              className={`min-h-[120px] border border-gray-200 p-2 ${
                !cell.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
              } ${cell.isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-sm font-medium mb-2 ${cell.isToday ? 'text-blue-600' : ''}`}>
                {cell.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {cell.bookings.map((booking, bookingIndex) => (
                  <div
                    key={bookingIndex}
                    className={`text-xs p-2 rounded text-white ${getStatusColor(booking.status)} ${booking.bookingType === 'banquet' ? 'min-h-[60px]' : ''}`}
                    title={`${booking.guestName} - ${booking.bookingType === 'room' ? `Room ${booking.roomNumber}` : booking.banquetName} (${booking.status})${booking.eventType ? ` - ${booking.eventType}` : ''}`}
                  >
                    <div className="font-medium truncate">
                      {booking.bookingType === 'room' 
                        ? (booking.roomNumber !== 'N/A' ? `Room ${booking.roomNumber}` : 'Room N/A')
                        : (booking.banquetName || 'Banquet N/A')
                      }
                    </div>
                    <div className="opacity-90 truncate">{booking.guestName}</div>
                    {booking.eventType && (
                      <div className="opacity-75 text-xs truncate">{booking.eventType}</div>
                    )}
                    {booking.bookingType === 'banquet' && (
                      <TimeDisplay startTime={booking.checkIn} endTime={booking.checkOut} />
                    )}
                  </div>
                ))}
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
    </div>
  );
};

export default BookingChart;
