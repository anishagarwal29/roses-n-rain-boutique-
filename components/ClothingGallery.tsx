import React from 'react';
import { Button } from './Button';

interface ClothingItem {
    id: string;
    title: string;
    src: string;
    price: string;
}

// Mock data generator
const MOCK_CLOTHING: ClothingItem[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `dress-${i + 1}`,
    title: i === 0 ? "Signature Red Cocktail Dress" : `Elegant Evening Gown ${i + 1}`,
    src: '/red-dress.jpg',
    price: `$${150 + i * 10}`
}));

interface ClothingGalleryProps {
    onSelect: (item: ClothingItem) => void;
    onBack: () => void;
}

export const ClothingGallery: React.FC<ClothingGalleryProps> = ({ onSelect, onBack }) => {
    return (
        <div className="min-h-screen bg-[#f9f8f6] animate-fade-in">
            <nav className="bg-white border-b border-brand-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-brand-800 font-medium hover:text-brand-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Back to Studio
                        </button>
                        <span className="font-serif text-xl font-bold text-brand-900 tracking-tight">Select Outfit</span>
                        <div className="w-24"></div> {/* Spacer for centering */}
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header className="mb-12 text-center">
                    <h1 className="font-serif text-4xl text-brand-900 mb-4">The Collection</h1>
                    <p className="text-brand-600 max-w-2xl mx-auto">
                        Explore our curated selection of premium ethnic wear. Choose a style to virtually try on.
                    </p>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {MOCK_CLOTHING.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100 overflow-hidden cursor-pointer"
                            onClick={() => onSelect(item)}
                        >
                            <div className="aspect-[3/4] relative overflow-hidden bg-brand-50">
                                <img
                                    src={item.src}
                                    alt={item.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <button className="absolute bottom-4 right-4 bg-white text-brand-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    Try On
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-serif text-lg text-brand-900 truncate">{item.title}</h3>
                                <p className="text-brand-500 text-sm mt-1">{item.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
