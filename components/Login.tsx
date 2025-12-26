
import React, { useState } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { UserRecord } from '../types';

const MASTER_ADMIN_EMAIL = "admin@genius.com";
const MASTER_ADMIN_PASSWORD = "admin123";

interface LoginProps {
  onLogin: (user: UserRecord) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const fetchAndCheckUser = async (userEmail: string) : Promise<UserRecord | null> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);

    const isMaster = userEmail.toLowerCase() === MASTER_ADMIN_EMAIL;

    if (querySnapshot.empty) {
      const allUsersSnapshot = await getDocs(query(collection(db, "users"), limit(1)));
      const isFirstUser = allUsersSnapshot.empty || isMaster;

      const newUser = {
        name: isMaster ? "Master Admin" : (name || userEmail.split('@')[0]),
        email: userEmail.toLowerCase(),
        password: isMaster ? MASTER_ADMIN_PASSWORD : (password || ''), 
        role: isFirstUser ? 'admin' : 'user',
        isApproved: isFirstUser, 
        status: isFirstUser ? 'active' : 'pending',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      const docRef = await addDoc(usersRef, newUser);
      return { id: docRef.id, ...newUser } as UserRecord;
    } else {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserRecord;
      
      if (isMaster && userData.role !== 'admin') {
         await updateDoc(userDoc.ref, { role: 'admin', isApproved: true, status: 'active' });
         userData.role = 'admin';
         userData.isApproved = true;
         userData.status = 'active';
      }

      await updateDoc(userDoc.ref, { lastLogin: serverTimestamp() });
      return { id: userDoc.id, ...userData };
    }
  };

  const handleAuthResult = (user: UserRecord, fromSignup: boolean = false) => {
    if (user.status === 'banned') {
      setError("عذراً، هذا الحساب محظور.");
      return;
    }
    
    if (!user.isApproved && user.role !== 'admin') {
      if (fromSignup) {
        setSuccessMessage("تم الطلب! بانتظار الموافقة.");
        setIsSignUp(false); 
      } else {
        setError("بانتظار الموافقة.");
      }
      return;
    }
    
    onLogin(user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (email.toLowerCase() === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASSWORD) {
         const user = await fetchAndCheckUser(email);
         if (user) {
           handleAuthResult(user);
           return;
         }
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (isSignUp) {
        if (!querySnapshot.empty) {
          setError("مسجل مسبقاً.");
          setIsSignUp(false);
          setIsLoading(false);
          return;
        }
        const user = await fetchAndCheckUser(email);
        if (user) handleAuthResult(user, true);
      } else {
        if (querySnapshot.empty) {
          setError("البريد غير مسجل.");
        } else {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as UserRecord;
          if (userData.password !== password) {
            setError("كلمة المرور خطأ.");
          } else {
            handleAuthResult({ id: userDoc.id, ...userData });
          }
        }
      }
    } catch (err) {
      setError("خطأ اتصال.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-slate-900/60 backdrop-blur-3xl border-l border-white/10 flex flex-col p-8 sm:p-14 relative overflow-hidden font-arabic">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-600 shadow-glow-sky"></div>
      
      <div className="flex-1 flex flex-col justify-center text-right">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
            {isSignUp ? 'إنضم إلينا' : 'تسجيل الدخول'}
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            {isSignUp ? 'أنشئ حسابك لبدء المعالجة' : 'الوصول إلى بوابة المدير الماستر'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center animate-shake">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">الاسم</label>
              <input 
                type="text" required disabled={isLoading} value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:border-sky-500/30 outline-none transition-all text-right"
                placeholder="أدخل اسمك"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">البريد الإلكتروني</label>
            <input 
              type="email" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-sky-500/30 transition-all text-left"
              placeholder="admin@genius.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">كلمة المرور</label>
            <input 
              type="password" required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-sky-500/30 transition-all text-left"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black rounded-2xl active:scale-95 transition-all shadow-glow-sky-sm hover:shadow-glow-sky text-sm uppercase tracking-widest"
          >
            {isLoading ? "جاري المعالجة..." : (isSignUp ? 'إرسال طلب' : 'دخول الماستر')}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-white/5 text-center">
          <button 
              type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); }}
              className="text-sky-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
          >
              {isSignUp ? 'لديك حساب؟ سجل الآن' : 'طلب إنشاء حساب جديد'}
          </button>
        </div>
      </div>

      <div className="mt-auto text-center">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em]">Quantum Security Protocol v2.5</p>
      </div>
      
      <style>{`
        .shadow-glow-sky { box-shadow: 0 0 30px rgba(14, 165, 233, 0.4); }
        .shadow-glow-sky-sm { box-shadow: 0 0 15px rgba(14, 165, 233, 0.2); }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};
