import { User2 } from "lucide-react";

export default function UserChip({ name, email, showEmail = true, className = "" }) {
  const displayName = name || "Usuario";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] flex items-center justify-center text-white">
        <User2 size={18} />
      </div>
      <div className="text-sm">
        <div className="font-semibold text-white truncate max-w-[180px]">
          {displayName}
        </div>
        {showEmail && email ? (
          <div className="text-gray-400 truncate max-w-[180px]">{email}</div>
        ) : null}
      </div>
    </div>
  );
}
