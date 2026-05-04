import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Settings as SettingsIcon, 
  Package, LayoutDashboard, LogOut, ChevronRight, Save, X, Image as ImageIcon
} from 'lucide-react';
import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
  query, orderBy, serverTimestamp, getDoc, setDoc
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { Product, Settings } from '../../types';
import { cn, handleFirestoreError, OperationType } from '../../lib/utils';

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'settings'>('dashboard');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">Admin Flay Store</h2>
        </div>
        <nav className="mt-6 space-y-1 px-3">
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
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'products' && <ProductManager />}
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-sm text-gray-600">Acesse o painel de gerenciamento</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
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
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold border-brand-gold/30"
          >
            Entrar
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

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...currentProduct, createdAt: serverTimestamp() };
    try {
      if (currentProduct?.id) {
        await updateDoc(doc(db, 'products', currentProduct.id), data);
      } else {
        await addDoc(collection(db, 'products'), data);
      }
      setIsEditing(false);
      fetchProducts();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
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
            <p className="text-orange-600 font-bold">R$ {product.price.toFixed(2)}</p>
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
                <input
                  placeholder="Tamanhos (ex: 37, 38, 39)"
                  className="w-full p-2 border rounded-lg"
                  value={currentProduct?.sizes?.join(', ') || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, sizes: e.target.value.split(',').map(s => s.trim()) })}
                />
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
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) setSettings(snap.data() as Settings);
      setLoading(false);
    };
    fetchSettings();
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

function DashboardOverview() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Bem-vindo ao Painel</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Vendas via WhatsApp" value="R$ 0,00" sublabel="Este mês" />
        <StatCard label="Pedidos Concluídos" value="0" sublabel="Este mês" />
        <StatCard label="Visitas no Site" value="--" sublabel="Em breve" />
      </div>
    </div>
  );
}

function StatCard({ label, value, sublabel }: { label: string, value: string, sublabel: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-2">{sublabel}</p>
    </div>
  );
}
