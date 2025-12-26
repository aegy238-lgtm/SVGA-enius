
import React, { useState } from 'react';

interface UploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onUpload, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`relative max-w-4xl mx-auto h-96 rounded-[3rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-8 p-10 cursor-pointer shadow-3xl
        ${isDragOver ? 'border-sky-500 bg-sky-500/10 scale-[1.01]' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input 
        id="file-input"
        type="file" 
        accept=".svga"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="w-24 h-24 bg-sky-500/10 rounded-3xl flex items-center justify-center text-sky-400 border border-sky-500/20">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      
      <div className="text-center">
        <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Upload SVGA Asset</h3>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select or drag your file to start editing</p>
      </div>

      <div className="flex gap-4">
        <span className="px-5 py-2 bg-white/5 rounded-2xl text-[10px] text-slate-500 border border-white/10 font-black uppercase tracking-widest">SVGA ONLY</span>
        <span className="px-5 py-2 bg-white/5 rounded-2xl text-[10px] text-slate-500 border border-white/10 font-black uppercase tracking-widest">MAX 50MB</span>
      </div>
      
      <style>{`
        .shadow-3xl { box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6); }
      `}</style>
    </div>
  );
};
