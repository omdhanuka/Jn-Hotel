import React from 'react';
import { Search } from 'lucide-react';

interface BookingFiltersProps {
	filters: {
		search: string;
		type: string;
		status: string;
		startDate: string;
		endDate: string;
	};
	onFilterChange: (key: string, value: string) => void;
	onSearch: (value: string) => void;
}

const BookingFilters: React.FC<BookingFiltersProps> = ({ filters, onFilterChange, onSearch }) => (
	<div className="bg-white rounded-lg shadow-md p-6 mb-6">
		<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
			<div className="md:col-span-2">
				<label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
					<input
						type="text"
						value={filters.search}
						onChange={(e) => onSearch(e.target.value)}
						placeholder="Search by name, phone, email, or booking ID..."
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
				<select
					value={filters.type}
					onChange={(e) => onFilterChange('type', e.target.value)}
					className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					<option value="all">All Types</option>
					<option value="room">Room Bookings</option>
					<option value="restaurant">Restaurant</option>
					<option value="banquet">Banquet Halls</option>
				</select>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
				<select
					value={filters.status}
					onChange={(e) => onFilterChange('status', e.target.value)}
					className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					<option value="all">All Status</option>
					<option value="pending">Pending</option>
					<option value="confirmed">Confirmed</option>
					<option value="checked-in">Checked In</option>
					<option value="checked-out">Checked Out</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
				<input
					type="date"
					value={filters.startDate}
					onChange={(e) => onFilterChange('startDate', e.target.value)}
					className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
				<input
					type="date"
					value={filters.endDate}
					onChange={(e) => onFilterChange('endDate', e.target.value)}
					className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
		</div>
	</div>
);

export default BookingFilters;
