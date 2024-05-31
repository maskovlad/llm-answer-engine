'use client'

import { Button, Flex, Heading } from '@radix-ui/themes';
import React, { useState, useEffect, useRef } from 'react';

const PageWithSidebars: React.FC = () => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const leftSidebarRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = (event: MouseEvent) => {
    if (leftSidebarRef.current && !leftSidebarRef.current.contains(event.target as Node)) {
      setIsLeftSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isLeftSidebarOpen) {
      document.addEventListener('click', handleOutsideClick);
    } else {
      document.removeEventListener('click', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isLeftSidebarOpen]);

  return (
    <Flex height="100vh">
          <Button
            className="lg:hidden fixed top-0 right-0 z-[60] mb-4 p-2 bg-blue-500 text-white rounded"
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          >
            Toggle Left Sidebar
          </Button>
      {/* Left Sidebar */}
      <Flex
        ref={leftSidebarRef}
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform ${
          isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:static lg:translate-x-0`}
      >
        <Heading className="p-4">Left Sidebar Content</Heading>
      </Flex>

      {/* Main Content */}
      <Flex className="flex-1 flex flex-col lg:flex-row">
        {/* Main Section */}
        <Flex className="flex-1 p-4">
          <Heading>Main Content</Heading>
        </Flex>

        {/* Right Sidebar */}
        <Flex className="hidden lg:block lg:w-64 bg-gray-800 text-white p-4">
          Right Sidebar Content
        </Flex>
      </Flex>
    </Flex>
  );
};

export default PageWithSidebars;
