import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  className?: string;
}

const AnimatedBackground = ({ className = '' }: AnimatedBackgroundProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden -z-10 ${className}`}>
      {/* Floating bubbles */}
      {[...Array(6)].map((_, index) => {
        // Generate random positions and sizes
        const size = Math.random() * 300 + 100; // 100-400px
        const delay = Math.random() * 5;
        const duration = Math.random() * 20 + 15; // 15-35s
        const opacity = Math.random() * 0.15 + 0.05; // 0.05-0.2
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;

        return (
          <motion.div
            key={index}
            className='absolute rounded-full bg-gradient-to-r from-green-200 to-green-300 dark:from-green-800 dark:to-green-700 blur-3xl'
            style={{
              width: size,
              height: size,
              left: `${initialX}%`,
              top: `${initialY}%`,
              opacity,
            }}
            animate={{
              x: [0, Math.random() * 80 - 40, 0],
              y: [0, Math.random() * 80 - 40, 0],
            }}
            transition={{
              repeat: Infinity,
              duration,
              delay,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Accent elements */}
      <motion.div
        className='absolute w-1/3 h-1/3 rounded-full bg-amber-200 dark:bg-amber-800/50 blur-3xl'
        style={{
          bottom: '10%',
          right: '5%',
          opacity: 0.15,
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className='absolute w-1/4 h-1/4 rounded-full bg-blue-200 dark:bg-blue-800/50 blur-3xl'
        style={{
          top: '15%',
          left: '10%',
          opacity: 0.1,
        }}
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
