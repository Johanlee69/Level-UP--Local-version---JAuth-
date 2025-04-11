import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#120E1B] to-[#5D1BE3] overflow-hidden">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <main className="flex-grow w-full overflow-auto mt-16">
        {React.Children.map(children, child => {
          // Pass sidebar state to Homepage component
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