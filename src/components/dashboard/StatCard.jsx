const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  type = 'default',
  children
}) => {
  const typeStyles = {
    default: 'text-primary',
    green: 'text-neon-green',
    amber: 'text-neon-amber',
    red: 'text-neon-red'
  };

  return (
    <div className="p-6 relative group border-r border-white/5 last:border-r-0">
      <div className="flex justify-between items-start mb-2">
        <p className={`${typeStyles[type]} text-xs font-mono uppercase tracking-widest`}>
          [ {title} ]
        </p>
        {trend && (
          <span className={`text-neon-green text-xs font-mono flex items-center shadow-neon-green bg-black border border-neon-green/30 px-1`}>
            ▲ {trendValue}%
          </span>
        )}
        {icon && (
          <span className={`material-symbols-outlined ${typeStyles[type]} text-[18px]`}>
            {icon}
          </span>
        )}
      </div>
      <h3 className="text-4xl font-mono text-white group-hover:text-primary transition-colors duration-300">
        {value}
        {subtitle && <span className="text-sm text-gray-500 font-normal">{subtitle}</span>}
      </h3>
      {children}
    </div>
  );
};

export default StatCard;
