const CircleProgress = ({ value = 84, icon = 'code' }) => (
  <div className="relative size-14 flex items-center justify-center">
    <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
      <path
        className="text-gray-900"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="text-primary shadow-neon"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeDasharray={`${value}, 100`}
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
    <span className="material-symbols-outlined absolute text-primary text-[16px]">{icon}</span>
  </div>
);

export default CircleProgress;
