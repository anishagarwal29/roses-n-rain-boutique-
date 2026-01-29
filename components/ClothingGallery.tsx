import React from 'react';
import { Button } from './Button';

interface ClothingItem {
    id: string;
    title: string;
    src: string;
    price: string;
}

// Mock data generator
const INITIAL_ITEMS: ClothingItem[] = Array.from({ length: 12 }).map((_, i) => ({
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
    const [items, setItems] = React.useState<ClothingItem[]>(INITIAL_ITEMS);
    const [isUploadOpen, setIsUploadOpen] = React.useState(false);
    const [newItem, setNewItem] = React.useState({
        title: '',
        price: '',
        file: null as File | null
    });

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.file || !newItem.title || !newItem.price) return;

        const objectUrl = URL.createObjectURL(newItem.file);

        const itemToAdd: ClothingItem = {
            id: `custom-${Date.now()}`,
            title: newItem.title,
            price: newItem.price.startsWith('$') ? newItem.price : `$${newItem.price}`,
            src: objectUrl
        };

        setItems([itemToAdd, ...items]);
        setIsUploadOpen(false);
        setNewItem({ title: '', price: '', file: null });
    };

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
                    {/* Add New Item Card */}
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-dashed border-brand-200 hover:border-brand-400 flex flex-col items-center justify-center aspect-[3/4] gap-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <span className="font-serif text-lg text-brand-800">Add New Item</span>
                    </button>

                    {items.map((item) => (
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

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm"
                        onClick={() => setIsUploadOpen(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                        <button
                            onClick={() => setIsUploadOpen(false)}
                            className="absolute top-4 right-4 text-brand-400 hover:text-brand-800 p-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-2xl font-serif text-brand-900 mb-6">Add New Outfit</h2>

                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-700 mb-1">Upload Image</label>
                                <div className="border-2 border-dashed border-brand-200 rounded-lg p-6 text-center hover:bg-brand-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setNewItem({ ...newItem, file: e.target.files[0] });
                                            }
                                        }}
                                        required
                                    />
                                    {newItem.file ? (
                                        <p className="text-brand-800 font-medium truncate">{newItem.file.name}</p>
                                    ) : (
                                        <div className="text-brand-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                            </svg>
                                            <span className="text-sm">Click to upload image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                    placeholder="e.g. Royal Blue Silk Saree"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-700 mb-1">Price</label>
                                <input
                                    type="text"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                    placeholder="e.g. $250"
                                    required
                                />
                            </div>

                            <Button type="submit" fullWidth className="mt-4">
                                Add to Collection
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
