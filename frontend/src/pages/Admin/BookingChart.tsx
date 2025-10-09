import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface BookingData {
  _id: string;
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  roomType: string;
  guestName: string;
  status: string;
  paymentStatus: string;
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

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [currentDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      console.log('Fetching bookings for:', startOfMonth, 'to', endOfMonth); // Debug log
      
      const response = await axios.get('/api/bookings/admin/chart', {
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString()
        }
      });
      
      console.log('Received bookings:', response.data.bookings); // Debug log
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch booking data');
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
        
        const dayBookings = bookings.filter(booking => {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);
          return currentDateCell >= checkIn && currentDateCell < checkOut;
        }).filter(booking => {
          if (selectedRoom === 'all') return true;
          return booking.roomNumber === selectedRoom;
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
                    className={`text-xs p-1 rounded text-white ${getStatusColor(booking.status)} truncate`}
                    title={`${booking.guestName} - Room ${booking.roomNumber} (${booking.status})`}
                  >
                    <div className="font-medium">
                      {booking.roomNumber !== 'N/A' ? `Room ${booking.roomNumber}` : booking.roomNumber}
                    </div>
                    <div className="opacity-90">{booking.guestName}</div>
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default BookingChart;
