import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar is always present but may be collapsed on desktop */}
      {(isSidebarOpen || !isMobile) && (
        <Sidebar closeSidebar={() => setIsSidebarOpen(false)} />
      )}
      <main className="flex-grow">
        <header className="bg-white border-b border-neutral-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            {isMobile && (
              <span 
                className="md:hidden mr-2 material-icons cursor-pointer text-neutral-600"
                onClick={toggleSidebar}
              >
                menu
              </span>
            )}
            <h2 className="text-xl font-semibold">PSSG</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-sm flex items-center">
              <span className="material-icons mr-1 text-sm">help_outline</span>
              <span>Help</span>
            </button>
          </div>
        </header>
        <div className="md:pl-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
