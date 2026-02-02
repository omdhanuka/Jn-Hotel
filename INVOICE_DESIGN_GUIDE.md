# Invoice Design Reference

## Royal Palace Hotel Invoice Layout

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  👑 ROYAL PALACE HOTEL                            INVOICE        ║
║     Luxury Redefined                              No: 10583      ║
║                                                   Date: 15/11/23 ║
║  📍 123 Royal Street, New Delhi, India           GST: 27ABC...   ║
║  📞 Phone: +91 9876543210                                        ║
║  ✉️  Email: info@royalpalacehotel.com                            ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  GUEST DETAILS (Navy Blue Header)                                ║
╠═══════════════════════════════════════════════════════════════════╣
║  Guest Name: Mr. Arjun Mehta          │  Room No: 205           ║
║  Check-In: 12/11/2023                 │  Check-Out: 15/11/2023  ║
║  No. of Nights: 3 Nights                                         ║
╠═══════════════════════════════════════════════════════════════════╣
║  Description          │   Qty    │   Rate   │    Amount         ║
╠═══════════════════════════════════════════════════════════════════╣
║  Room Charges         │ 2 Nights │  ₹ 3,500 │    ₹ 7,000       ║
║  Food & Beverage      │    —     │    —     │    ₹ 1,200       ║
║  Laundry             │    —     │    —     │    ₹ 300         ║
╠═══════════════════════════════════════════════════════════════════╣
║                                        Subtotal:    ₹ 8,500      ║
║                                        CGST (9%):   ₹ 765        ║
║                                        SGST (9%):   ₹ 765        ║
╠═══════════════════════════════════════════════════════════════════╣
║  Payment Mode: Credit Card        GRAND TOTAL:  ₹ 10,030 🟨     ║
║  Transaction ID: TXN987654321                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║        Thank you for staying with us!              [QR CODE]     ║
║                                                    Scan to Pay   ║
║  This is a computer-generated invoice.                           ║
║  No signature required.                                          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## Color Palette

### Primary Colors
- **Gold/Amber**: #D97706 (Amber-600)
- **Dark Gold**: #B45309 (Amber-700)
- **Crown Logo**: Amber-600

### Secondary Colors
- **Navy Blue**: #1F2937 (Gray-800) - Section headers
- **Dark Gray**: #374151 (Gray-700) - Body text
- **Light Gray**: #F9FAFB (Gray-50) - Alternate rows

### Accent Colors
- **White**: #FFFFFF - Background
- **Border**: #E5E7EB (Gray-200) - Table borders
- **Success**: #059669 (Green-600) - Payment status

## Typography

### Headings
- **Hotel Name**: 30px, Bold, Amber-700, Letter-spacing: 0.05em
- **INVOICE**: 40px, Bold, Gray-800
- **Section Headers**: 14px, Bold, White on Gray-800 background

### Body Text
- **Regular Text**: 14px, Gray-600
- **Bold Text**: 14px, Bold, Gray-900
- **Small Text**: 12px, Gray-500

### Table
- **Header**: 12px, Bold, Uppercase, White on Gray-800
- **Body**: 14px, Gray-700
- **Amounts**: 14px, Bold, Right-aligned

## Layout Specifications

### Sections
1. **Header** (Company Info + Invoice Details)
   - Padding: 24px
   - Border-bottom: 4px solid Amber-600

2. **Guest Details** (Navy Blue Bar)
   - Background: Gray-800
   - Color: White
   - Padding: 8px 16px

3. **Items Table**
   - Full-width
   - Border: 1px solid Gray-300
   - Alternating row colors

4. **Payment Summary**
   - Grand Total: Amber-700 background, White text
   - Font-size: 20px, Bold

5. **Footer**
   - Text-align: Center
   - Italic message
   - QR Code: 120x120px

### Spacing
- Section spacing: 24px
- Grid gaps: 24px
- Table padding: 12px 16px
- Border radius: 8px (for cards)

## Icons

- 📍 Location marker
- 📞 Phone icon  
- ✉️ Email icon
- 👑 Crown logo (SVG)
- [QR] QR Code (120x120px)

## Responsive Behavior

### Desktop (>1024px)
- Max-width: 900px
- Center-aligned
- Full feature display

### Tablet (768px - 1024px)
- Max-width: 100%
- Slightly reduced padding
- Maintained layout

### Mobile (<768px)
- Single column layout
- Stacked grid items
- Reduced font sizes
- Maintained readability

### Print
- Paper size: A4
- Margins: 0.5in all sides
- Remove navigation/buttons
- Optimized colors for print
- Page break control

## Print Optimization

```css
@media print {
  /* Hide navigation elements */
  .no-print { display: none; }
  
  /* Ensure full visibility of invoice */
  #invoice-print-area { 
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  /* Optimize colors */
  background-color: white;
  color: black;
}
```

## Accessibility

- ✅ High contrast ratios (WCAG AA)
- ✅ Semantic HTML structure
- ✅ Readable font sizes (minimum 12px)
- ✅ Clear section headings
- ✅ Logical tab order
- ✅ Print-friendly layout

## Professional Features

1. **Company Branding**
   - Prominent logo placement
   - Consistent color scheme
   - Professional tagline

2. **Clear Information Hierarchy**
   - Visual separation of sections
   - Bold important information
   - Structured data presentation

3. **Legal Compliance**
   - GST number display
   - Tax breakdown (CGST/SGST)
   - Invoice numbering
   - Date and time stamps

4. **Payment Integration**
   - QR code for digital payments
   - Transaction ID tracking
   - Multiple payment methods

5. **Professional Footer**
   - Thank you message
   - Legal disclaimer
   - Contact information

## File Size Optimization

- SVG icons (scalable, small size)
- Google Charts API for QR (no local assets)
- Optimized CSS (no heavy frameworks)
- Minimal JavaScript
- Fast loading times

## Browser Print Dialog

When users click "Print" or "Download PDF":
1. Opens native browser print dialog
2. Suggests "Save as PDF" destination
3. Maintains all styling and layout
4. Includes QR code and graphics
5. Proper page breaks

## Customization Options

To customize for your hotel:

1. **Update Hotel Details** in `InvoiceTemplate.tsx`:
   ```typescript
   <h1>YOUR HOTEL NAME</h1>
   <p>Your Tagline</p>
   <p>Your Address</p>
   <p>Your Phone</p>
   <p>Your Email</p>
   ```

2. **Change Colors**:
   - Replace `amber-600` with your brand color
   - Update `gray-800` for section headers
   - Modify accent colors as needed

3. **Update GST Number**:
   ```typescript
   gstNumber="YOUR_GST_NUMBER"
   ```

4. **Adjust Logo**:
   - Replace crown SVG with your logo
   - Update SVG path or use image

---

**Design Inspiration**: Luxury hotel invoicing standards from 5-star properties worldwide.
