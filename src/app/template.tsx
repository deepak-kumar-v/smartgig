'use client';

import { motion } from 'framer-motion';

// 🎨 TRANSITION VARIANTS - Change 'activeVariant' to switch styles
const activeVariant = 'premiumFadeUp'; // Options: 'premiumFadeUp', 'slideLeft', 'scaleZoom', 'simpleFade'

const variants = {
    premiumFadeUp: {
        initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        transition: { ease: [0.22, 1, 0.36, 1], duration: 0.75 }
    },
    slideLeft: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        transition: { ease: 'easeOut', duration: 0.5 }
    },
    scaleZoom: {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { type: 'spring', damping: 20, stiffness: 100 }
    },
    simpleFade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.4 }
    }
};

export default function Template({ children }: { children: React.ReactNode }) {
    const variant = variants[activeVariant as keyof typeof variants];

    return (
        <motion.div
            initial={variant.initial}
            animate={variant.animate}
            transition={variant.transition}
        >
            {children}
        </motion.div>
    );
}
