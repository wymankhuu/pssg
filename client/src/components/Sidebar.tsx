import { Link, useLocation } from "wouter";
import { gradeLevels } from "@/data/grade-levels";
import pssgLogo from "@/assets/pssg-paper-logo.svg";
import { useState, useEffect } from "react";

interface SidebarProps {
  closeSidebar?: () => void;
}

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return (
    <aside 
      className={`bg-indigo-900 text-white flex-shrink-0 flex flex-col h-screen z-20 fixed md:sticky top-0 left-0 transition-all duration-300 ${
        isMobile ? 'w-full' : isCollapsed ? 'w-16 hover:w-64' : 'w-64'
      }`}
      onMouseEnter={() => !isMobile && setIsCollapsed(false)}
      onMouseLeave={() => !isMobile && setIsCollapsed(true)}
    >
      <div className="p-4 flex items-center border-b border-indigo-800">
        <img src={pssgLogo} alt="PSSG Logo" className="w-8 h-8 mr-2" />
        <h1 className={`font-bold text-xl whitespace-nowrap overflow-hidden transition-opacity duration-300 ${
          isCollapsed && !isMobile ? 'opacity-0' : 'opacity-100'
        }`}>PSSG</h1>
        <button 
          className="ml-auto md:hidden text-white"
          onClick={closeSidebar}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div className="py-4 flex-grow overflow-y-auto">
        <h2 className={`px-4 text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-2 ${
          isCollapsed && !isMobile ? 'text-center' : ''
        }`}>
          {isCollapsed && !isMobile ? 'Grade' : 'Grade Levels'}
        </h2>
        
        {gradeLevels.map((grade) => (
          <Link 
            key={grade.id}
            href={`/generator/${grade.id}`}
          >
            <a 
              className={`block px-4 py-2 hover:bg-indigo-800 transition-colors flex items-center ${
                location === `/generator/${grade.id}` ? 'bg-indigo-700 text-white' : 'text-indigo-100'
              }`}
            >
              <span className="material-icons text-base">{grade.icon}</span>
              <span className={`ml-2 whitespace-nowrap transition-opacity duration-300 ${
                isCollapsed && !isMobile ? 'opacity-0 w-0' : 'opacity-100'
              }`}>
                {grade.label}
              </span>
            </a>
          </Link>
        ))}
      </div>
      
      <div className="mt-auto border-t border-indigo-800 p-4">
        <div className="flex justify-center">
          <span className={`text-xs text-indigo-400 whitespace-nowrap transition-opacity duration-300 ${
            isCollapsed && !isMobile ? 'opacity-0 w-0' : 'opacity-100'
          }`}>
            Created by SpyGuy
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
