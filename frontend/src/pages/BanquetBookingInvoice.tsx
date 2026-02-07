import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import InvoiceTemplate from '../components/InvoiceTemplate';

interface Banquet {
  _id: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  location?: string;
  amenities?: string[];
}

interface BanquetBooking {
  _id: string;
  type: string;
  resourceId: string | Banquet;
  userId: any;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentId?: string;
  eventDetails?: {
    eventType?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    additionalRequirements?: string;
    specialPackage?: boolean;
  };
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

const BanquetBookingInvoice: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [booking, setBooking] = useState<BanquetBooking | null>(null);
  const [banquet, setBanquet] = useState<Banquet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/bookings/${bookingId}`);
      const bookingData = response.data;
      
      // Check if it's a banquet booking
      if (bookingData.type !== 'banquet') {
        toast.error('This is not a banquet booking');
        navigate('/dashboard');
        return;
      }
      
      setBooking(bookingData);
      
      // Fetch banquet details
      const banquetId = typeof bookingData.resourceId === 'string' ? bookingData.resourceId : bookingData.resourceId._id;
      if (banquetId) {
        await fetchBanquetDetails(banquetId);
      }
    } catch (error) {
      toast.error('Failed to fetch booking details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanquetDetails = async (banquetId: string) => {
    try {
      const response = await axios.get(`/banquets/${banquetId}`);
      setBanquet(response.data);
    } catch (error) {
      console.error('Failed to fetch banquet details:', error);
    }
  };

  const calculateHours = () => {
    if (!booking) return 0;
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 3600));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateInvoiceData = () => {
    if (!booking || !banquet) return null;

    // booking.totalAmount is the subtotal (before GST)
    const subtotal = booking.totalAmount;
    const cgst = Math.round(subtotal * 0.09); // 9% CGST
    const sgst = Math.round(subtotal * 0.09); // 9% SGST
    const grandTotal = subtotal + cgst + sgst;
    
    const serviceItems: Array<{ description: string; qty: number | string; rate: number | string; amount: number }> = [];
    
    const hours = calculateHours();
    
    // Calculate per-hour rate based on actual subtotal
    const banquetCharges = booking.eventDetails?.specialPackage 
      ? subtotal - (booking.guests * 800) 
      : subtotal;
    const actualRatePerHour = hours > 0 ? Math.round(banquetCharges / hours) : 0;
    
    // Add banquet hall charges
    serviceItems.push({
      description: `${banquet.name} - Banquet Hall`,
      qty: `${hours} Hours`,
      rate: `₹ ${actualRatePerHour}`,
      amount: banquetCharges
    });

    // Add special package if selected
    if (booking.eventDetails?.specialPackage) {
      const packageAmount = booking.guests * 800;
      serviceItems.push({
        description: 'Premium Event Package',
        qty: `${booking.guests} Guests`,
        rate: '₹ 800',
        amount: packageAmount
      });
    }

    return {
      items: serviceItems,
      subtotal,
      cgst,
      sgst,
      grandTotal
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print(); // Modern browsers allow saving as PDF
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!booking || !banquet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice not found</h2>
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/admin/banquets' : '/dashboard')}
            className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const invoiceData = calculateInvoiceData();
  if (!invoiceData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 no-print">
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/admin/banquets' : '/dashboard')}
            className="flex items-center text-amber-600 hover:text-amber-800 font-semibold"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center bg-gray-600 text-white px-5 py-2.5 rounded-md hover:bg-gray-700 transition-colors"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center bg-amber-600 text-white px-5 py-2.5 rounded-md hover:bg-amber-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-print-area" ref={printRef} className="bg-white shadow-2xl rounded-lg p-8">
          <InvoiceTemplate
            invoiceNumber={booking._id.slice(-8).toUpperCase()}
            invoiceDate={formatDate(booking.createdAt)}
            gstNumber="27ABCDE1234F1Z6"
            customerName={booking.eventDetails?.fullName || 'N/A'}
            customerPhone={booking.eventDetails?.phone || 'N/A'}
            customerEmail={booking.eventDetails?.email || 'N/A'}
            bookingDetails={{
              banquetHall: banquet.name,
              eventDate: `${formatDate(booking.checkIn)} (${formatTime(booking.checkIn)} - ${formatTime(booking.checkOut)})`,
              eventType: booking.eventDetails?.eventType || 'Event',
              guests: booking.guests
            }}
            items={invoiceData.items}
            subtotal={invoiceData.subtotal}
            cgst={invoiceData.cgst}
            sgst={invoiceData.sgst}
            grandTotal={invoiceData.grandTotal}
            paymentMode={booking.paymentMethod || (booking.paymentId ? 'Online' : 'Cash')}
            transactionId={booking.paymentId}
            invoiceType="banquet"
            qrCodeData={booking.paymentId || `BNQ-${booking._id}`}
          />

          {booking.eventDetails?.additionalRequirements && (
            <div className="mt-6 border-t-2 border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-800 mb-2">Special Requests:</h3>
              <p className="text-gray-600 text-sm">{booking.eventDetails.additionalRequirements}</p>
            </div>
          )}

          {banquet.amenities && banquet.amenities.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Included Amenities:</h3>
              <div className="flex flex-wrap gap-2">
                {banquet.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BanquetBookingInvoice;
