import { LayoutDashboard, Cpu, BarChart2, Inbox, MonitorPlay } from "lucide-react";
import type { Device } from "../types";

type Page = "dashboard" | "live" | "devices" | "report" | "inbox";

interface Props {
  devices: Device[];
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const BTN_STYLE = { padding: "20px 12px" };

export default function Sidebar({ devices, currentPage, onNavigate }: Props) {
  function btn(page: Page) {
    return `w-full flex items-center gap-3 rounded text-base ${currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`;
  }

  return (
    <aside className="w-56 bg-gray-900 text-gray-200 flex flex-col h-full shrink-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white tracking-wide">EXCAVATOR</h1>
        <p className="text-xs text-gray-400 mt-0.5">Edge Monitoring</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <button onClick={() => onNavigate("dashboard")} style={BTN_STYLE} className={btn("dashboard")}>
          <LayoutDashboard size={18} /> 대시보드
        </button>
        <button onClick={() => onNavigate("live")} style={BTN_STYLE} className={btn("live")}>
          <MonitorPlay size={18} /> 실시간 View
        </button>
        <button onClick={() => onNavigate("inbox")} style={BTN_STYLE} className={btn("inbox")}>
          <Inbox size={18} /> 탐지 이력 관리
        </button>
        <button onClick={() => onNavigate("devices")} style={BTN_STYLE} className={btn("devices")}>
          <Cpu size={18} /> 차량 관리
        </button>
        <button onClick={() => onNavigate("report")} style={BTN_STYLE} className={btn("report")}>
          <BarChart2 size={18} /> 리포트
        </button>
      </nav>

      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        {devices.filter((d) => d.status !== "offline").length}/{devices.length} 온라인
      </div>
    </aside>
  );
}
