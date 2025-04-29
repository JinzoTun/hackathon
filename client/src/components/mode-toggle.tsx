import { CheckIcon, CloudMoon, Leaf, Sprout, Sun, Wheat } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from 'react-i18next';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-amber-500 dark:-rotate-90 dark:scale-0' />
          <CloudMoon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all text-emerald-300 dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>{t('themeToggle.toggleGrowingMode')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className='flex items-center gap-2 justify-between'
        >
          <div className='flex items-center gap-2'>
            <Wheat className='h-4 w-4 text-amber-500' />
            <span>{t('themeToggle.daytimeMode')}</span>
          </div>
          {theme === 'light' && <CheckIcon className='h-4 w-4' />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className='flex items-center gap-2 justify-between'
        >
          <div className='flex items-center gap-2'>
            <Sprout className='h-4 w-4 text-emerald-500' />
            <span>{t('themeToggle.nighttimeMode')}</span>
          </div>
          {theme === 'dark' && <CheckIcon className='h-4 w-4' />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className='flex items-center gap-2 justify-between'
        >
          <div className='flex items-center gap-2'>
            <Leaf className='h-4 w-4 text-green-500' />
            <span>{t('themeToggle.naturalCycle')}</span>
          </div>
          {theme === 'system' && <CheckIcon className='h-4 w-4' />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
