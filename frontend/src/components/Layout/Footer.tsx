import React from 'react';
import { Crown, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Hotel Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2 rounded-lg shadow-lg">
                <Crown className="h-7 w-7 text-gray-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                  JN PALACE
                </span>
                <span className="text-xs text-amber-400 tracking-widest font-light">LUXURY HOTEL</span>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              Experience the epitome of luxury and comfort at JN Palace. We offer premium accommodations,
              world-class dining, and exceptional event spaces designed for the most discerning guests.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="bg-gray-700/50 p-3 rounded-lg hover:bg-amber-500/20 hover:text-amber-400 transition-all duration-300 group"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-gray-700/50 p-3 rounded-lg hover:bg-amber-500/20 hover:text-amber-400 transition-all duration-300 group"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-gray-700/50 p-3 rounded-lg hover:bg-amber-500/20 hover:text-amber-400 transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-gray-700/50 p-3 rounded-lg hover:bg-amber-500/20 hover:text-amber-400 transition-all duration-300 group"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-amber-400 tracking-wide">QUICK LINKS</h3>
            <div className="space-y-3">
              <Link
                to="/rooms"
                className="block text-gray-300 hover:text-amber-400 transition-colors duration-300 hover:translate-x-1 transform"
              >
                Room Booking
              </Link>
              <Link
                to="/restaurant"
                className="block text-gray-300 hover:text-amber-400 transition-colors duration-300 hover:translate-x-1 transform"
              >
                Dining Experience
              </Link>
              <Link
                to="/banquets"
                className="block text-gray-300 hover:text-amber-400 transition-colors duration-300 hover:translate-x-1 transform"
              >
                Event Spaces
              </Link>
              <a
                href="#"
                className="block text-gray-300 hover:text-amber-400 transition-colors duration-300 hover:translate-x-1 transform"
              >
                Gallery
              </a>
              <a
                href="#"
                className="block text-gray-300 hover:text-amber-400 transition-colors duration-300 hover:translate-x-1 transform"
              >
                About Us
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-amber-400 tracking-wide">CONTACT US</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <MapPin className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm leading-relaxed">
                  123 Royal Street, Palace District<br />
                  New Delhi, India 110001
                </span>
              </div>
              <div className="flex items-center space-x-3 group">
                <Phone className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <a href="tel:+911234567890" className="text-gray-300 hover:text-amber-400 transition-colors text-sm">
                  +91 123 456 7890
                </a>
              </div>
              <div className="flex items-center space-x-3 group">
                <Mail className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <a href="mailto:info@jnpalace.com" className="text-gray-300 hover:text-amber-400 transition-colors text-sm">
                  info@jnpalace.com
                </a>
              </div>
              <div className="flex items-start space-x-3 group">
                <Clock className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm leading-relaxed">
                  24/7 Service Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700/50 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} JN Palace Hotel. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                Privacy Policy
              </a>
              <span className="text-gray-600">|</span>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                Terms of Service
              </a>
              <span className="text-gray-600">|</span>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
