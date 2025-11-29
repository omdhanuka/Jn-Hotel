import React from 'react';
import { CheckCircle, AlertCircle, Wrench, Loader, Clock } from 'lucide-react';

interface RoomStatusBadgeProps {
  status: string;
  isBooked: boolean;
}

const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({ status, isBooked }) => {
  const getStatusConfig = () => {
    if (isBooked) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Occupied'
      };
    }

    switch (status) {
      case 'active':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Available'
        };
      case 'cleaning':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Loader className="h-4 w-4" />,
          label: 'Cleaning'
        };
      case 'maintenance':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Wrench className="h-4 w-4" />,
          label: 'Maintenance'
        };
      case 'reserved':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Clock className="h-4 w-4" />,
          label: 'Reserved'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-4 w-4" />,
          label: status
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      {config.icon}
      <span className="ml-1.5">{config.label}</span>
    </span>
  );
};

export default RoomStatusBadge;
