import { Outlet, useLocation } from 'react-router-dom';
import { Header, Sidebar } from '../components/layout';

const Layout = ({ user }) => {
  const location = useLocation();

  // Generate breadcrumb from path
  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return [
        { label: 'root', active: false },
        { label: 'dashboard', active: false },
        { label: 'overview', active: true },
      ];
    }
    return pathParts.map((part, index) => ({
      label: part,
      active: index === pathParts.length - 1,
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="bg-oled-black text-text-main flex overflow-hidden selection:bg-primary selection:text-black">
      {/* Scanlines overlay */}
      <div className="scanlines" />

      {/* Grid background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.1] grid-bg" />

      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <Header user={user} breadcrumbs={breadcrumbs} />

        {/* Main content */}
        <main className="flex-1 w-full overflow-y-auto px-6 py-8 z-10 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <button className="size-14 bg-black border border-primary text-primary shadow-neon flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;
