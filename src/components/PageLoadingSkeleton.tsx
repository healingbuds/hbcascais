import { motion } from 'framer-motion';
import { Skeleton } from './ui/skeleton';

interface PageLoadingSkeletonProps {
  variant?: 'default' | 'hero' | 'cards' | 'article';
}

const PageLoadingSkeleton = ({ variant = 'default' }: PageLoadingSkeletonProps) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  if (variant === 'hero') {
    return (
      <motion.div
        className="min-h-screen bg-background"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Header skeleton */}
        <motion.div variants={itemVariants} className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <div className="hidden md:flex items-center gap-4">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl md:hidden" />
          </div>
        </motion.div>

        {/* Hero skeleton */}
        <motion.div variants={itemVariants} className="pt-32 px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-16 sm:h-20 w-3/4 rounded-2xl" />
            <Skeleton className="h-16 sm:h-20 w-1/2 rounded-2xl" />
            <Skeleton className="h-6 w-2/3 mt-8 rounded-lg" />
          </div>
        </motion.div>

        {/* Content skeleton */}
        <motion.div variants={itemVariants} className="mt-32 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (variant === 'cards') {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} variants={itemVariants}>
            <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
              <Skeleton className="h-48 w-full" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (variant === 'article') {
    return (
      <motion.div
        className="max-w-4xl mx-auto px-4 py-20"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div variants={itemVariants}>
          <Skeleton className="h-8 w-32 rounded-lg mb-4" />
          <Skeleton className="h-12 w-full rounded-xl mb-2" />
          <Skeleton className="h-12 w-3/4 rounded-xl mb-8" />
          <Skeleton className="h-64 w-full rounded-2xl mb-8" />
        </motion.div>
        
        <motion.div variants={itemVariants} className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded-lg" />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  // Default skeleton
  return (
    <motion.div
      className="min-h-screen bg-background p-6"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div variants={itemVariants} className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-1/3 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </motion.div>
    </motion.div>
  );
};

export default PageLoadingSkeleton;
