import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'DASHBOARD' },
  { path: '/submit', icon: 'rate_review', label: 'SUBMIT' },
  { path: '/batch', icon: 'workspaces', label: 'BATCH' },
  { path: '/candidates', icon: 'person_search', label: 'CANDIDATES' },
  { path: '/tasks', icon: 'assignment', label: 'TASKS' },
  { path: '/settings', icon: 'settings_suggest', label: 'SYSTEM' },
];

const Sidebar = ({ user }) => {
  const defaultUser = {
    name: 'ROOT_USER',
    accessLevel: 'ACCESS_LVL_5',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADtheZwePEO9juUGUtf5rk_PKTpz1O8PS6vGcaoEmxOMK-YX0CEitbLUPzcM7VfFIidHbYKgr_Cn1ZClLnx39Ao09l-P41hT6gYcVKrU2d-zP4-DOyaHMyYlh6fs6CL3EHUN1KftWspYNpQVI2WyO1uz7gTU7MNeJC5HA5VdVwkbBot3QUQ4sel_v_88gA1TTcnduXAazb2snNvtaw-yRmMQABAy3OkwW8580rwOw30r2ghFYhC43bo27ya7qN7f9hYX-i2BrOAR8'
  };

  const { name, accessLevel, avatar } = user || defaultUser;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-oled-black z-40 relative flex-shrink-0">
      {/* Vertical divider glow */}
      <div className="sidebar-divider-glow absolute top-0 bottom-0 right-0 h-full" />

      {/* Logo Section */}
      <div className="p-6 border-b border-white/10 relative">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center size-8 text-primary border border-primary shadow-neon">
            <span className="material-symbols-outlined text-[20px]">terminal</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white terminal-glow">
              DevRecruit<span className="text-primary">.sh</span>
            </h1>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-primary font-mono pl-11">
          System: Online
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${isActive ? 'nav-item-active' : 'text-gray-400 hover:text-primary hover:bg-white/5 border-r-2 border-transparent hover:border-primary/50'} group flex items-center px-4 py-3 text-sm font-medium transition-all duration-200`
            }
          >
            <span className="material-symbols-outlined mr-3 text-gray-500 group-hover:text-primary transition-colors">
              {item.icon}
            </span>
            <span className="font-mono tracking-wide group-hover:text-primary group-hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10 bg-black/50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="size-10 border border-primary/50 overflow-hidden relative shadow-neon-sm">
            <img
              alt="User Avatar"
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
              src={avatar}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none truncate group-hover:text-primary transition-colors">
              {name}
            </p>
            <div className="flex items-center mt-1.5">
              <span className="size-2 bg-neon-green rounded-full shadow-neon-green mr-2 animate-pulse" />
              <p className="text-[10px] text-primary font-mono leading-none truncate">
                {accessLevel}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-500 group-hover:text-primary text-[18px]">
            logout
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
