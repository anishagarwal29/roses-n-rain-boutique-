import React, { useRef } from 'react';
import { ImageUpload } from '../types';

interface ImageUploaderProps {
  label: string;
  imageState: ImageUpload;
  onChange: (newState: ImageUpload) => void;
  id: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, imageState, onChange, id }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          file: file,
          previewUrl: reader.result as string, // This is also the base64 string with header
          base64: reader.result as string,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onChange({
      file: null,
      previewUrl: null,
      base64: null,
      mimeType: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <label htmlFor={id} className="text-brand-900 font-serif font-semibold text-lg">
        {label}
      </label>

      <div
        className={`
          relative flex flex-col items-center justify-center w-full h-80 
          border-2 border-dashed rounded-xl transition-all duration-300
          ${imageState.previewUrl ? 'border-brand-400 bg-white' : 'border-brand-200 bg-white hover:bg-slate-50 hover:border-brand-300'}
        `}
      >
        {imageState.previewUrl ? (
          <>
            <img
              src={imageState.previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl brightness-125 contrast-105"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 rounded-full p-2 shadow-sm backdrop-blur-sm transition-colors"
              title="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-brand-400 cursor-pointer w-full h-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium">Click to upload photo</span>
            <span className="text-xs text-brand-300 mt-1">JPG or PNG</span>
          </div>
        )}
      </div>

      <input
        type="file"
        id={id}
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
    </div>
  );
};