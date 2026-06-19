import React, { useState, useRef, useCallback } from 'react';

const ImageDropzone = ({ images, onAdd, onRemove, onSetPrimary }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    const previews = valid.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    onAdd(previews);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 group',
          dragging
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : 'border-border-theme hover:border-accent/60 hover:bg-surface',
        ].join(' ')}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/10 text-accent group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
          <i className="ri-image-add-line text-2xl" />
        </div>
        <div className="text-center">
          <p className="font-bold text-foreground text-sm">
            {dragging ? 'Drop to upload' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-foreground/40 mt-1">
            or click to browse · PNG, JPG, WEBP — max 7 images, 5 MB each
          </p>
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase text-accent bg-accent/10 px-4 py-1.5 rounded-full">
          Browse Files
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square">
              <img
                src={img.url}
                alt={`Product ${i + 1}`}
                className={[
                  'w-full h-full object-cover rounded-xl transition-all duration-300 border border-border-theme',
                  i === 0 ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : '',
                ].join(' ')}
              />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[8px] font-black tracking-widest uppercase bg-accent text-accent-content px-1.5 py-0.5 rounded-full">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSetPrimary(i); }}
                    title="Set as primary"
                    className="w-6 h-6 bg-accent text-accent-content rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <i className="ri-star-line text-xs" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  title="Remove"
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <i className="ri-close-line text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;
