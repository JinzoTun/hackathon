import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/api/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after component mount
    setIsLoaded(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.3,
        duration: 0.8,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const ctaVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  return (
    <div className='min-h-screen  bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-slate-950 overflow-hidden relative'>
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Hero Section */}
      <motion.div
        className=' mx-auto px-4 max-w-7xl pt-20 pb-16 relative'
        initial='hidden'
        animate={isLoaded ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        {/* Main content */}
        <div className='flex flex-col  md:flex-row items-center justify-between gap-12'>
          {/* Left Column - Text */}
          <motion.div
            className='w-full md:w-1/2 space-y-6'
            variants={itemVariants}
          >
            <motion.div variants={itemVariants}>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-green-800 dark:text-green-300 leading-tight mb-4'>
                {t('connect')}{' '}
                <span className='text-amber-600 dark:text-amber-400'>
                  {t('farmer')}
                </span>{' '}
                {t('nearYou')}
              </h1>
              <p className='text-xl text-gray-600 dark:text-gray-300 mb-8'>
                {t('landingPage.description')}
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className='flex flex-wrap gap-4'
              variants={itemVariants}
            >
              <motion.div
                variants={ctaVariants}
                whileHover='hover'
                whileTap='tap'
              >
                <Button
                  size='lg'
                  className='bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-6 rounded-lg shadow-lg hover:shadow-xl'
                  onClick={() =>
                    user ? navigate('/dashboard') : navigate('/auth/login')
                  }
                >
                  {user ? t('goToDashboard') : t('getStarted')}
                </Button>
              </motion.div>

              <motion.div
                variants={ctaVariants}
                whileHover='hover'
                whileTap='tap'
              >
                <Button
                  size='lg'
                  variant='outline'
                  className='border-green-600 text-green-700 dark:border-green-500 dark:text-green-400 text-lg px-6 py-6 rounded-lg hover:bg-green-50 dark:hover:bg-green-950'
                  onClick={() => navigate('/map')}
                >
                  {t('exploreMap')}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Column - Image/Animation */}
          <motion.div className='w-full md:w-1/2' variants={itemVariants}>
            <motion.img
              src='/Farmer-bro.svg'
              alt='Farmer Illustration'
              className='w-full h-auto max-w-md mx-auto'
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
                delay: 0.5,
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.section
        className='container mx-auto px-4 py-16'
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <motion.h2
          className='text-3xl font-bold text-center text-green-800 dark:text-green-300 mb-12'
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {t('whyJoinCommunity')}
        </motion.h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.2 }}
            >
              <Card className='h-full border-green-100 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70'>
                <CardContent className='p-6'>
                  <div className='mb-4 text-4xl text-green-600 dark:text-green-400'>
                    {feature.icon}
                  </div>
                  <h3 className='text-xl font-bold mb-2 text-green-800 dark:text-green-300'>
                    {t(feature.titleKey)}
                  </h3>
                  <p className='text-gray-600 dark:text-gray-300'>
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonial Section */}
      <motion.section
        className='container mx-auto px-4 py-16'
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <motion.div
          className='bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm rounded-xl p-8 relative overflow-hidden'
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className='absolute top-0 right-0 w-40 h-40 bg-green-200 dark:bg-green-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50'></div>

          <motion.div
            className='relative z-10 text-center max-w-3xl mx-auto space-y-4'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.9 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <svg
              className='w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400'
              fill='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path d='M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z' />
            </svg>
            <p className='text-xl md:text-2xl italic text-gray-700 dark:text-gray-200 font-light'>
              {t('testimonial.quote')}
            </p>
            <h4 className='text-lg font-semibold text-green-800 dark:text-green-300'>
              {t('testimonial.author')}
            </h4>
            <p className='text-gray-600 dark:text-gray-400'>
              {t('testimonial.role')}
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Final CTA Section with Parallax Effect */}
      <motion.section
        className='container mx-auto px-4 py-16 mb-10'
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        <motion.div
          className='bg-gradient-to-r from-green-600 to-green-500 dark:from-green-700 dark:to-green-600 rounded-xl p-10 text-center text-white relative overflow-hidden'
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background Animation Elements */}
          <motion.div
            className='absolute top-0 left-0 w-40 h-40 bg-white rounded-full opacity-10'
            animate={{
              x: [0, 40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 12,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className='absolute bottom-0  right-0 w-60 h-60 bg-white rounded-full opacity-10'
            animate={{
              x: [0, -30, 0],
              y: [0, -30, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 15,
              ease: 'easeInOut',
            }}
          />

          <div className='max-w-3xl mx-auto relative z-10'>
            <h2 className='text-3xl md:text-4xl font-bold mb-6'>
              {t('readyToJoin')}
            </h2>
            <p className='text-xl mb-8 text-green-50'>
              {t('connectDescription')}
            </p>
            <motion.div
              variants={ctaVariants}
              whileHover='hover'
              whileTap='tap'
              className='inline-block'
            >
              <Button
                size='lg'
                className='bg-white text-green-700 hover:bg-green-50 text-xl  px-8 py-6 rounded-lg shadow-lg'
                onClick={() =>
                  user ? navigate('/dashboard') : navigate('/auth/register')
                }
              >
                {user ? t('accessDashboard') : t('joinNow')}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* Animated Farm Illustration at bottom */}
      <motion.div
        className='w-full h-48 bg-gradient-to-t from-green-800/20 to-transparent relative overflow-hidden'
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1.5, delay: 1.8 }}
      >
        {/* Animated clouds */}
        <motion.div
          className='absolute top-0 w-full flex justify-between'
          animate={{
            x: [0, -30, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 30,
            ease: 'easeInOut',
          }}
        >
          <div className='w-20 h-10 bg-white/30 dark:bg-white/10 rounded-full filter blur-md'></div>
          <div className='w-32 h-12 bg-white/40 dark:bg-white/20 rounded-full filter blur-md'></div>
        </motion.div>

        {/* Animated tractor that resets to start instead of reversing */}
        <motion.div
          className='absolute -bottom-2 w-full flex justify-start'
          initial={{ x: '-1%' }}
          animate={{ x: '110%' }}
          transition={{
            duration: 15,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
            repeatDelay: 0.5,
          }}
        >
          <img
            src='/tractor.svg'
            alt='Farm Tractor'
            className='w-16 h-auto sm:w-20 md:w-24 lg:w-28 drop-shadow-md hover:scale-110 transition-transform duration-300'
          />
        </motion.div>

        

        {/* Farm field silhouette */}
        <div className='absolute bottom-0 w-full'>
          <svg
            viewBox='0 0 1200 40'
            xmlns='http://www.w3.org/2000/svg'
            className='w-full h-auto fill-green-800 dark:fill-green-600'
            preserveAspectRatio='none'
          >
            <path d='M0,40 L1200,40 L1200,35 C1100,25 1000,30 900,20 C800,15 700,25 600,30 C500,35 400,15 300,20 C200,25 100,35 0,30 L0,40 Z' />
          </svg>
        </div>
      </motion.div>
    </div>
  );
};

// Feature icons and content
const features = [
  {
    icon: '🌱',
    titleKey: 'features.expertCommunity.title',
    descriptionKey: 'features.expertCommunity.description',
  },
  {
    icon: '🔍',
    titleKey: 'features.diseaseIdentification.title',
    descriptionKey: 'features.diseaseIdentification.description',
  },
  {
    icon: '🗺️',
    titleKey: 'features.localConnections.title',
    descriptionKey: 'features.localConnections.description',
  },
];

export default LandingPage;
