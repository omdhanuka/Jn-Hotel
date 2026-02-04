import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import InvoiceTemplate from '../components/InvoiceTemplate';

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
  services?: string[];
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

const RoomBookingInvoice: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to view invoice');
      navigate('/login');
      return;
    }
    fetchBookingData();
  }, [bookingId, user, navigate]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/bookings/${bookingId}`);
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
          endpoint = `/rooms/${resourceId}`;
          break;
        case 'banquet':
          endpoint = `/banquets/${resourceId}`;
          break;
        case 'table':
          endpoint = `/restaurant/tables/${resourceId}`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateInvoiceData = () => {
    if (!booking || !resource) return null;

    const nights = calculateNights();
    const roomCharges = resource.price * nights;
    
    // Calculate additional services
    let additionalServices = 0;
    const serviceItems: Array<{ description: string; qty: number | string; rate: number | string; amount: number }> = [];
    const services = Array.isArray(booking.services) ? booking.services : [];
    
    // Add room charges
    serviceItems.push({
      description: 'Room Charges',
      qty: `${nights} Nights`,
      rate: `₹ ${resource.price}`,
      amount: roomCharges
    });

    // Add services if any
    if (services.length > 0) {
      services.forEach((service) => {
        let serviceAmount = 0;
        switch(service.toLowerCase()) {
          case 'breakfast':
            serviceAmount = 500 * nights;
            break;
          case 'spa':
            serviceAmount = 1500;
            break;
          case 'gym':
            serviceAmount = 300 * nights;
            break;
          case 'laundry':
            serviceAmount = 300;
            break;
          default:
            serviceAmount = 500;
        }
        additionalServices += serviceAmount;
        serviceItems.push({
          description: service,
          qty: '—',
          rate: '—',
          amount: serviceAmount
        });
      });
    }

    const subtotal = roomCharges + additionalServices;
    const cgst = Math.round(subtotal * 0.09); // 9% CGST
    const sgst = Math.round(subtotal * 0.09); // 9% SGST
    const grandTotal = subtotal + cgst + sgst;

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

  if (!booking || !resource) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700"
          >
            Back to Dashboard
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
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-amber-600 hover:text-amber-800 font-semibold"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
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
            customerName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
            customerPhone={user?.phone}
            customerEmail={user?.email}
            bookingDetails={{
              roomNumber: resource.roomNumber,
              checkIn: formatDate(booking.checkIn),
              checkOut: formatDate(booking.checkOut),
              nights: calculateNights(),
              guests: booking.guests
            }}
            items={invoiceData.items}
            subtotal={invoiceData.subtotal}
            cgst={invoiceData.cgst}
            sgst={invoiceData.sgst}
            grandTotal={invoiceData.grandTotal}
            paymentMode={booking.paymentId ? 'Credit Card' : 'Cash'}
            transactionId={booking.paymentId}
            invoiceType="room"
            qrCodeData={booking.paymentId || `INV-${booking._id}`}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomBookingInvoice;
