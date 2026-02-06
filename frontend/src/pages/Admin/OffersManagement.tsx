import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Gift, Save, X, Image as ImageIcon, Calendar, Percent } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Offer {
  _id?: string;
  title: string;
  description: string;
  discount: number;
  image: string;
  features: string[];
  validUntil: string;
  category: 'romantic' | 'luxury' | 'family' | 'business';
  price: number;
  originalPrice: number;
  code: string;
  isActive: boolean;
  createdAt?: string;
}

const OffersManagement: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<Offer>({
    title: '',
    description: '',
    discount: 0,
    image: '',
    features: [''],
    validUntil: '',
    category: 'luxury',
    price: 0,
    originalPrice: 0,
    code: '',
    isActive: true
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/offers');
      setOffers(response.data.offers || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Filter out empty features
      const cleanedData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (editingOffer?._id) {
        await axios.put(`/offers/${editingOffer._id}`, cleanedData);
        toast.success('Offer updated successfully!');
      } else {
        await axios.post('/offers', cleanedData);
        toast.success('Offer created successfully!');
      }
      
      fetchOffers();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving offer:', error);
      toast.error(error.response?.data?.message || 'Failed to save offer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await axios.delete(`/offers/${id}`);
      toast.success('Offer deleted successfully!');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.patch(`/offers/${id}/toggle`, { isActive: !isActive });
      toast.success(`Offer ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchOffers();
    } catch (error) {
      console.error('Error toggling offer:', error);
      toast.error('Failed to update offer status');
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData(offer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffer(null);
    setFormData({
      title: '',
      description: '',
      discount: 0,
      image: '',
      features: [''],
      validUntil: '',
      category: 'luxury',
      price: 0,
      originalPrice: 0,
      code: '',
      isActive: true
    });
  };

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      romantic: 'bg-pink-100 text-pink-800',
      luxury: 'bg-purple-100 text-purple-800',
      family: 'bg-blue-100 text-blue-800',
      business: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.luxury;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-8 w-8 text-amber-600" />
            Special Offers Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage exclusive hotel offers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Create New Offer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-2 border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide">Total Offers</p>
              <p className="text-3xl font-bold text-gray-900">{offers.length}</p>
            </div>
            <Gift className="h-12 w-12 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-2 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide">Active Offers</p>
              <p className="text-3xl font-bold text-green-600">{offers.filter(o => o.isActive).length}</p>
            </div>
            <Calendar className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-2 border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide">Inactive Offers</p>
              <p className="text-3xl font-bold text-red-600">{offers.filter(o => !o.isActive).length}</p>
            </div>
            <X className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wide">Avg Discount</p>
              <p className="text-3xl font-bold text-purple-600">
                {offers.length > 0 ? Math.round(offers.reduce((sum, o) => sum + o.discount, 0) / offers.length) : 0}%
              </p>
            </div>
            <Percent className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow">
          <Gift className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Offers Yet</h3>
          <p className="text-gray-600 mb-6">Create your first special offer to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Create First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div key={offer._id} className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-amber-100 hover:shadow-xl transition-all">
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={offer.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold shadow-lg">
                  {offer.discount}% OFF
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getCategoryBadge(offer.category)}`}>
                    {offer.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{offer.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{offer.description}</p>
                
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-amber-600">₹{offer.price.toLocaleString()}</span>
                    <span className="text-lg text-gray-400 line-through">₹{offer.originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <p className="text-xs text-gray-600">Promo Code</p>
                    <p className="text-sm font-bold text-amber-600">{offer.code}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Valid Until: {new Date(offer.validUntil).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offer.isActive}
                        onChange={() => handleToggleActive(offer._id!, offer.isActive)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                    <span className={`text-sm font-semibold ${offer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(offer._id!)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-amber-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Offer Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    placeholder="e.g., Romantic Getaway Package"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    placeholder="Describe what's included in this offer..."
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    required
                  >
                    <option value="romantic">Romantic</option>
                    <option value="luxury">Luxury</option>
                    <option value="family">Family</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                {/* Promo Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition uppercase"
                    placeholder="e.g., ROMANCE15"
                    required
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Original Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    placeholder="10000"
                    min="0"
                    required
                  />
                </div>

                {/* Discount % */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Discount (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => {
                      const discount = Number(e.target.value);
                      const price = Math.round(formData.originalPrice * (1 - discount / 100));
                      setFormData({ ...formData, discount, price });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    placeholder="15"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                {/* Offer Price (Auto-calculated) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated from original price and discount</p>
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    placeholder="https://images.unsplash.com/photo-..."
                    required
                  />
                </div>

                {/* Features */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Features/Inclusions
                  </label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        placeholder="e.g., Complimentary champagne on arrival"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Add Feature
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <Save className="h-5 w-5" />
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersManagement;
