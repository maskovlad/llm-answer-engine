'use client';

import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
import { logo } from '@/public'
import Sidebar from './sidebar';
import { Locale } from '@/i18n-config';
import LocaleSwitcher from './locale-switcher';
import { Flex, Button, Avatar, Text } from '@radix-ui/themes';
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon, GearIcon } from '@radix-ui/react-icons';

export function Header({ lang }: { lang: Locale }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <header className="sticky flex items-center top-0 z-20 w-full px-4 border-b h-14 shrink-0 backdrop-blur-xl">
      <Flex justify='between' align='center' width='100%'>
        <Flex display={{initial: 'flex', md: 'none'}} />
        <Flex className="inline-flex items-center home-links whitespace-nowrap">
          <img src={logo.src} width='50px' height='50px' className='bg-transparent' />
          {/* <img className="h-[50px]" src={logo.src} /> */}
          <a className='inline-flex' href="https://naida.vercel.app" rel="noopener" target="_blank">
            <Text className="text-lg sm:text-xl lg:text-2xl font-semibold ml-4">NAIDA</Text>
          </a>
          {/* <span className="linear-wipe text-sm">ШІстема пошуку відповідей (alpha)</span> */}
        </Flex>

        <Flex justify='center' align='center' gap='2'>
          <Button variant="outline" onClick={() => setTheme(theme === 'light' ?'dark':'light')}>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
          <LocaleSwitcher curLocale={lang} />
          <Button variant="outline" onClick={toggleSidebar}>
              <GearIcon />
          </Button>
        </Flex>
      </Flex>
      {/*<Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} lang={lang} />*/}
    </header>
  );
}

