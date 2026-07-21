import React from 'react';
import { 
  Wifi, 
  HardDrive, 
  Mouse, 
  Cpu, 
  Wrench, 
  FolderOpen, 
  Printer, 
  BatteryCharging 
} from 'lucide-react';

export default function CategoryMockup({ category, size = 'medium' }) {
  const isLarge = size === 'large';
  
  // Custom styled SVGs and templates for each category
  const renderGraphic = () => {
    const strokeWidth = isLarge ? 1.5 : 1.2;
    const iconSize = isLarge ? 'w-16 h-16' : 'w-7 h-7';

    switch (category) {
      case 'connectivity':
        return (
          <div className="flex flex-col items-center justify-center text-gov-blue">
            <Wifi className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md animate-pulse`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="5" y="10" width="90" height="20" rx="3" fill="#1c2541" />
                <circle cx="15" cy="20" r="2" fill="#10b981" />
                <circle cx="25" cy="20" r="2" fill="#10b981" />
                <circle cx="35" cy="20" r="2" fill="#10b981" />
                <circle cx="45" cy="20" r="2" fill="#c5a880" />
                <line x1="60" y1="17" x2="85" y2="17" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="2,2" />
                <line x1="60" y1="23" x2="85" y2="23" stroke="#cbd5e1" strokeWidth="2" />
              </svg>
            )}
          </div>
        );
      case 'storage':
        return (
          <div className="flex flex-col items-center justify-center text-emerald-600">
            <HardDrive className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="25" y="5" width="50" height="30" rx="2" fill="#0f766e" />
                <line x1="35" y1="12" x2="65" y2="12" stroke="#14b8a6" strokeWidth="1.5" />
                <line x1="35" y1="18" x2="65" y2="18" stroke="#14b8a6" strokeWidth="1.5" />
                <line x1="35" y1="24" x2="55" y2="24" stroke="#10b981" strokeWidth="1.5" />
                <circle cx="60" cy="24" r="2" fill="#f59e0b" />
              </svg>
            )}
          </div>
        );
      case 'peripherals':
        return (
          <div className="flex flex-col items-center justify-center text-gov-gold">
            <Mouse className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="15" y="12" width="70" height="16" rx="2" fill="#78350f" />
                <circle cx="25" cy="20" r="2" fill="white" />
                <circle cx="35" cy="20" r="2" fill="white" />
                <circle cx="45" cy="20" r="2" fill="white" />
                <circle cx="55" cy="20" r="2" fill="white" />
                <circle cx="65" cy="20" r="2" fill="white" />
                <circle cx="75" cy="20" r="2" fill="#d97706" />
              </svg>
            )}
          </div>
        );
      case 'electronics':
        return (
          <div className="flex flex-col items-center justify-center text-rose-600">
            <Cpu className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="35" y="5" width="30" height="30" rx="3" fill="#be123c" />
                <rect x="42" y="12" width="16" height="16" fill="#fda4af" />
                <line x1="30" y1="10" x2="35" y2="10" stroke="#fda4af" strokeWidth="2" />
                <line x1="30" y1="20" x2="35" y2="20" stroke="#fda4af" strokeWidth="2" />
                <line x1="30" y1="30" x2="35" y2="30" stroke="#fda4af" strokeWidth="2" />
                <line x1="65" y1="10" x2="70" y2="10" stroke="#fda4af" strokeWidth="2" />
                <line x1="65" y1="20" x2="70" y2="20" stroke="#fda4af" strokeWidth="2" />
                <line x1="65" y1="30" x2="70" y2="30" stroke="#fda4af" strokeWidth="2" />
              </svg>
            )}
          </div>
        );
      case 'tools':
        return (
          <div className="flex flex-col items-center justify-center text-slate-600">
            <Wrench className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="20" y="8" width="60" height="24" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
                <line x1="30" y1="20" x2="70" y2="20" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="35" cy="20" r="3" fill="#f59e0b" />
                <circle cx="65" cy="20" r="3" fill="#10b981" />
              </svg>
            )}
          </div>
        );
      case 'organization':
        return (
          <div className="flex flex-col items-center justify-center text-indigo-600">
            <FolderOpen className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="10" y="5" width="80" height="30" rx="3" fill="#312e81" />
                <line x1="20" y1="12" x2="80" y2="12" stroke="#4f46e5" strokeWidth="2" />
                <line x1="20" y1="20" x2="80" y2="20" stroke="#4f46e5" strokeWidth="2" />
                <line x1="20" y1="28" x2="80" y2="28" stroke="#4f46e5" strokeWidth="2" />
                <circle cx="70" cy="20" r="2" fill="#10b981" />
              </svg>
            )}
          </div>
        );
      case 'toner':
        return (
          <div className="flex flex-col items-center justify-center text-teal-600">
            <Printer className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="25" y="8" width="50" height="24" rx="2" fill="#0d9488" stroke="#0ea5e9" strokeWidth="1" />
                <rect x="35" y="24" width="30" height="12" fill="#cbd5e1" />
                <line x1="40" y1="30" x2="60" y2="30" stroke="#475569" strokeWidth="1.5" />
              </svg>
            )}
          </div>
        );
      case 'consumables':
      default:
        return (
          <div className="flex flex-col items-center justify-center text-amber-600">
            <BatteryCharging className={`${iconSize} stroke-[${strokeWidth}] drop-shadow-md`} />
            {isLarge && (
              <svg viewBox="0 0 100 40" className="w-24 h-10 mt-2 opacity-80" fill="none">
                <rect x="20" y="12" width="55" height="16" rx="2" fill="#78350f" />
                <rect x="75" y="16" width="5" height="8" rx="1" fill="#f59e0b" />
                <rect x="25" y="15" width="10" height="10" fill="#10b981" />
                <rect x="38" y="15" width="10" height="10" fill="#10b981" />
                <rect x="51" y="15" width="10" height="10" fill="#f59e0b" />
              </svg>
            )}
          </div>
        );
    }
  };

  const bgGradient = () => {
    switch (category) {
      case 'connectivity': return 'from-blue-50/50 to-indigo-100/30';
      case 'storage': return 'from-emerald-50/50 to-teal-100/30';
      case 'peripherals': return 'from-amber-50/50 to-orange-100/30';
      case 'electronics': return 'from-rose-50/50 to-pink-100/30';
      case 'tools': return 'from-slate-50/50 to-slate-200/30';
      case 'organization': return 'from-indigo-50/50 to-violet-100/30';
      case 'toner': return 'from-teal-50/50 to-sky-100/30';
      case 'consumables':
      default:
        return 'from-amber-50/50 to-yellow-100/30';
    }
  };

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${bgGradient()} p-3 select-none`}>
      {renderGraphic()}
      {!isLarge && (
        <span className="text-[7px] font-black text-slate-400 mt-1 uppercase tracking-widest block">MOCKUP</span>
      )}
    </div>
  );
}
