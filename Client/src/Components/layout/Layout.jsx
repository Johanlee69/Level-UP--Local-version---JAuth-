import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from '../Homepage/components/Sidebar';

const Layout = ({ children, toggleSidebar: propToggleSidebar, isSidebarOpen: propIsSidebarOpen }) => {
  const [localIsSidebarOpen, setLocalIsSidebarOpen] = useState(false);
  
  const isSidebarOpen = propIsSidebarOpen !== undefined ? propIsSidebarOpen : localIsSidebarOpen;
  const toggleSidebar = propToggleSidebar || (() => setLocalIsSidebarOpen(!localIsSidebarOpen));

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#120E1B] to-[#5D1BE3] overflow-hidden">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className="flex-grow w-full overflow-auto mt-16">
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type.name === 'Homepage') {
            return React.cloneElement(child, { 
              toggleSidebar,
              isSidebarOpen 
            });
          }
          return child;
        })}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 