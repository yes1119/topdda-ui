import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Device, IotMessage } from "../types";
import { CLASS_META } from "../types";
import { VEHICLE_ROUTES } from "../mockData";

interface Props {
  devices: Device[];
  feed: IotMessage[];
  onSelectDevice: (id: string) => void;
}

function formatTs(tsStr: string) {
  if (tsStr.length >= 12) return `${tsStr.slice(8, 10)}:${tsStr.slice(10, 12)}:${tsStr.slice(12, 14)}`;
  return tsStr;
}

// 두 좌표 사이 각도 계산 (북=0, 시계방향)
function bearing(from: [number, number], to: [number, number]): number {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// 차량 SVG 아이콘 생성 (색상 + 회전각도)
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
  return L.divIcon({
    html,
    className: "",
    iconSize: [80, 52],
    iconAnchor: [40, 16],
  });
}

const statusColor: Record<string, string> = {
  online:   "#22c55e",
  offline:  "#9ca3af",
  detected: "#3b82f6",
};

export default function Dashboard({ devices, feed, onSelectDevice }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  // 각 차량의 현재 waypoint 인덱스
  const routeIdxRef = useRef<Record<string, number>>(
    Object.fromEntries(devices.map((d) => [d.id, 0]))
  );
  const [positions, setPositions] = useState<Record<string, [number, number]>>(
    Object.fromEntries(devices.map((d) => [d.id, [d.lat, d.lon]]))
  );
  const [tick, setTick] = useState(0);
  const [isSatellite, setIsSatellite] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const TILES = {
    street:    { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",  attr: "© OpenStreetMap contributors" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
  };

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([37.499, 127.040], 14);
    tileLayerRef.current = L.tileLayer(TILES.street.url, { attribution: TILES.street.attr }).addTo(mapInstance.current);
    setTimeout(() => mapInstance.current?.invalidateSize(), 200);
  }, []);

  // 타일 레이어 전환
  useEffect(() => {
    if (!mapInstance.current || !tileLayerRef.current) return;
    const tile = isSatellite ? TILES.satellite : TILES.street;
    tileLayerRef.current.setUrl(tile.url);
  }, [isSatellite]);

  // 마커 초기 생성
  useEffect(() => {
    if (!mapInstance.current) return;
    devices.forEach((d) => {
      if (d.status === "offline") return;
      if (markersRef.current[d.id]) return;
      const pos = positions[d.id] ?? [d.lat, d.lon];
      const color = statusColor[d.status];
      const marker = L.marker(pos, { icon: makeCarIcon(color, 0, d.id) }).addTo(mapInstance.current!);
      marker.bindPopup(`<b>${d.id}</b><br/>속도: ${d.speed} km/h<br/>오늘 검출: ${d.todayDetections}건`);
      marker.on("click", () => onSelectDevice(d.id));
      markersRef.current[d.id] = marker;
    });
  }, [mapInstance.current]);

  // 2초마다 차량 위치 이동
  useEffect(() => {
    const t = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        devices.forEach((d) => {
          if (d.status === "offline") return;
          const route = VEHICLE_ROUTES[d.id];
          if (!route || route.length < 2) return;
          const idx = routeIdxRef.current[d.id] ?? 0;
          const nextIdx = (idx + 1) % route.length;
          routeIdxRef.current[d.id] = nextIdx;
          next[d.id] = route[nextIdx];
        });
        return next;
      });
      setTick((n) => n + 1);
    }, 2000);
    return () => clearInterval(t);
  }, [devices]);

  // 위치 변경 시 마커 업데이트
  useEffect(() => {
    devices.forEach((d) => {
      const marker = markersRef.current[d.id];
      if (!marker) return;
      const pos = positions[d.id];
      if (!pos) return;

      const prevLatLng = marker.getLatLng();
      const angle = bearing([prevLatLng.lat, prevLatLng.lng], pos);
      const color = statusColor[d.status];

      marker.setLatLng(pos);
      marker.setIcon(makeCarIcon(color, angle, d.id));
    });
  }, [positions]);

  const visibleFeed = feed.slice(0, 8 + (tick % 4));
  const totalDetections = devices.reduce((s, d) => s + d.todayDetections, 0);
  const onlineCount = devices.filter((d) => d.status !== "offline").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 16, gap: 12 }}>
      {/* KPI 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, flexShrink: 0 }}>
        {[
          { label: "전체 디바이스",  value: `${onlineCount} / ${devices.length}`, sub: "온라인",     border: "#22c55e" },
          { label: "오늘 검출",      value: totalDetections,                       sub: "건",         border: "#3b82f6" },
          { label: "최근 이상 감지", value: feed.filter((f) => CLASS_META[f.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? ""]?.severity === "high").length, sub: "건 (1시간)", border: "#ef4444" },
          { label: "오늘 업로드",    value: totalDetections * 3,                   sub: "이미지",     border: "#a855f7" },
        ].map((c) => (
          <div key={c.label} style={{ background: "#1f2937", borderRadius: 8, padding: "14px 16px", borderLeft: `4px solid ${c.border}` }}>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>{c.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>{c.value}</p>
            <p style={{ fontSize: 11, color: "#6b7280" }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* 지도 + 피드 */}
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        {/* 지도 */}
        <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", border: "1px solid #374151", position: "relative" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          <div style={{ position: "absolute", top: 10, right: 10, zIndex: 999, display: "flex", background: "#1f2937", borderRadius: 6, overflow: "hidden", border: "1px solid #374151" }}>
            <button
              onClick={() => setIsSatellite(false)}
              style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: !isSatellite ? "#3b82f6" : "transparent", color: !isSatellite ? "#fff" : "#9ca3af" }}
            >일반</button>
            <button
              onClick={() => setIsSatellite(true)}
              style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: isSatellite ? "#3b82f6" : "transparent", color: isSatellite ? "#fff" : "#9ca3af" }}
            >위성</button>
          </div>
        </div>

        {/* 검출 피드 */}
        <div style={{ width: 270, background: "#1f2937", borderRadius: 8, border: "1px solid #374151", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #374151", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>실시간 검출 피드</span>
            <span style={{ fontSize: 11, color: "#4ade80" }}>● LIVE</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {visibleFeed.map((msg, i) => {
              const cls = msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
              const meta = CLASS_META[cls];
              const prob = msg.OBJECT_LIST?.[0]?.OBJECT_PRBL ?? 0;
              return (
                <div
                  key={i}
                  onClick={() => onSelectDevice(msg.DEVICE_ID)}
                  style={{ padding: "10px 16px", borderBottom: "1px solid #374151", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 9999, background: (meta?.color ?? "#6b7280") + "33", color: meta?.color ?? "#9ca3af" }}>
                      {meta?.label ?? cls}
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{(prob * 100).toFixed(0)}%</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#d1d5db", marginBottom: 2 }}>{msg.DEVICE_ID}</p>
                  <p style={{ fontSize: 11, color: "#6b7280" }}>{formatTs(msg.TIMESTAMP)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
