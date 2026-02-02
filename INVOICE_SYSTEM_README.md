# Hotel Invoice System - Royal Palace Hotel Design

## Overview
This project now includes a professional invoice system with a **Royal Palace Hotel** design template inspired by luxury hotel invoicing standards. All booking types (Room, Banquet, and Restaurant) now generate beautiful, printable invoices.

## Features

### ✨ Professional Invoice Design
- **Royal Palace Hotel Branding** - Crown logo, elegant typography
- **Structured Layout** - Clear sections for guest details, booking information, and payment breakdown
- **Tax Breakdown** - CGST (9%) and SGST (9%) displayed separately
- **QR Code Integration** - Scan-to-pay functionality using Google Charts API
- **Print & Download** - Optimized for printing and PDF generation

### 📄 Invoice Types

#### 1. Room Booking Invoice (`/invoice/room/:bookingId`)
- Guest information with contact details
- Room number and room type
- Check-in and check-out dates
- Number of nights calculation
- Room charges breakdown
- Additional services (Breakfast, Spa, Gym, Laundry, etc.)
- Tax calculations (CGST + SGST)
- Payment method and transaction ID

**Features:**
- Automatically calculates nights stayed
- Itemizes all additional services
- Shows room rate per night
- Displays booking creation date

#### 2. Restaurant Invoice (`/invoice/restaurant/:billId`)
- Customer name and phone number
- Table number (for dine-in) or delivery type
- Detailed menu items with quantities
- Add-ons and spice levels
- Discount application
- Delivery charges (for home delivery)
- Delivery address (when applicable)
- Tax breakdown
- Payment method

**Features:**
- Supports Dine-In, Takeaway, and Home Delivery
- Itemizes all menu items with add-ons
- Shows discount if applied
- Includes delivery charges for delivery orders
- Special notes section

#### 3. Banquet Booking Invoice (`/invoice/banquet/:bookingId`)
- Event organizer details
- Banquet hall name and capacity
- Event date, start time, and end time
- Event type (Wedding, Corporate, Conference, etc.)
- Number of guests
- Hourly charges calculation
- Additional services (Catering, Decoration, Audio-Visual, Photography, etc.)
- Tax breakdown
- Special requests section
- Included amenities display

**Features:**
- Calculates hours based on start and end time
- Per-guest catering charges
- Flat-rate additional services
- Shows event-specific details
- Lists included amenities

## File Structure

```
frontend/src/
├── components/
│   └── InvoiceTemplate.tsx         # Reusable invoice component
├── pages/
│   ├── RoomBookingInvoice.tsx      # Room invoice page
│   ├── RestaurantInvoice.tsx       # Restaurant invoice page
│   ├── BanquetBookingInvoice.tsx   # Banquet invoice page
│   └── Receipt.tsx                 # Legacy receipt (kept for compatibility)
└── App.tsx                         # Updated with new routes
```

## Component: InvoiceTemplate

### Props
```typescript
interface InvoiceTemplateProps {
  invoiceNumber: string;           // Invoice/Bill number
  invoiceDate: string;              // Invoice generation date
  gstNumber?: string;               // GST registration number
  customerName: string;             // Customer/Guest name
  customerPhone?: string;           // Customer phone
  customerEmail?: string;           // Customer email
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
  items: InvoiceItem[];            // Line items
  subtotal: number;                 // Subtotal before tax
  cgst: number;                     // Central GST (9%)
  sgst: number;                     // State GST (9%)
  grandTotal: number;               // Final total
  paymentMode: string;              // Payment method
  transactionId?: string;           // Transaction ID
  invoiceType: 'room' | 'restaurant' | 'banquet';
  qrCodeData?: string;              // Data for QR code
}
```

## Usage

### From Dashboard
Users can view invoices for their paid bookings:
```tsx
<Link to={`/invoice/room/${bookingId}`}>View Invoice</Link>
<Link to={`/invoice/banquet/${bookingId}`}>View Invoice</Link>
```

### From Admin Panel
Admins can view and print restaurant invoices:
```tsx
<Link to={`/invoice/restaurant/${billId}`}>View Invoice</Link>
```

## Styling & Printing

### Print Styles
The invoices include special print CSS to ensure proper printing:
```css
@media print {
  body * { visibility: hidden; }
  #invoice-print-area, #invoice-print-area * { visibility: visible; }
  .no-print { display: none !important; }
}
```

### Color Scheme
- **Primary Color**: Amber/Gold (#D97706, #B45309)
- **Secondary Color**: Gray (#1F2937, #6B7280)
- **Accent**: Royal Blue for special elements
- **Crown Logo**: SVG-based, scalable

### Typography
- **Headers**: Bold, large size
- **Body**: Arial, sans-serif for readability
- **Tables**: Clear borders, alternating row colors

## QR Code Integration

QR codes are generated using Google Charts API:
```typescript
const getQRCodeUrl = () => {
  if (!qrCodeData) return '';
  const size = 120;
  return `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(qrCodeData)}&chs=${size}x${size}&chld=L|0`;
};
```

No external dependencies required!

## Tax Calculations

All invoices include:
- **Subtotal**: Sum of all items
- **CGST (9%)**: Central Goods and Services Tax
- **SGST (9%)**: State Goods and Services Tax
- **Grand Total**: Subtotal + CGST + SGST

Formula:
```typescript
const cgst = Math.round(subtotal * 0.09);
const sgst = Math.round(subtotal * 0.09);
const grandTotal = subtotal + cgst + sgst;
```

## Additional Services & Pricing

### Room Services
- **Breakfast**: ₹500 per night
- **Spa**: ₹1,500 (one-time)
- **Gym**: ₹300 per night
- **Laundry**: ₹300 (one-time)
- **Other**: ₹500 (default)

### Banquet Services
- **Catering**: ₹500 per guest
- **Decoration**: ₹15,000 (flat)
- **Audio-Visual**: ₹10,000 (flat)
- **Photography**: ₹20,000 (flat)
- **Valet Parking**: ₹5,000 (flat)
- **Other**: ₹5,000 (default)

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Modern mobile browsers

## Print-to-PDF

Users can save invoices as PDF using:
1. **Print Button** → Opens print dialog
2. **Download PDF Button** → Opens print dialog where users can select "Save as PDF"

Modern browsers support native PDF generation without external libraries.

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/invoice/room/:bookingId` | RoomBookingInvoice | Room booking invoice |
| `/invoice/restaurant/:billId` | RestaurantInvoice | Restaurant bill invoice |
| `/invoice/banquet/:bookingId` | BanquetBookingInvoice | Banquet booking invoice |
| `/receipt/:bookingId` | Receipt | Legacy receipt (still functional) |

## API Endpoints Used

### Room Invoice
- `GET /bookings/:bookingId` - Fetch booking details
- `GET /rooms/:roomId` - Fetch room details

### Restaurant Invoice
- `GET /bills/:billId` - Fetch bill details
- `POST /bills/:billId/print` - Update print count

### Banquet Invoice
- `GET /banquets/bookings/:bookingId` - Fetch banquet booking
- `GET /banquets/:banquetId` - Fetch banquet hall details

## Future Enhancements

- [ ] Email invoice functionality
- [ ] Multi-language support
- [ ] Custom branding per hotel
- [ ] Invoice templates selection
- [ ] Digital signature integration
- [ ] Payment gateway integration with QR codes
- [ ] Invoice history and audit trail
- [ ] Batch invoice generation
- [ ] Automatic invoice numbering system
- [ ] GST compliance reports

## Notes

1. **Invoice Numbers**: Currently using last 8 characters of booking/bill ID in uppercase
2. **GST Number**: Hardcoded as `27ABCDE1234F1Z6` (update for production)
3. **Hotel Details**: Update address, phone, email in `InvoiceTemplate.tsx`
4. **QR Code Data**: Currently uses payment ID or booking ID (can be updated to include payment links)

## Support

For issues or questions:
- Check the console for error messages
- Verify all API endpoints are accessible
- Ensure booking/bill IDs are valid
- Test print functionality in different browsers

---

**Made with ❤️ for Royal Palace Hotel**
