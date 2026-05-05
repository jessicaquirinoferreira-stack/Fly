import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, Settings as SettingsIcon, 
  Package, LayoutDashboard, LogOut, ChevronRight, Save, X, Image as ImageIcon,
  ShoppingCart, CheckCircle, Clock, Truck, AlertCircle, ExternalLink, Globe,
  ArrowLeft
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

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'settings' | 'orders' | 'inventory'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // First, check/create admin record if authorized by email
        const adminDocRef = doc(db, 'admins', u.uid);
        try {
          const adminSnap = await getDoc(adminDocRef);
          if (!adminSnap.exists() && (
            u.email?.toLowerCase() === 'jessicaquirinoferreira@gmail.com' || 
            u.email?.toLowerCase() === 'fly@store.com'
          )) {
            await setDoc(adminDocRef, {
              email: u.email,
              role: 'admin',
              createdAt: serverTimestamp()
            });
          }
          
          // Now check if we can actually list products
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
          await getDocs(q);
          setIsAdminUser(true);
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
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <AdminLogin />;
  if (isAdminUser === null) return <div className="h-screen flex items-center justify-center text-brand-gold font-bold animate-pulse uppercase tracking-[0.2em] italic">Segurança: Verificando Nível de Acesso...</div>;

  if (isAdminUser === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-2xl shadow-xl text-center">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
          <p className="text-gray-600">Este e-mail ({user.email}) não tem permissão de administrador.</p>
          <button 
            onClick={() => signOut(auth)}
            className="mt-6 w-full py-3 bg-brand-black text-white rounded-lg hover:bg-black transition"
          >
            Sair e tentar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 relative">
        <div className="p-6 border-b border-gray-100 mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-brand-black transition-colors mb-4 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Loja</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 tracking-tighter">ADMIN <span className="text-brand-gold italic">FLAY</span></h2>
        </div>
        <nav className="space-y-1 px-3">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<Package size={20} />} 
            label="Produtos" 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
          />
          <SidebarItem 
            icon={<ShoppingCart size={20} />} 
            label="Pedidos" 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
          />
          <SidebarItem 
            icon={<Globe size={20} />} 
            label="Inventário" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarItem 
            icon={<SettingsIcon size={20} />} 
            label="Configurações" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 w-full p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'orders' && <OrderManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors",
        active 
          ? "bg-brand-gold/10 text-brand-gold" 
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por E-mail/Senha não está habilitado no Console do Firebase. Vá em Authentication > Sign-in method e ative "E-mail/Senha".');
      } else if (err.code === 'auth/network-request-failed' || err.code === 'auth/unauthorized-domain') {
        setError(`ACESSO BLOQUEADO PELO FIREBASE: Você precisa adicionar o domínio "${currentDomain}" na lista de "Domínios Autorizados" no Console do Firebase (Authentication > Settings > Authorized Domains).`);
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Erro ao fazer login: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
          <ArrowLeft size={20} className="text-brand-black" />
        </div>
        <span className="font-black text-brand-black uppercase tracking-tighter text-xs">Voltar ao Site</span>
      </Link>
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

function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);

  const SIZES_RANGE = Array.from({ length: 16 }, (_, i) => (i + 30).toString());

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => {
      console.error("Error products snapshot:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total stock based on inventory
    const totalStock = Object.values(currentProduct?.inventory || {}).reduce((acc, qty) => acc + (qty || 0), 0);
    const availableSizes = Object.entries(currentProduct?.inventory || {})
      .filter(([_, qty]) => (qty || 0) > 0)
      .map(([size]) => size);

    const data = { 
      ...currentProduct, 
      stock: totalStock,
      sizes: availableSizes,
      updatedAt: serverTimestamp(),
      createdAt: currentProduct?.createdAt || serverTimestamp() 
    };

    try {
      if (currentProduct?.id) {
        await updateDoc(doc(db, 'products', currentProduct.id), data);
      } else {
        await addDoc(collection(db, 'products'), data);
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
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h2>
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
          <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-48 object-cover rounded-lg mb-4" 
              referrerPolicy="no-referrer"
            />
            <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
            <div className="flex items-center gap-2">
              <p className={cn("font-bold", product.salePrice ? "text-gray-400 line-through text-sm" : "text-brand-gold")}>
                R$ {product.price.toFixed(2)}
              </p>
              {product.salePrice && (
                <p className="text-brand-gold font-bold">
                  R$ {product.salePrice.toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Estoque: {product.stock ?? 'S/Inf'}</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button 
                onClick={() => { setCurrentProduct(product); setIsEditing(true); }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(product.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Nome do produto"
                  className="w-full p-2 border rounded-lg"
                  value={currentProduct?.name || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Preço (R$)"
                  className="w-full p-2 border rounded-lg"
                  value={currentProduct?.price || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                  required
                />
                <input
                  type="number"
                  placeholder="Preço em Promoção (R$) - Opcional"
                  className="w-full p-2 border rounded-lg"
                  value={currentProduct?.salePrice || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, salePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
                <input
                  placeholder="URL da Imagem"
                  className="w-full p-2 border rounded-lg"
                  value={currentProduct?.imageUrl || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                  required
                />
                <input
                  placeholder="Marca"
                  className="w-full p-2 border rounded-lg"
                  value={currentProduct?.brand || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
                />
                <input
                  placeholder="Categoria"
                  className="w-full p-2 border rounded-lg"
                  value={currentProduct?.category || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                />
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

function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateQty = async (productId: string, size: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newInventory = { ...(product.inventory || {}), [size]: qty };
    const totalStock = Object.values(newInventory).reduce((acc, v) => acc + (v || 0), 0);
    const availableSizes = Object.entries(newInventory)
      .filter(([_, v]) => (v || 0) > 0)
      .map(([s]) => s);

    try {
      await updateDoc(doc(db, 'products', productId), {
        inventory: newInventory,
        stock: totalStock,
        sizes: availableSizes,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Gestão de Inventário</h2>
          <p className="text-gray-500 text-sm">Controle rápido de estoque por tamanho.</p>
        </div>
        <div className="w-full md:w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar produto..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-gold outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Grade (30-45)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover border" alt="" />
                      <div>
                        <p className="font-black text-brand-black uppercase tracking-tighter text-sm line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{product.category}</p>
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

function SettingsManager() {
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
    }, (err) => {
      console.error("Error settings snapshot:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      alert('Configurações salvas!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configurações Gerais</h2>
      <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Loja</label>
            <input
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-gold"
              value={settings.storeName}
              onChange={e => setSettings({ ...settings, storeName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp (Número Completo)</label>
            <input
              placeholder="Ex: 5511999999999"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-gold"
              value={settings.whatsappNumber}
              onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email de Contato</label>
            <input
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-gold"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
            <input
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-gold"
              value={settings.instagramUrl}
              onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
            <input
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-gold"
              value={settings.facebookUrl}
              onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-black text-white rounded-lg hover:bg-black font-medium transition border border-brand-gold"
        >
          <Save size={20} className="text-brand-gold" />
          Salvar Configurações
        </button>
      </form>
    </div>
  );
}

function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (err) => {
      console.error("Error orders snapshot:", err);
    });
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="text-orange-500" size={18} />;
      case 'processing': return <Package className="text-blue-500" size={18} />;
      case 'shipped': return <Truck className="text-purple-500" size={18} />;
      case 'delivered': return <CheckCircle className="text-green-500" size={18} />;
      case 'cancelled': return <AlertCircle className="text-red-500" size={18} />;
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
      <h2 className="text-2xl font-bold text-gray-900">Pedidos Recentes</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {order.createdAt?.toDate?.() ? order.createdAt.toDate().toLocaleDateString('pt-BR') : '---'}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                  <div className="text-xs text-gray-500">{order.customerPhone}</div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  R$ {order.total.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm font-medium">{getStatusLabel(order.status)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    className="text-xs border rounded p-1"
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
    });

    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setStats(prev => ({ ...prev, productsCount: snapshot.size }));
    });

    return () => {
      ordersUnsubscribe();
      productsUnsubscribe();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Painel Geral</h2>
        <p className="text-gray-500 text-sm">Visão geral do negócio em tempo real.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Vendas Totais" value={`R$ ${stats.totalSales.toFixed(2)}`} sublabel="Pedidos confirmados" icon={<Globe className="text-blue-500" />} />
        <StatCard label="Pedidos Totais" value={stats.ordersCount.toString()} sublabel="Total histórico" icon={<ShoppingCart className="text-purple-500" />} />
        <StatCard label="Produtos Ativos" value={stats.productsCount.toString()} sublabel="No catálogo" icon={<Package className="text-orange-500" />} />
        <StatCard label="Aguardando" value={stats.pendingOrders.toString()} sublabel="Pedidos pendentes" icon={<Clock className="text-brand-gold" />} />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 uppercase tracking-tighter">Últimas Vendas</h3>
          <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest bg-brand-gold/5 px-2 py-1 rounded">Sincronizado</p>
        </div>
        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <ShoppingCart size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-xs font-bold uppercase">Nenhum pedido realizado ainda.</p>
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50/50 border border-transparent rounded-2xl hover:border-brand-gold/20 hover:bg-white transition-all group shadow-sm hover:shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-brand-black transition-colors">
                    <ShoppingCart size={18} className="text-gray-400 group-hover:text-brand-gold" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-brand-black uppercase tracking-tighter">{order.customerName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {order.createdAt?.toDate?.() 
                        ? `${order.createdAt.toDate().toLocaleDateString('pt-BR')} às ${order.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Recém criado'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-black tracking-tighter">R$ {order.total.toFixed(2)}</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block",
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-brand-gold/10 text-brand-gold'
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
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all border-b-8 border-b-brand-gold/10">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</span>
        <div className="p-2.5 bg-gray-50 rounded-xl">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-brand-black tracking-tighter leading-none">{value}</p>
        {sublabel && <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
          {sublabel}
        </p>}
      </div>
    </div>
  );
}
