import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className='flex items-center justify-center h-[90vh]'>
      <div className='w-full max-w-md mx-auto text-center px-4'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: isLoaded ? 1 : 0.8, opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className='mb-4'
        >
          <img
            src='/not-found.svg'
            alt={t('notFound')}
            className='w-96 h-auto mx-auto'
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isLoaded ? 0 : 20, opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className='text-2xl font-bold text-foreground mb-2'>
            {t('notFoundPage.title')}
          </h1>

          <p className='text-sm text-muted-foreground mb-4'>
            {t('notFoundPage.description')}
          </p>

          <div className='flex items-center justify-center gap-3'>
            <Button asChild variant='default' size='sm'>
              <Link to='/' className='flex items-center gap-1'>
                <Home size={16} />
                {t('notFoundPage.homeButton')}
              </Link>
            </Button>

            <Button asChild variant='outline' size='sm'>
              <Link
                to='#'
                onClick={() => window.history.back()}
                className='flex items-center gap-1'
              >
                <ArrowLeft size={16} />
                {t('notFoundPage.backButton')}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
