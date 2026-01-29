import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { ImageUpload, GenerationResult } from './types';
import { generateTryOnImage } from './services/geminiService';
import { ClothingGallery } from './components/ClothingGallery';

const initialImageState: ImageUpload = {
  file: null,
  previewUrl: null,
  base64: null,
  mimeType: ''
};

// Help Modal Component
const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl transform transition-all border border-brand-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-400 hover:text-brand-800 transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-serif text-brand-900 mb-6">How it Works</h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-bold text-lg">1</div>
            <div>
              <h3 className="font-bold text-brand-800 mb-1">Upload Your Photo</h3>
              <p className="text-brand-600 text-sm leading-relaxed">
                Take a clear, full-body photo standing straight. Good lighting is key for the most realistic result.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-bold text-lg">2</div>
            <div>
              <h3 className="font-bold text-brand-800 mb-1">Choose the Outfit</h3>
              <p className="text-brand-600 text-sm leading-relaxed">
                Select one of our exclusive dresses to try on. We've curated a selection of our finest pieces for you.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-bold text-lg">3</div>
            <div>
              <h3 className="font-bold text-brand-800 mb-1">See the Magic</h3>
              <p className="text-brand-600 text-sm leading-relaxed">
                Click "Try It On" and our AI stylist will drape the outfit onto you in seconds, preserving the exact colors and embroidery.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-100">
          <Button onClick={onClose} fullWidth>
            Start Styling
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [personImage, setPersonImage] = useState<ImageUpload>(initialImageState);
  const [clothingImage, setClothingImage] = useState<ImageUpload>(initialImageState);
  const [result, setResult] = useState<GenerationResult>({
    imageUrl: null,
    loading: false,
    error: null
  });
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currentView, setView] = useState<'HOME' | 'GALLERY'>('HOME');

  const handleGenerate = async () => {
    if (!personImage.base64 || !clothingImage.base64) return;

    setResult({ ...result, loading: true, error: null });

    try {
      const generatedImageUrl = await generateTryOnImage(personImage, clothingImage);
      setResult({
        imageUrl: generatedImageUrl,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setResult({
        imageUrl: null,
        loading: false,
        error: error.message || "Something went wrong during the try-on process."
      });
    }
  };

  const handleReset = () => {
    setPersonImage(initialImageState);
    setClothingImage(initialImageState);
    setResult({ imageUrl: null, loading: false, error: null });
  };

  const isReadyToGenerate = personImage.base64 && clothingImage.base64 && !result.loading;

  if (currentView === 'GALLERY') {
    return (
      <ClothingGallery
        onBack={() => setView('HOME')}
        onSelect={async (item) => {
          // Pre-process the selected item
          const response = await fetch(item.src);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setClothingImage({
              file: new File([blob], "preset.jpg", { type: blob.type }),
              previewUrl: item.src,
              base64: reader.result as string,
              mimeType: blob.type
            });
            setView('HOME');
          };
          reader.readAsDataURL(blob);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f8f6] text-slate-800 font-sans pb-20">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Navigation / Header */}
      <nav className="bg-white border-b border-brand-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span className="font-serif text-2xl font-bold text-brand-900 tracking-tight">Roses N Rain</span>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center gap-2 text-brand-800 font-medium text-sm uppercase tracking-wide hover:text-brand-600 transition-colors px-4 py-2 rounded-full hover:bg-brand-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                How to Use
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <header className="text-center mb-16">
          <h1 className="font-serif text-5xl md:text-6xl text-brand-900 mb-6">
            Ethnic Wear Studio
          </h1>
          <p className="text-xl text-brand-700 max-w-2xl mx-auto font-light leading-relaxed">
            Experience authentic Indian couture from home. Visualize our intricate embroideries and vibrant colors on yourself instantly.
          </p>
        </header>

        {/* Try-On Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Upload Section */}
          <div className="lg:col-span-5 space-y-8 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-100">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-brand-900">1. Upload Photos</h2>
              <p className="text-brand-500 text-sm">For best results, use a full-length photo with good lighting.</p>
            </div>

            <ImageUploader
              id="person-upload"
              label="Your Photo"
              imageState={personImage}
              onChange={setPersonImage}
            />

            <div className="flex items-center gap-4">
              <div className="h-px bg-brand-100 flex-1"></div>
              <span className="text-brand-300 text-sm font-serif italic">&</span>
              <div className="h-px bg-brand-100 flex-1"></div>
            </div>

            {/* Clothing Selection Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-brand-800 uppercase tracking-wider mb-2">
                Choose an Outfit
              </label>

              {!clothingImage.previewUrl ? (
                <button
                  onClick={() => setView('GALLERY')}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 hover:bg-brand-50 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 group-hover:bg-brand-200 group-hover:text-brand-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <span className="font-serif text-xl text-brand-800">Browse Collection</span>
                </button>
              ) : (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-200 shadow-sm group">
                  <img
                    src={clothingImage.previewUrl}
                    alt="Selected Outfit"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setView('GALLERY')}
                      className="bg-white text-brand-900 px-6 py-2 rounded-full font-medium shadow-lg hover:bg-brand-50 transform translate-y-2 group-hover:translate-y-0 transition-all"
                    >
                      Change Outfit
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!isReadyToGenerate}
              fullWidth
              className="mt-4"
            >
              {result.loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Draping Outfit...
                </>
              ) : (
                <>
                  <span className="text-lg">Try It On</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 00-1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </>
              )}
            </Button>

            {result.error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {result.error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <div className="h-full min-h-[600px] bg-white rounded-3xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-100 relative overflow-hidden flex flex-col">
              {/* Decorative header within the frame */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="text-brand-200 font-serif text-9xl opacity-10 leading-none select-none">
                  Roses N Rain
                </div>
              </div>

              {result.imageUrl ? (
                <div className="relative flex-1 rounded-2xl overflow-hidden group">
                  <img
                    src={result.imageUrl}
                    alt="Virtual Try-On Result"
                    className="w-full h-full object-contain bg-brand-50"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-4">
                    <a
                      href={result.imageUrl}
                      download="lumiere-try-on.png"
                      className="bg-white text-brand-900 px-6 py-2 rounded-full font-medium shadow-lg hover:bg-brand-50 transition-colors"
                    >
                      Download Photo
                    </a>
                    <button
                      onClick={handleReset}
                      className="bg-brand-900 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-brand-800 transition-colors"
                    >
                      Try New Outfit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-brand-50/50 rounded-2xl border-2 border-dashed border-brand-100 p-8 text-center">
                  {!result.loading ? (
                    <>
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-brand-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <h3 className="font-serif text-2xl text-brand-800 mb-2">Your look will appear here</h3>
                      <p className="text-brand-400 font-light max-w-xs">
                        Upload a photo of yourself and select an outfit from our collection.
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center animate-pulse">
                      <div className="w-64 h-80 bg-brand-100/50 rounded-lg mb-4"></div>
                      <p className="text-brand-500 font-serif italic text-lg">Weaving the threads...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 mt-20 py-8 border-t border-brand-100 text-center text-brand-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Roses N Rain Indian Boutique. Powered by AI.</p>
      </footer>
    </div>
  );
}