import React from 'react';
import { Eye, Users, MapPin, Calendar, Loader, CheckCircle, ArrowRight } from 'lucide-react';
import RoomStatusBadge from './RoomStatusBadge';

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  floor: number;
  status: string;
  isBooked: boolean;
  maxGuests: number;
  price: number;
  currentGuest?: {
    name: string;
    bookingId: string;
    checkIn: string;
    checkOut: string;
    paymentStatus: string;
  } | null;
}

interface RoomCardProps {
  room: Room;
  onViewDetails: () => void;
  onUpdateStatus: () => void;
  onMoveGuest?: () => void;
  onCompleteTask?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  onViewDetails, 
  onUpdateStatus,
  onMoveGuest,
  onCompleteTask 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Room {room.roomNumber}
          </h3>
          <p className="text-sm text-gray-600 capitalize mt-1">
            {room.type} • Floor {room.floor}
          </p>
        </div>
        <RoomStatusBadge status={room.status} isBooked={room.isBooked} />
      </div>

      {/* Room Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2" />
          <span>Max {room.maxGuests} guests</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>₹{room.price}/night</span>
        </div>
      </div>

      {/* Current Guest Info */}
      {room.currentGuest && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-blue-900">Current Guest</h4>
            <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
              #{room.currentGuest.bookingId}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-2">
            {room.currentGuest.name}
          </p>
          <div className="flex items-center text-xs text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {new Date(room.currentGuest.checkIn).toLocaleDateString()} - 
              {new Date(room.currentGuest.checkOut).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              room.currentGuest.paymentStatus === 'paid' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              Payment: {room.currentGuest.paymentStatus}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </button>

        {room.isBooked && onMoveGuest && (
          <button
            onClick={onMoveGuest}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Move Guest
          </button>
        )}

        {(room.status === 'cleaning' || room.status === 'maintenance') && onCompleteTask && (
          <button
            onClick={onCompleteTask}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark {room.status === 'cleaning' ? 'Cleaning' : 'Maintenance'} Complete
          </button>
        )}

        {!room.isBooked && room.status === 'active' && (
          <button
            onClick={onUpdateStatus}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            <Loader className="h-4 w-4 mr-2" />
            Update Status
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
