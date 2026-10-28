import { useState, useRef } from 'react';
import { HiOutlineUpload, HiOutlineX } from 'react-icons/hi';
import api from '../../services/api';
import toast from 'react-hot-toast';

function ImageUploader({ images, onChange, maxImages = 5 }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can upload a maximum of ${maxImages} images`);
      return;
    }

    // Validate size and types
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    try {
      const res = await api.post('/listings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.images) {
        onChange([...images, ...res.data.images]);
        toast.success(`${res.data.images.length} photo(s) uploaded`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">
          Item Photos ({images.length}/{maxImages})
        </label>
        <span className="text-xs text-slate-400">PNG, JPG, WebP up to 5MB</span>
      </div>

      {/* Grid of uploaded images + upload button */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {images.map((img, idx) => (
          <div
            key={img.publicId || idx}
            className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
          >
            <img
              src={img.url}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-sm"
              title="Remove photo"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-xl bg-slate-50 hover:bg-primary-50/30 transition-colors cursor-pointer text-slate-500 hover:text-primary-600 disabled:opacity-50"
          >
            <HiOutlineUpload className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">
              {uploading ? 'Uploading...' : 'Add Photo'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default ImageUploader;
