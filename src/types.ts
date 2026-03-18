export enum Category {
  BURGERS = "Burgers",
  SIDE_ITEMS = "Side Items",
  WRAPS = "Wraps",
  PIZZA = "Pizza",
  DRINKS = "Drinks",
  ICE_SHAKES = "Ice & Shakes",
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  isPopular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  customNote?: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  orderNote?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: number;
  status: "Received" | "Preparing" | "Out for Delivery" | "Delivered";
}
