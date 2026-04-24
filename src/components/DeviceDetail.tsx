import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Device, IotMessage } from "../types";
import { CLASS_META } from "../types";
import { VEHICLE_ROUTES } from "../mockData";

interface Props {
  device: Device;
  path: [number, number][];
  history: IotMessage[];
}

const SAMPLE_IMAGES = [
  "https://picsum.photos/seed/cam1/640/480",
  "https://picsum.photos/seed/cam2/640/480",
  "https://picsum.photos/seed/cam3/640/480",
  "https://picsum.photos/seed/cam4/640/480",
  "https://picsum.photos/seed/cam5/640/480",
];

function formatTs(tsStr: string) {
  if (tsStr.length >= 14)
    return `${tsStr.slice(0,4)}-${tsStr.slice(4,6)}-${tsStr.slice(6,8)} ${tsStr.slice(8,10)}:${tsStr.slice(10,12)}:${tsStr.slice(12,14)}`;
  return tsStr;
}

function bearing(from: [number, number], to: [number, number]): number {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function makeCarIcon(color: string, angle: number, label: string) {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <g transform="rotate(${angle}, 16, 16)">
          <ellipse cx="16" cy="16" rx="8" ry="12" fill="${color}" stroke="white" stroke-width="2"/>
          <polygon points="16,4 12,10 20,10" fill="white" opacity="0.9"/>
          <rect x="10" y="20" width="4" height="3" rx="1" fill="white" opacity="0.7"/>
          <rect x="18" y="20" width="4" height="3" rx="1" fill="white" opacity="0.7"/>
          <rect x="10" y="9" width="4" height="3" rx="1" fill="white" opacity="0.7"/>
          <rect x="18" y="9" width="4" height="3" rx="1" fill="white" opacity="0.7"/>
        </g>
      </svg>
      <div style="background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;white-space:nowrap;border:1px solid ${color}">${label}</div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [80, 52], iconAnchor: [40, 16] });
}

function BboxCanvas({ region, width, height, label }: {
  region: [number, number, number, number]; width: number; height: number; label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const [xmin, ymin, xmax, ymax] = region;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(xmin * width, ymin * height, (xmax - xmin) * width, (ymax - ymin) * height);
    const textW = ctx.measureText(label).width + 10;
    ctx.fillStyle = "#ef4444dd";
    ctx.fillRect(xmin * width, ymin * height - 20, textW, 20);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(label, xmin * width + 5, ymin * height - 5);
  }, [region, width, height, label]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
}

export default function DeviceDetail({ device, path, history }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const routeIdxRef = useRef(0);

  const [carPos, setCarPos] = useState<[number, number]>([device.lat, device.lon]);
  const [imgIdx, setImgIdx] = useState(0);
  const [currentMsg, setCurrentMsg] = useState<IotMessage | null>(history[0] ?? null);
  const [isSatellite, setIsSatellite] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const TILES = {
    street:    { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",  attr: "© OpenStreetMap contributors" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
  };

  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tile = isSatellite ? TILES.satellite : TILES.street;
    tileLayerRef.current.setUrl(tile.url);
  }, [isSatellite]);

  // 이미지 폴링 (1.5초)
  useEffect(() => {
    const t = setInterval(() => {
      setImgIdx((i) => (i + 1) % SAMPLE_IMAGES.length);
      setCurrentMsg((prev) => {
        const idx = history.findIndex((h) => h === prev);
        return history[(idx + 1) % history.length] ?? prev;
      });
    }, 1500);
    return () => clearInterval(t);
  }, [history]);

  // 차량 위치 이동 (2초)
  useEffect(() => {
    const route = VEHICLE_ROUTES[device.id];
    if (!route || route.length < 2) return;
    const t = setInterval(() => {
      routeIdxRef.current = (routeIdxRef.current + 1) % route.length;
      setCarPos(route[routeIdxRef.current]);
    }, 2000);
    return () => clearInterval(t);
  }, [device.id]);

  // device.id 바뀔 때마다 지도 완전 재생성
  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 지도 destroy
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
      carMarkerRef.current = null;
    }

    routeIdxRef.current = 0;
    setCarPos([device.lat, device.lon]);

    mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([device.lat, device.lon], 15);
    tileLayerRef.current = L.tileLayer(TILES.street.url, { attribution: TILES.street.attr }).addTo(mapInstance.current);
    setTimeout(() => mapInstance.current?.invalidateSize(), 100);

    // 주행 경로 폴리라인
    L.polyline(path, { color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "6 4" }).addTo(mapInstance.current);

    // 검출 지점 핀
    history.forEach((msg) => {
      const lat = parseFloat(msg.SENSOR.LAT);
      const lon = parseFloat(msg.SENSOR.LON);
      if (!lat || !lon) return;
      const cls = msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
      const color = CLASS_META[cls]?.color ?? "#6b7280";
      L.circleMarker([lat, lon], { radius: 6, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9 })
        .bindPopup(`<b>${CLASS_META[cls]?.label ?? cls}</b><br/>${formatTs(msg.TIMESTAMP)}`)
        .addTo(mapInstance.current!);
    });

    // 차량 마커 생성
    carMarkerRef.current = L.marker([device.lat, device.lon], {
      icon: makeCarIcon("#22c55e", 0, device.id),
    }).addTo(mapInstance.current);
    carMarkerRef.current.bindPopup(`<b>${device.id}</b>`);
  }, [device.id]);

  // carPos 변경 시 마커 이동 + 아이콘 회전
  useEffect(() => {
    const marker = carMarkerRef.current;
    if (!marker) return;
    const prev = marker.getLatLng();
    const angle = bearing([prev.lat, prev.lng], carPos);
    marker.setLatLng(carPos);
    marker.setIcon(makeCarIcon("#22c55e", angle, device.id));
    // 지도 중심 부드럽게 따라가기
    mapInstance.current?.panTo(carPos, { animate: true, duration: 1.5 });
  }, [carPos]);

  const fixLabel = device.fixStatus === "4" ? "Fix" : device.fixStatus === "5" ? "Float" : "No Fix";
  const fixColor = device.fixStatus === "4" ? "#4ade80" : device.fixStatus === "5" ? "#facc15" : "#f87171";
  const region = currentMsg?.OBJECT_LIST?.[0]?.OBJECT_REGION;
  const clsLabel = CLASS_META[currentMsg?.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? ""]?.label ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 16, gap: 12 }}>
      {/* 상단 정보 바 */}
      <div style={{ background: "#1f2937", borderRadius: 8, padding: "10px 20px", display: "flex", alignItems: "center", gap: 24, flexShrink: 0, border: "1px solid #374151" }}>
        <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{device.id}</span>
        <span style={{ color: device.status === "offline" ? "#f87171" : "#4ade80", fontWeight: 600, fontSize: 13 }}>
          {device.status === "offline" ? "오프라인" : "운행중"}
        </span>
        <span style={{ color: "#d1d5db", fontSize: 13 }}>속도 <b>{device.speed.toFixed(1)}</b> km/h</span>
        <span style={{ color: fixColor, fontSize: 13 }}>GPS <b>{fixLabel}</b></span>
        <span style={{ color: "#9ca3af", fontSize: 13 }}>마지막 수신 <b style={{ color: "#e5e7eb" }}>{device.lastSeen}</b></span>
        <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 13 }}>오늘 검출 <b style={{ color: "#fff" }}>{device.todayDetections}건</b></span>
      </div>

      {/* 지도 + 영상 */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0, height: 320 }}>
        {/* 경로 지도 */}
        <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", border: "1px solid #374151", position: "relative" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          <div style={{ position: "absolute", top: 10, right: 10, zIndex: 999, display: "flex", background: "#1f2937", borderRadius: 6, overflow: "hidden", border: "1px solid #374151" }}>
            <button onClick={() => setIsSatellite(false)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: !isSatellite ? "#3b82f6" : "transparent", color: !isSatellite ? "#fff" : "#9ca3af" }}>일반</button>
            <button onClick={() => setIsSatellite(true)}  style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: isSatellite  ? "#3b82f6" : "transparent", color: isSatellite  ? "#fff" : "#9ca3af" }}>위성</button>
          </div>
        </div>

        {/* 실시간 영상 */}
        <div style={{ width: 380, borderRadius: 8, overflow: "hidden", border: "1px solid #374151", background: "#000", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "8px 12px", background: "#1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>실시간 영상</span>
            <span style={{ fontSize: 11, color: "#4ade80" }}>● LIVE</span>
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <img src={SAMPLE_IMAGES[imgIdx]} alt="live" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {region && <BboxCanvas region={region} width={380} height={272} label={clsLabel} />}
            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 4 }}>
              {currentMsg ? formatTs(currentMsg.TIMESTAMP) : "--"}
            </div>
            {currentMsg?.OBJECT_LIST?.[0] && (
              <div style={{ position: "absolute", bottom: 8, left: 8 }}>
                <span style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 9999, fontWeight: 600,
                  background: (CLASS_META[currentMsg.OBJECT_LIST[0].OBJECT_TYPE]?.color ?? "#6b7280") + "44",
                  color: CLASS_META[currentMsg.OBJECT_LIST[0].OBJECT_TYPE]?.color ?? "#fff",
                  border: `1px solid ${CLASS_META[currentMsg.OBJECT_LIST[0].OBJECT_TYPE]?.color ?? "#6b7280"}`,
                }}>
                  {clsLabel} {(currentMsg.OBJECT_LIST[0].OBJECT_PRBL * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 검출 이력 */}
      <div style={{ flex: 1, background: "#1f2937", borderRadius: 8, border: "1px solid #374151", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #374151", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>검출 이력</span>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(55,65,81,0.5)", position: "sticky", top: 0 }}>
                {["시각", "클래스", "신뢰도", "위도", "경도", "속도"].map((h) => (
                  <th key={h} style={{ padding: "8px 16px", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((msg, i) => {
                const cls = msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
                const meta = CLASS_META[cls];
                const prob = msg.OBJECT_LIST?.[0]?.OBJECT_PRBL ?? 0;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #374151" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(55,65,81,0.4)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "8px 16px", color: "#d1d5db" }}>{formatTs(msg.TIMESTAMP)}</td>
                    <td style={{ padding: "8px 16px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 9999, background: (meta?.color ?? "#6b7280") + "33", color: meta?.color ?? "#9ca3af", fontSize: 11 }}>
                        {meta?.label ?? cls}
                      </span>
                    </td>
                    <td style={{ padding: "8px 16px", color: "#d1d5db" }}>{(prob * 100).toFixed(1)}%</td>
                    <td style={{ padding: "8px 16px", color: "#9ca3af" }}>{parseFloat(msg.SENSOR.LAT).toFixed(5)}</td>
                    <td style={{ padding: "8px 16px", color: "#9ca3af" }}>{parseFloat(msg.SENSOR.LON).toFixed(5)}</td>
                    <td style={{ padding: "8px 16px", color: "#9ca3af" }}>{parseFloat(msg.SENSOR.SPEED).toFixed(1)} km/h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
