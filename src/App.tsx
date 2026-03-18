import { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, Phone, MapPin, Clock, Instagram, Facebook, MessageCircle, Star, RotateCcw, Truck, CheckCircle2, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Category, MenuItem, CartItem, CustomerInfo, Order } from "./types";
import { MENU_ITEMS, RESTAURANT_NAME, WHATSAPP_NUMBER, RESTAURANT_HOURS, DELIVERY_AREA, CONTACT_INFO } from "./constants";

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(() => {
    const saved = localStorage.getItem("customerInfo");
    return saved ? JSON.parse(saved) : { name: "", address: "", phone: "", orderNote: "" };
  });
  const [lastOrder, setLastOrder] = useState<Order | null>(() => {
    const saved = localStorage.getItem("lastOrder");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Persist customer info
  useEffect(() => {
    localStorage.setItem("customerInfo", JSON.stringify(customerInfo));
  }, [customerInfo]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return MENU_ITEMS;
    return MENU_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const addToCart = (item: MenuItem, quantity: number, note: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.customNote === note);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.customNote === note
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity, customNote: note }];
    });
  };

  const repeatLastOrder = () => {
    if (lastOrder) {
      setCart(lastOrder.items);
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id: string, note?: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.customNote === note)));
  };

  const updateQuantity = (id: string, delta: number, note?: string) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id && i.customNote === note) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const estimatedDeliveryTime = useMemo(() => {
    const baseTime = 25; // Base 25 mins
    const perItemTime = 3; // 3 mins per unique item
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    return baseTime + (totalItems * perItemTime);
  }, [cart]);

  const placeOrder = () => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      items: [...cart],
      total: totalAmount,
      timestamp: Date.now(),
      status: "Received",
    };

    // Save as last order
    setLastOrder(newOrder);
    localStorage.setItem("lastOrder", JSON.stringify(newOrder));
    
    // Set as active order for tracking
    setActiveOrder(newOrder);

    // Generate WhatsApp message
    const itemsList = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.name}\n` +
          `   - Quantity: ${item.quantity}\n` +
          `   - Price: PKR ${item.price * item.quantity}\n` +
          `   - Notes: ${item.customNote || "None"}`
      )
      .join("\n\n");

    const message = `🍽️ *New Order - ${RESTAURANT_NAME}*\n\n` +
      `👤 *Customer Details*\n` +
      `Name: ${customerInfo.name}\n` +
      `Phone: ${customerInfo.phone}\n` +
      `Address: ${customerInfo.address}\n\n` +
      `🛒 *Order Items*\n${itemsList}\n\n` +
      `💰 *Total Amount:* PKR ${totalAmount}\n\n` +
      `📝 *Additional Notes from Customer:*\n${customerInfo.orderNote || "No extra instructions"}\n\n` +
      `📩 *Generated via Bali Restaurant Web App*`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, "_blank");
    
    // Clear cart after a short delay
    setTimeout(() => setCart([]), 1000);
  };

  // Simulate order status updates
  useEffect(() => {
    if (activeOrder && activeOrder.status !== "Delivered") {
      const timer = setTimeout(() => {
        setActiveOrder(prev => {
          if (!prev) return null;
          const statuses: Order["status"][] = ["Received", "Preparing", "Out for Delivery", "Delivered"];
          const currentIndex = statuses.indexOf(prev.status);
          if (currentIndex < statuses.length - 1) {
            return { ...prev, status: statuses[currentIndex + 1] };
          }
          return prev;
        });
      }, 10000); // Update status every 10 seconds for demo
      return () => clearTimeout(timer);
    }
  }, [activeOrder]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-bali-orange/20">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 glass-panel">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-bali-olive rounded-full flex items-center justify-center text-white font-serif italic text-2xl shadow-lg shadow-bali-olive/20">B</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-bali-olive leading-none">{RESTAURANT_NAME}</h1>
              <span className="font-display text-[8px] font-bold uppercase tracking-[0.4em] text-bali-orange">Tropical Flavors</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {lastOrder && cart.length === 0 && (
              <button 
                onClick={repeatLastOrder}
                className="hidden md:flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest text-bali-olive hover:text-bali-orange transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Repeat Last Order
              </button>
            )}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 hover:bg-bali-olive/5 rounded-full transition-colors group"
            >
              <motion.div
                key={cart.length}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
              >
                <ShoppingCart className="w-7 h-7 text-bali-olive group-hover:text-bali-orange transition-colors" />
              </motion.div>
              <AnimatePresence>
                {cart.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-1 right-1 bg-bali-orange text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg"
                  >
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[85vh] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1920" 
          alt="Bali Restaurant Hero"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-bali-cream flex items-center justify-center text-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-4xl text-white"
          >
            <span className="section-subtitle text-white/80">Welcome to Paradise</span>
            <h2 className="text-6xl md:text-9xl font-serif italic mb-8 leading-[0.9]">Authentic Flavors, <br/> Bali Vibes</h2>
            <p className="text-xl md:text-2xl font-light opacity-90 mb-12 max-w-2xl mx-auto leading-relaxed">Experience the best Pizza, Burgers, and Shakes in town. Freshly prepared with love, delivered to your door.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="#menu" className="bali-btn bali-btn-primary text-sm px-12 py-5">Explore Menu</a>
              <a href="#info" className="bali-btn bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 text-sm px-12 py-5">Our Story</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main id="menu" className="flex-grow max-w-7xl mx-auto px-4 py-24 w-full">
        {/* Order Tracking Section */}
        <AnimatePresence>
          {activeOrder && (
            <motion.section 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-24"
            >
              <div className="bali-card p-10 bg-bali-olive text-white relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-bali-orange/10 rounded-full blur-3xl" />
                
                <div className="absolute top-0 right-0 p-6">
                  <button onClick={() => setActiveOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
                  <div className="max-w-sm">
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-bali-orange mb-2 block">Live Status</span>
                    <h3 className="text-3xl font-serif italic mb-4 flex items-center gap-3">
                      Track Your Order
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">Your order <span className="text-white font-bold">#{activeOrder.id}</span> is being prepared with the finest ingredients.</p>
                  </div>
                  
                  <div className="flex-grow max-w-3xl">
                    <div className="relative flex justify-between">
                      {["Received", "Preparing", "Out for Delivery", "Delivered"].map((status, idx) => {
                        const statuses: Order["status"][] = ["Received", "Preparing", "Out for Delivery", "Delivered"];
                        const currentIndex = statuses.indexOf(activeOrder.status);
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;
                        
                        return (
                          <div key={status} className="flex flex-col items-center gap-4 z-10">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 ${
                              isCompleted ? "bg-bali-orange text-white shadow-lg shadow-bali-orange/40" : "bg-white/5 text-white/20 border border-white/10"
                            } ${isCurrent ? "ring-8 ring-bali-orange/20 scale-110" : ""}`}>
                              {status === "Received" && <CheckCircle2 className="w-6 h-6" />}
                              {status === "Preparing" && <Clock className="w-6 h-6" />}
                              {status === "Out for Delivery" && <Truck className="w-6 h-6" />}
                              {status === "Delivered" && <Star className="w-6 h-6" />}
                            </div>
                            <div className="text-center">
                              <span className={`block font-display text-[10px] font-bold uppercase tracking-widest ${
                                isCompleted ? "text-white" : "text-white/20"
                              }`}>{status}</span>
                              {isCurrent && <span className="text-[8px] text-bali-orange font-bold uppercase tracking-tighter animate-pulse">In Progress</span>}
                            </div>
                          </div>
                        );
                      })}
                      {/* Progress Line */}
                      <div className="absolute top-7 left-0 w-full h-[1px] bg-white/10 -z-0" />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(["Received", "Preparing", "Out for Delivery", "Delivered"].indexOf(activeOrder.status) / 3) * 100}%` 
                        }}
                        className="absolute top-7 left-0 h-[1px] bg-bali-orange -z-0 transition-all duration-1000 shadow-[0_0_10px_rgba(255,99,33,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="text-center mb-16">
          <span className="section-subtitle">Our Selection</span>
          <h2 className="section-title">Explore the Menu</h2>
          <div className="flex flex-wrap gap-4 mt-10 justify-center">
            {["All", ...Object.values(Category)].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`bali-btn text-[10px] px-8 py-3 ${
                  selectedCategory === cat 
                    ? "bali-btn-secondary" 
                    : "bali-btn-outline"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={addToCart} />
            ))}
          </AnimatePresence>
        </div>

        {/* Info Section */}
        <section id="info" className="mt-48">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="section-subtitle">Our Story</span>
            <h2 className="section-title">A Taste of Bali in Every Bite</h2>
            <p className="text-zinc-500 font-light leading-relaxed">Founded with a passion for authentic flavors and tropical vibes, Bali Restaurant brings you a unique fusion of traditional recipes and modern culinary techniques. Every dish is prepared with the freshest ingredients to ensure an unforgettable experience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bali-card p-12 text-center group">
              <div className="w-20 h-20 bg-bali-cream rounded-full flex items-center justify-center mx-auto mb-8 transition-transform duration-500 group-hover:scale-110">
                <Clock className="w-8 h-8 text-bali-orange" />
              </div>
              <span className="premium-label">Availability</span>
              <h3 className="text-2xl font-serif italic mb-4">Opening Hours</h3>
              <p className="text-zinc-500 font-light leading-relaxed">{RESTAURANT_HOURS}</p>
            </div>
            
            <div className="bali-card p-12 text-center group">
              <div className="w-20 h-20 bg-bali-cream rounded-full flex items-center justify-center mx-auto mb-8 transition-transform duration-500 group-hover:scale-110">
                <MapPin className="w-8 h-8 text-bali-orange" />
              </div>
              <span className="premium-label">Location</span>
              <h3 className="text-2xl font-serif italic mb-4">Delivery Area</h3>
              <p className="text-zinc-500 font-light leading-relaxed">{DELIVERY_AREA}</p>
            </div>
            
            <div className="bali-card p-12 text-center group">
              <div className="w-20 h-20 bg-bali-cream rounded-full flex items-center justify-center mx-auto mb-8 transition-transform duration-500 group-hover:scale-110">
                <Phone className="w-8 h-8 text-bali-orange" />
              </div>
              <span className="premium-label">Get in Touch</span>
              <h3 className="text-2xl font-serif italic mb-4">Contact Us</h3>
              <p className="text-zinc-500 font-light leading-relaxed">{CONTACT_INFO.phone}</p>
              <p className="text-zinc-500 font-light leading-relaxed">{CONTACT_INFO.email}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-bali-ink text-white py-24 mt-48 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-bali-orange/5 rounded-full blur-[100px]" />
        
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-bali-orange rounded-full flex items-center justify-center text-white font-serif italic text-xl shadow-lg shadow-bali-orange/20">B</div>
              <h2 className="text-3xl font-bold tracking-tight">{RESTAURANT_NAME}</h2>
            </div>
            <p className="text-white/50 max-w-md mb-10 text-lg font-light leading-relaxed">Bringing the authentic taste of the tropics to your plate. We pride ourselves on using fresh ingredients and traditional recipes with a modern twist.</p>
            <div className="flex gap-6">
              <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-bali-orange hover:text-white transition-all duration-300 border border-white/10"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-bali-orange hover:text-white transition-all duration-300 border border-white/10"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-bali-orange hover:text-white transition-all duration-300 border border-white/10"><MessageCircle className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-bali-orange mb-8">Quick Links</h4>
            <ul className="space-y-4 text-white/50 font-light">
              <li><a href="#menu" className="hover:text-white transition-colors">Our Menu</a></li>
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Delivery Info</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-bali-orange mb-8">Location</h4>
            <p className="text-white/50 mb-6 font-light">{CONTACT_INFO.address}</p>
            <div className="w-full h-40 bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.5!2d115.1!3d-8.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMzYnMDAuMCJTIDExNcKwMDYnMDAuMCJF!5e0!3m2!1sen!2sid!4v1234567890" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-24 pt-8 border-t border-white/5 text-center text-white/20 text-[10px] font-display uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} {RESTAURANT_NAME}. All rights reserved.
        </div>
      </footer>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-bali-cream z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-2xl font-serif italic flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-bali-orange" />
                    Your Cart
                  </h3>
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-bali-olive/40 mt-1">Review your selection</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-3 hover:bg-bali-cream rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <ShoppingCart className="w-10 h-10 text-bali-olive/20" />
                    </div>
                    <p className="text-xl font-serif italic text-bali-olive/60">Your cart is empty</p>
                    {lastOrder && (
                      <button 
                        onClick={repeatLastOrder}
                        className="mt-6 flex items-center gap-2 text-bali-orange font-display text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Repeat Last Order
                      </button>
                    )}
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 text-bali-olive/40 font-display text-[10px] font-bold uppercase tracking-widest hover:text-bali-olive transition-colors"
                    >
                      Start adding items
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      <AnimatePresence mode="popLayout">
                        {cart.map((item, idx) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            key={`${item.id}-${idx}`} 
                            className="bali-card p-5 flex gap-5"
                          >
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-grow">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-lg font-serif italic">{item.name}</h4>
                                <button 
                                  onClick={() => removeFromCart(item.id, item.customNote)}
                                  className="text-zinc-300 hover:text-bali-orange transition-colors p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs font-display font-bold text-bali-olive/40 mb-4 tracking-wider">PKR {item.price}</p>
                              {item.customNote && (
                                <div className="bg-bali-cream/50 p-2 rounded-lg mb-4">
                                  <p className="text-[10px] italic text-bali-orange leading-tight">Note: {item.customNote}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-4 bg-bali-cream rounded-full px-4 py-1.5">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1, item.customNote)}
                                    className="text-bali-olive hover:text-bali-orange transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <motion.span 
                                    key={item.quantity}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    className="font-bold text-sm min-w-[12px] text-center"
                                  >
                                    {item.quantity}
                                  </motion.span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1, item.customNote)}
                                    className="text-bali-olive hover:text-bali-orange transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="ml-auto font-serif italic text-lg">PKR {item.price * item.quantity}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="pt-8 border-t border-black/5 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-2xl italic">Checkout</h4>
                        <div className="flex items-center gap-2 text-bali-orange bg-bali-orange/5 px-4 py-2 rounded-full border border-bali-orange/10">
                          <Clock className="w-4 h-4" />
                          <span className="font-display text-[10px] font-bold uppercase tracking-widest">Est: {estimatedDeliveryTime} mins</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="premium-label">Full Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. John Doe"
                            className="bali-input"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="premium-label">Phone Number</label>
                          <input 
                            type="tel" 
                            placeholder="e.g. +92 300 1234567"
                            className="bali-input"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="premium-label">Delivery Address</label>
                          <textarea 
                            placeholder="House #, Street, Area"
                            rows={2}
                            className="bali-input resize-none"
                            value={customerInfo.address}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="premium-label">Order Note</label>
                          <textarea 
                            placeholder="Any special instructions?"
                            rows={2}
                            className="bali-input resize-none"
                            value={customerInfo.orderNote}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, orderNote: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-white border-t border-black/5 space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-center">
                    <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-bali-olive/40">Total Amount</span>
                    <span className="text-3xl font-serif italic text-bali-orange">PKR {totalAmount}</span>
                  </div>
                  <button 
                    onClick={placeOrder}
                    disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address}
                    className="w-full bali-btn bali-btn-primary py-5 text-sm"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Place Order via WhatsApp
                  </button>
                  <p className="text-center text-[10px] font-display font-bold uppercase tracking-widest text-bali-olive/30">Secure checkout via WhatsApp</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem, q: number, n: string) => void; key?: string | number }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    onAdd(item, quantity, note);
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1500);
    setQuantity(1);
    setNote("");
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bali-card flex flex-col h-full group"
    >
      <div className="relative h-72 overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {item.isPopular && (
          <div className="absolute top-6 left-6 bg-bali-orange text-white text-[10px] font-display font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md">
            <Star className="w-3 h-3 fill-current" />
            POPULAR
          </div>
        )}
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl font-serif italic text-xl text-bali-olive shadow-xl">
          PKR {item.price}
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <div className="mb-4">
          <span className="font-display text-[10px] font-bold uppercase tracking-widest text-bali-orange mb-1 block">{item.category}</span>
          <h3 className="text-2xl font-serif italic">{item.name}</h3>
        </div>
        <p className="text-zinc-500 text-sm font-light leading-relaxed mb-8 flex-grow">{item.description}</p>
        
        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Special instructions..."
              className="w-full text-xs px-5 py-3 rounded-2xl bg-bali-cream/50 border border-black/5 focus:outline-none focus:ring-2 focus:ring-bali-orange/10 transition-all placeholder:text-zinc-400"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 bg-bali-cream rounded-full px-5 py-2">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-bali-olive hover:text-bali-orange transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm min-w-[20px] text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="text-bali-olive hover:text-bali-orange transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={handleAdd}
              disabled={isAdding}
              className={`bali-btn flex-grow py-4 shadow-none ${
                isAdding ? "bg-emerald-500 text-white" : "bali-btn-secondary"
              }`}
            >
              {isAdding ? (
                <>Added to Cart</>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

