const ActionLinks = ({ githubUrl, hostedUrl, videoUrl }) => {
  // Build links array from provided props only
  const links = [];

  if (githubUrl) {
    links.push({
      icon: 'code',
      label: 'GitHub_Repository',
      href: githubUrl,
    });
  }

  if (hostedUrl) {
    links.push({
      icon: 'rocket_launch',
      label: 'Live_Demo',
      href: hostedUrl,
    });
  }

  if (videoUrl) {
    links.push({
      icon: 'videocam',
      label: 'Video_Demo',
      href: videoUrl,
    });
  }

  // If no links provided, show a message
  if (links.length === 0) {
    return (
      <div className="glass-panel p-4 flex-1 corner-brackets">
        <h3 className="text-xs font-bold text-primary uppercase mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          Action_Links
        </h3>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <span className="material-symbols-outlined text-2xl text-gray-600 mb-2">link_off</span>
          <p className="text-gray-500 font-mono text-[10px]">NO_LINKS_PROVIDED</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 flex-1 corner-brackets">
      <h3 className="text-xs font-bold text-primary uppercase mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">terminal</span>
        Action_Links
      </h3>
      <nav className="flex flex-col gap-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 border border-white/10 hover:border-primary/50 bg-white/5 hover:bg-primary/10 transition-all group"
          >
            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-[16px]">
              {link.icon}
            </span>
            <span className="text-xs text-gray-300 group-hover:text-white font-mono flex-1">
              &gt; {link.label}
            </span>
            <span className="material-symbols-outlined text-gray-600 group-hover:text-primary text-[14px]">
              open_in_new
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default ActionLinks;
