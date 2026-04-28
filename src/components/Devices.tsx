import type { Device } from "../types";

interface Props {
  devices: Device[];
  onSelectDevice: (id: string) => void;
}

const statusLabel: Record<string, string> = { online: "운행중", offline: "오프라인", detected: "검출 발생" };
const statusColor: Record<string, string> = { online: "text-green-400", offline: "text-red-400", detected: "text-blue-400" };
const fixLabel: Record<string, string> = { "4": "Fix", "5": "Float", "0": "No Fix" };
const fixColor: Record<string, string> = { "4": "text-green-400", "5": "text-yellow-400", "0": "text-red-400" };

export default function Devices({ devices, onSelectDevice }: Props) {
  return (
    <div className="p-4 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-white font-semibold text-lg">차량 관리</h2>
        <span className="text-sm text-gray-400">{devices.filter((d) => d.status !== "offline").length}/{devices.length} 온라인</span>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-1">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/60">
            <tr>
              {["차량 ID", "IP", "상태", "마지막 수신", "오늘 검출", "GPS", "속도", "버전", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {devices.map((d) => (
              <tr key={d.id} className="hover:bg-gray-700/40">
                <td className="px-4 py-3 font-medium text-white">{d.id}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{d.ip}</td>
                <td className={`px-4 py-3 font-medium ${statusColor[d.status]}`}>{statusLabel[d.status]}</td>
                <td className="px-4 py-3 text-gray-400">{d.lastSeen}</td>
                <td className="px-4 py-3 text-gray-300">{d.todayDetections}건</td>
                <td className={`px-4 py-3 font-medium ${fixColor[d.fixStatus]}`}>{fixLabel[d.fixStatus]}</td>
                <td className="px-4 py-3 text-gray-400">{d.speed.toFixed(1)} km/h</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{d.version}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectDevice(d.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    상세 보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
