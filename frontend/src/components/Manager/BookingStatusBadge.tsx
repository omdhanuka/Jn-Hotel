import React from 'react';
import { CheckCircle, Clock, XCircle, Check } from 'lucide-react';

interface BookingStatusBadgeProps {
  status: string;
}

const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Confirmed'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-4 w-4" />,
          label: 'Pending'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="h-4 w-4" />,
          label: 'Cancelled'
        };
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Check className="h-4 w-4" />,
          label: 'Completed'
        };
      case 'checked-in':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Checked In'
        };
      case 'checked-out':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Check className="h-4 w-4" />,
          label: 'Checked Out'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-4 w-4" />,
          label: status
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};

export default BookingStatusBadge;
