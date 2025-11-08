import React, { useState, useEffect } from 'react';
import { Star, Check, X, Eye, Trash2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Review {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  booking: {
    type: string;
    checkIn: string;
    checkOut: string;
  };
  rating: number;
  title: string;
  comment: string;
  experienceType: string;
  isApproved: boolean;
  isPublished: boolean;
  adminResponse?: string;
  createdAt: string;
}

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/reviews?status=${filter}&limit=50`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      toast.error('Failed to fetch reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string, isApproved: boolean, isPublished: boolean) => {
    try {
      await axios.put(`/api/reviews/admin/${reviewId}`, {
        isApproved,
        isPublished,
        adminResponse: adminResponse || undefined
      });
      toast.success(`Review ${isApproved ? 'approved' : 'rejected'} successfully`);
      setSelectedReview(null);
      setAdminResponse('');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await axios.delete(`/api/reviews/admin/${reviewId}`);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const getStatusBadge = (review: Review) => {
    if (!review.isApproved) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
    }
    if (review.isPublished) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Published</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Approved</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Approved
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">
              {filter === 'pending' ? 'No pending reviews to approve' : 'No reviews available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {review.user.firstName} {review.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{review.user.email}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="text-sm font-medium text-gray-900 mb-1">{review.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">{review.comment}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm text-gray-600">{review.experienceType}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(review)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!review.isApproved && (
                          <button
                            onClick={() => handleApprove(review._id, true, true)}
                            className="text-green-600 hover:text-green-800"
                            title="Approve & Publish"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Review Details</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Guest Information</h3>
                <p className="text-sm text-gray-600">
                  {selectedReview.user.firstName} {selectedReview.user.lastName} ({selectedReview.user.email})
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Rating</h3>
                <div className="flex">
                  {[...Array(selectedReview.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Title</h3>
                <p className="text-sm text-gray-600">{selectedReview.title}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Review</h3>
                <p className="text-sm text-gray-600">{selectedReview.comment}</p>
              </div>

              {!selectedReview.isApproved && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Response (Optional)
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Add a response to the guest..."
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setAdminResponse('');
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              {!selectedReview.isApproved && (
                <>
                  <button
                    onClick={() => handleApprove(selectedReview._id, false, false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedReview._id, true, true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve & Publish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
