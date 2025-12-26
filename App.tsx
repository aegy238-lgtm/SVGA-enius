
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Uploader } from './components/Uploader';
import { Workspace } from './components/Workspace';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { AppState, FileMetadata, MaterialAsset, UserRecord } from './types';
import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

declare var SVGA: any;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);

  // Persistence check
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
      // Log details for the Admin to see
      await addDoc(collection(db, "process_logs"), {
        fileName: metadata.name,
        userEmail: currentUser.email,
        userName: currentUser.name,
        fileSize: metadata.size,
        dimensions: `${metadata.dimensions?.width}x${metadata.dimensions?.height}`,
        frames: metadata.frames || 0,
        fileUrl: metadata.fileUrl || "",
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.svga')) return;
    setState(AppState.UPLOADING);
    
    let downloadUrl = "";
    try {
      // 1. Upload to Firebase Storage for permanent link
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      downloadUrl = await getDownloadURL(uploadResult.ref);
    } catch (err) {
      console.error("Storage upload failed, proceeding with local processing only", err);
    }

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
          fileUrl: downloadUrl
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
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden selection:bg-sky-500/30">
      <Header 
        onLogoClick={handleReset} 
        isAdmin={currentUser?.role === 'admin'} 
        userName={currentUser?.name}
        onAdminToggle={() => setShowAdminPanel(!showAdminPanel)}
        onLogout={handleLogout}
        isAdminOpen={showAdminPanel}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[85vh] relative pt-24">
        {showAdminPanel && (
          <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-2xl p-4 sm:p-10 overflow-y-auto">
            <div className="max-w-6xl mx-auto bg-slate-900 rounded-[3rem] border border-white/10 shadow-3xl p-6 sm:p-10 relative mt-10">
               <button 
                 onClick={() => setShowAdminPanel(false)}
                 className="absolute top-6 right-6 sm:top-10 sm:right-10 w-12 h-12 bg-white/5 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl z-50"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <AdminPanel />
            </div>
          </div>
        )}

        <div className={showAdminPanel ? "blur-xl scale-[0.98] pointer-events-none opacity-20 transition-all duration-700" : "transition-all duration-700"}>
          {state === AppState.IDLE && (
            <div className="py-20">
              <Uploader onUpload={handleFileUpload} isUploading={false} />
            </div>
          )}

          {state === AppState.UPLOADING && (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="w-24 h-24 border-8 border-sky-500/10 border-t-sky-500 rounded-full animate-spin mb-8 shadow-glow-sky"></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter animate-pulse text-center">جاري الرفع والفحص السحابي...</h2>
            </div>
          )}

          {state === AppState.PROCESSING && fileMetadata && (
            <Workspace metadata={fileMetadata} onCancel={handleReset} />
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-10 mt-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.5em]">SVGA GENIUS • QUANTUM MANAGEMENT INTERFACE</p>
        </div>
      </footer>
      <style>{`
        .shadow-glow-sky { box-shadow: 0 0 30px rgba(14, 165, 233, 0.4); }
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8); }
      `}</style>
    </div>
  );
};

export default App;
