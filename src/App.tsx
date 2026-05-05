import React, { useState } from 'react';
import Shop from './components/Shop/Shop';
import AdminPanel from './components/Admin/AdminPanel';

export default function App() {
  const [view, setView] = useState<'shop' | 'admin'>('shop');

  return (
    <div className="relative">
      {view === 'shop' ? (
        <Shop onOpenAdmin={() => setView('admin')} />
      ) : (
        <AdminPanel onClose={() => setView('shop')} />
      )}
    </div>
  );
}
