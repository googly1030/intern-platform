const MiniChart = () => (
  <div className="h-8 w-full mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
    <svg className="w-full h-full stroke-primary fill-none stroke-[1px]" preserveAspectRatio="none" viewBox="0 0 100 25">
      <path d="M0 20 L 10 22 L 20 15 L 30 18 L 40 10 L 50 14 L 60 18 L 70 12 L 80 5 L 90 8 L 100 12" vectorEffect="non-scaling-stroke" />
    </svg>
  </div>
);

export default MiniChart;
