import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Device, IotMessage } from "../types";
import { CLASS_META } from "../types";
import { VEHICLE_ROUTES } from "../mockData";

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
];

interface Props {
  devices: Device[];
  device: Device;
  selectedId: string;
  onSelectDevice: (id: string) => void;
  history: IotMessage[];
}


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
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48" style="transform:rotate(${angle}deg);filter:drop-shadow(0 0 4px ${color})">
        <rect x="5" y="4" width="22" height="40" rx="7" fill="${color}" stroke="white" stroke-width="1.5"/>
        <rect x="8" y="2" width="16" height="5" rx="3" fill="${color}" stroke="white" stroke-width="1"/>
        <rect x="8" y="41" width="16" height="5" rx="3" fill="${color}" stroke="white" stroke-width="1"/>
        <rect x="8" y="10" width="16" height="8" rx="2" fill="white" opacity="0.85"/>
        <rect x="8" y="30" width="16" height="7" rx="2" fill="white" opacity="0.6"/>
        <rect x="9" y="19" width="14" height="9" rx="1" fill="${color}" stroke="white" stroke-width="0.5" opacity="0.7"/>
        <rect x="1" y="12" width="4" height="3" rx="1.5" fill="${color}" stroke="white" stroke-width="1"/>
        <rect x="27" y="12" width="4" height="3" rx="1.5" fill="${color}" stroke="white" stroke-width="1"/>
      </svg>
      <div style="background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;white-space:nowrap;border:1px solid ${color}">${label}</div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [80, 68], iconAnchor: [40, 24] });
}


interface DetectionPopup {
  msg: IotMessage;
  imgSrc: string;
  anchorX: number;
  anchorY: number;
}

export default function DeviceDetail({ devices, device, selectedId, onSelectDevice, history }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const routeIdxRef = useRef(0);

  const [carPos, setCarPos] = useState<[number, number]>([device.lat, device.lon]);
  const [isSatellite, setIsSatellite] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 플로팅 영상 패널 상태
  const [vidPos, setVidPos] = useState({ x: 16, y: 16 });
  const [vidSize, setVidSize] = useState({ w: 360, h: 240 });
  const [vidVisible, setVidVisible] = useState(true);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; ow: number; oh: number } | null>(null);

  // 탐지 팝업 패널 상태
  const [detPopup, setDetPopupState] = useState<DetectionPopup | null>(null);
  const [detPos, setDetPos] = useState({ x: 0, y: 0 });
  const [detSize, setDetSize] = useState({ w: 280, h: 300 });
  const detDragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const detResizeRef = useRef<{ startX: number; startY: number; ow: number; oh: number } | null>(null);
  const selectedMarkerRef = useRef<{ marker: L.CircleMarker; color: string } | null>(null);

  function setDetPopup(p: DetectionPopup | null) {
    if (p === null) { setDetPopupState(null); return; }
    const w = detSize.w;
    const h = detSize.h;
    const TAIL = 10; // 꼭지 높이
    const mapW = mapRef.current?.clientWidth ?? 800;
    const mapH = mapRef.current?.clientHeight ?? 600;
    // 기본: 마커 바로 위 중앙
    let x = p.anchorX - w / 2;
    let y = p.anchorY - h - TAIL;
    // 좌우 clamp
    x = Math.max(4, Math.min(x, mapW - w - 4));
    // 위로 잘리면 마커 아래쪽에 표시 (꼭지는 위쪽)
    if (y < 4) y = p.anchorY + TAIL + 4;
    // 아래로 잘리면 다시 위로
    y = Math.min(y, mapH - h - 4);
    setDetPos({ x, y });
    setDetPopupState(p);
  }

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: vidPos.x, oy: vidPos.y };
    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return;
      setVidPos({ x: dragRef.current.ox + ev.clientX - dragRef.current.startX, y: dragRef.current.oy + ev.clientY - dragRef.current.startY });
    }
    function onUp() { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, ow: vidSize.w, oh: vidSize.h };
    function onMove(ev: MouseEvent) {
      if (!resizeRef.current) return;
      setVidSize({
        w: Math.max(240, resizeRef.current.ow + ev.clientX - resizeRef.current.startX),
        h: Math.max(160, resizeRef.current.oh + ev.clientY - resizeRef.current.startY),
      });
    }
    function onUp() { resizeRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onDetDragStart(e: React.MouseEvent) {
    e.preventDefault();
    detDragRef.current = { startX: e.clientX, startY: e.clientY, ox: detPos.x, oy: detPos.y };
    function onMove(ev: MouseEvent) {
      if (!detDragRef.current) return;
      setDetPos({ x: detDragRef.current.ox + ev.clientX - detDragRef.current.startX, y: detDragRef.current.oy + ev.clientY - detDragRef.current.startY });
    }
    function onUp() { detDragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onDetResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    detResizeRef.current = { startX: e.clientX, startY: e.clientY, ow: detSize.w, oh: detSize.h };
    function onMove(ev: MouseEvent) {
      if (!detResizeRef.current) return;
      setDetSize({
        w: Math.max(200, detResizeRef.current.ow + ev.clientX - detResizeRef.current.startX),
        h: Math.max(200, detResizeRef.current.oh + ev.clientY - detResizeRef.current.startY),
      });
    }
    function onUp() { detResizeRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const TILES = {
    street:    { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",  attr: "© OpenStreetMap contributors" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
  };

  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tile = isSatellite ? TILES.satellite : TILES.street;
    tileLayerRef.current.setUrl(tile.url);
  }, [isSatellite]);


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
    setTimeout(() => mapInstance.current?.invalidateSize(), 300);

    // 검출 지점 핀
    history.forEach((msg, i) => {
      const lat = parseFloat(msg.SENSOR.LAT);
      const lon = parseFloat(msg.SENSOR.LON);
      if (!lat || !lon) return;
      const cls = msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
      const color = CLASS_META[cls]?.color ?? "#6b7280";
      const imgSrc = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length];
      const marker = L.circleMarker([lat, lon], { radius: 6, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9 });
      marker.on("click", () => {
        // 이전 선택 마커 원래대로
        if (selectedMarkerRef.current) {
          const { marker: prev, color: prevColor } = selectedMarkerRef.current;
          prev.setStyle({ radius: 6, fillColor: prevColor, color: "#fff", weight: 2, fillOpacity: 0.9 });
        }
        // 클릭한 마커 강조
        marker.setStyle({ radius: 12, fillColor: color, color: "#fff", weight: 3, fillOpacity: 1 });
        selectedMarkerRef.current = { marker, color };
        // 마커 픽셀 좌표 계산 (지도 컨테이너 기준)
        const px = mapInstance.current!.latLngToContainerPoint([lat, lon]);
        setDetPopup({ msg, imgSrc, anchorX: px.x, anchorY: px.y });
      });
      marker.addTo(mapInstance.current!);
    });

    // 차량 마커 생성
    carMarkerRef.current = L.marker([device.lat, device.lon], {
      icon: makeCarIcon("#3b82f6", 0, device.id),
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
    marker.setIcon(makeCarIcon("#3b82f6", angle, device.id));
    // 지도 중심 부드럽게 따라가기
    mapInstance.current?.panTo(carPos, { animate: true, duration: 1.5 });
  }, [carPos]);

  const fixLabel = device.fixStatus === "4" ? "Fix" : device.fixStatus === "5" ? "Float" : "No Fix";
  const fixColor = device.fixStatus === "4" ? "#4ade80" : device.fixStatus === "5" ? "#facc15" : "#f87171";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 16, gap: 12 }}>
      {/* 상단 정보 바 */}
      <div style={{ background: "#1f2937", borderRadius: 8, padding: "10px 20px", display: "flex", alignItems: "center", gap: 20, flexShrink: 0, border: "1px solid #374151" }}>
        {/* 차량 선택 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderRight: "1px solid #374151", paddingRight: 20 }}>
          <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>차량 선택</span>
          <div style={{ display: "flex", gap: 6 }}>
            {devices.map((d) => {
              const isSelected = d.id === selectedId;
              const dotColor = d.status === "offline" ? "#f87171" : "#3b82f6";
              return (
                <button
                  key={d.id}
                  onClick={() => onSelectDevice(d.id)}
                  style={{
                    padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: isSelected ? "#3b82f6" : "#374151",
                    color: isSelected ? "#fff" : "#9ca3af",
                    border: `1px solid ${isSelected ? "#3b82f6" : "#4b5563"}`,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
                  {d.id}
                </button>
              );
            })}
          </div>
        </div>
        {/* 현재 차량 정보 */}
        <span style={{ color: device.status === "offline" ? "#f87171" : "#3b82f6", fontWeight: 600, fontSize: 13 }}>
          {device.status === "offline" ? "오프라인" : "운행중"}
        </span>
        <span style={{ color: "#d1d5db", fontSize: 13 }}>속도 <b>{device.speed.toFixed(1)}</b> km/h</span>
        <span style={{ color: fixColor, fontSize: 13 }}>GPS <b>{fixLabel}</b></span>
        <span style={{ color: "#9ca3af", fontSize: 13 }}>마지막 수신 <b style={{ color: "#e5e7eb" }}>{device.lastSeen}</b></span>
        <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 13 }}>오늘 검출 <b style={{ color: "#fff" }}>{device.todayDetections}건</b></span>
      </div>

      {/* 지도 (꽉 채움) + 플로팅 영상 패널 */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {/* 지도 */}
        <div style={{ width: "100%", height: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #374151" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          {/* 타일 전환 버튼 */}
          <div style={{ position: "absolute", top: 10, right: 10, zIndex: 999, display: "flex", background: "#1f2937", borderRadius: 6, overflow: "hidden", border: "1px solid #374151" }}>
            <button onClick={() => setIsSatellite(false)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: !isSatellite ? "#3b82f6" : "transparent", color: !isSatellite ? "#fff" : "#9ca3af" }}>일반</button>
            <button onClick={() => setIsSatellite(true)}  style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: isSatellite  ? "#3b82f6" : "transparent", color: isSatellite  ? "#fff" : "#9ca3af" }}>위성</button>
          </div>
          {/* 영상 토글 버튼 */}
          {!vidVisible && (
            <button
              onClick={() => setVidVisible(true)}
              style={{ position: "absolute", top: 10, left: 10, zIndex: 999, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#1f2937", border: "1px solid #374151", borderRadius: 6, color: "#4ade80" }}
            >
              ● 영상 보기
            </button>
          )}
        </div>

        {/* 탐지 팝업 패널 */}
        {detPopup && (() => {
          const cls = detPopup.msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
          const meta = CLASS_META[cls];
          const prob = detPopup.msg.OBJECT_LIST?.[0]?.OBJECT_PRBL ?? 0;
          // 꼭지가 위쪽(패널이 마커 아래)인지 아래쪽(패널이 마커 위)인지
          const tailBelow = detPos.y > detPopup.anchorY; // 패널이 마커보다 아래 = 꼭지는 위
          // 꼭지 X: 마커 anchorX - 패널 left (clamp: 패널 안에 들어오게)
          const tailX = Math.max(12, Math.min(detPopup.anchorX - detPos.x, detSize.w - 12));
          return (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: "absolute", left: detPos.x, top: detPos.y, zIndex: 1100,
                width: detSize.w, height: detSize.h,
                borderRadius: 8, border: "1px solid #4b5563",
                background: "#111827", display: "flex", flexDirection: "column",
                boxShadow: "0 8px 32px rgba(0,0,0,0.7)", overflow: "visible",
              }}
            >
              {/* 말풍선 꼭지 */}
              {tailBelow ? (
                // 꼭지 위쪽 (패널이 마커 아래)
                <>
                  <div style={{ position: "absolute", top: -10, left: tailX, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "10px solid #4b5563" }} />
                  <div style={{ position: "absolute", top: -8, left: tailX, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: "9px solid #111827" }} />
                </>
              ) : (
                // 꼭지 아래쪽 (패널이 마커 위)
                <>
                  <div style={{ position: "absolute", bottom: -10, left: tailX, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid #4b5563" }} />
                  <div style={{ position: "absolute", bottom: -8, left: tailX, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "9px solid #111827" }} />
                </>
              )}
              {/* 드래그 헤더 */}
              <div
                onMouseDown={onDetDragStart}
                style={{ padding: "6px 10px", background: "#1f2937", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "grab", userSelect: "none", flexShrink: 0 }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>탐지 상세</span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (selectedMarkerRef.current) {
                      const { marker: prev, color: prevColor } = selectedMarkerRef.current;
                      prev.setStyle({ radius: 6, fillColor: prevColor, color: "#fff", weight: 2, fillOpacity: 0.9 });
                      selectedMarkerRef.current = null;
                    }
                    setDetPopup(null);
                  }}
                  style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                >✕</button>
              </div>

              {/* 이미지 */}
              <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                <img
                  src={detPopup.imgSrc}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>

              {/* 정보 */}
              <div style={{ padding: "8px 10px", background: "#1f2937", borderRadius: "0 0 8px 8px", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: (meta?.color ?? "#6b7280") + "33", color: meta?.color ?? "#9ca3af" }}>
                    {meta?.label ?? cls}
                  </span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>신뢰도 {(prob * 100).toFixed(1)}%</span>
                </div>
                <div style={{ fontSize: 11, color: "#d1d5db" }}>{formatTs(detPopup.msg.TIMESTAMP)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {detPopup.msg.DEVICE_ID} · {parseFloat(detPopup.msg.SENSOR.SPEED).toFixed(1)} km/h
                </div>
              </div>

              {/* 리사이즈 핸들 */}
              <div
                onMouseDown={onDetResizeStart}
                style={{
                  position: "absolute", bottom: -10, right: -10, width: 24, height: 24,
                  cursor: "nwse-resize", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#4b5563", borderRadius: "50%", boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M5 8L8 5M8 8L8 8" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          );
        })()}

        {/* 플로팅 영상 패널 */}
        {vidVisible && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute", left: vidPos.x, top: vidPos.y, zIndex: 1000,
              width: vidSize.w, height: vidSize.h,
              borderRadius: 8, border: "1px solid #4b5563",
              background: "#000", display: "flex", flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              overflow: "visible",
            }}
          >
            {/* 드래그 핸들 (헤더) */}
            <div
              onMouseDown={onDragStart}
              style={{ padding: "6px 10px", background: "#1f2937", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "grab", userSelect: "none", flexShrink: 0 }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>실시간 영상</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#4ade80" }}>● LIVE</span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setVidVisible(false)}
                  style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                >✕</button>
              </div>
            </div>

            {/* 영상 */}
            <div style={{ position: "relative", flex: 1, overflow: "hidden", borderRadius: "0 0 8px 8px" }}>
              {(() => {
                const src = device.id === "edge-test-126"
                  ? "/ens/excavator_sample2.mp4"
                  : "/ens/excavator_sample.mp4";
                return (
                  <video
                    key={src}
                    autoPlay loop muted playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  >
                    <source src={src} type="video/mp4" />
                  </video>
                );
              })()}
            </div>

            {/* 리사이즈 핸들 (우하단) */}
            <div
              onMouseDown={onResizeStart}
              style={{
                position: "absolute", bottom: -10, right: -10, width: 24, height: 24,
                cursor: "nwse-resize", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: "#4b5563", borderRadius: "50%", boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 8L8 2M5 8L8 5M8 8L8 8" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
