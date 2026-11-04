import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { uploadImage, deleteUpload } from '../../services/uploadService.js';

/**
 * Upload images to Cloudinary and keep them as [{ url, publicId }].
 * - multiple: up to `max` images (rooms, maintenance photos)
 * - single:   max={1} (profile photo, homepage photo)
 */
export default function ImageUploader({ value = [], onChange, folder, max = 6, label = 'Photos', hint, round = false }) {
  const inputRef = useRef(null);
  const uploadedHere = useRef(new Set()); // images uploaded in this form but not saved yet
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const images = Array.isArray(value) ? value : value ? [value] : [];
  const single = max === 1;
  const latest = useRef(images);
  latest.current = images;

  // When the component goes away, nothing else to clean up; saved images are managed by the server
  useEffect(() => () => uploadedHere.current.clear(), []);

  const emit = (list) => onChange(single ? list[0] || null : list);

  const addFiles = async (fileList) => {
    setError('');
    const room = max - (single ? 0 : latest.current.length);
    const files = Array.from(fileList).slice(0, Math.max(room, 0));
    if (!files.length) {
      setError(`You can add up to ${max} photo${max > 1 ? 's' : ''}.`);
      return;
    }
    setPending((n) => n + files.length);
    for (const file of files) {
      try {
        const img = await uploadImage(file, folder);
        uploadedHere.current.add(img.publicId);
        if (single) {
          const old = latest.current[0];
          if (old?.publicId && uploadedHere.current.has(old.publicId)) deleteUpload(old.publicId).catch(() => {});
          latest.current = [img];
        } else {
          latest.current = [...latest.current, img];
        }
        emit(latest.current);
      } catch (err) {
        setError(err.message);
      } finally {
        setPending((n) => n - 1);
      }
    }
  };

  const remove = (img) => {
    const next = latest.current.filter((i) => i !== img);
    latest.current = next;
    emit(next);
    // Delete straight away only if it was never saved; saved ones are removed by the server on save
    if (img.publicId && uploadedHere.current.has(img.publicId)) {
      uploadedHere.current.delete(img.publicId);
      deleteUpload(img.publicId).catch(() => {});
    }
  };

  const makeCover = (img) => emit([img, ...latest.current.filter((i) => i !== img)]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const canAdd = single || images.length + pending < max;

  return (
    <div className={`uploader ${round ? 'uploader-round' : ''}`}>
      {label && <span className="field-label">{label}</span>}
      <div className="uploader-grid">
        {images.map((img, i) => (
          <figure key={img.publicId || img.url} className="uploader-thumb">
            <img src={img.url} alt={`${label} ${i + 1}`} loading="lazy" onError={(e) => e.currentTarget.classList.add('is-broken')} />
            {!single && i === 0 && <span className="uploader-cover">Cover</span>}
            <div className="uploader-actions">
              {!single && i > 0 && (
                <button type="button" onClick={() => makeCover(img)} title="Use as cover photo" aria-label="Use as cover photo">
                  <Icon name="star" size={14} />
                </button>
              )}
              <button type="button" onClick={() => remove(img)} title="Remove" aria-label="Remove photo">
                <Icon name="trash" size={14} />
              </button>
            </div>
          </figure>
        ))}
        {Array.from({ length: pending }).map((_, i) => (
          <div key={`p${i}`} className="uploader-thumb uploader-loading" aria-label="Uploading">
            <span className="spinner" />
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            className={`uploader-drop ${dragging ? 'is-dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Icon name={single && images.length ? 'refresh' : 'upload'} size={20} />
            <span>{single && images.length ? 'Replace' : 'Add photo'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        multiple={!single}
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <span className="field-hint">{hint || `Drag photos here or click to choose. Stored on Cloudinary${single ? '' : `, up to ${max}`}.`}</span>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
