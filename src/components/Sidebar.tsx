import { LayoutDashboard, Map, Image, Cpu } from "lucide-react";
import type { Device } from "../types";

type Page = "dashboard" | "detail" | "gallery" | "devices";

interface Props {
  devices: Device[];
  currentPage: Page;
  selectedDevice: string | null;
  onNavigate: (page: Page, deviceId?: string) => void;
}

const statusDot: Record<string, string> = {
  online:   "bg-green-400",
  offline:  "bg-red-400",
  detected: "bg-blue-400",
};

export default function Sidebar({ devices, currentPage, selectedDevice, onNavigate }: Props) {
  return (
    <aside className="w-56 bg-gray-900 text-gray-200 flex flex-col h-full shrink-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white tracking-wide">TOPDDA</h1>
        <p className="text-xs text-gray-400 mt-0.5">Edge Monitoring</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "dashboard" ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
        >
          <LayoutDashboard size={16} /> 대시보드
        </button>
        <button
          onClick={() => onNavigate("gallery")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "gallery" ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
        >
          <Image size={16} /> 검출 갤러리
        </button>
        <button
          onClick={() => onNavigate("devices")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "devices" ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
        >
          <Cpu size={16} /> 디바이스 관리
        </button>

        <div className="pt-4 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">차량 목록</div>
        {devices.map((d) => (
          <button
            key={d.id}
            onClick={() => onNavigate("detail", d.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "detail" && selectedDevice === d.id ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[d.status]}`} />
            <span className="truncate">{d.id}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        {devices.filter((d) => d.status !== "offline").length}/{devices.length} 온라인
      </div>
    </aside>
  );
}
