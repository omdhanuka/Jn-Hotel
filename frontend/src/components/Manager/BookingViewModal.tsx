import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, Users, DollarSign, FileText, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BookingStatusBadge from './BookingStatusBadge';
import PaymentBadge from './PaymentBadge';

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
      await axios.patch(`/api/manager/bookings/${booking._id}/status`, { status: newStatus });
      toast.success('Booking status updated successfully');
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <p className="text-gray-600 text-sm mt-1">#{booking.bookingId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Booking Status</div>
                <BookingStatusBadge status={booking.status} />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                <PaymentBadge status={booking.paymentStatus} />
              </div>
            </div>
            
            {booking.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-indigo-600" />
              Guest Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="text-base font-medium text-gray-900">{booking.guestName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="text-base font-medium text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {booking.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="text-base font-medium text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {booking.phone || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Guests</div>
                <div className="text-base font-medium text-gray-900 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Booking Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="text-base font-medium text-gray-900 capitalize">{booking.bookingType.replace('-', ' ')}</div>
              </div>
              {booking.checkIn && (
                <div>
                  <div className="text-sm text-gray-600">Check-in</div>
                  <div className="text-base font-medium text-gray-900">
                    {new Date(booking.checkIn).toLocaleDateString()}
                  </div>
                </div>
              )}
              {booking.checkOut && (
                <div>
                  <div className="text-sm text-gray-600">Check-out</div>
                  <div className="text-base font-medium text-gray-900">
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-base font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                  ₹{booking.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {booking.specialRequests && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Special Requests
              </h3>
              <p className="text-gray-700">{booking.specialRequests}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;
