import { LayoutDashboard, Cpu, BarChart2, Inbox, MonitorPlay } from "lucide-react";
import type { Device } from "../types";

type Page = "dashboard" | "live" | "devices" | "report" | "inbox";

interface Props {
  devices: Device[];
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ devices, currentPage, onNavigate }: Props) {
  return (
    <aside className="w-56 bg-gray-900 text-gray-200 flex flex-col h-full shrink-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white tracking-wide">EXCAVATOR</h1>
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
          onClick={() => onNavigate("live")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "live" ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
        >
          <MonitorPlay size={16} /> 실시간 View
        </button>
        <button
          onClick={() => onNavigate("devices")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "devices" ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
        >
          <Cpu size={16} /> 차량 관리
        </button>
        <button
          onClick={() => onNavigate("inbox")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "inbox" ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
        >
          <Inbox size={16} /> 탐지 이력 관리
        </button>
        <button
          onClick={() => onNavigate("report")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${currentPage === "report" ? "bg-blue-600 text-white" : "hover:bg-gray-700"}`}
        >
          <BarChart2 size={16} /> 리포트
        </button>
      </nav>

      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        {devices.filter((d) => d.status !== "offline").length}/{devices.length} 온라인
      </div>
    </aside>
  );
}
