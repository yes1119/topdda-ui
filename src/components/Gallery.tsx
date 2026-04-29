import { useState } from "react";
import type { IotMessage } from "../types";
import { CLASS_META } from "../types";

interface Props {
  feed: IotMessage[];
}

const SAMPLE_IMAGES = [
  '/ens/2026-04-28T01:35:49.060906+00:00_real_excavator_t588.jpg',
  '/ens/2026-04-28T01:35:49.273995+00:00_real_excavator_t586.jpg',
  '/ens/2026-04-28T01:36:09.474903+00:00_real_excavator_t589.jpg',
  '/ens/2026-04-28T01:36:19.249631+00:00_real_excavator_t592.jpg',
  '/ens/2026-04-28T01:36:22.854487+00:00_real_excavator_t596.jpg',
  '/ens/2026-04-28T01:36:27.151112+00:00_real_excavator_t598.jpg',
  '/ens/2026-04-28T01:36:39.660137+00:00_real_excavator_t600.jpg',
  '/ens/2026-04-28T01:36:45.581591+00:00_real_excavator_t604.jpg',
  '/ens/2026-04-28T01:36:47.958232+00:00_real_excavator_t608.jpg',
  '/ens/2026-04-28T01:36:48.164644+00:00_real_excavator_t607.jpg',
  '/ens/2026-04-28T04:12:20.344767+00:00_real_excavator_t614.jpg',
  '/ens/2026-04-28T04:14:22.054972+00:00_real_excavator_t630.jpg',
  '/ens/2026-04-28T04:14:54.370227+00:00_real_excavator_t636.jpg',
  '/ens/2026-04-28T04:14:56.369736+00:00_real_excavator_t639.jpg',
  '/ens/2026-04-28T04:14:57.961653+00:00_real_excavator_t640.jpg',
  '/ens/2026-04-28T04:49:13.958346+00:00_real_excavator_t644.jpg',
  '/ens/2026-04-28T04:51:15.651010+00:00_real_excavator_t660.jpg',
  '/ens/2026-04-28T04:51:47.977917+00:00_real_excavator_t666.jpg',
  '/ens/2026-04-28T04:51:49.966308+00:00_real_excavator_t669.jpg',
  '/ens/2026-04-28T04:51:51.574361+00:00_real_excavator_t670.jpg',
  '/ens/2026-04-28T04:52:33.091499+00:00_real_excavator_t677.jpg',
  '/ens/2026-04-28T04:52:37.400686+00:00_real_excavator_t680.jpg',
  '/ens/2026-04-28T04:53:21.488903+00:00_real_excavator_t692.jpg',
  '/ens/2026-04-28T04:53:41.092773+00:00_real_excavator_t698.jpg',
  '/ens/2026-04-28T04:54:04.998414+00:00_real_excavator_t701.jpg',
  '/ens/2026-04-28T04:54:05.692621+00:00_real_excavator_t702.jpg',
  '/ens/2026-04-28T04:54:12.493098+00:00_real_excavator_t705.jpg',
  '/ens/2026-04-28T04:54:19.993428+00:00_real_excavator_t712.jpg',
  '/ens/2026-04-28T04:54:22.674029+00:00_real_excavator_t713.jpg',
  '/ens/2026-04-28T04:54:54.090604+00:00_real_excavator_t718.jpg',
  '/ens/2026-04-28T04:55:02.591728+00:00_real_excavator_t724.jpg',
  '/ens/2026-04-28T04:55:04.700901+00:00_real_excavator_t725.jpg',
  '/ens/2026-04-28T04:55:18.306506+00:00_real_excavator_t727.jpg',
  '/ens/2026-04-28T04:55:24.902416+00:00_real_excavator_t728.jpg',
  '/ens/2026-04-28T04:55:27.491958+00:00_real_excavator_t732.jpg',
  '/ens/2026-04-28T04:55:29.802783+00:00_real_excavator_t731.jpg',
  '/ens/2026-04-28T04:55:38.300214+00:00_real_excavator_t733.jpg',
  '/ens/2026-04-28T04:55:43.200857+00:00_real_excavator_t735.jpg',
  '/ens/2026-04-28T04:55:51.193250+00:00_real_excavator_t736.jpg',
  '/ens/2026-04-28T04:56:20.489841+00:00_real_excavator_t745.jpg',
  '/ens/2026-04-28T04:56:21.191119+00:00_real_excavator_t746.jpg',
  '/ens/2026-04-28T04:56:30.604430+00:00_real_excavator_t749.jpg',
  '/ens/2026-04-28T04:56:34.593477+00:00_real_excavator_t751.jpg',
  '/ens/2026-04-28T04:56:37.094879+00:00_real_excavator_t752.jpg',
  '/ens/2026-04-28T04:56:39.406966+00:00_real_excavator_t753.jpg',
  '/ens/2026-04-28T04:56:40.690672+00:00_real_excavator_t754.jpg',
  '/ens/2026-04-28T04:56:43.191691+00:00_real_excavator_t755.jpg',
  '/ens/2026-04-28T04:56:44.094851+00:00_real_excavator_t756.jpg',
  '/ens/2026-04-28T04:56:51.294494+00:00_real_excavator_t758.jpg',
  '/ens/2026-04-28T04:57:24.796873+00:00_real_excavator_t772.jpg',
  '/ens/2026-04-28T04:57:28.917209+00:00_real_excavator_t776.jpg',
  '/ens/2026-04-28T04:57:34.997964+00:00_real_excavator_t777.jpg',
  '/ens/2026-04-28T04:57:47.589818+00:00_real_excavator_t781.jpg',
  '/ens/2026-04-28T04:57:51.898720+00:00_real_excavator_t789.jpg',
  '/ens/2026-04-28T04:57:52.914234+00:00_real_excavator_t791.jpg',
  '/ens/2026-04-28T04:57:53.992818+00:00_real_excavator_t792.jpg',
  '/ens/2026-04-28T04:57:54.802764+00:00_real_excavator_t793.jpg',
  '/ens/2026-04-28T04:57:56.691118+00:00_real_excavator_t794.jpg',
  '/ens/2026-04-28T04:58:03.898569+00:00_real_excavator_t796.jpg',
  '/ens/2026-04-28T04:58:22.201263+00:00_real_excavator_t802.jpg',
  '/ens/2026-04-28T04:58:24.197669+00:00_real_excavator_t805.jpg',
  '/ens/2026-04-28T04:58:29.494841+00:00_real_excavator_t807.jpg',
  '/ens/2026-04-28T04:58:30.893439+00:00_real_excavator_t808.jpg',
  '/ens/2026-04-28T04:58:31.900238+00:00_real_excavator_t810.jpg',
  '/ens/2026-04-28T04:58:34.794757+00:00_real_excavator_t812.jpg',
  '/ens/2026-04-28T04:58:45.596083+00:00_real_excavator_t817.jpg',
  '/ens/2026-04-28T04:58:51.499162+00:00_real_excavator_t819.jpg',
  '/ens/2026-04-28T04:59:04.302784+00:00_real_excavator_t826.jpg',
  '/ens/2026-04-28T04:59:17.493875+00:00_real_excavator_t834.jpg',
  '/ens/2026-04-28T04:59:18.874786+00:00_real_excavator_t833.jpg',
  '/ens/2026-04-28T04:59:18.990399+00:00_real_excavator_t832.jpg',
  '/ens/2026-04-28T04:59:40.091073+00:00_real_excavator_t843.jpg',
  '/ens/2026-04-28T04:59:41.849344+00:00_real_excavator_t844.jpg',
  '/ens/2026-04-28T04:59:55.725993+00:00_real_excavator_t845.jpg',
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
          <option value="all">전체 차량</option>
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
                        ["차량", selected.DEVICE_ID],
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
