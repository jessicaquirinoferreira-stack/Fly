export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  category: string;
  brand: string;
  sizes: string[];
  inventory?: { [key: string]: number };
  featured: boolean;
  active: boolean;
  stock?: number;
  createdAt: any;
}

export interface Settings {
  whatsappNumber: string;
  instagramUrl?: string;
  facebookUrl?: string;
  storeName: string;
  email?: string;
  freeShippingThreshold?: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}
