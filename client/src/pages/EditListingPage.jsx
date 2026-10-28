import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImageUploader from '../components/listing/ImageUploader';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'textbooks', label: '📚 Textbooks' },
  { value: 'electronics', label: '💻 Electronics' },
  { value: 'bicycles', label: '🚲 Bicycles' },
  { value: 'calculators', label: '🖩 Calculators' },
  { value: 'furniture', label: '🪑 Furniture' },
  { value: 'clothing', label: '👕 Clothing' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'stationery', label: '✏️ Stationery' },
  { value: 'other', label: '📦 Other' },
];

const CONDITIONS = [
  { value: 'like_new', label: 'Like New — flawless, barely used' },
  { value: 'good', label: 'Good — minor cosmetic wear, fully functional' },
  { value: 'fair', label: 'Fair — noticeable wear, works fine' },
  { value: 'worn', label: 'Worn — heavily used, functional' },
];

function EditListingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'textbooks',
    condition: 'good',
    startingPrice: '',
    minBidIncrement: '10',
    closingTime: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        const l = res.data.listing;

        // Restriction check
        if (l.bidCount > 0) {
          toast.error('Cannot edit listing after bids have been placed');
          navigate(`/auction/${id}`);
          return;
        }

        setFormData({
          title: l.title,
          description: l.description,
          category: l.category,
          condition: l.condition,
          startingPrice: String(l.startingPrice),
          minBidIncrement: String(l.minBidIncrement || 10),
          closingTime: new Date(l.closingTime).toISOString().slice(0, 16),
        });
        setImages(l.images || []);
      } catch {
        toast.error('Failed to load listing for editing');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/listings/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        startingPrice: Number(formData.startingPrice),
        minBidIncrement: Number(formData.minBidIncrement),
        closingTime: new Date(formData.closingTime).toISOString(),
        images,
      });

      toast.success('Listing updated successfully!');
      navigate(`/auction/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-2 text-slate-500 text-sm">Loading listing details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Auction Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ImageUploader images={images} onChange={setImages} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={4}
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Starting Price (₹)</label>
              <input
                type="number"
                name="startingPrice"
                required
                min="1"
                value={formData.startingPrice}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Bid Increment (₹)</label>
              <input
                type="number"
                name="minBidIncrement"
                required
                min="1"
                value={formData.minBidIncrement}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Closing Time</label>
            <input
              type="datetime-local"
              name="closingTime"
              required
              value={formData.closingTime}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/auction/${id}`)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditListingPage;
