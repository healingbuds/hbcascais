import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useShop } from '@/context/ShopContext';

export function FloatingCartButton() {
  const { cartCount, setIsCartOpen } = useShop();
  
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="font-semibold">Cart</span>
      {cartCount > 0 && (
        <motion.span
          key={cartCount}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-primary text-sm font-bold ring-2 ring-primary/20"
        >
          {cartCount > 99 ? '99+' : cartCount}
        </motion.span>
      )}
    </motion.button>
  );
}
