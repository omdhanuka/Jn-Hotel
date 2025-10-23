import nodemailer from 'nodemailer';
import { IBooking } from '../models/Booking';

// Create transporter only when needed (lazy initialization)
let transporter: nodemailer.Transporter | null = null;
let isInitialized = false;

// Check if email credentials are available
const hasEmailCredentials = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const isDisabled = process.env.DISABLE_EMAILS === 'true';
  
  if (isDisabled) {
    console.warn('⚠️ Emails disabled by DISABLE_EMAILS flag');
    return false;
  }
  
  if (!emailUser || !emailPass) {
    return false;
  }
  
  return true;
};

const initializeEmailService = async () => {
  if (isInitialized) return;
  
  console.log('🔍 Initializing email service...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? `Set (${process.env.EMAIL_USER})` : 'Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `Set (${process.env.EMAIL_PASS.length} chars)` : 'Not set');
  
  if (hasEmailCredentials()) {
    try {
      console.log('🔄 Creating email transporter...');
      const emailPass = process.env.EMAIL_PASS!.replace(/\s/g, '');
      
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER!,
          pass: emailPass
        }
      });

      console.log('🔄 Verifying email connection...');
      await transporter.verify();
      console.log('✅ Email transporter ready and verified');
    } catch (error: any) {
      console.error('❌ Email transporter verification failed:', error.message);
      if (error.code === 'EAUTH') {
        console.log('📧 Gmail Authentication Failed - Check your credentials');
      }
      transporter = null;
    }
  } else {
    console.warn('⚠️ Email credentials not configured - emails will be logged only');
  }
  
  isInitialized = true;
};

// Email logging function
const logEmail = (to: string, subject: string, type: string, details?: any) => {
  console.log('\n📧 ===== EMAIL LOG =====');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Type: ${type}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  if (details) {
    console.log('Details:', JSON.stringify(details, null, 2));
  }
  console.log('Status: Logged (Email service unavailable)');
  console.log('======================\n');
};

// Helper functions for status styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return '#059669';
    case 'cancelled': return '#dc2626';
    case 'completed': return '#2563eb';
    default: return '#d97706';
  }
};

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Your booking has been confirmed! 🎉';
    case 'cancelled': return 'Your booking has been cancelled. 😔';
    case 'completed': return 'Your booking has been completed. Thank you! ✅';
    case 'pending': return 'Your booking is pending confirmation. ⏳';
    default: return `Your booking status has been updated to ${status}.`;
  }
};

// send booking confirmation
export async function sendBookingConfirmation(
  to: string,
  booking: IBooking,
  user: { firstName: string; lastName: string }
) {
  // Initialize email service if not already done
  await initializeEmailService();
  
  const subject = `Booking Confirmation – ${booking.type.toUpperCase()}`;
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Booking Confirmation', {
      bookingId: booking._id,
      type: booking.type,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
      userName: `${user.firstName} ${user.lastName}`
    });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: #059669; margin: 0;">Booking Confirmation</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; color: #374151;">Hello ${user.firstName} ${user.lastName},</p>
        <p style="color: #6b7280;">Thank you for your booking! Your reservation has been confirmed.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Booking ID:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Type:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-in:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkIn).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-out:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkOut).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Guests:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking.guests}</td>
          </tr>
          ${booking.eventDetails?.eventType ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Event Type:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking.eventDetails.eventType}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Total Amount:</td>
            <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">$${booking.totalAmount}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 20px;">
        <p style="margin: 0; color: #1e40af;"><strong>Status:</strong> Your booking is ${booking.status} and payment status is ${booking.paymentStatus}.</p>
      </div>
      
      ${booking.specialRequests ? `
      <div style="background-color: #fef3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #92400e; margin-top: 0;">Special Requests:</h4>
        <p style="color: #92400e; margin: 0;">${booking.specialRequests}</p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6b7280; margin-bottom: 15px;">Thank you for choosing our hotel!</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking Details</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Booking confirmation email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendBookingConfirmation failed:', error);
    // Fallback to logging
    logEmail(to, subject, 'Booking Confirmation (Error)', {
      bookingId: booking._id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// send booking status update
export async function sendBookingStatusUpdate(
  to: string,
  userName: string,
  booking: IBooking,
  oldStatus: string,
  newStatus: string
) {
  // Initialize email service if not already done
  await initializeEmailService();
  
  const subject = `Booking Status Updated – ${newStatus.toUpperCase()}`;
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Status Update', {
      bookingId: booking._id,
      oldStatus,
      newStatus,
      userName
    });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: ${getStatusColor(newStatus)}; margin: 0;">Booking Status Update</h2>
      </div>
      
      <div style="text-align: center; margin-bottom: 25px;">
        <p style="font-size: 18px; color: #374151; margin-bottom: 10px;">Hello ${userName},</p>
        <p style="font-size: 16px; color: #4b5563;">${getStatusMessage(newStatus)}</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Booking Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Booking ID:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Type:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-in:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkIn).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-out:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkOut).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Total Amount:</td>
            <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">$${booking.totalAmount}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: ${newStatus === 'confirmed' ? '#ecfdf5' : newStatus === 'cancelled' ? '#fef2f2' : '#eff6ff'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${getStatusColor(newStatus)}; margin-bottom: 20px;">
        <p style="margin: 0; color: ${getStatusColor(newStatus)};">
          <strong>Status Changed:</strong> ${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)} → ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking Details</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ 
      from: process.env.EMAIL_USER, 
      to, 
      subject, 
      html 
    });
    console.log(`✅ Status update email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendBookingStatusUpdate failed:', error);
    logEmail(to, subject, 'Status Update (Error)', {
      bookingId: booking._id,
      oldStatus,
      newStatus,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// send payment status update
export async function sendPaymentStatusUpdate(
  to: string,
  userName: string,
  booking: IBooking,
  paymentStatus: string
) {
  // Initialize email service if not already done
  await initializeEmailService();
  
  const subject = `Payment ${paymentStatus.toUpperCase()} – Booking ${booking._id}`;
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Payment Update', {
      bookingId: booking._id,
      paymentStatus,
      userName
    });
    return;
  }

  try {
    await transporter.sendMail({ 
      from: process.env.EMAIL_USER, 
      to, 
      subject, 
      html: `<h2>Hello ${userName},</h2><p>Your payment status is now: <strong>${paymentStatus}</strong>.</p>` 
    });
    console.log(`✅ Payment update email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendPaymentStatusUpdate failed:', error);
    logEmail(to, subject, 'Payment Update (Error)', {
      bookingId: booking._id,
      paymentStatus,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// send welcome email (after user registration)
export async function sendWelcomeEmail(
  to: string,
  firstName: string
) {
  // Initialize email service if not already done
  await initializeEmailService();
  
  const subject = 'Welcome to GrandStay Hotel';
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Welcome Email', { firstName });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: #059669; margin: 0;">Welcome!</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; color: #374151;">Hello ${firstName},</p>
        <p style="color: #6b7280;">Thank you for registering at GrandStay Hotel!</p>
        <p style="color: #6b7280;">We're excited to have you. You can now:</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <ul style="color: #374151; margin: 0; padding-left: 20px;">
          <li>Book rooms and suites</li>
          <li>Reserve banquet halls</li>
          <li>Make restaurant reservations</li>
          <li>Manage your bookings online</li>
          <li>Earn loyalty points with every booking</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Get Started</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Welcome email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendWelcomeEmail failed:', error);
    logEmail(to, subject, 'Welcome Email (Error)', { firstName });
  }
}

// send booking reminder (1 day before)
export async function sendBookingReminder(
  to: string,
  booking: IBooking,
  user: { firstName: string; lastName: string }
) {
  // Initialize email service if not already done
  await initializeEmailService();
  
  const subject = `Reminder: Upcoming Booking – ${booking.type.toUpperCase()}`;
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Booking Reminder', {
      bookingId: booking._id,
      type: booking.type,
      checkIn: booking.checkIn,
      userName: `${user.firstName} ${user.lastName}`
    });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: #059669; margin: 0;">Booking Reminder</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; color: #374151;">Hello ${user.firstName} ${user.lastName},</p>
        <p style="color: #6b7280;">This is a friendly reminder about your upcoming booking.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Booking ID:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Type:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-in:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkIn).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-out:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkOut).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Guests:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking.guests}</td>
          </tr>
          ${booking.eventDetails?.eventType ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Event Type:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking.eventDetails.eventType}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Total Amount:</td>
            <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">$${booking.totalAmount}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6b7280; margin-bottom: 15px;">We look forward to welcoming you!</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking Details</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Booking reminder email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendBookingReminder failed:', error);
    logEmail(to, subject, 'Booking Reminder (Error)', {
      bookingId: booking._id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// send thank you email (after checkout)
export async function sendThankYouEmail(
  to: string,
  userName: string,
  booking: IBooking
) {
  const subject = 'Thank You for Staying with Us!';
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Thank You Email', {
      bookingId: booking._id,
      userName
    });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: #059669; margin: 0;">Thank You!</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; color: #374151;">Dear ${userName},</p>
        <p style="color: #6b7280;">Thank you for choosing GrandStay Hotel. We hope you had a pleasant stay.</p>
        <p style="color: #6b7280;">We value your feedback. Please let us know how we did.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/feedback" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Give Feedback</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Thank you email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendThankYouEmail failed:', error);
    logEmail(to, subject, 'Thank You Email (Error)', {
      bookingId: booking._id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// send invoice email (after payment)
export async function sendInvoiceEmail(
  to: string,
  userName: string,
  booking: IBooking
) {
  const subject = `Invoice for Your Stay – Booking ${booking._id}`;
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Invoice Email', {
      bookingId: booking._id,
      userName
    });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: #059669; margin: 0;">Invoice</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; color: #374151;">Hello ${userName},</p>
        <p style="color: #6b7280;">Thank you for your payment. Please find your invoice details below.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin-top: 0;">Invoice Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Booking ID:</td>
            <td style="padding: 8px 0; color: #6b7280;">${booking._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Name:</td>
            <td style="padding: 8px 0; color: #6b7280;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-in:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkIn).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Check-out:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(booking.checkOut).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Total Amount:</td>
            <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">$${booking.totalAmount}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6b7280; margin-bottom: 15px;">We appreciate your business!</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking Details</a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Invoice email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendInvoiceEmail failed:', error);
    logEmail(to, subject, 'Invoice Email (Error)', {
      bookingId: booking._id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// send password reset email
export async function sendPasswordResetEmail(
  to: string,
  token: string
) {
  const subject = 'Password Reset Request';
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Password Reset Email', { token });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: #059669; margin: 0;">Password Reset</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; color: #374151;">Hello,</p>
        <p style="color: #6b7280;">We received a request to reset your password.</p>
        <p style="color: #6b7280;">Click the button below to reset it:</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.CLIENT_URL}/reset-password?token=${token}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center;">
        <p>If you didn't request this, please ignore this email.</p>
        <p>For security, this link will expire in 30 minutes.</p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Password reset email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendPasswordResetEmail failed:', error);
    logEmail(to, subject, 'Password Reset Email (Error)', { token });
  }
}

// send account verification email
export async function sendVerificationEmail(
  to: string,
  token: string
) {
  const subject = 'Account Verification Required';
  
  // Log email if no transporter available
  if (!transporter) {
    logEmail(to, subject, 'Verification Email', { token });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🏨 Hotel Management</h1>
        <h2 style="color: #059669; margin: 0;">Verify Your Account</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 18px; color: #374151;">Hello,</p>
        <p style="color: #6b7280;">Thank you for registering at GrandStay Hotel.</p>
        <p style="color: #6b7280;">Please verify your account by clicking the button below:</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.CLIENT_URL}/verify-account?token=${token}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Account</a>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center;">
        <p>If you didn't create an account, please ignore this email.</p>
        <p>For security, this link will expire in 30 minutes.</p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>If you have any questions, please contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">${process.env.EMAIL_USER}</a></p>
        <p>© 2024 Hotel Management. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Verification email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendVerificationEmail failed:', error);
    logEmail(to, subject, 'Verification Email (Error)', { token });
  }
}

// send banquet booking confirmation email
export async function sendBanquetBookingConfirmation(
  to: string,
  booking: IBooking,
  user: { firstName: string; lastName: string }
) {
  await initializeEmailService();
  
  const subject = `Banquet Booking Confirmation – ${booking.eventDetails?.eventType || 'Event'}`;
  
  if (!transporter) {
    logEmail(to, subject, 'Banquet Confirmation', {
      bookingId: booking._id,
      eventType: booking.eventDetails?.eventType,
      checkIn: booking.checkIn,
      totalAmount: booking.totalAmount
    });
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <div style="text-align: center; margin-bottom: 30px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
        <h1 style="color: #fff; margin-bottom: 10px; font-size: 28px;">🎉 BANQUET BOOKING CONFIRMED</h1>
        <h2 style="color: #f0f8ff; margin: 0; font-size: 20px;">${booking.eventDetails?.eventType || 'Special Event'}</h2>
      </div>
      
      <div style="background: white; color: #333; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 20px;">
          <p style="font-size: 18px; color: #4c51bf; font-weight: bold;">Dear ${user.firstName} ${user.lastName},</p>
          <p style="color: #6b7280; font-size: 16px;">🎊 Congratulations! Your banquet booking has been confirmed. Get ready for an unforgettable celebration!</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="color: white; margin-top: 0; text-align: center; font-size: 20px;">✨ EVENT DETAILS ✨</h3>
          
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">📋 Booking ID:</span>
              <span>${booking._id}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">🎪 Event Type:</span>
              <span>${booking.eventDetails?.eventType || 'Special Event'}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">👤 Host Name:</span>
              <span>${booking.eventDetails?.fullName || `${user.firstName} ${user.lastName}`}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">📅 Event Date:</span>
              <span>${new Date(booking.checkIn).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">⏰ Event Time:</span>
              <span>${new Date(booking.checkIn).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
              })} - ${new Date(booking.checkOut).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">👥 Expected Guests:</span>
              <span>${booking.guests} people</span>
            </div>
            
            ${booking.eventDetails?.cateringPreference ? `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">🍽️ Catering:</span>
              <span>${booking.eventDetails.cateringPreference}</span>
            </div>
            ` : ''}
            
            ${booking.eventDetails?.decorationTheme ? `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">🎨 Decoration:</span>
              <span>${booking.eventDetails.decorationTheme}</span>
            </div>
            ` : ''}
            
            ${booking.eventDetails?.seatingArrangement ? `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px;">
              <span style="font-weight: bold;">💺 Seating:</span>
              <span>${booking.eventDetails.seatingArrangement}</span>
            </div>
            ` : ''}
            
            <div style="display: flex; justify-content: space-between; padding-top: 12px; font-size: 20px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-top: 10px;">
              <span>💰 Total Amount:</span>
              <span style="color: #ffd700;">$${booking.totalAmount}</span>
            </div>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #38a169, #48bb78); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
          <h4 style="margin-top: 0; font-size: 18px;">🎯 BOOKING STATUS</h4>
          <p style="margin: 0; font-size: 16px; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
            <strong>Event Status:</strong> ${booking.status.toUpperCase()} ✅<br>
            <strong>Payment Status:</strong> ${booking.paymentStatus.toUpperCase()} 💳
          </p>
        </div>
        
        ${booking.eventDetails?.musicDjRequired ? `
        <div style="background: linear-gradient(135deg, #e53e3e, #f56565); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h4 style="margin: 0;">🎵 MUSIC & DJ SERVICES INCLUDED</h4>
        </div>
        ` : ''}
        
        ${booking.eventDetails?.parkingRequired ? `
        <div style="background: linear-gradient(135deg, #3182ce, #4299e1); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h4 style="margin: 0;">🚗 PARKING ARRANGED (${booking.eventDetails.numberOfVehicles || 'Multiple'} vehicles)</h4>
        </div>
        ` : ''}
        
        ${booking.specialRequests ? `
        <div style="background: #fef3cd; color: #92400e; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
          <h4 style="margin-top: 0; color: #92400e;">📝 Special Requests:</h4>
          <p style="margin: 0; font-style: italic;">${booking.specialRequests}</p>
        </div>
        ` : ''}
        
        <div style="background: linear-gradient(135deg, #805ad5, #9f7aea); color: white; padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: white;">🎉 WHAT'S NEXT?</h3>
          <div style="text-align: left; max-width: 400px; margin: 0 auto;">
            <p style="margin: 8px 0;">✨ Our event coordinator will contact you 48 hours before the event</p>
            <p style="margin: 8px 0;">🎪 Setup begins 2 hours before your event time</p>
            <p style="margin: 8px 0;">📞 24/7 support available for any changes or queries</p>
            <p style="margin: 8px 0;">🎁 Complimentary welcome drinks for all guests</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #6b7280; margin-bottom: 15px; font-size: 16px;">Ready to celebrate? We can't wait to host your special event!</p>
          <a href="${process.env.CLIENT_URL}/dashboard" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            🎊 VIEW EVENT DETAILS
          </a>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; text-align: center;">
        <p style="margin: 10px 0; color: #f0f8ff;">📧 Questions? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #ffd700; text-decoration: underline;">${process.env.EMAIL_USER}</a></p>
        <p style="margin: 10px 0; color: #f0f8ff;">🌟 Thank you for choosing us for your special celebration!</p>
        <p style="margin: 0; color: #e2e8f0; font-size: 14px;">© 2024 Hotel Management - Making Memories Since Day One</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Banquet confirmation email sent to ${to}`);
  } catch (error) {
    console.error('❌ sendBanquetBookingConfirmation failed:', error);
    logEmail(to, subject, 'Banquet Confirmation (Error)', {
      bookingId: booking._id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}