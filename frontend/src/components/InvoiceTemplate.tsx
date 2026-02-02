import React from 'react';

interface InvoiceItem {
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number;
}

interface InvoiceTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  gstNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  bookingDetails?: {
    roomNumber?: string;
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    tableNumber?: string;
    banquetHall?: string;
    eventDate?: string;
    eventType?: string;
    guests?: number;
  };
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  paymentMode: string;
  transactionId?: string;
  invoiceType: 'room' | 'restaurant' | 'banquet';
  qrCodeData?: string;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoiceNumber,
  invoiceDate,
  gstNumber = '27ABCDE1234F1Z6',
  customerName,
  customerPhone,
  customerEmail,
  bookingDetails,
  items,
  subtotal,
  cgst,
  sgst,
  grandTotal,
  paymentMode,
  transactionId,
  invoiceType,
  qrCodeData,
}) => {
  // Generate QR Code using Google Charts API
  const getQRCodeUrl = () => {
    if (!qrCodeData) return '';
    const size = 120;
    return `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(qrCodeData)}&chs=${size}x${size}&chld=L|0`;
  };

  const getInvoiceTitle = () => {
    switch (invoiceType) {
      case 'room':
        return 'ROOM BOOKING INVOICE';
      case 'restaurant':
        return 'RESTAURANT INVOICE';
      case 'banquet':
        return 'BANQUET BOOKING INVOICE';
      default:
        return 'INVOICE';
    }
  };

  return (
    <div className="bg-white w-full max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-amber-600 pb-6 mb-6">
        <div className="flex justify-between items-start">
          {/* Logo and Hotel Name */}
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="text-amber-600 text-4xl mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-amber-700" style={{ letterSpacing: '0.05em' }}>ROYAL PALACE HOTEL</h1>
                <p className="text-amber-600 italic text-sm">Luxury Redefined</p>
              </div>
            </div>
            <div className="text-gray-600 text-xs mt-3 space-y-1">
              <p className="flex items-center">
                <span className="mr-2">📍</span>
                <span>123 Royal Street, New Delhi, India</span>
              </p>
              <p className="flex items-center">
                <span className="mr-2">📞</span>
                <span>Phone: +91 9876543210</span>
              </p>
              <p className="flex items-center">
                <span className="mr-2">✉️</span>
                <span>Email: info@royalpalacehotel.com</span>
              </p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">INVOICE</h2>
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">Invoice No:</span> {invoiceNumber}</p>
              <p><span className="font-semibold">Invoice Date:</span> {invoiceDate}</p>
              {gstNumber && <p><span className="font-semibold">GST No:</span> {gstNumber}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Details */}
      <div className="mb-6">
        <div className="bg-gray-800 text-white px-4 py-2 font-semibold">
          Guest Details
        </div>
        <div className="border border-gray-300">
          <div className="grid grid-cols-2 divide-x divide-gray-300">
            <div className="p-3">
              <p className="text-sm"><span className="font-semibold">Guest Name:</span> {customerName}</p>
            </div>
            {bookingDetails?.roomNumber && (
              <div className="p-3">
                <p className="text-sm"><span className="font-semibold">Room No:</span> {bookingDetails.roomNumber}</p>
              </div>
            )}
            {bookingDetails?.tableNumber && (
              <div className="p-3">
                <p className="text-sm"><span className="font-semibold">Table No:</span> {bookingDetails.tableNumber}</p>
              </div>
            )}
            {bookingDetails?.banquetHall && (
              <div className="p-3">
                <p className="text-sm"><span className="font-semibold">Banquet Hall:</span> {bookingDetails.banquetHall}</p>
              </div>
            )}
          </div>
          {bookingDetails?.checkIn && bookingDetails?.checkOut && (
            <div className="border-t border-gray-300 grid grid-cols-2 divide-x divide-gray-300">
              <div className="p-3">
                <p className="text-sm"><span className="font-semibold">Check-In:</span> {bookingDetails.checkIn}</p>
              </div>
              <div className="p-3">
                <p className="text-sm"><span className="font-semibold">Check-Out:</span> {bookingDetails.checkOut}</p>
              </div>
            </div>
          )}
          {bookingDetails?.eventDate && (
            <div className="border-t border-gray-300 grid grid-cols-2 divide-x divide-gray-300">
              <div className="p-3">
                <p className="text-sm"><span className="font-semibold">Event Date:</span> {bookingDetails.eventDate}</p>
              </div>
              {bookingDetails.eventType && (
                <div className="p-3">
                  <p className="text-sm"><span className="font-semibold">Event Type:</span> {bookingDetails.eventType}</p>
                </div>
              )}
            </div>
          )}
          {(bookingDetails?.nights || bookingDetails?.guests) && (
            <div className="border-t border-gray-300 p-3">
              {bookingDetails?.nights && (
                <p className="text-sm"><span className="font-semibold">No. of Nights:</span> {bookingDetails.nights} Nights</p>
              )}
              {bookingDetails?.guests && (
                <p className="text-sm"><span className="font-semibold">No. of Guests:</span> {bookingDetails.guests}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-center w-24">Qty</th>
              <th className="border border-gray-300 px-4 py-2 text-right w-32">Rate</th>
              <th className="border border-gray-300 px-4 py-2 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 px-4 py-3 text-sm">{item.description}</td>
                <td className="border border-gray-300 px-4 py-3 text-center text-sm">{item.qty}</td>
                <td className="border border-gray-300 px-4 py-3 text-right text-sm">
                  {typeof item.rate === 'number' ? `₹ ${item.rate.toLocaleString()}` : item.rate}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">
                  ₹ {item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and Payment */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="border border-gray-300 p-4">
            <p className="text-sm mb-2"><span className="font-semibold">Payment Mode:</span> {paymentMode}</p>
            {transactionId && (
              <p className="text-sm"><span className="font-semibold">Transaction ID:</span> {transactionId}</p>
            )}
          </div>
        </div>

        <div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">₹ {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>CGST (9%):</span>
              <span className="font-semibold">₹ {cgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>SGST (9%):</span>
              <span className="font-semibold">₹ {sgst.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-amber-700 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-bold text-lg">Grand Total:</span>
            <span className="font-bold text-xl">₹ {grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* QR Code and Footer */}
      <div className="flex justify-between items-end mb-6">
        <div className="flex-1">
          <p className="text-center text-lg font-semibold italic text-gray-700 mb-2">
            Thank you for staying with us!
          </p>
          <p className="text-center text-xs text-gray-500">
            This is a computer-generated invoice. No signature required.
          </p>
        </div>
        {qrCodeData && (
          <div className="text-center ml-6">
            <img src={getQRCodeUrl()} alt="QR Code" className="w-28 h-28 mb-1" />
            <p className="text-xs font-semibold text-gray-700">Scan to Pay</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceTemplate;
