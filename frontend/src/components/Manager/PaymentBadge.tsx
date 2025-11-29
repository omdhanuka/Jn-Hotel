import React from 'react';
import { DollarSign, Clock, XCircle, AlertCircle } from 'lucide-react';

interface PaymentBadgeProps {
  status: string;
}

const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status }) => {
  const map = {
    paid: {
      classes: 'bg-green-100 text-green-800 border-green-200',
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Paid'
    },
    pending: {
      classes: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <Clock className="h-4 w-4" />,
      label: 'Pending'
    },
    failed: {
      classes: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="h-4 w-4" />,
      label: 'Failed'
    },
    refunded: {
      classes: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Refunded'
    },
    cancelled: {
      classes: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <XCircle className="h-4 w-4" />,
      label: 'Cancelled'
    },
    partial: {
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <AlertCircle className="h-4 w-4" />,
      label: 'Partial'
    }
  } as const;

  const normalized = status.toLowerCase();
  const config = map[normalized as keyof typeof map] ?? {
    classes: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Clock className="h-4 w-4" />,
    label: status
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};

export default PaymentBadge;
