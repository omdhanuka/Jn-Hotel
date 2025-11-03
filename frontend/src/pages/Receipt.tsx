import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Download, Printer, ArrowLeft, Hotel } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Booking {
  _id: string;
  type: 'room' | 'banquet' | 'table' | 'hotel';
  resourceId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  services: string[];
  createdAt: string;
  paymentId?: string;
}

interface Resource {
  _id: string;
  roomNumber?: string;
  name?: string;
  type: string;
  price: number;
}

const Receipt: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to view receipt');
      navigate('/login');
      return;
    }
    fetchBookingData();
  }, [bookingId, user, navigate]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${bookingId}`);
      const bookingData = response.data;
      setBooking(bookingData);
      
      // Fetch resource details
      await fetchResourceDetails(bookingData.type, bookingData.resourceId);
    } catch (error) {
      toast.error('Failed to fetch booking details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchResourceDetails = async (type: string, resourceId: string) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'room':
          endpoint = `/api/rooms/${resourceId}`;
          break;
        case 'banquet':
          endpoint = `/api/banquets/${resourceId}`;
          break;
        case 'table':
          endpoint = `/api/restaurant/tables/${resourceId}`;
          break;
      }
      
      if (endpoint) {
        const response = await axios.get(endpoint);
        setResource(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch resource details:', error);
    }
  };

  const calculateNights = () => {
    if (!booking || booking.type === 'table') return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const calculateSubtotal = () => {
    if (!booking || !resource) return 0;
    if (booking.type === 'table') return 0;
    return resource.price * calculateNights();
  };

  const calculateTaxes = () => {
    const subtotal = calculateSubtotal();
    return Math.round(subtotal * 0.12); // 12% tax
  };

  const handlePrint = () => {
    // Use browser's native print with proper styling
    const printWindow = window.open('', '_blank');
    const receiptContent = document.getElementById('receipt-content');
    
    if (printWindow && receiptContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${booking?._id.slice(-8).toUpperCase()}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
              background: white;
            }
            
            .receipt-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              background: #2563eb;
              color: white;
              padding: 30px;
              margin-bottom: 20px;
            }
            
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .logo-section h1 {
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .logo-section p {
              font-size: 12pt;
              opacity: 0.9;
            }
            
            .receipt-info h2 {
              font-size: 20pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .section {
              margin-bottom: 25px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .section:last-child {
              border-bottom: none;
            }
            
            .section h3 {
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 15px;
              color: #374151;
            }
            
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 15px;
            }
            
            .info-block h4 {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 8px;
              color: #111827;
            }
            
            .info-block p {
              margin-bottom: 4px;
              color: #6b7280;
            }
            
            .booking-details {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 15px;
            }
            
            .payment-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 5px 0;
            }
            
            .payment-total {
              display: flex;
              justify-content: space-between;
              font-size: 16pt;
              font-weight: bold;
              padding: 15px 0;
              border-top: 2px solid #e5e7eb;
              margin-top: 15px;
            }
            
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              margin-top: 30px;
            }
            
            .footer p {
              margin-bottom: 8px;
              color: #6b7280;
            }
            
            .services-tag {
              display: inline-block;
              background: #dbeafe;
              color: #1e40af;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 10pt;
              margin: 2px;
            }
            
            @page {
              margin: 0.5in;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptContent.innerHTML.replace(/class="[^"]*"/g, (match) => {
              // Convert Tailwind classes to our print styles
              if (match.includes('bg-blue-600')) return 'class="header"';
              if (match.includes('grid grid-cols-1 md:grid-cols-2')) return 'class="grid"';
              if (match.includes('bg-gray-50 p-6')) return 'class="booking-details"';
              if (match.includes('flex justify-between')) return 'class="payment-row"';
              if (match.includes('bg-gray-50 p-6 text-center')) return 'class="footer"';
              return match;
            })}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      // Fallback to regular print
      window.print();
    }
  };

  const handleDownload = () => {
    handlePrint(); // Modern browsers allow save as PDF from print dialog
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking || !resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Receipt not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8 no-print">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Download className="h-5 w-5 mr-2" />
              Download
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div id="receipt-content" className="bg-white shadow-lg rounded-lg overflow-hidden no-break">
          {/* Header */}
          <div className="bg-blue-600 text-white p-8 no-break">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Hotel className="h-10 w-10 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold">GrandStay Hotel</h1>
                  <p className="text-blue-100">Luxury & Comfort Redefined</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold">RECEIPT</h2>
                <p className="text-blue-100">#{booking._id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Hotel Information */}
          <div className="p-8 border-b border-gray-200 no-break">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Hotel Information</h3>
                <div className="text-gray-600 space-y-1">
                  <p>123 Luxury Avenue</p>
                  <p>City, State 12345</p>
                  <p>Phone: +1 (555) 123-4567</p>
                  <p>Email: info@grandstay.com</p>
                  <p>Website: www.grandstay.com</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Guest Information</h3>
                <div className="text-gray-600 space-y-1">
                  <p>{user?.firstName} {user?.lastName}</p>
                  <p>{user?.email}</p>
                  <p>Booking Date: {new Date(booking.createdAt).toLocaleDateString()}</p>
                  <p>Payment Status: <span className={`font-medium ${
                    booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                  }`}>{booking.paymentStatus.toUpperCase()}</span></p>
                  {booking.paymentId && <p>Payment ID: {booking.paymentId}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-8 border-b border-gray-200 no-break">
            <h3 className="font-semibold text-gray-900 mb-4">Booking Details</h3>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {booking.type === 'room' 
                      ? `Room ${resource.roomNumber} - ${resource.type}` 
                      : resource.name
                    }
                  </h4>
                  <div className="space-y-1 text-gray-600">
                    <p>Type: {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}</p>
                    <p>Guests: {booking.guests}</p>
                    {booking.type !== 'table' && (
                      <>
                        <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
                        <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
                        <p>Duration: {calculateNights()} night{calculateNights() > 1 ? 's' : ''}</p>
                      </>
                    )}
                    {booking.type === 'table' && (
                      <p>Reservation Date: {new Date(booking.checkIn).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                
                {booking.specialRequests && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                    <p className="text-gray-600 text-sm">{booking.specialRequests}</p>
                  </div>
                )}
              </div>

              {booking.services.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Additional Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {booking.services.map((service, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="p-8 no-break">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
            
            <div className="space-y-3">
              {booking.type !== 'table' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} ({calculateNights()} night{calculateNights() > 1 ? 's' : ''} × ₹{resource.price})
                  </span>
                  <span className="font-medium">₹{calculateSubtotal()}</span>
                </div>
              )}
              
              {booking.services.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Additional Services</span>
                  <span className="font-medium">₹{booking.totalAmount - calculateSubtotal() - calculateTaxes()}</span>
                </div>
              )}
              
              {booking.type !== 'table' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees (12%)</span>
                  <span className="font-medium">₹{calculateTaxes()}</span>
                </div>
              )}
              
              <hr className="my-4" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span className="text-blue-600">₹{booking.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 text-center no-break">
            <p className="text-gray-600 text-sm mb-2">
              Thank you for choosing GrandStay Hotel. We hope you enjoyed your stay!
            </p>
            <p className="text-gray-500 text-xs">
              This is a computer-generated receipt and does not require a signature.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              For any questions or concerns, please contact us at +1 (555) 123-4567 or info@grandstay.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
