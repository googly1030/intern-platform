const ActionLinks = ({ links = [] }) => {
  const defaultLinks = [
    { icon: 'code', label: 'GitHub_Profile', href: '#' },
    { icon: 'rocket_launch', label: 'Live_Demo', href: '#' },
    { icon: 'videocam', label: 'Video_Interview', href: '#' },
    { icon: 'description', label: 'Resume_PDF', href: '#' },
  ];

  const navLinks = links.length > 0 ? links : defaultLinks;

  return (
    <div className="glass-panel p-4 flex-1 corner-brackets">
      <h3 className="text-xs font-bold text-primary uppercase mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">terminal</span>
        Action_Links
      </h3>
      <nav className="flex flex-col gap-2">
        {navLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2 border border-white/10 hover:border-primary/50 bg-white/5 hover:bg-primary/10 transition-all group"
          >
            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-[16px]">
              {link.icon}
            </span>
            <span className="text-xs text-gray-300 group-hover:text-white font-mono">
              &gt; {link.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default ActionLinks;
