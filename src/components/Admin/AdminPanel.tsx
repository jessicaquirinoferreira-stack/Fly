import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Settings as SettingsIcon, 
  Package, LayoutDashboard, LogOut, ChevronRight, Save, X, Image as ImageIcon,
  ShoppingCart, CheckCircle, Clock, Truck, AlertCircle, ExternalLink, Globe,
  ArrowLeft, Boxes
} from 'lucide-react';
import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
  query, orderBy, serverTimestamp, getDoc, setDoc, onSnapshot
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { Product, Settings, Order } from '../../types';
import { cn, handleFirestoreError, OperationType } from '../../lib/utils';

const isIframe = typeof window !== 'undefined' && window !== window.parent;

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isServerAuthed, setIsServerAuthed] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_server_authed') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'settings' | 'orders' | 'inventory'>('dashboard');

  useEffect(() => {
    // 1. Check for manual bypass (Emergency handle)
    if (sessionStorage.getItem('admin_bypass') === 'true' || isServerAuthed) {
      setIsAdminUser(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      setUser(u);
      
      if (u) {
        // Essential allowed emails
        const allowedEmails = ['jessicaquirinoferreira@gmail.com', 'fly@store.com', 'contato@flaystore.com'];
        const userEmail = u.email?.toLowerCase() || '';

        // PRIORITY 1: Email check (Client-side trust for faster loading)
        if (allowedEmails.includes(userEmail)) {
          setIsAdminUser(true);
          setLoading(false);
          
          // Background: Ensure admin doc exists
          const adminDocRef = doc(db, 'admins', u.uid);
          try {
            const adminSnap = await getDoc(adminDocRef);
            if (!adminSnap.exists()) {
              await setDoc(adminDocRef, {
                email: u.email,
                role: 'admin',
                createdAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.warn("Background admin check failed, but user is in allowed list.", e);
          }
          return;
        }

        // PRIORITY 2: Check Firestore for previously granted roles
        try {
          const adminDocRef = doc(db, 'admins', u.uid);
          const adminSnap = await getDoc(adminDocRef);
          
          if (adminSnap.exists()) {
            setIsAdminUser(true);
          } else {
            setIsAdminUser(false);
          }
        } catch (err: any) {
          console.error("Admin check failed", err);
          setIsAdminUser(false);
        }
      } else {
        setIsAdminUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isServerAuthed]);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem('admin_server_authed');
    sessionStorage.removeItem('admin_bypass');
    setIsServerAuthed(false);
    setIsAdminUser(null);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-black uppercase tracking-widest text-black animate-pulse">Iniciando Sistema...</p>
    </div>
  );

  if (!user && !isServerAuthed) return <AdminLogin onServerSuccess={() => setIsServerAuthed(true)} onClose={onClose} />;

  if (isAdminUser === false && !isServerAuthed) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-lg border-2 border-red-200">
          <AlertCircle size={40} className="text-red-600" />
        </div>
        <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2 italic">Acesso Negado</h1>
        <p className="text-gray-600 mb-8 max-w-sm font-bold uppercase text-xs tracking-tight">Sua conta ({user?.email}) não possui privilégios administrativos para este painel.</p>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border-2 border-black text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all shadow-md"
          >
            Voltar ao Site
          </button>
          <button 
            onClick={handleLogout}
            className="px-8 py-3 bg-black text-brand-gold rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-900 transition-all shadow-xl border-2 border-brand-gold/30"
          >
            Sair e Trocar Conta
          </button>
        </div>
      </div>
    );
  }

  if (isAdminUser === null && !isServerAuthed) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="p-4 bg-white rounded-3xl shadow-2xl border-2 border-brand-gold mb-4 animate-bounce">
        <Package size={32} className="text-black" />
      </div>
      <div className="text-center">
        <p className="text-brand-gold font-black uppercase tracking-[0.2em] italic mb-1">Segurança Flay Atacado</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verificando Credenciais...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 relative">
        <div className="p-6 border-b border-gray-100 mb-6">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-brand-black transition-colors mb-4 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sair do Admin</span>
          </button>
          <h2 className="text-xl font-black text-black tracking-tighter">ADMIN <span className="text-brand-gold italic">FLAY</span></h2>
        </div>
        <nav className="space-y-2 px-4">
          <SidebarItem 
            icon={<LayoutDashboard size={22} />} 
            label="Home" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<Package size={22} />} 
            label="Catalogo" 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
          />
          <SidebarItem 
            icon={<ShoppingCart size={22} />} 
            label="Pedidos" 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
          />
          <SidebarItem 
            icon={<Boxes size={22} />} 
            label="Girar Estoque" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarItem 
            icon={<SettingsIcon size={22} />} 
            label="Config" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t-2 border-black">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-black font-black uppercase text-xs tracking-widest hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200 shadow-sm"
          >
            <LogOut size={20} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {isServerAuthed && (
          <div className="absolute top-4 right-8 z-50">
            <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Sincronização Direta Ativa (Modo Estável)
            </div>
          </div>
        )}
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'products' && <ProductManager isServerAuthed={isServerAuthed} />}
        {activeTab === 'orders' && <OrderManager isServerAuthed={isServerAuthed} />}
        {activeTab === 'inventory' && <InventoryManager isServerAuthed={isServerAuthed} />}
        {activeTab === 'settings' && <SettingsManager isServerAuthed={isServerAuthed} />}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all border-2",
        active 
          ? "bg-black text-brand-gold border-black shadow-xl scale-[1.02]" 
          : "text-black border-transparent hover:bg-gray-100/80 hover:border-black/5"
      )}
    >
      <div className={cn("transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function AdminLogin({ onServerSuccess, onClose }: { onServerSuccess: () => void, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const MASTER_KEY = 'FLAY-2024-ADMIN'; // Emergency master key in case Firebase fails

    try {
      // 1. Emergency Bypass Check
      if (password === MASTER_KEY && email.includes('@')) {
        sessionStorage.setItem('admin_bypass', 'true');
        onServerSuccess();
        return;
      }

      // 2. Server-side Bridge (Fast path)
      try {
        const resp = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (resp.ok) {
          sessionStorage.setItem('admin_server_authed', 'true');
          onServerSuccess();
          return;
        }
      } catch (fErr) {
        console.warn("Server login unavailable, falling back to Firebase Auth", fErr);
      }

      // 3. Standard Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      // Determine error message
      let message = 'E-mail ou senha incorretos.';
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        message = 'Erro de conexão com o servidor de autenticação. Tente novamente em instantes.';
      } else if (err.code === 'auth/network-request-failed' || err.code === 'auth/unauthorized-domain') {
        message = 'Erro de domínio não autorizado no Firebase. Use as credenciais administrativas alternativas ou configure o domínio no console do Firebase.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Credenciais administrativas inválidas. Verifique seu e-mail e senha.';
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative">
      <button onClick={onClose} className="absolute top-8 left-8 flex items-center gap-2 group">
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
          <ArrowLeft size={20} className="text-brand-black" />
        </div>
        <span className="font-black text-brand-black uppercase tracking-tighter text-xs">Voltar ao Site</span>
      </button>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-brand-black tracking-tighter uppercase italic">
            Área <span className="text-brand-gold">Restrita</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">Acesse o painel de gerenciamento</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              <p className="font-medium">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-gold focus:border-brand-gold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-gold focus:border-brand-gold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold border-brand-gold/30 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductManager({ isServerAuthed }: { isServerAuthed?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);

  const SIZES_RANGE = Array.from({ length: 16 }, (_, i) => (i + 30).toString());

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total stock based on inventory
    const totalStock = Object.values(currentProduct?.inventory || {}).reduce((acc: number, qty: any) => acc + (Number(qty) || 0), 0);
    const availableSizes = Object.entries(currentProduct?.inventory || {})
      .filter(([_, qty]) => (Number(qty) || 0) > 0)
      .map(([size]) => size);

    const data = { 
      ...currentProduct, 
      stock: totalStock,
      sizes: availableSizes,
      updatedAt: serverTimestamp(),
      createdAt: currentProduct?.createdAt || serverTimestamp() 
    };

    try {
      if (isServerAuthed) {
        const url = currentProduct?.id 
          ? `/api/admin/db/products/${currentProduct.id}` 
          : `/api/admin/db/products`;
        const method = currentProduct?.id ? 'PATCH' : 'POST';
        
        const resp = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!resp.ok) throw new Error('Falha ao salvar no servidor');
      } else {
        if (currentProduct?.id) {
          await updateDoc(doc(db, 'products', currentProduct.id), data as any);
        } else {
          await addDoc(collection(db, 'products'), data as any);
        }
      }
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const toggleSizeStock = (size: string) => {
    const currentInv = currentProduct?.inventory || {};
    const newInv = { ...currentInv };
    
    if (newInv[size] !== undefined) {
      delete newInv[size];
    } else {
      newInv[size] = 0;
    }
    
    setCurrentProduct({ ...currentProduct, inventory: newInv });
  };

  const updateSizeQty = (size: string, qty: string) => {
    const val = parseInt(qty) || 0;
    setCurrentProduct({
      ...currentProduct,
      inventory: {
        ...(currentProduct?.inventory || {}),
        [size]: val
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      try {
        if (isServerAuthed) {
          const resp = await fetch(`/api/admin/db/products/${id}`, { method: 'DELETE' });
          if (!resp.ok) throw new Error('Falha ao excluir no servidor');
        } else {
          await deleteDoc(doc(db, 'products', id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Gerenciar Produtos</h2>
        <button 
          onClick={() => { setCurrentProduct({ active: true, featured: false, sizes: [] }); setIsEditing(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-black text-white rounded-lg hover:bg-black transition border border-brand-gold/50"
        >
          <Plus size={20} className="text-brand-gold" />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex flex-col">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-48 object-cover rounded-lg mb-4" 
              referrerPolicy="no-referrer"
            />
            <h3 className="font-black text-black line-clamp-1 uppercase text-sm">{product.name}</h3>
            <div className="flex items-center gap-2">
              <p className={cn("font-black", product.salePrice ? "text-gray-400 line-through text-sm" : "text-brand-gold font-black")}>
                R$ {product.price.toFixed(2)}
              </p>
              {product.salePrice && (
                <p className="text-red-600 font-black">
                  R$ {product.salePrice.toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-xs text-black font-bold mt-1">Estoque: {product.stock ?? 'S/Inf'}</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button 
                onClick={() => { setCurrentProduct(product); setIsEditing(true); }}
                className="p-2 text-black hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(product.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-100 shadow-sm"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{currentProduct?.id ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsEditing(false)}><X /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Nome do Produto</label>
                  <input
                    placeholder="Nome do produto"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-black focus:ring-2 focus:ring-brand-gold outline-none"
                    value={currentProduct?.name || ''}
                    onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Preço Original (R$)</label>
                  <input
                    type="number"
                    placeholder="Preço (R$)"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-black focus:ring-2 focus:ring-brand-gold outline-none"
                    value={currentProduct?.price || ''}
                    onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Preço Promo (R$)</label>
                  <input
                    type="number"
                    placeholder="Preço em Promoção (R$) - Opcional"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-black focus:ring-2 focus:ring-brand-gold outline-none"
                    value={currentProduct?.salePrice || ''}
                    onChange={e => setCurrentProduct({ ...currentProduct, salePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">URL da Imagem</label>
                  <input
                    placeholder="URL da Imagem"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-black focus:ring-2 focus:ring-brand-gold outline-none"
                    value={currentProduct?.imageUrl || ''}
                    onChange={e => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Marca</label>
                  <input
                    placeholder="Marca"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-black focus:ring-2 focus:ring-brand-gold outline-none"
                    value={currentProduct?.brand || ''}
                    onChange={e => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Categoria</label>
                  <input
                    placeholder="Categoria"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-black focus:ring-2 focus:ring-brand-gold outline-none"
                    value={currentProduct?.category || ''}
                    onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                  />
                </div>
              </div>

              {/* Inventory Management Section */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-brand-black uppercase tracking-tighter text-sm">Controle de Estoque (Grade)</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Clique nos números para ativar e defina a quantidade</p>
                  </div>
                  <Package size={20} className="text-brand-gold" />
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {SIZES_RANGE.map(size => {
                    const isActive = currentProduct?.inventory?.[size] !== undefined;
                    return (
                      <div key={size} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleSizeStock(size)}
                          className={cn(
                            "w-full py-2 rounded-lg font-black text-xs transition-all border-2",
                            isActive 
                              ? "bg-brand-black text-brand-gold border-brand-black" 
                              : "bg-white text-gray-300 border-gray-100 hover:border-gray-200"
                          )}
                        >
                          {size}
                        </button>
                        {isActive && (
                          <input
                            type="number"
                            placeholder="Qtd"
                            className="w-full text-center text-[10px] font-bold p-1 border rounded bg-white"
                            value={currentProduct?.inventory?.[size] || 0}
                            onChange={(e) => updateSizeQty(size, e.target.value)}
                           min="0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-start gap-3">
                <ImageIcon className="text-gray-400 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Dica de Imagem</p>
                  <p className="text-xs text-gray-500">Use URLs de serviços como PostImage, ImgBB ou Cloudinary. Verifique se o link termina em .jpg, .png ou .webp para melhor compatibilidade.</p>
                </div>
              </div>
              <textarea
                placeholder="Descrição"
                className="w-full p-2 border rounded-lg h-32"
                value={currentProduct?.description || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={currentProduct?.active} 
                    onChange={e => setCurrentProduct({ ...currentProduct, active: e.target.checked })}
                  />
                  Ativo
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={currentProduct?.featured} 
                    onChange={e => setCurrentProduct({ ...currentProduct, featured: e.target.checked })}
                  />
                  Destaque
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryManager({ isServerAuthed }: { isServerAuthed?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateQty = async (productId: string, size: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newInventory = { ...(product.inventory || {}), [size]: qty };
    const totalStock = Object.values(newInventory).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);
    const availableSizes = Object.entries(newInventory)
      .filter(([_, v]) => (Number(v) || 0) > 0)
      .map(([s]) => s);

    const data = {
      inventory: newInventory,
      stock: totalStock,
      sizes: availableSizes,
      updatedAt: serverTimestamp()
    };

    try {
      if (isServerAuthed && productId) {
        const resp = await fetch(`/api/admin/db/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!resp.ok) throw new Error('Falha no servidor');
      } else {
        await updateDoc(doc(db, 'products', productId), data as any);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tighter uppercase italic">Gestão de Inventário</h2>
          <p className="text-black font-bold text-sm">Controle rápido de estoque por tamanho.</p>
        </div>
        <div className="w-full md:w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
          <input
            type="text"
            placeholder="Buscar produto..."
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black rounded-xl focus:ring-2 focus:ring-brand-gold outline-none font-bold text-black placeholder:text-gray-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border-2 border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black border-b border-black">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest">Produto</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest text-center">Grade (30-45)</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-6 text-black">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-black shadow-sm" alt="" />
                      <div>
                        <p className="font-black text-black uppercase tracking-tighter text-sm line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-brand-gold font-black uppercase tracking-widest">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-md mx-auto">
                      {Array.from({ length: 16 }, (_, i) => (i + 30).toString()).map(size => {
                        const qty = product.inventory?.[size];
                        const isActive = qty !== undefined;
                        return (
                          <div key={size} className="flex flex-col items-center">
                            <span className={cn(
                              "text-[8px] font-black mb-1",
                              isActive ? "text-brand-black" : "text-gray-300"
                            )}>{size}</span>
                            <input
                              type="number"
                              disabled={!isActive}
                              className={cn(
                                "w-10 text-center text-[10px] font-bold p-1 rounded transition-all",
                                !isActive ? "bg-gray-50 text-gray-200 border-transparent" : "bg-white border text-brand-black",
                                qty === 0 ? "border-red-200 text-red-500 font-black" : ""
                              )}
                              value={qty ?? 0}
                              onChange={e => updateQty(product.id, size, parseInt(e.target.value) || 0)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className={cn(
                      "font-black tracking-tighter text-lg px-4 py-2 rounded-2xl",
                      (product.stock || 0) <= 5 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                    )}>
                      {product.stock || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsManager({ isServerAuthed }: { isServerAuthed?: boolean }) {
  const [settings, setSettings] = useState<Settings>({
    whatsappNumber: '5584986320918',
    storeName: 'Flay Store',
    instagramUrl: 'https://www.instagram.com/flaystoreatacado',
    facebookUrl: 'https://www.facebook.com/share/1CjVDbaMiJ/',
    email: 'Flaystoreatacado@gmail.com'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data() as Settings);
      setLoading(false);
    }, (error) => {
      console.error("Error settings snapshot:", error);
      setLoading(false);
      // We don't throw here to avoid crashing the whole view if settings doc doesn't exist yet
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isServerAuthed) {
        // Use PATCH for existing doc in settings
        const resp = await fetch(`/api/admin/db/settings/global`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        if (!resp.ok) throw new Error('Falha no servidor');
      } else {
        await setDoc(doc(db, 'settings', 'global'), settings);
      }
      alert('Configurações salvas!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Configurações Gerais</h2>
      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-xl border-2 border-black space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1">Nome da Loja</label>
            <input
              className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-brand-gold focus:border-black font-bold text-black"
              value={settings.storeName}
              onChange={e => setSettings({ ...settings, storeName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1">WhatsApp (Número Completo)</label>
            <input
              placeholder="Ex: 5511999999999"
              className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-brand-gold focus:border-black font-bold text-black"
              value={settings.whatsappNumber}
              onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1">Email de Contato</label>
            <input
              className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-brand-gold focus:border-black font-bold text-black"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1">Instagram URL</label>
            <input
              className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-brand-gold focus:border-black font-bold text-black"
              value={settings.instagramUrl}
              onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1">Facebook URL</label>
            <input
              className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-brand-gold focus:border-black font-bold text-black"
              value={settings.facebookUrl}
              onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-black text-white rounded-xl hover:bg-gray-900 font-black tracking-widest uppercase transition border-2 border-brand-gold"
        >
          <Save size={20} className="text-brand-gold" />
          Salvar Configurações
        </button>
      </form>
    </div>
  );
}

function OrderManager({ isServerAuthed }: { isServerAuthed?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      if (isServerAuthed && orderId) {
        const resp = await fetch(`/api/admin/db/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (!resp.ok) throw new Error('Falha no servidor');
      } else {
        await updateDoc(doc(db, 'orders', orderId), { status });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="text-orange-600" size={18} />;
      case 'processing': return <Package className="text-blue-600" size={18} />;
      case 'shipped': return <Truck className="text-purple-600" size={18} />;
      case 'delivered': return <CheckCircle className="text-green-600" size={18} />;
      case 'cancelled': return <AlertCircle className="text-red-600" size={18} />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-black uppercase tracking-tighter italic">Pedidos Recentes</h2>
      
      <div className="bg-white rounded-[2rem] shadow-xl border-2 border-black overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black border-b border-black">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest">Cliente</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest">Total</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-6 text-xs font-black text-black uppercase tracking-widest">
                  {order.createdAt?.toDate?.() ? order.createdAt.toDate().toLocaleDateString('pt-BR') : '---'}
                </td>
                <td className="px-6 py-6">
                  <div className="text-sm font-black text-black uppercase tracking-tighter">{order.customerName}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">{order.customerPhone}</div>
                </td>
                <td className="px-6 py-6 text-sm font-black text-black bg-gray-50/50">
                  R$ {order.total.toFixed(2)}
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm w-fit">
                    {getStatusIcon(order.status)}
                    <span className="text-[10px] font-black uppercase text-black">{getStatusLabel(order.status)}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <select 
                    className="text-[10px] font-black uppercase tracking-widest border-2 border-black rounded-xl p-2 bg-white cursor-pointer hover:bg-brand-gold/5 transition-colors"
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                  >
                    <option value="pending">Pendente</option>
                    <option value="processing">Processando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    productsCount: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const ordersUnsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      const total = orders.reduce((acc, curr) => curr.status !== 'cancelled' ? acc + curr.total : acc, 0);
      const pending = orders.filter(o => o.status === 'pending').length;
      
      setStats(prev => ({ 
        ...prev, 
        totalSales: total, 
        ordersCount: snapshot.size,
        pendingOrders: pending
      }));

      const sorted = [...orders].sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
      setRecentOrders(sorted.slice(0, 5));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setStats(prev => ({ ...prev, productsCount: snapshot.size }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    return () => {
      ordersUnsubscribe();
      productsUnsubscribe();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-black tracking-tighter uppercase italic">Painel Geral</h2>
        <p className="text-black font-bold text-sm tracking-tight">Visão estratégica do negócio em tempo real.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Faturamento" value={`R$ ${stats.totalSales.toFixed(2)}`} sublabel="Pedidos faturados" icon={<Globe className="text-blue-600" />} />
        <StatCard label="Volume Pedidos" value={stats.ordersCount.toString()} sublabel="Vendas totais" icon={<ShoppingCart className="text-purple-600" />} />
        <StatCard label="Mix Prdutos" value={stats.productsCount.toString()} sublabel="Ativos na loja" icon={<Package className="text-orange-600" />} />
        <StatCard label="Pendências" value={stats.pendingOrders.toString()} sublabel="Aguardando envio" icon={<Clock className="text-brand-gold" />} />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-black overflow-hidden">
        <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-100">
          <h3 className="font-black text-xl text-black uppercase tracking-tighter italic">Últimas Vendas</h3>
          <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black px-3 py-1.5 rounded-full shadow-lg">Monitoramento Ativo</p>
        </div>
        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <ShoppingCart size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-xs font-bold uppercase">Nenhum pedido realizado ainda.</p>
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50/50 border-2 border-transparent rounded-[1.5rem] hover:border-black hover:bg-white transition-all group shadow-sm hover:shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:bg-black transition-colors">
                    <ShoppingCart size={20} className="text-gray-400 group-hover:text-brand-gold" />
                  </div>
                  <div>
                    <p className="font-black text-base text-black uppercase tracking-tighter leading-none mb-1">{order.customerName}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {order.createdAt?.toDate?.() 
                        ? `${order.createdAt.toDate().toLocaleDateString('pt-BR')} • ${order.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Recém criado'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-black text-lg tracking-tighter leading-none mb-1">R$ {order.total.toFixed(2)}</p>
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full inline-block border",
                    order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-black text-brand-gold border-brand-gold/30 shadow-lg'
                  )}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sublabel, icon }: { label: string, value: string, sublabel?: string, icon?: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-black flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all border-b-8 border-b-black group">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">{label}</span>
        <div className="p-3 bg-black rounded-2xl shadow-lg border border-brand-gold/30 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-black tracking-tighter leading-none mb-2">{value}</p>
        {sublabel && <div className="text-[9px] text-brand-gold font-black uppercase tracking-widest flex items-center gap-1.5 bg-black px-2 py-1 rounded-full w-fit shadow-md">
          <div className="w-1 h-1 rounded-full bg-brand-gold animate-pulse" />
          {sublabel}
        </div>}
      </div>
    </div>
  );
}
