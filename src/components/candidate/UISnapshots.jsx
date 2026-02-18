const UISnapshots = ({ snapshots = [] }) => {
  const defaultSnapshots = [
    {
      label: 'DASHBOARD_V1',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFLu4Fp4YJo3fOYqiKP22u2zXxqYCt0rCCA0bpqLncbab6X787Gqe31fPigKt69TJvsYwXx1vCJE4jkW9MS8DwbDXr2VFFxer9NqtOwx0dXLkTSBQe7sYtLC8MD41UYKy_VBjFG3DqoQPAG3OjakXEjJ7xlqJNFuDTRTcz7yPklK4qgih0wlZvpDjybfwMxFEYU4DNLji1wf-ANMJGdub3zwdtiwt28JodA8Egi_spoq7e4NpME-d3C40NEu6XQvT6qccUC6Gm6B8',
    },
    {
      label: 'MOBILE_APP',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFLN9DWhJLR_6SiCd2YzzP3-Kw8vSjipUnY_qzSwvd-Xf7FVSJloZKaupOoyj7tvk7jB2YORsFv2H5MXEK4i2Mk_8h_B_uwukzdL-f1rT9bG_OOPM1BOftNsxZRPpD0OPJAUIGqJd_WIdtRGQqLRs3iGnPCt6mpxjOGyYXCfERH-3Bifm7aCDoL5TB9x4B95xz-t41AoI45JDqVKdQeGcHftnPN9PwZGz1dWyyFhDe0FWsJHxK6MtZT2ifECrhDsiaQnlaiiG4zzQ',
    },
  ];

  const items = snapshots.length > 0 ? snapshots : defaultSnapshots;

  return (
    <div className="glass-panel p-4 flex-1">
      <h3 className="text-xs font-bold text-primary uppercase mb-4">[ UI_SNAPSHOTS ]</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {items.map((snapshot, index) => (
          <div key={index} className="border border-primary/40 p-1 relative group cursor-pointer">
            {/* Corner decorations */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary" />

            <div className="bg-black aspect-video overflow-hidden">
              <img
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                src={snapshot.image}
                alt={snapshot.label}
              />
            </div>
            <div className="text-[9px] text-center mt-1 text-primary/70">{snapshot.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UISnapshots;
