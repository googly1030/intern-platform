const Header = ({ user, breadcrumbs = [] }) => {
  const defaultUser = {
    name: 'ROOT_USER',
    accessLevel: 'ACCESS_LEVEL_5',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADtheZwePEO9juUGUtf5rk_PKTpz1O8PS6vGcaoEmxOMK-YX0CEitbLUPzcM7VfFIidHbYKgr_Cn1ZClLnx39Ao09l-P41hT6gYcVKrU2d-zP4-DOyaHMyYlh6fs6CL3EHUN1KftWspYNpQVI2WyO1uz7gTU7MNeJC5HA5VdVwkbBot3QUQ4sel_v_88gA1TTcnduXAazb2snNvtaw-yRmMQABAy3OkwW8580rwOw30r2ghFYhC43bo27ya7qN7f9hYX-i2BrOAR8'
  };

  const { name, accessLevel, avatar } = user || defaultUser;

  return (
    <header className="sticky top-0 z-30 w-full bg-oled-black/90 backdrop-blur-sm border-b border-white/10 lg:pl-0">
      <div className="divider-glow absolute bottom-0 left-0 right-0 w-full" />

      <div className="flex items-center justify-between px-6 py-4 mx-auto w-full">
        {/* Left side - Mobile menu & logo, or Desktop breadcrumbs */}
        <div className="lg:hidden flex items-center gap-3">
          <button className="text-primary border border-primary p-1">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white terminal-glow">
            DevRecruit<span className="text-primary">.sh</span>
          </h1>
        </div>

        {/* Desktop breadcrumbs */}
        <div className="hidden lg:flex items-center gap-2 text-sm font-mono">
          <span className="text-primary/70">root</span>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              <span className="text-gray-600">/</span>
              <span className={crumb.active ? 'text-white' : 'text-primary/70'}>
                {crumb.label}
              </span>
            </span>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* System Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-primary/70">
            <span>CPU: 12%</span>
            <span>MEM: 4.2GB</span>
            <span>NET: 1Gbps</span>
          </div>

          <div className="h-6 w-px bg-white/20" />

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative text-white/70 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 size-1.5 bg-primary shadow-neon rounded-full" />
            </button>

            {/* Settings */}
            <button className="text-white/70 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>

            {/* User Profile - only visible on mobile (on desktop it's in sidebar) */}
            <div className="lg:hidden flex items-center gap-3 pl-2">
              <div className="size-9 border border-primary/50 overflow-hidden relative shadow-neon-sm">
                <img
                  alt="User Avatar"
                  className="w-full h-full object-cover grayscale"
                  src={avatar}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
