import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShop } from '@/context/ShopContext';

export function CartButton() {
  const { cartCount, setIsCartOpen } = useShop();

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={() => setIsCartOpen(true)}
    >
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.span
            key="cart-count"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
