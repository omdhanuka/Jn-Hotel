import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, DollarSign, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  bookingId: string;
  bookingType: string;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  resourceDetails?: any;
  specialRequests?: string;
  createdAt: string;
}

interface BookingViewModalProps {
  booking: Booking;
  onClose: () => void;
  onRefresh: () => void;
}

const BookingViewModal: React.FC<BookingViewModalProps> = ({ booking, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await axios.patch(`/manager/bookings/${booking._id}/status`, { status: newStatus });
      toast.success('Booking status updated successfully');
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Booking Details - {booking.bookingId}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Guest Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Guest Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium">{booking.guestName}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm">{booking.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm">{booking.phone}</span>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Booking Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{booking.bookingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium">
                  {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : new Date(booking.date).toLocaleDateString()}
                </span>
              </div>
              {booking.checkOut && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">{booking.guests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {booking.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Payment Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">₹{booking.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div>
              <h3 className="text-lg font-medium mb-3">Special Requests</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{booking.specialRequests}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;
