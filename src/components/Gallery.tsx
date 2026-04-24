import { useState } from "react";
import type { IotMessage } from "../types";
import { CLASS_META } from "../types";

interface Props {
  feed: IotMessage[];
}

const SAMPLE_IMAGES = [
  "https://picsum.photos/seed/g1/320/240",
  "https://picsum.photos/seed/g2/320/240",
  "https://picsum.photos/seed/g3/320/240",
  "https://picsum.photos/seed/g4/320/240",
  "https://picsum.photos/seed/g5/320/240",
  "https://picsum.photos/seed/g6/320/240",
];

function formatTs(tsStr: string) {
  if (tsStr.length >= 14)
    return `${tsStr.slice(0,4)}-${tsStr.slice(4,6)}-${tsStr.slice(6,8)} ${tsStr.slice(8,10)}:${tsStr.slice(10,12)}:${tsStr.slice(12,14)}`;
  return tsStr;
}

export default function Gallery({ feed }: Props) {
  const [filterDevice, setFilterDevice] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [selected, setSelected] = useState<IotMessage | null>(null);

  const devices = [...new Set(feed.map((f) => f.DEVICE_ID))];
  const classes = Object.keys(CLASS_META);

  const filtered = feed.filter((f) => {
    const cls = f.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
    return (filterDevice === "all" || f.DEVICE_ID === filterDevice)
      && (filterClass === "all" || cls === filterClass);
  });

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* 필터 바 */}
      <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3 shrink-0 border border-gray-700">
        <select
          value={filterDevice}
          onChange={(e) => setFilterDevice(e.target.value)}
          className="bg-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-600"
        >
          <option value="all">전체 디바이스</option>
          {devices.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="bg-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-600"
        >
          <option value="all">전체 클래스</option>
          {classes.map((c) => <option key={c} value={c}>{CLASS_META[c].label}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length}건</span>
      </div>

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {filtered.map((msg, i) => {
            const cls = msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
            const meta = CLASS_META[cls];
            const prob = msg.OBJECT_LIST?.[0]?.OBJECT_PRBL ?? 0;
            return (
              <div
                key={i}
                onClick={() => setSelected(msg)}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors"
              >
                <div className="relative">
                  <img src={SAMPLE_IMAGES[i % SAMPLE_IMAGES.length]} alt="" className="w-full h-36 object-cover" />
                  <span
                    className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: meta?.color + "dd", color: "#fff" }}
                  >
                    {meta?.label ?? cls}
                  </span>
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-300 truncate">{msg.DEVICE_ID}</p>
                  <p className="text-xs text-gray-500">{formatTs(msg.TIMESTAMP)}</p>
                  <p className="text-xs text-gray-400 mt-1">신뢰도 {(prob * 100).toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-gray-800 rounded-xl overflow-hidden w-[600px] border border-gray-600" onClick={(e) => e.stopPropagation()}>
            <img src={SAMPLE_IMAGES[0]} alt="" className="w-full h-64 object-cover" />
            <div className="p-5">
              {(() => {
                const cls = selected.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
                const meta = CLASS_META[cls];
                const prob = selected.OBJECT_LIST?.[0]?.OBJECT_PRBL ?? 0;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-lg">{meta?.label ?? cls}</span>
                      <span
                        className="text-sm px-3 py-1 rounded-full"
                        style={{ backgroundColor: meta?.color + "33", color: meta?.color }}
                      >
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        ["디바이스", selected.DEVICE_ID],
                        ["시각", formatTs(selected.TIMESTAMP)],
                        ["위도", parseFloat(selected.SENSOR.LAT).toFixed(6)],
                        ["경도", parseFloat(selected.SENSOR.LON).toFixed(6)],
                        ["속도", `${parseFloat(selected.SENSOR.SPEED).toFixed(1)} km/h`],
                        ["방향", `${parseFloat(selected.SENSOR.DIRECTION).toFixed(1)}°`],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-gray-700 rounded px-3 py-2">
                          <p className="text-gray-400 text-xs">{k}</p>
                          <p className="text-gray-100">{v}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelected(null)} className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white rounded py-2 text-sm">닫기</button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
