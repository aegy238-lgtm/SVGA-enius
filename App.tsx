
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Uploader } from './components/Uploader';
import { Workspace } from './components/Workspace';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { AppState, FileMetadata, MaterialAsset, UserRecord } from './types';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

declare var SVGA: any;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('svga_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setState(AppState.IDLE);
      } catch (e) {
        localStorage.removeItem('svga_user');
      }
    }
  }, []);

  const handleLogin = (user: UserRecord) => {
    setCurrentUser(user);
    localStorage.setItem('svga_user', JSON.stringify(user));
    setState(AppState.IDLE);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('svga_user');
    setShowAdminPanel(false);
    setState(AppState.LOGIN);
  };

  const logProcessToFirestore = async (metadata: FileMetadata) => {
    try {
      if (!currentUser) return;
      await addDoc(collection(db, "process_logs"), {
        fileName: metadata.name,
        userEmail: currentUser.email,
        userName: currentUser.name,
        fileSize: metadata.size,
        dimensions: `${metadata.dimensions?.width}x${metadata.dimensions?.height}`,
        frames: metadata.frames || 0,
        fileUrl: "Local Processing",
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.svga')) return;
    
    const fileUrl = URL.createObjectURL(file);
    try {
      const parser = new SVGA.Parser();
      parser.load(fileUrl, (videoItem: any) => {
        URL.revokeObjectURL(fileUrl);
        const images = videoItem.images || {};
        const assets: MaterialAsset[] = Object.keys(images).map((key, index) => ({
          id: `asset-${index}`, type: 'image', name: key, size: 'Raw', dimensions: 'Dynamic'
        }));
        const meta: FileMetadata = {
          name: file.name, size: file.size, type: 'SVGA',
          dimensions: { width: videoItem.videoSize?.width || 0, height: videoItem.videoSize?.height || 0 },
          fps: videoItem.FPS || 30, frames: videoItem.frames || 0, assets, videoItem,
          fileUrl: ""
        };
        setFileMetadata(meta);
        setState(AppState.PROCESSING);
        logProcessToFirestore(meta);
      }, () => {
        URL.revokeObjectURL(fileUrl);
        setState(AppState.IDLE);
      });
    } catch (err) {
      setState(AppState.IDLE);
    }
  }, [currentUser]);

  const handleReset = useCallback(() => {
    setState(AppState.IDLE);
    setFileMetadata(null);
    setShowAdminPanel(false);
  }, []);

  if (state === AppState.LOGIN) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-[#020617] overflow-hidden">
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative p-20 border-r border-white/5">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[150px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-3xl mx-auto mb-10 transform -rotate-12 hover:rotate-0 transition-transform duration-700">
               <span className="text-white text-6xl font-black italic">S</span>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4">SVGA <span className="text-sky-400">GENIUS</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-xs">The Quantum Animation Processor</p>
          </div>
        </div>
        
        <div className="w-full lg:w-[480px] h-full shadow-3xl z-50 overflow-y-auto">
          <Login onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden relative">
      <Header 
        onLogoClick={handleReset} 
        isAdmin={currentUser?.role === 'admin'} 
        userName={currentUser?.name}
        onAdminToggle={() => setShowAdminPanel(!showAdminPanel)}
        onLogout={handleLogout}
        isAdminOpen={showAdminPanel}
      />
      
      <div className="flex pt-20 h-screen overflow-hidden relative">
        <main className={`flex-1 overflow-y-auto transition-all duration-700 custom-scrollbar ${showAdminPanel ? 'lg:mr-[450px] opacity-20 lg:opacity-40 blur-sm' : 'mr-0'}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {state === AppState.IDLE && (
              <div className="py-10 sm:py-20 animate-in fade-in zoom-in duration-700">
                <Uploader onUpload={handleFileUpload} isUploading={false} />
              </div>
            )}

            {state === AppState.PROCESSING && fileMetadata && (
              <Workspace metadata={fileMetadata} onCancel={handleReset} />
            )}
          </div>
          
          <footer className="border-t border-white/5 py-8 text-center mt-10 sm:mt-20">
            <p className="text-[8px] sm:text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">SVGA GENIUS • WORKSPACE ISOLATION ACTIVE</p>
          </footer>
        </main>

        <aside 
          className={`fixed top-0 lg:top-20 right-0 bottom-0 w-full lg:w-[450px] bg-[#020617]/95 lg:bg-slate-900/90 backdrop-blur-3xl border-l border-white/10 z-[200] lg:z-[110] transition-transform duration-500 shadow-3xl overflow-y-auto ${showAdminPanel ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 sm:p-8 pt-24 lg:pt-8">
            <div className="flex justify-between items-center mb-8 sm:mb-10">
              <button 
                 onClick={() => setShowAdminPanel(false)}
                 className="w-12 h-12 lg:w-10 lg:h-10 bg-white/5 hover:bg-red-500/20 text-white rounded-2xl lg:rounded-xl flex items-center justify-center transition-all group border border-white/10"
               >
                 <svg className="w-6 h-6 lg:w-5 lg:h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <h3 className="text-white font-black uppercase text-xs sm:text-sm tracking-widest">Master Control</h3>
            </div>
            <AdminPanel />
          </div>
        </aside>
      </div>

      <style>{`
        .shadow-3xl { box-shadow: -20px 0 50px rgba(0,0,0,0.5); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.1); border-radius: 30px; }
      `}</style>
    </div>
  );
};

export default App;
