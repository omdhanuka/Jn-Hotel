import React, { useState, useEffect } from 'react';
import { Calendar, Users, CreditCard, Edit, Check, X, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  type: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [newBookingStatus, setNewBookingStatus] = useState('');
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings/admin');
      setBookings(response.data.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId: string, paymentStatus: string) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/payment-status`, {
        paymentStatus
      });
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, paymentStatus, status: paymentStatus === 'paid' ? 'confirmed' : booking.status }
          : booking
      ));
      
      setEditingPayment(null);
      toast.success('Payment status updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      console.log('Updating booking status:', bookingId, status); // Debug log
      
      const response = await axios.put(`/api/bookings/${bookingId}/status`, {
        status
      });
      
      console.log('Status update response:', response.data); // Debug log
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { 
              ...booking, 
              status,
              paymentStatus: status === 'confirmed' && booking.paymentStatus === 'pending' ? 'paid' : booking.paymentStatus
            }
          : booking
      ));
      
      setEditingStatus(null);
      toast.success('Booking status updated successfully');
    } catch (error: any) {
      console.error('Error updating status:', error); // Debug log
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { 
              ...booking, 
              status: 'cancelled',
              paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : 'cancelled'
            }
          : booking
      ));
      
      toast.success('Booking cancelled successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const startEditBooking = (booking: Booking) => {
    setEditForm({
      checkIn: booking.checkIn.split('T')[0],
      checkOut: booking.checkOut.split('T')[0],
      guests: booking.guests,
      specialRequests: booking.specialRequests || ''
    });
    setEditingBooking(booking._id);
  };

  const updateBooking = async (bookingId: string) => {
    try {
      await axios.put(`/api/bookings/${bookingId}`, editForm);
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { 
              ...booking, 
              checkIn: editForm.checkIn,
              checkOut: editForm.checkOut,
              guests: editForm.guests,
              specialRequests: editForm.specialRequests
            }
          : booking
      ));
      
      setEditingBooking(null);
      toast.success('Booking updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Booking Management</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.user.firstName} {booking.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{booking.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingBooking === booking._id ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {booking.type} Booking
                        </div>
                        <input
                          type="number"
                          value={editForm.guests}
                          onChange={(e) => setEditForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))
                          }
                          className="w-20 text-xs border border-gray-300 rounded px-2 py-1"
                          min="1"
                        />
                        <span className="text-xs"> guests</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {booking.type} Booking
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {booking.guests} guests
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingBooking === booking._id ? (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={editForm.checkIn}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                        <input
                          type="date"
                          value={editForm.checkOut}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <div>
                          <div>{new Date(booking.checkIn).toLocaleDateString()}</div>
                          <div>{new Date(booking.checkOut).toLocaleDateString()}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${booking.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingPayment === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newPaymentStatus}
                          onChange={(e) => setNewPaymentStatus(e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="refunded">Refunded</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="failed">Failed</option>
                        </select>
                        <button
                          onClick={() => updatePaymentStatus(booking._id, newPaymentStatus)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingPayment(null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingStatus === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newBookingStatus}
                          onChange={(e) => setNewBookingStatus(e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          onClick={() => {
                            console.log('Button clicked, updating to:', newBookingStatus); // Debug log
                            updateBookingStatus(booking._id, newBookingStatus);
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Save Status"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingStatus(null)}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {editingBooking === booking._id ? (
                        <>
                          <button
                            onClick={() => updateBooking(booking._id)}
                            className="text-green-600 hover:text-green-800"
                            title="Save Changes"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingBooking(null)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel Edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditBooking(booking)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Booking"
                            disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          {editingStatus !== booking._id && editingPayment !== booking._id && (
                            <button
                              onClick={() => {
                                console.log('Edit status clicked for booking:', booking._id); // Debug log
                                setEditingStatus(booking._id);
                                setNewBookingStatus(booking.status);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Edit Status"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          
                          {editingPayment !== booking._id && (
                            <button
                              onClick={() => {
                                setEditingPayment(booking._id);
                                setNewPaymentStatus(booking.paymentStatus);
                              }}
                              className="text-purple-600 hover:text-purple-800"
                              title="Edit Payment Status"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => cancelBooking(booking._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel Booking"
                            disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingBooking && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Special Requests</h3>
          <textarea
            value={editForm.specialRequests}
            onChange={(e) => setEditForm(prev => ({ ...prev, specialRequests: e.target.value }))}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2"
            rows={3}
            placeholder="Any special requests..."
          />
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
