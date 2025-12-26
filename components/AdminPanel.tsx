
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { UserRecord, ProcessLog } from '../types';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserRecord[];
      setUsers(usersData);
    }, (err) => console.error("Users sync error:", err));

    // Listen to logs
    const logsQuery = query(collection(db, "process_logs"), orderBy("timestamp", "desc"));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProcessLog[];
      setLogs(logsData);
      setIsLoading(false);
    }, (err) => {
      console.error("Logs sync error:", err);
      setIsLoading(false);
    });

    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, []);

  const updateUserStatus = async (userId: string, updates: Partial<UserRecord>) => {
    try {
      await updateDoc(doc(db, "users", userId), updates);
    } catch (e) {
      alert("خطأ في التحديث");
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm("حذف المستخدم نهائياً؟")) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (e) {
        alert("فشل الحذف");
      }
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "جاري المزامنة...";
    try {
      // Check if it's a Firestore Timestamp
      if (typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleString('ar-EG');
      }
      // Check if it's a regular Date or numeric timestamp
      return new Date(ts).toLocaleString('ar-EG');
    } catch (e) {
      return "تاريخ غير معروف";
    }
  };

  const copyLogToClipboard = (log: ProcessLog) => {
    const dateStr = log.timestamp && typeof log.timestamp.toDate === 'function' 
      ? log.timestamp.toDate().toLocaleString() 
      : 'غير متوفر';
      
    const text = `ملف: ${log.fileName || 'بلا اسم'}\nبواسطة: ${log.userName || 'مجهول'} (${log.userEmail || 'بلا بريد'})\nالأبعاد: ${log.dimensions || 'N/A'}\nالفريمات: ${log.frames || 0}\nرابط التحميل: ${log.fileUrl || 'غير متوفر'}\nالتاريخ: ${dateStr}`;
    
    navigator.clipboard.writeText(text);
    alert("تم نسخ بيانات ورابط الملف بنجاح!");
  };

  const downloadFile = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sky-500 font-black text-xs uppercase tracking-widest">Quantum Link Establishing...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-700 font-sans">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
        <div className="text-right order-2 sm:order-1">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-1 text-right">
            {activeTab === 'users' ? 'إدارة الأعضاء' : 'سجل الملفات المرفوعة'}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Master Control Protocol</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 order-1 sm:order-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            المستخدمين
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            سجل النشاط
          </button>
        </div>
      </div>

      <div className="bg-slate-950/50 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        {activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">المستخدم</th>
                  <th className="px-8 py-6">الحالة</th>
                  <th className="px-8 py-6">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-4">
                        <div className="text-right">
                          <div className="text-white font-black text-sm">{user.name || 'مستخدم مجهول'}</div>
                          <div className="text-slate-500 text-[10px] font-mono opacity-60">{user.email}</div>
                        </div>
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg transition-all border ${user.status === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-800 text-sky-400 border-white/5'}`}>
                          {(user.name?.[0] || 'U').toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                        user.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        user.status === 'pending' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse' :
                        'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}>
                        {user.status === 'pending' ? 'بانتظار الموافقة' : 
                         user.status === 'active' ? 'نشط' : 'محظور'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                         {user.status === 'pending' && (
                           <button 
                             onClick={() => updateUserStatus(user.id, { isApproved: true, status: 'active' })}
                             className="px-4 py-2 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                           >
                              موافقة
                           </button>
                         )}

                         {user.status === 'active' && user.role !== 'admin' && (
                           <button 
                             onClick={() => updateUserStatus(user.id, { isApproved: false, status: 'banned' })}
                             className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                           >
                              حظر
                           </button>
                         )}

                         {user.status === 'banned' && (
                           <button 
                             onClick={() => updateUserStatus(user.id, { isApproved: true, status: 'active' })}
                             className="px-4 py-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                           >
                              إلغاء حظر
                           </button>
                         )}
                         
                         <button 
                           onClick={() => deleteUser(user.id)}
                           className="p-2.5 bg-white/5 text-slate-500 hover:bg-red-600 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                           title="حذف نهائي"
                         >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                  <th className="px-8 py-6">الملف</th>
                  <th className="px-8 py-6">المستخدم</th>
                  <th className="px-8 py-6">التاريخ</th>
                  <th className="px-8 py-6">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-600 text-xs font-black uppercase tracking-[0.4em]">لا توجد سجلات بعد</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                           <span className="text-white font-black text-sm truncate max-w-[150px]">{log.fileName || 'ملف غير معروف'}</span>
                           <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-500 flex-shrink-0">
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-right">
                          <div className="text-slate-300 font-bold text-xs">{log.userName || 'مجهول'}</div>
                          <div className="text-slate-600 text-[9px] font-mono">{log.userEmail || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-slate-500 text-[10px] font-mono">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          {log.fileUrl ? (
                            <button 
                              onClick={() => downloadFile(log.fileUrl!)}
                              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20"
                              title="فتح الرابط المباشر"
                            >
                              تحميل مباشر
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-700 font-black italic">رابط غير متوفر</span>
                          )}
                          <button 
                            onClick={() => copyLogToClipboard(log)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 rounded-xl transition-all"
                            title="نسخ جميع البيانات"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-center">
         <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em]">Quantum Protection Active • {users.length} Users Tracked</p>
      </div>
    </div>
  );
};
