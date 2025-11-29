import React, { useState } from 'react';
import { Search, DollarSign, Trash2, Plus, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ExtraCharge {
  name: string;
  amount: number;
}

interface CheckOutTabProps {
  onSuccess?: () => void;
}

const CheckOutTab: React.FC<CheckOutTabProps> = ({ onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [newCharge, setNewCharge] = useState({ name: '', amount: '' });
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get(`/api/manager/active-guests?search=${searchQuery}`);
      
      if (response.data.bookings && response.data.bookings.length > 0) {
        const foundBooking = response.data.bookings[0];
        setBooking(foundBooking);
        setExtraCharges([]);
      } else {
        toast.error('No active guest found');
        setBooking(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Search failed');
      setBooking(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddCharge = () => {
    if (!newCharge.name || !newCharge.amount) {
      toast.error('Please enter charge name and amount');
      return;
    }

    setExtraCharges(prev => [...prev, {
      name: newCharge.name,
      amount: parseFloat(newCharge.amount)
    }]);
    
    setNewCharge({ name: '', amount: '' });
    setShowChargeModal(false);
    toast.success('Charge added');
  };

  const handleRemoveCharge = (index: number) => {
    setExtraCharges(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    if (!booking) return { subtotal: 0, extraTotal: 0, grandTotal: 0 };
    
    const subtotal = booking.totalAmount || 0;
    const extraTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const grandTotal = subtotal + extraTotal;
    
    return { subtotal, extraTotal, grandTotal };
  };

  const handleCompleteCheckout = async () => {
    if (!booking) return;

    try {
      setProcessing(true);
      await axios.post('/api/manager/checkout', {
        bookingId: booking._id,
        extraCharges: extraCharges,
        notes: `Extra charges: ${extraCharges.map(c => `${c.name}: ₹${c.amount}`).join(', ')}`
      });
      
      toast.success('Check-out completed successfully!');
      
      // Call onSuccess callback to refresh activity list
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setBooking(null);
      setSearchQuery('');
      setExtraCharges([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setProcessing(false);
    }
  };

  const { subtotal, extraTotal, grandTotal } = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Search Active Guest</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Room Number, Guest Name, or Booking ID..."
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Active Stay Details */}
      {booking && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Active Stay Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Guest Name</p>
                <p className="font-medium">{booking.user?.firstName} {booking.user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Number</p>
                <p className="font-medium">Room {booking.resourceId?.roomNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="font-medium">{new Date(booking.checkIn).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected Check-out</p>
                <p className="font-medium">{new Date(booking.checkOut).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stay Duration</p>
                <p className="font-medium">{booking.stayDuration} day(s)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Booking Amount</p>
                <p className="font-medium">₹{booking.totalAmount}</p>
              </div>
            </div>
          </div>

          {/* Extra Charges */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Extra Charges</h3>
              <button
                onClick={() => setShowChargeModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Charge
              </button>
            </div>

            {extraCharges.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Charge Name</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-right py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {extraCharges.map((charge, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{charge.name}</td>
                      <td className="text-right py-2">₹{charge.amount}</td>
                      <td className="text-right py-2">
                        <button
                          onClick={() => handleRemoveCharge(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No extra charges added</p>
            )}
          </div>

          {/* Checkout Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Checkout Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Room Charges:</span>
                <span className="font-medium">₹{subtotal}</span>
              </div>
              {extraTotal > 0 && (
                <div className="flex justify-between">
                  <span>Extra Charges:</span>
                  <span className="font-medium">₹{extraTotal}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 text-lg font-bold">
                <span>Grand Total:</span>
                <span>₹{grandTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Amount Paid:</span>
                <span>₹{booking.amountPaid || 0}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Balance:</span>
                <span className={booking.remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                  ₹{Math.max(0, grandTotal - (booking.amountPaid || 0))}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => window.open(`/api/manager/invoice/${booking._id}`, '_blank')}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice PDF
              </button>
              <button
                onClick={handleCompleteCheckout}
                disabled={processing}
                className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {processing ? 'Processing...' : 'Complete Check-Out'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Charge Modal */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add Extra Charge</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charge Name
                </label>
                <input
                  type="text"
                  value={newCharge.name}
                  onChange={(e) => setNewCharge(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Laundry, Minibar"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={newCharge.amount}
                  onChange={(e) => setNewCharge(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowChargeModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCharge}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                >
                  Add Charge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckOutTab;
