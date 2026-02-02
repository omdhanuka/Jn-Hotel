import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import InvoiceTemplate from '../components/InvoiceTemplate';

interface OrderItem {
  _id: string;
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  addOns?: { name: string; price: number }[];
  spiceLevel?: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  orderId: string;
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  deliveryType: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharges?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  generatedAt: string;
  generatedBy: string;
  notes?: string;
}

const RestaurantInvoice: React.FC = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillData();
  }, [billId]);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/bills/${billId}`);
      setBill(response.data);
    } catch (error) {
      toast.error('Failed to fetch bill details');
      navigate('/admin/bills');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateInvoiceData = () => {
    if (!bill) return null;

    const invoiceItems: Array<{ description: string; qty: number | string; rate: number | string; amount: number }> = bill.items.map(item => {
      let itemDescription = item.name;
      if (item.addOns && item.addOns.length > 0) {
        const addOnsText = item.addOns.map(a => a.name).join(', ');
        itemDescription += ` (${addOnsText})`;
      }
      if (item.spiceLevel) {
        itemDescription += ` [${item.spiceLevel}]`;
      }

      const addOnsTotal = item.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0;
      const itemRate = item.price + addOnsTotal;
      const itemAmount = itemRate * item.quantity;

      return {
        description: itemDescription,
        qty: item.quantity,
        rate: itemRate,
        amount: itemAmount
      };
    });

    // Add delivery charges if applicable
    if (bill.deliveryCharges && bill.deliveryCharges > 0) {
      invoiceItems.push({
        description: 'Delivery Charges',
        qty: '—',
        rate: '—',
        amount: bill.deliveryCharges
      });
    }

    // Add discount as negative item if present
    if (bill.discount > 0) {
      invoiceItems.push({
        description: 'Discount',
        qty: '—',
        rate: '—',
        amount: -bill.discount
      });
    }

    const subtotal = bill.subtotal;
    const cgst = Math.round(bill.tax / 2); // Split tax into CGST and SGST
    const sgst = Math.round(bill.tax / 2);
    
    return {
      items: invoiceItems,
      subtotal,
      cgst,
      sgst,
      grandTotal: bill.totalAmount
    };
  };

  const handlePrint = async () => {
    try {
      await axios.post(`/bills/${billId}/print`);
      window.print();
    } catch (error) {
      console.error('Failed to update print count');
      window.print();
    }
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

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice not found</h2>
          <button
            onClick={() => navigate('/admin/bills')}
            className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700"
          >
            Back to Bills
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
            onClick={() => navigate('/admin/bills')}
            className="flex items-center text-amber-600 hover:text-amber-800 font-semibold"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Bills
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
            invoiceNumber={bill.billNumber || bill._id.slice(-8).toUpperCase()}
            invoiceDate={formatDate(bill.generatedAt)}
            gstNumber="27ABCDE1234F1Z6"
            customerName={bill.customerName}
            customerPhone={bill.customerPhone}
            bookingDetails={{
              tableNumber: bill.deliveryType === 'dine-in' ? bill.tableNumber : undefined,
              eventType: bill.deliveryType === 'dine-in' ? 'Dine-In' : bill.deliveryType === 'takeaway' ? 'Takeaway' : 'Home Delivery'
            }}
            items={invoiceData.items}
            subtotal={invoiceData.subtotal}
            cgst={invoiceData.cgst}
            sgst={invoiceData.sgst}
            grandTotal={invoiceData.grandTotal}
            paymentMode={bill.paymentMethod}
            transactionId={`ORD-${bill.orderId.slice(-8).toUpperCase()}`}
            invoiceType="restaurant"
            qrCodeData={`BILL-${bill._id}`}
          />
          
          {bill.deliveryType === 'delivery' && bill.deliveryAddress && (
            <div className="mt-6 border-t-2 border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-800 mb-2">Delivery Address:</h3>
              <p className="text-gray-600 text-sm">{bill.deliveryAddress}</p>
            </div>
          )}
          
          {bill.notes && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
              <p className="text-gray-600 text-sm">{bill.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantInvoice;
