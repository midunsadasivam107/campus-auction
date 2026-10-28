import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function CreateListingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Helper for preset duration (hours)
  const getPresetDate = (hours) => {
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'textbooks',
    condition: 'good',
    startingPrice: '',
    minBidIncrement: '10',
    closingTime: getPresetDate(24), // Default 24 hours
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applyDurationPreset = (hours) => {
    setFormData({ ...formData, closingTime: getPresetDate(hours) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to list an item');
      navigate('/login');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one photo of the item');
      return;
    }

    if (Number(formData.startingPrice) <= 0) {
      toast.error('Starting price must be at least ₹1');
      return;
    }

    const closingDate = new Date(formData.closingTime);
    if (closingDate <= new Date()) {
      toast.error('Closing time must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        startingPrice: Number(formData.startingPrice),
        minBidIncrement: Number(formData.minBidIncrement) || 10,
        closingTime: closingDate.toISOString(),
        images,
      };

      const res = await api.post('/listings', payload);
      toast.success('Auction listing created successfully! 🎉');
      navigate(`/auction/${res.data.listing._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
            Seller Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            Create an Auction Listing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pass on your essentials to fellow junior students through a live auction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <ImageUploader images={images} onChange={setImages} />

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Item Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. TI-84 Plus Graphing Calculator with Cable"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Condition *
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              rows={4}
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe age, wear and tear, included accessories, pickup location on campus..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Starting Price (₹) *
              </label>
              <input
                type="number"
                name="startingPrice"
                required
                min="1"
                step="1"
                value={formData.startingPrice}
                onChange={handleChange}
                placeholder="e.g. 500"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Bid Increment (₹)
              </label>
              <input
                type="number"
                name="minBidIncrement"
                required
                min="1"
                step="1"
                value={formData.minBidIncrement}
                onChange={handleChange}
                placeholder="10"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Closing Time & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Auction Closing Date & Time *
              </label>
              <div className="flex gap-1.5">
                {[
                  { label: '2h', hours: 2 },
                  { label: '12h', hours: 12 },
                  { label: '24h', hours: 24 },
                  { label: '3d', hours: 72 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyDurationPreset(preset.hours)}
                    className="text-xs bg-slate-100 hover:bg-primary-100 text-slate-600 hover:text-primary-700 px-2 py-0.5 rounded font-medium transition-colors"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="datetime-local"
              name="closingTime"
              required
              value={formData.closingTime}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              ⚡ Anti-sniping rule: Any bid placed within 30 seconds of closing will extend the deadline by 60 seconds.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating Listing...' : 'Publish Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateListingPage;
