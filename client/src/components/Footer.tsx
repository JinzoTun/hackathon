import { Link } from 'react-router-dom';
import { Github, Facebook, Twitter, Instagram, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t py-6 md:py-8 w-full'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* Brand and main navigation */}
          <div className='space-y-4'>
            <div className='font-bold text-xl'>{t('agrilink')}</div>
            <p className='text-sm text-muted-foreground max-w-xs'>
              {t('landingPage.description')}
            </p>
            <div className='flex items-center gap-3 pt-2'>
              <a
                href='https://github.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors'
                aria-label='GitHub'
              >
                <Github className='size-5' />
              </a>
              <a
                href='#'
                aria-label='Facebook'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                <Facebook className='size-5' />
              </a>
              <a
                href='#'
                aria-label='Twitter'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                <Twitter className='size-5' />
              </a>
              <a
                href='#'
                aria-label='Instagram'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                <Instagram className='size-5' />
              </a>
            </div>
          </div>

          {/* Navigation links */}
          <div className='space-y-4'>
            <h3 className='font-medium text-base'>{t('navigation')}</h3>
            <nav className='flex flex-col gap-2 text-sm text-muted-foreground'>
              <Link to='/' className='hover:text-foreground transition-colors'>
                {t('home')}
              </Link>
              <Link
                to='/dashboard'
                className='hover:text-foreground transition-colors'
              >
                {t('Dashboard')}
              </Link>
              <Link
                to='/profile'
                className='hover:text-foreground transition-colors'
              >
                {t('Profile')}
              </Link>
              <Link
                to='/chat'
                className='hover:text-foreground transition-colors'
              >
                {t('chat')}
              </Link>
            </nav>
          </div>

          {/* Features section */}
          <div className='space-y-4'>
            <h3 className='font-medium text-base'>{t('Features')}</h3>
            <nav className='flex flex-col gap-2 text-sm text-muted-foreground'>
              <Link
                to='/dashboard'
                className='hover:text-foreground transition-colors'
              >
                {t('dashboard.diseaseDetection')}
              </Link>
              <Link to='/' className='hover:text-foreground transition-colors'>
                {t('map.allUser')}
              </Link>
              <Link
                to='/chat'
                className='hover:text-foreground transition-colors'
              >
                {t('chatPage.farmingAdvice')}
              </Link>
            </nav>
          </div>

          {/* Contact us */}
          <div className='space-y-4'>
            <h3 className='font-medium text-base'>{t('contactUser')}</h3>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Mail className='size-4' />
              <span>contact@agrilink.com</span>
            </div>
            <form className='space-y-2'>
              <input
                type='email'
                placeholder={t('emailAddress')}
                className='w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-transparent'
                aria-label={t('emailAddress')}
              />
              <Button type='submit' size='sm' className='w-full'>
                {t('submit')}
              </Button>
            </form>
          </div>
        </div>

        {/* Copyright section */}
        <div className='mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground'>
          <div className='text-center md:text-left'>
            © {currentYear} {t('agrilink')}
          </div>
          <div className='flex flex-wrap justify-center md:justify-end items-center gap-4'>
            <Link to='/' className='hover:text-foreground transition-colors'>
              {t('notFoundPage.homeButton')}
            </Link>
            <Link
              to='/login'
              className='hover:text-foreground transition-colors'
            >
              {t('login')}
            </Link>
            <Link
              to='/register'
              className='hover:text-foreground transition-colors'
            >
              {t('register')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
