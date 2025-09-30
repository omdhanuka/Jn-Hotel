import React from 'react';
import { Hotel, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Hotel Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Hotel className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">GrandStay Hotel</span>
            </div>
            <p className="text-gray-300 mb-4">
              Experience luxury and comfort at GrandStay Hotel. We offer premium accommodations,
              world-class dining, and exceptional event spaces for all your needs.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-gray-400 hover:text-blue-400 cursor-pointer transition" />
              <Twitter className="h-6 w-6 text-gray-400 hover:text-blue-400 cursor-pointer transition" />
              <Instagram className="h-6 w-6 text-gray-400 hover:text-blue-400 cursor-pointer transition" />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">123 Luxury Avenue, City, State 12345</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">info@grandstay.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="/rooms" className="block text-gray-300 hover:text-white transition">
                Room Booking
              </a>
              <a href="/banquets" className="block text-gray-300 hover:text-white transition">
                Event Spaces
              </a>
              <a href="/restaurant" className="block text-gray-300 hover:text-white transition">
                Restaurant
              </a>
              <a href="#" className="block text-gray-300 hover:text-white transition">
                Privacy Policy
              </a>
              <a href="#" className="block text-gray-300 hover:text-white transition">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 GrandStay Hotel. All rights reserved. Built with ❤️ for exceptional hospitality.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
