import React from 'react';
import { Button } from './Button';
import { GenerationResult } from '../types';

interface ResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: GenerationResult;
    onReset: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, result, onReset }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl max-w-2xl w-full py-16 px-8 shadow-2xl transform transition-all border border-brand-100 flex flex-col items-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-brand-400 hover:text-brand-800 transition-colors p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-3xl font-serif text-brand-900 mb-6">Your Look</h2>

                <div className="w-full h-[60vh] max-h-[600px] flex items-center justify-center bg-brand-50 rounded-xl overflow-hidden mb-6 relative border border-brand-100">
                    {result.imageUrl ? (
                        <img
                            src={result.imageUrl}
                            alt="Virtual Try-On Result"
                            className="w-full h-full object-contain brightness-110"
                        />
                    ) : result.loading ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-brand-600 font-serif text-lg">Weaving the threads...</p>
                        </div>
                    ) : result.error ? (
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                            </div>
                            <p className="text-red-700 font-medium mb-1">Draping Failed</p>
                            <p className="text-red-500 text-sm max-w-xs">{result.error}</p>
                        </div>
                    ) : (
                        <div className="text-brand-400">
                            Image will appear here
                        </div>
                    )}
                </div>

                {result.imageUrl && (
                    <div className="flex gap-4 w-full justify-center">
                        <a
                            href={result.imageUrl}
                            download="roses-n-rain-look.png"
                            className="flex items-center justify-center gap-2 bg-white text-brand-900 border border-brand-200 px-6 py-3 rounded-full font-medium shadow-sm hover:bg-brand-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            Download
                        </a>
                        <Button onClick={() => { onReset(); onClose(); }}>
                            Try Another Outfit
                        </Button>
                    </div>
                )}
                {result.error && (
                    <Button onClick={onReset}>
                        Try Again
                    </Button>
                )}
            </div>
        </div>
    );
};
