import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { IotMessage } from "../types";
import { CLASS_META } from "../types";

interface Props {
  feed: IotMessage[];
}

type Status = "미검토" | "검토중" | "완료" | "오탐";

interface InboxItem {
  id: string;
  msg: IotMessage;
  status: Status;
  assignee: string | null;
  assignedAt: string | null;
  memo: string;
  statusHistory: { status: Status; who: string; when: string }[];
}

// mock 위험도 데이터
interface RiskData {
  score: number;       // 0~10
  pipeDist: number;    // 배관 거리 (m)
  reported: boolean;   // 사전 굴착신고 여부
  duration: number;    // 동일 위치 체류 분
}

function mockRisk(id: string): RiskData {
  const seed = parseInt(id.replace("INB-", ""), 10);
  const pipeDist = +((seed * 13.7) % 78 + 2).toFixed(1);  // 2~80m
  const reported = seed % 3 === 0;
  const duration = (seed * 11) % 40 + 1;                   // 1~40분

  // 위험도 = 미신고 여부(가중 높음) + 배관 근접도 + 체류 시간
  const reportedPenalty = reported ? 0 : 4.5;
  const distScore = Math.max(0, (80 - pipeDist) / 80) * 3;   // 가까울수록 +3
  const durScore = (duration / 40) * 2;                       // 길수록 +2
  const raw = reportedPenalty + distScore + durScore;
  // 신고됨: 1~5.5, 미신고: 5.5~9.5
  const score = +Math.min(9.5, Math.max(1.0, raw)).toFixed(1);

  return { score, pipeDist, reported, duration };
}

const STATUS_FLOW: Status[] = ["미검토", "검토중", "완료"];

const STATUS_META: Record<Status, { color: string; bg: string; next: Status[] }> = {
  미검토: { color: "#f97316", bg: "#f9731620", next: ["검토중", "오탐"] },
  검토중: { color: "#facc15", bg: "#facc1520", next: ["완료", "오탐"] },
  완료:   { color: "#22c55e", bg: "#22c55e20", next: [] },
  오탐:   { color: "#6b7280", bg: "#6b728020", next: [] },
};

const ASSIGNEES = ["김민준", "이서연", "박지훈", "최수아"];

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
    return `${tsStr.slice(0,4)}-${tsStr.slice(4,6)}-${tsStr.slice(6,8)} ${tsStr.slice(8,10)}:${tsStr.slice(10,12)}`;
  return tsStr;
}

function nowStr() {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

function elapsed(tsStr: string) {
  if (tsStr.length < 14) return "";
  const d = new Date(
    `${tsStr.slice(0,4)}-${tsStr.slice(4,6)}-${tsStr.slice(6,8)}T${tsStr.slice(8,10)}:${tsStr.slice(10,12)}:${tsStr.slice(12,14)}`
  );
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return `${Math.floor(diff / 1440)}일 전`;
}

// ── MiniMap ──────────────────────────────────────────────────────────────────
const TILES = {
  street:    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

// 탐지 좌표 기준으로 mock 굴착신고 구역 폴리곤 생성 (오프셋 + 약간 불규칙한 사각형)
function mockExcavationZone(lat: number, lon: number, reported: boolean): [number, number][] {
  const seed = Math.abs(Math.round(lat * 1000 + lon * 1000)) % 100;
  const d = 0.0006 + seed * 0.000008; // ~70~130m 범위
  const offLat = (reported ? 1 : 3.5) * 0.00015;
  const offLon = (reported ? 0.5 : 2) * 0.00015;
  const cx = lat + offLat;
  const cy = lon + offLon;
  // 불규칙한 사각형 (시계방향)
  return [
    [cx - d * 1.1, cy - d * 0.9],
    [cx - d * 0.8, cy + d * 1.2],
    [cx + d * 1.0, cy + d * 0.8],
    [cx + d * 0.9, cy - d * 1.1],
  ];
}

function MiniMap({ lat, lon, color, reported }: { lat: number; lon: number; color: string; reported: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const zoneRef = useRef<L.Polygon | null>(null);
  const dangerRef = useRef<L.Circle | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lon], 16);
      tileRef.current = L.tileLayer(TILES.street).addTo(mapInstance.current);
    }
    const map = mapInstance.current;

    // 기존 레이어 제거
    if (markerRef.current) markerRef.current.remove();
    if (zoneRef.current) zoneRef.current.remove();
    if (dangerRef.current) dangerRef.current.remove();

    // 굴착신고 구역 폴리곤
    const zone = mockExcavationZone(lat, lon, reported);
    zoneRef.current = L.polygon(zone, {
      color: reported ? "#22c55e" : "#ef4444",
      fillColor: reported ? "#22c55e" : "#ef4444",
      fillOpacity: 0.15,
      weight: 2,
      dashArray: reported ? undefined : "6 4",
    }).addTo(map);
    zoneRef.current.bindTooltip(
      reported ? "✓ 굴착신고 구역" : "⚠ 미신고 작업 의심구역",
      { permanent: false, direction: "top", className: "" }
    );

    // 미신고인 경우 탐지 위치에 빨간 경고 원 추가
    if (!reported) {
      dangerRef.current = L.circle([lat, lon], {
        radius: 12,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(map);
    }

    // 탐지 마커
    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 6px ${color}"></div>`,
      className: "", iconSize: [14, 14], iconAnchor: [7, 7],
    });
    markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
    map.setView([lat, lon], 16);
    setTimeout(() => map.invalidateSize(), 100);
  }, [lat, lon, color, reported]);

  useEffect(() => {
    tileRef.current?.setUrl(isSatellite ? TILES.satellite : TILES.street);
  }, [isSatellite]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {/* 범례 */}
      <div style={{ position: "absolute", bottom: 8, left: 8, zIndex: 999, background: "rgba(17,24,39,0.85)", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: "#e5e7eb", display: "flex", flexDirection: "column", gap: 2 }}>
        <span><span style={{ color: reported ? "#22c55e" : "#ef4444" }}>■</span> {reported ? "신고 구역" : "미신고 구역"}</span>
        <span><span style={{ color }}>●</span> 탐지 위치</span>
      </div>
      {/* 타일 토글 */}
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 999, display: "flex", background: "#1f2937", borderRadius: 6, overflow: "hidden", border: "1px solid #374151" }}>
        <button onClick={() => setIsSatellite(false)} style={{ padding: "3px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", background: !isSatellite ? "#3b82f6" : "transparent", color: !isSatellite ? "#fff" : "#9ca3af" }}>일반</button>
        <button onClick={() => setIsSatellite(true)}  style={{ padding: "3px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", background:  isSatellite ? "#3b82f6" : "transparent", color:  isSatellite ? "#fff" : "#9ca3af" }}>위성</button>
      </div>
    </div>
  );
}

// ── useAddress ────────────────────────────────────────────────────────────────
function useAddress(lat: number, lon: number) {
  const [address, setAddress] = useState<string>("주소 조회 중...");
  useEffect(() => {
    setAddress("주소 조회 중...");
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`)
      .then((r) => r.json())
      .then((d) => setAddress(d.display_name ?? "주소 없음"))
      .catch(() => setAddress("주소 조회 실패"));
  }, [lat, lon]);
  return address;
}

// ── HeroBlock ─────────────────────────────────────────────────────────────────
function HeroBlock({ risk }: { risk: RiskData }) {
  const scoreColor = risk.score >= 8 ? "#ef4444" : risk.score >= 5 ? "#f97316" : "#22c55e";
  const urgency = risk.score >= 8 ? "즉시 출동 필요" : risk.score >= 5 ? "검토 필요" : "정상 모니터링";
  const urgencyBg = risk.score >= 8 ? "#ef444420" : risk.score >= 5 ? "#f9731620" : "#22c55e20";

  return (
    <div style={{ background: "#1f2937", borderRadius: 10, border: `1px solid ${scoreColor}55`, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 1 }}>위험 요약</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 9999, background: urgencyBg, color: scoreColor }}>
          {urgency}
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        {/* 위험도 스코어 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: urgencyBg, borderRadius: 8, padding: "10px 18px", border: `1px solid ${scoreColor}44`, flexShrink: 0 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{risk.score.toFixed(1)}</span>
          <span style={{ fontSize: 10, color: scoreColor, marginTop: 2 }}>/ 10</span>
        </div>
        {/* 핵심 수치 3개 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, flex: 1 }}>
          <div style={{ background: "#111827", borderRadius: 6, padding: "8px 10px", border: "1px solid #374151" }}>
            <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>배관까지 거리</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: risk.pipeDist < 10 ? "#ef4444" : "#e5e7eb" }}>{risk.pipeDist}m</p>
          </div>
          <div style={{ background: "#111827", borderRadius: 6, padding: "8px 10px", border: "1px solid #374151" }}>
            <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>굴착신고</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: risk.reported ? "#22c55e" : "#ef4444" }}>
              {risk.reported ? "✓ 신고됨" : "✗ 미신고"}
            </p>
          </div>
          <div style={{ background: "#111827", borderRadius: 6, padding: "8px 10px", border: "1px solid #374151" }}>
            <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>체류 시간</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: risk.duration > 20 ? "#f97316" : "#e5e7eb" }}>{risk.duration}분</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatusStepper ─────────────────────────────────────────────────────────────
function StatusStepper({ item }: { item: InboxItem }) {
  const isOtam = item.status === "오탐";
  const currentIdx = STATUS_FLOW.indexOf(item.status);

  return (
    <div style={{ background: "#1f2937", borderRadius: 10, border: "1px solid #374151", padding: "12px 16px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, marginBottom: 10 }}>진행 상황</p>
      {isOtam ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", padding: "4px 14px", borderRadius: 9999, background: "#6b728020", border: "1px solid #6b7280" }}>⊗ 오탐 처리됨</span>
          {item.statusHistory.find(h => h.status === "오탐") && (
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              {item.statusHistory.find(h => h.status === "오탐")!.who} · {formatTs(item.statusHistory.find(h => h.status === "오탐")!.when)}
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {STATUS_FLOW.map((s, idx) => {
            const done = currentIdx > idx;
            const active = currentIdx === idx;
            const hist = item.statusHistory.find(h => h.status === s);
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: idx < STATUS_FLOW.length - 1 ? 1 : undefined }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "#3b82f6" : active ? "#1e3a5f" : "#1f2937",
                    border: `2px solid ${done || active ? "#3b82f6" : "#374151"}`,
                    fontSize: 12, fontWeight: 700, color: done || active ? "#fff" : "#4b5563",
                  }}>
                    {done ? "✓" : idx + 1}
                  </div>
                  <span style={{ fontSize: 10, color: active ? "#93c5fd" : done ? "#9ca3af" : "#4b5563", fontWeight: active ? 700 : 400, whiteSpace: "nowrap" }}>{s}</span>
                  {hist && (
                    <span style={{ fontSize: 9, color: "#6b7280", whiteSpace: "nowrap" }}>{hist.who}</span>
                  )}
                </div>
                {idx < STATUS_FLOW.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? "#3b82f6" : "#374151", margin: "0 4px", marginBottom: 28 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────────
interface DetailPanelProps {
  selItem: InboxItem;
  imgIdx: number;
  memo: string;
  setMemo: (v: string) => void;
  changeStatus: (id: string, next: Status) => void;
  assignTo: (id: string, assignee: string) => void;
  saveMemo: (id: string) => void;
}

function DetailPanel({ selItem, imgIdx, memo, setMemo, changeStatus, assignTo, saveMemo }: DetailPanelProps) {
  const cls = selItem.msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
  const meta = CLASS_META[cls];
  const prob = selItem.msg.OBJECT_LIST?.[0]?.OBJECT_PRBL ?? 0;
  const smeta = STATUS_META[selItem.status];
  const lat = parseFloat(selItem.msg.SENSOR.LAT);
  const lon = parseFloat(selItem.msg.SENSOR.LON);
  const address = useAddress(lat, lon);
  const risk = mockRisk(selItem.id);
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* 이미지 라이트박스 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }} />
          <button
            onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 24, fontSize: 28, color: "#fff", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          >✕</button>
        </div>
      )}

      {/* 헤더: ID + 상태 전환 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{selItem.id}</span>
          <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 9999, background: smeta.bg, color: smeta.color, fontWeight: 700 }}>
            {selItem.status}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {smeta.next.map((next) => (
            <button
              key={next}
              onClick={() => changeStatus(selItem.id, next)}
              style={{
                padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: STATUS_META[next].color, color: "#fff", border: "none",
              }}
            >
              → {next}
            </button>
          ))}
        </div>
      </div>

      {/* HERO */}
      <div style={{ flexShrink: 0 }}>
        <HeroBlock risk={risk} />
      </div>

      {/* 스테퍼 */}
      <div style={{ flexShrink: 0 }}>
        <StatusStepper item={selItem} />
      </div>

      {/* 이미지 + 미니맵 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, height: 320, flexShrink: 0 }}>
        <div
          onClick={() => setLightbox(SAMPLE_IMAGES[imgIdx % SAMPLE_IMAGES.length])}
          style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #374151", cursor: "zoom-in", position: "relative" }}
        >
          <img src={SAMPLE_IMAGES[imgIdx % SAMPLE_IMAGES.length]} alt="" style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }} />
          <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.55)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#fff" }}>
            클릭하여 원본 보기
          </div>
        </div>
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #374151", position: "relative" }}>
          <MiniMap lat={lat} lon={lon} color={meta?.color ?? "#3b82f6"} reported={risk.reported} />
        </div>
      </div>

      {/* 메타 정보 + 담당자 + 메모 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flexShrink: 0 }}>
        {/* 검출 정보 */}
        <div style={{ background: "#1f2937", borderRadius: 8, padding: "12px 14px", border: "1px solid #374151" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, letterSpacing: 1 }}>검출 정보</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {([
              ["신뢰도", `${(prob * 100).toFixed(1)}%`],
              ["차량", selItem.msg.DEVICE_ID],
              ["시각", formatTs(selItem.msg.TIMESTAMP)],
              ["속도", `${parseFloat(selItem.msg.SENSOR.SPEED).toFixed(1)} km/h`],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 10, color: "#6b7280" }}>{k}</p>
                <p style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 600 }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #374151" }}>
            <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>주소</p>
            <p style={{ fontSize: 11, color: "#e5e7eb", fontWeight: 600, wordBreak: "break-all" }}>{address}</p>
          </div>
        </div>

        {/* 담당자 + 메모 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#1f2937", borderRadius: 8, padding: "12px 14px", border: "1px solid #374151" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, letterSpacing: 1 }}>담당자</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ASSIGNEES.map((name) => (
                <button
                  key={name}
                  onClick={() => assignTo(selItem.id, name)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                    background: selItem.assignee === name ? "#3b82f6" : "#374151",
                    color: selItem.assignee === name ? "#fff" : "#9ca3af",
                    border: "none", fontWeight: selItem.assignee === name ? 700 : 400,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: "#1f2937", borderRadius: 8, padding: "12px 14px", border: "1px solid #374151", flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, letterSpacing: 1 }}>메모</p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="현장 메모, 조치 내용..."
              style={{
                width: "100%", height: 52, background: "#111827", border: "1px solid #374151",
                borderRadius: 6, padding: "6px 10px", color: "#e5e7eb", fontSize: 11,
                resize: "none", outline: "none", boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => saveMemo(selItem.id)}
              style={{ marginTop: 6, padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer" }}
            >
              저장
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Inbox({ feed }: Props) {
  const [items, setItems] = useState<InboxItem[]>(() =>
    feed.map((msg, i) => {
      const status: Status = i < 3 ? "미검토" : i < 9 ? "검토중" : i < 16 ? "완료" : "오탐";
      const assignee = i < 3 ? null : ASSIGNEES[i % ASSIGNEES.length];
      return {
        id: `INB-${String(i + 1).padStart(3, "0")}`,
        msg, status, assignee, assignedAt: assignee ? msg.TIMESTAMP : null, memo: "",
        statusHistory: status !== "미검토"
          ? STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) + 1).map((s, si) => ({
              status: s, who: ASSIGNEES[si % ASSIGNEES.length], when: msg.TIMESTAMP,
            }))
          : [],
      };
    })
  );

  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "전체">("전체");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [memo, setMemo] = useState("");

  const filtered = items.filter((it) => filterStatus === "전체" || it.status === filterStatus);

  const counts = Object.fromEntries(
    (["미검토", "검토중", "작업지시", "완료", "오탐"] as Status[]).map((s) => [
      s, items.filter((it) => it.status === s).length,
    ])
  ) as Record<Status, number>;

  function changeStatus(id: string, next: Status) {
    const who = items.find(it => it.id === id)?.assignee ?? "시스템";
    const when = nowStr();
    setItems((prev) => prev.map((it) =>
      it.id === id
        ? { ...it, status: next, statusHistory: [...it.statusHistory, { status: next, who, when }] }
        : it
    ));
    if (selected?.id === id) {
      // 상태 전환 후 자동으로 다음 미검토 항목 이동
      const cur = items.find(it => it.id === id);
      if (cur) {
        const curIdx = filtered.indexOf(cur);
        const next_item = filtered.slice(curIdx + 1).find(it => it.id !== id) ?? filtered.find(it => it.id !== id);
        if (next_item) { setSelected(next_item); setMemo(next_item.memo); }
        else setSelected(null);
      }
    }
  }

  function assignTo(id: string, assignee: string) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, assignee, assignedAt: nowStr() } : it));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, assignee } : null);
  }

  function saveMemo(id: string) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, memo } : it));
  }

  function toggleCheck(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function bulkChangeStatus(next: Status) {
    const when = nowStr();
    setItems((prev) => prev.map((it) =>
      checkedIds.has(it.id)
        ? { ...it, status: next, statusHistory: [...it.statusHistory, { status: next, who: "일괄처리", when }] }
        : it
    ));
    setCheckedIds(new Set());
  }

  const selItem = selected ? items.find((it) => it.id === selected.id) ?? selected : null;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* 좌측 리스트 */}
      <div style={{ width: "30%", minWidth: 260, maxWidth: 400, display: "flex", flexDirection: "column", borderRight: "1px solid #374151", flexShrink: 0 }}>

        {/* 상태 필터 탭 */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #374151", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(["전체", "미검토", "검토중", "완료", "오탐"] as const).map((s) => {
            const meta = s !== "전체" ? STATUS_META[s] : null;
            const isActive = filterStatus === s;
            const count = s === "전체" ? items.length : counts[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${isActive ? (meta?.color ?? "#3b82f6") : "#374151"}`,
                  background: isActive ? (meta?.bg ?? "#3b82f620") : "transparent",
                  color: isActive ? (meta?.color ?? "#3b82f6") : "#9ca3af",
                }}
              >
                {s} {count}
              </button>
            );
          })}
        </div>

        {/* 일괄 처리 바 */}
        {checkedIds.size > 0 && (
          <div style={{ padding: "8px 14px", background: "#1e3a5f", borderBottom: "1px solid #374151", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600 }}>{checkedIds.size}건 선택</span>
            <button onClick={() => bulkChangeStatus("오탐")} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#6b728020", color: "#9ca3af", border: "1px solid #6b7280" }}>일괄 오탐</button>
            <button onClick={() => bulkChangeStatus("검토중")} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#facc1520", color: "#facc15", border: "1px solid #facc15" }}>일괄 검토중</button>
            <button onClick={() => setCheckedIds(new Set())} style={{ marginLeft: "auto", padding: "3px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: "transparent", color: "#6b7280", border: "none" }}>취소</button>
          </div>
        )}

        {/* 리스트 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "#6b7280", fontSize: 13 }}>항목 없음</div>
          )}
          {filtered.map((it, i) => {
            const cls = it.msg.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
            const meta = CLASS_META[cls];
            const prob = it.msg.OBJECT_LIST?.[0]?.OBJECT_PRBL ?? 0;
            const smeta = STATUS_META[it.status];
            const isSelected = selItem?.id === it.id;
            const isChecked = checkedIds.has(it.id);
            const risk = mockRisk(it.id);
            const scoreColor = risk.score >= 8 ? "#ef4444" : risk.score >= 5 ? "#f97316" : "#22c55e";
            return (
              <div
                key={it.id}
                onClick={() => { setSelected(it); setMemo(it.memo); }}
                style={{
                  padding: "10px 14px", borderBottom: "1px solid #374151", cursor: "pointer",
                  background: isSelected ? "#1e3a5f" : isChecked ? "#1e293b" : "transparent",
                  borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#1f2937"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isChecked ? "#1e293b" : "transparent"; }}
              >
                {/* 체크박스 */}
                <div
                  onClick={(e) => toggleCheck(it.id, e)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isChecked ? "#3b82f6" : "#4b5563"}`,
                    background: isChecked ? "#3b82f6" : "transparent", flexShrink: 0, marginTop: 2,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  {isChecked && <span style={{ fontSize: 10, color: "#fff", lineHeight: 1 }}>✓</span>}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{it.id}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* 위험도 */}
                      <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>⚠ {risk.score.toFixed(1)}</span>
                      <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 9999, background: smeta.bg, color: smeta.color, fontWeight: 600 }}>
                        {it.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src={SAMPLE_IMAGES[i % SAMPLE_IMAGES.length]} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: (meta?.color ?? "#6b7280") + "33", color: meta?.color ?? "#9ca3af", fontWeight: 600 }}>
                          {meta?.label ?? cls}
                        </span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{(prob * 100).toFixed(0)}%</span>
                        {!risk.reported && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>미신고</span>}
                      </div>
                      <p style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {it.msg.DEVICE_ID} · {elapsed(it.msg.TIMESTAMP)}
                        {it.assignee && ` · ${it.assignee}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측 상세 */}
      {selItem ? (
        <DetailPanel
          selItem={selItem}
          imgIdx={items.findIndex((it) => it.id === selItem.id)}
          memo={memo}
          setMemo={setMemo}
          changeStatus={changeStatus}
          assignTo={assignTo}
          saveMemo={saveMemo}
        />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 14 }}>
          좌측에서 검출 항목을 선택하세요
        </div>
      )}
    </div>
  );
}
