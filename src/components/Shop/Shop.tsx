import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Instagram, Facebook, Menu, X, Trash2,
  MapPin, Phone, Truck, CreditCard, ChevronRight, Minus, Plus,
  Crown
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, CartItem, Settings } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Common fonts
// Inter (Sans) is already default in Tailwind theme in many setups here.

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showSplash, setShowSplash] = useState(true);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const logoUrl = "https://i.postimg.cc/tgs9h1qV/Screenshot-20260504-103559-2.jpg";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Show AI popup after 3 seconds of site load
      setTimeout(() => setShowAIPopup(true), 3000);
    }, 6000); 
    return () => clearTimeout(timer);
  }, []);

  const aiMessages = [
    "Olá! Quer ver as novidades exclusivas que acabaram de chegar? Siga nosso Instagram!",
    "Precisa de ajuda com o tamanho? Me chama no WhatsApp agora!",
    "Temos preços especiais para ATACADO. Consulte nossas condições no ícone verde!",
    "Aproveite! O estoque dessas peças é limitado e sai muito rápido."
  ];
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    if (showAIPopup) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % aiMessages.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [showAIPopup]);

  useEffect(() => {
    const fetchData = async () => {
      // Products
      const q = query(collection(db, 'products'), where('active', '==', true));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

      // Settings
      const setSnap = await getDoc(doc(db, 'settings', 'global'));
      if (setSnap.exists()) {
        setSettings(setSnap.data() as Settings);
      } else {
        // Fallback for first run or missing doc
        setSettings({
          storeName: 'Flay Store',
          whatsappNumber: '5584986320918',
          instagramUrl: 'https://www.instagram.com/flaystoreatacado',
          facebookUrl: 'https://www.facebook.com/share/1CjVDbaMiJ/',
          email: 'Flaystoreatacado@gmail.com'
        });
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: Product, size?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item => item.id === product.id && item.selectedSize === size 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size)));
  };

  const updateQuantity = (id: string, size: string | undefined, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedSize === size) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[100] bg-brand-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Animated Background Elements */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1],
                rotate: [0, 90, 0]
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute w-[800px] h-[800px] border border-brand-gold/10 rounded-full"
            />
            
            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-brand-gold shadow-[0_0_50px_rgba(197,160,89,0.3)] mb-8"
              >
                <img src={logoUrl} alt="Flay Store Logo" className="w-full h-full object-cover" />
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="text-center"
              >
                <h2 className="text-3xl font-black text-white tracking-[0.3em] uppercase mb-2">FLAY STORE</h2>
                <div className="h-1 w-24 bg-brand-gold mx-auto mb-4"></div>
                <p className="text-brand-gold font-bold tracking-[0.1em] text-sm animate-pulse">CARREGANDO O MELHOR DO ESTILO...</p>
              </motion.div>
            </div>

            {/* Shoebox/Shoe silhouette hints */}
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 0.05 }}
              transition={{ delay: 2, duration: 2 }}
              className="absolute bottom-10 right-10"
            >
              <ShoppingBag size={300} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-brand-black rounded-full flex items-center justify-center border-2 border-brand-gold overflow-hidden mr-3 shadow-lg shadow-brand-gold/20">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-brand-black leading-none">FLAY</span>
                <span className="text-lg font-bold text-brand-gold leading-none tracking-tight">STORE</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {categories.map(c => (
                <button 
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    activeCategory === c ? "text-brand-gold" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  placeholder="Pesquisar..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-brand-gold w-48 lg:w-64"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <ShoppingBag size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md shadow-brand-gold/50">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[60vh] bg-gray-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2070" 
          alt="Hero" 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight">
              ESTILO E CONFORTO EM <span className="text-brand-gold drop-shadow-lg">CADA PASSO.</span>
            </h1>
            <p className="text-lg text-gray-200 mb-8 max-w-xl mx-auto font-medium">
              As melhores marcas mundiais com preços que cabem no seu bolso. Entrega rápida em todo o Brasil.
            </p>
            <button 
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-brand-gold text-brand-black px-10 py-5 rounded-full font-black hover:bg-brand-gold-dark transition transform hover:scale-105 shadow-xl shadow-brand-gold/20 flex items-center gap-3 mx-auto"
            >
              COMPRAR AGORA
              <ChevronRight size={24} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="bg-brand-black py-6 border-y border-brand-gold/30">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <Truck className="text-brand-gold mb-2" size={24} />
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">Envio Imediato</span>
          </div>
          <div className="flex flex-col items-center">
            <Crown className="text-brand-gold mb-2" size={24} />
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">Atacado & Varejo</span>
          </div>
          <div className="flex flex-col items-center border-x border-brand-gold/10 px-2">
            <CreditCard className="text-brand-gold mb-2" size={24} />
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">Parcelamento Sem Juros</span>
          </div>
          <div className="flex flex-col items-center">
            <Phone className="text-brand-gold mb-2" size={24} />
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">Suporte 24h</span>
          </div>
        </div>
      </div>

      {/* Sales Marquee */}
      <div className="bg-brand-gold overflow-hidden py-2 select-none border-y border-brand-black/20">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[10px] font-black text-brand-black mx-4 tracking-tighter uppercase">
              🔥 ESTOQUE LIMITADO • ⚡ ENVIO PARA TODO O BRASIL • 🦁 QUALIDADE PREMIUM • 💎 OS MELHORES PREÇOS •
            </span>
          ))}
        </div>
      </div>

      {/* Products */}
      <main id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-brand-black tracking-tight">LANÇAMENTOS</h2>
            <div className="h-1.5 w-20 bg-brand-gold mt-2"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {filteredProducts.map(product => (
            // @ts-ignore
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-brand-black rounded-2xl flex items-center justify-center border border-brand-gold shadow-lg shadow-brand-gold/10 overflow-hidden">
                  <img src={logoUrl} alt="Flay Store" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter text-brand-black leading-none">FLAY STORE</span>
                  <span className="text-xs font-bold text-brand-gold tracking-[0.2em] uppercase">Atacado & Varejo</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 max-w-sm leading-relaxed">
                Referência em calçados multimarcas. Tênis casuais, esportivos e muito mais para todos os estilos. Atacado e Varejo.
              </p>
              <div className="flex space-x-6 mt-8">
                {settings?.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-gold transition-all hover:scale-110">
                    <Instagram size={28} />
                  </a>
                )}
                {settings?.facebookUrl && (
                  <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-gold transition-all hover:scale-110">
                    <Facebook size={28} />
                  </a>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-brand-black mb-6 tracking-widest text-xs uppercase">INSTITUCIONAL</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-medium">
                <li><a href="#" className="hover:text-brand-gold transition-colors">Sobre nós</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Políticas de Privacidade</a></li>
                <li><a href="#" className="hover:text-brand-gold transition-colors">Termos de Uso</a></li>
                <li><a href="/admin" className="text-xs text-gray-300 hover:text-brand-gold transition-colors">Área Administrativa</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-brand-black mb-6 tracking-widest text-xs uppercase">CONTATO</h4>
              <ul className="space-y-4 text-sm text-gray-600 font-medium">
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-brand-gold" />
                  {settings?.whatsappNumber || 'Contate-nos'}
                </li>
                <li className="flex items-center gap-3 uppercase tracking-tighter text-xs">
                  <span className="text-brand-gold font-bold">EMAIL:</span>
                  {settings?.email || 'contato@flaystore.com'}
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={18} className="text-brand-gold" />
                  São Paulo, Brasil
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Flay Store. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-brand-gold" />
                  <h3 className="text-xl font-bold">Seu Carrinho</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingBag size={64} strokeWidth={1} />
                    <p className="font-medium">O seu carrinho está vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 group">
                      <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                            <button 
                              onClick={() => removeFromCart(item.id, item.selectedSize)}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            Tamanho: {item.selectedSize || 'N/A'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button onClick={() => updateQuantity(item.id, item.selectedSize, -1)} className="p-1 px-2 hover:bg-gray-100 transition"><Minus size={14}/></button>
                            <span className="px-2 text-sm font-bold min-w-[2rem] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.selectedSize, 1)} className="p-1 px-2 hover:bg-gray-100 transition"><Plus size={14}/></button>
                          </div>
                          <p className="font-bold text-brand-gold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-brand-gold">R$ {cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full bg-brand-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition shadow-lg shadow-brand-gold/10 border border-brand-gold/50"
                  >
                    FINALIZAR PEDIDO
                    <ChevronRight size={20} className="text-brand-gold" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cart={cart}
        settings={settings}
      />

      {/* AI Assistant Popup */}
      <AnimatePresence>
        {showAIPopup && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-6 z-[45] max-w-[280px]"
          >
            <div className="bg-white rounded-2xl p-4 shadow-2xl border border-brand-gold/20 relative">
              <button 
                onClick={() => setShowAIPopup(false)}
                className="absolute -top-2 -right-2 bg-gray-900 text-white p-1 rounded-full text-[10px]"
              >
                <X size={12} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full border border-brand-gold overflow-hidden">
                  <img src={logoUrl} alt="AI" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-black text-brand-gold tracking-widest uppercase">Assistente Flay</span>
              </div>
              <p className="text-xs font-medium text-gray-700 leading-relaxed mb-3">
                {aiMessages[currentMessage]}
              </p>
              <a 
                href={`https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '') || '5584986320918'}`}
                target="_blank"
                rel="noreferrer"
                className="block text-center w-full bg-brand-gold text-brand-black text-[10px] font-black py-2 rounded-lg hover:bg-brand-gold-dark transition"
              >
                FALAR COM ESPECIALISTA
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Social Bar */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
        <motion.a 
          whileHover={{ scale: 1.1 }}
          href={`https://wa.me/${settings?.whatsappNumber?.replace(/\D/g, '') || '5584986320918'}`} 
          target="_blank" 
          rel="noreferrer"
          className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition"
        >
          <Phone size={28} />
        </motion.a>
        <motion.a 
          whileHover={{ scale: 1.1 }}
          href={settings?.instagramUrl || "https://www.instagram.com/flaystoreatacado"} 
          target="_blank" 
          rel="noreferrer"
          className="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
        >
          <Instagram size={28} />
        </motion.a>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, size?: string) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);

  return (
    <div className="group relative">
      <div className="relative aspect-square bg-gray-100 rounded-[2.5rem] overflow-hidden mb-5 border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10">
        {/* Aggressive Sales Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {product.featured && (
            <span className="bg-brand-black text-brand-gold px-3 py-1 rounded-full text-[10px] font-black tracking-widest shadow-lg border border-brand-gold/30">
              🔥 MAIS VENDIDO
            </span>
          )}
          <span className="bg-brand-gold text-brand-black px-3 py-1 rounded-full text-[10px] font-black tracking-widest shadow-lg">
            ⚡ ÚLTIMAS UNIDADES
          </span>
        </div>

        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <button 
            onClick={() => onAddToCart(product, selectedSize)}
            className="w-full bg-brand-black text-brand-gold py-4 rounded-2xl font-black shadow-2xl hover:bg-black transition flex items-center justify-center gap-2 border border-brand-gold/50"
          >
            <ShoppingBag size={20} />
            COMPRAR AGORA
          </button>
        </div>
      </div>

      <div className="space-y-2 px-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-1">{product.brand || 'Original'}</p>
            <h3 className="font-bold text-brand-black group-hover:text-brand-gold transition-colors line-clamp-2 leading-tight h-10 text-sm">{product.name}</h3>
          </div>
        </div>
        
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.sizes.map(size => (
              <button
                key={size}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center pt-0.5 text-xs font-black border transition-all",
                  selectedSize === size 
                    ? "bg-brand-black text-brand-gold border-brand-gold" 
                    : "bg-white text-gray-400 border-gray-100 hover:border-brand-gold/50"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <p className="text-xl font-black text-brand-black">R$ {product.price.toFixed(2)}</p>
          {product.salePrice && (
            <p className="text-sm text-gray-400 line-through font-bold">R$ {product.salePrice.toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({ isOpen, onClose, cart, settings }: { isOpen: boolean, onClose: () => void, cart: CartItem[], settings: Settings | null }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + (shippingCost || 0);

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: cleanCep }));
    
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
          
          // Realistic mock shipping based on region
          // Standard simulation
          let cost = 15.00;
          if (['SP', 'RJ', 'MG', 'ES'].includes(data.uf)) cost = 19.90;
          else if (['PR', 'SC', 'RS'].includes(data.uf)) cost = 24.90;
          else if (['BA', 'CE', 'PE', 'RN', 'MA', 'AL', 'SE', 'PB'].includes(data.uf)) cost = 34.90;
          else cost = 45.00;
          
          setShippingCost(cost);
        }
      } catch (err) {
        console.error('ViaCEP Error:', err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const finalizeOrder = () => {
    const text = `*NOVO PEDIDO - ${settings?.storeName}*\n\n` +
      `*CLIENTE:*\n` +
      `👤 ${formData.name}\n` +
      `📞 ${formData.phone}\n\n` +
      `*ENDEREÇO:*\n` +
      `📍 ${formData.street}, ${formData.number} ${formData.complement ? `- ${formData.complement}` : ''}\n` +
      `🏡 ${formData.neighborhood}\n` +
      `🏙️ ${formData.city} - ${formData.state}\n` +
      `📮 CEP: ${formData.cep}\n\n` +
      `*ITENS:*\n` +
      cart.map(item => `- ${item.quantity}x ${item.name} ${item.selectedSize ? `(Tam: ${item.selectedSize})` : ''} - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n') +
      `\n\n` +
      `*FINANCEIRO:*\n` +
      `📦 Subtotal: R$ ${subtotal.toFixed(2)}\n` +
      `🚚 Frete: R$ ${shippingCost?.toFixed(2) || '0.00'}\n` +
      `💰 *TOTAL: R$ ${total.toFixed(2)}*\n\n` +
      `_Aguardando confirmação de pagamento..._`;

    const encodedText = encodeURIComponent(text);
    const cleanNumber = settings?.whatsappNumber?.replace(/\D/g, '') || '';
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedText}`;
    window.location.href = whatsappUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all", step >= 1 ? "bg-brand-gold text-brand-black" : "bg-gray-200 text-gray-400")}>1</div>
            <div className={cn("flex-1 h-1 rounded-full", step >= 2 ? "bg-brand-gold" : "bg-gray-200")}></div>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all", step >= 2 ? "bg-brand-gold text-brand-black" : "bg-gray-200 text-gray-400")}>2</div>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight text-center">DADOS DE ENTREGA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  placeholder="Nome Completo" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <input 
                  placeholder="Telefone / WhatsApp" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <input 
                  placeholder="CEP" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium"
                  value={formData.cep}
                  onChange={e => handleCepChange(e.target.value)}
                  maxLength={8}
                />
                <div className="relative">
                  <input 
                    placeholder="Logradouro (Rua)" 
                    disabled={loadingCep}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium disabled:opacity-50"
                    value={formData.street}
                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                  />
                  {loadingCep && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <input 
                  placeholder="Número" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium"
                  value={formData.number}
                  onChange={e => setFormData({ ...formData, number: e.target.value })}
                />
                <input 
                  placeholder="Complemento" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium"
                  value={formData.complement}
                  onChange={e => setFormData({ ...formData, complement: e.target.value })}
                />
                <input 
                  placeholder="Bairro" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium disabled:opacity-50"
                  value={formData.neighborhood}
                  disabled={loadingCep}
                  onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    placeholder="Cidade" 
                    className="col-span-2 px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium disabled:opacity-50"
                    value={formData.city}
                    disabled={loadingCep}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                   <input 
                    placeholder="UF" 
                    className="col-span-1 px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-gold border-none font-medium text-center disabled:opacity-50"
                    value={formData.state}
                    disabled={loadingCep}
                    maxLength={2}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.phone || !formData.cep || !formData.number}
                className="w-full bg-brand-black text-white py-4 rounded-2xl font-bold hover:bg-black transition shadow-lg shadow-brand-gold/10 border border-brand-gold/30 disabled:opacity-50 disabled:grayscale"
              >
                PRÓXIMO PASSO
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">RESUMO DO PEDIDO</h3>
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between font-medium text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-600">
                  <span>Frete {formData.state && `(${formData.state})`}</span>
                  <span>{shippingCost ? `R$ ${shippingCost.toFixed(2)}` : 'Calculando...'}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between text-xl font-black text-gray-900">
                  <span>TOTAL</span>
                  <span className="text-brand-gold">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4 items-start">
                <Phone className="text-blue-600 flex-shrink-0" size={24} />
                <p className="text-blue-900 text-sm leading-relaxed">
                  Ao finalizar, você será redirecionado para o WhatsApp da <strong>{settings?.storeName}</strong> para confirmar seu pedido e combinar o pagamento.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 px-6 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition"
                >
                  VOLTAR
                </button>
                <button 
                  onClick={finalizeOrder}
                  className="flex-[2] bg-brand-black text-white py-4 px-6 rounded-2xl font-black hover:bg-black transition shadow-lg shadow-brand-gold/10 flex items-center justify-center gap-2 border border-brand-gold/50"
                >
                  <Phone size={20} className="text-brand-gold" />
                  FINALIZAR WHATSAPP
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

