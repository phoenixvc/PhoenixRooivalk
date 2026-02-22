/**
 * Shopping Cart Types
 * Defines the structure for the shopping cart functionality
 */

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  phaseTimeline: string;
  monthlyFee?: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  /** Sum of one-time purchase prices (price * quantity) */
  oneTimeTotal: number;
  /** Sum of recurring monthly fees (monthlyFee * quantity) */
  recurringTotal: number;
}

export interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
}
