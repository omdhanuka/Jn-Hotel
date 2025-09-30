import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendWelcomeEmail = async (email: string, firstName: string) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email service not configured, skipping welcome email');
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to GrandStay Hotel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to GrandStay Hotel, ${firstName}!</h1>
          <p>Thank you for registering with us. We're excited to have you as our guest.</p>
          <p>You can now:</p>
          <ul>
            <li>Book luxury rooms and suites</li>
            <li>Reserve banquet halls for events</li>
            <li>Make restaurant reservations</li>
            <li>Order room service</li>
          </ul>
          <p>Start earning loyalty points with every booking!</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The GrandStay Team</strong></p>
        </div>
      `
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

export const sendBookingConfirmation = async (email: string, bookingDetails: any) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email service not configured, skipping booking confirmation');
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Booking Confirmation - GrandStay Hotel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Booking Confirmed! 🎉</h1>
          <p>Your booking has been confirmed. Here are the details:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr><td><strong>Booking ID:</strong></td><td>${bookingDetails.id}</td></tr>
              <tr><td><strong>Type:</strong></td><td>${bookingDetails.type}</td></tr>
              <tr><td><strong>Check-in:</strong></td><td>${new Date(bookingDetails.checkIn).toLocaleDateString()}</td></tr>
              <tr><td><strong>Check-out:</strong></td><td>${new Date(bookingDetails.checkOut).toLocaleDateString()}</td></tr>
              <tr><td><strong>Guests:</strong></td><td>${bookingDetails.guests}</td></tr>
              <tr><td><strong>Total Amount:</strong></td><td style="color: #2563eb; font-weight: bold;">$${bookingDetails.totalAmount}</td></tr>
            </table>
          </div>
          <p>We look forward to hosting you at GrandStay Hotel!</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The GrandStay Team</strong></p>
        </div>
      `
    });
    console.log(`Booking confirmation sent to ${email}`);
  } catch (error) {
    console.error('Booking confirmation email failed:', error);
  }
};

export const sendOrderConfirmation = async (email: string, orderDetails: any) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email service not configured, skipping order confirmation');
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Order Confirmation - GrandStay Restaurant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea580c;">Order Confirmed! 🍽️</h1>
          <p>Your food order has been received and is being prepared.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p><strong>Order ID:</strong> ${orderDetails.id}</p>
            <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
            <p><strong>Estimated Time:</strong> ${orderDetails.estimatedTime} minutes</p>
          </div>
          <p>You'll receive an update when your order is ready!</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Order confirmation email failed:', error);
  }
};
