export interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
}

export interface Perfume {
  id: number;
  name: string;
  category: string;
  price: number;
  icon: string;
  gradient: string;
  stock?: number;
}

export interface CartItem extends Perfume {
  ml: number;
}

export interface Transaction {
  id: number;
  store_id: number;
  user_id?: number;
  user_name?: string;
  total_amount: number;
  discount_amount: number;
  payment_amount: number;
  created_at: string;
  store_name?: string;
}

export interface StockMatrixItem extends Perfume {
  stocks: Record<number, number>;
  total_stock: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  store_id?: number | null;
}

export interface StockTransfer {
  id: number;
  from_store_id: number;
  to_store_id: number;
  perfume_id: number;
  qty_ml: number;
  status: string;
  created_at: string;
  from_store_name?: string;
  to_store_name?: string;
  perfume_name?: string;
}
