import React, { useRef, useState } from 'react';
import { Image, Video, X, UploadCloud, Film } from 'lucide-react';

interface MediaUploadZoneProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
  helperText?: string;
}

export const MediaUploadZone: React.FC<MediaUploadZoneProps> = ({
  mediaUrls,
  onChange,
  maxFiles = 4,
  label = 'Attach Photo / Video Evidence',
  helperText = 'Upload visual evidence of the problem or completed repair (PNG, JPG, MP4, WebM up to 10MB).'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - mediaUrls.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const resultUrl = e.target.result as string;
          onChange([...mediaUrls, resultUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = mediaUrls.filter((_, i) => i !== index);
    onChange(updated);
  };

  const isVideo = (url: string) => {
    return url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Image size={14} color="var(--color-primary)" />
        {label}
      </label>

      {mediaUrls.length < maxFiles && (
        <div
          className={`media-upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ 
              width: 34, 
              height: 34, 
              borderRadius: '50%', 
              background: 'var(--color-primary-subtle)', 
              color: 'var(--color-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <UploadCloud size={18} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Click to upload photo or video
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {helperText}
            </div>
          </div>
        </div>
      )}

      {/* Thumbnails Preview Grid */}
      {mediaUrls.length > 0 && (
        <div className="media-preview-grid">
          {mediaUrls.map((url, idx) => (
            <div key={idx} className="media-preview-item">
              {isVideo(url) ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                  <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: 4, fontSize: '10px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Film size={10} /> Video
                  </div>
                </div>
              ) : (
                <img src={url} alt={`Evidence #${idx + 1}`} />
              )}
              <button
                type="button"
                className="media-preview-remove"
                onClick={(e) => handleRemove(idx, e)}
                title="Remove evidence"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
