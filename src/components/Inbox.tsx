import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { IotMessage } from "../types";
import { CLASS_META } from "../types";

interface Props {
  feed: IotMessage[];
}

type Status = "미검토" | "검토중" | "작업지시" | "완료" | "오탐";

interface InboxItem {
  id: string;
  msg: IotMessage;
  status: Status;
  assignee: string | null;
  memo: string;
  updatedAt: string;
}

const STATUS_META: Record<Status, { color: string; bg: string; next: Status[] }> = {
  미검토:  { color: "#f97316", bg: "#f9731620", next: ["검토중", "오탐"] },
  검토중:  { color: "#facc15", bg: "#facc1520", next: ["작업지시", "오탐"] },
  작업지시:{ color: "#3b82f6", bg: "#3b82f620", next: ["완료"] },
  완료:    { color: "#22c55e", bg: "#22c55e20", next: [] },
  오탐:    { color: "#6b7280", bg: "#6b728020", next: [] },
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

function MiniMap({ lat, lon, color }: { lat: number; lon: number; color: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
        .setView([lat, lon], 16);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}").addTo(mapInstance.current);
    }
    if (markerRef.current) markerRef.current.remove();
    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 6px ${color}"></div>`,
      className: "", iconSize: [14, 14], iconAnchor: [7, 7],
    });
    markerRef.current = L.marker([lat, lon], { icon }).addTo(mapInstance.current);
    mapInstance.current.setView([lat, lon], 16);
    setTimeout(() => mapInstance.current?.invalidateSize(), 100);
  }, [lat, lon, color]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

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

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace", marginBottom: 4 }}>{selItem.id}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{meta?.label ?? cls}</span>
            <span style={{ fontSize: 13, padding: "2px 10px", borderRadius: 9999, background: smeta.bg, color: smeta.color, fontWeight: 600 }}>
              {selItem.status}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {smeta.next.map((next) => (
            <button
              key={next}
              onClick={() => changeStatus(selItem.id, next)}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: STATUS_META[next].bg, color: STATUS_META[next].color,
                border: `1px solid ${STATUS_META[next].color}`,
              }}
            >
              → {next}
            </button>
          ))}
        </div>
      </div>

      {/* 이미지 + 미니맵 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, height: 320 }}>
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #374151" }}>
          <img src={SAMPLE_IMAGES[imgIdx % SAMPLE_IMAGES.length]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #374151", position: "relative" }}>
          <MiniMap lat={lat} lon={lon} color={meta?.color ?? "#3b82f6"} />
          <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 4, zIndex: 999 }}>
            검출 위치
          </div>
        </div>
      </div>

      {/* 검출 정보 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {([
          ["신뢰도", `${(prob * 100).toFixed(1)}%`],
          ["차량", selItem.msg.DEVICE_ID],
          ["시각", formatTs(selItem.msg.TIMESTAMP)],
          ["속도", `${parseFloat(selItem.msg.SENSOR.SPEED).toFixed(1)} km/h`],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ background: "#1f2937", borderRadius: 6, padding: "10px 12px", border: "1px solid #374151" }}>
            <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>{k}</p>
            <p style={{ fontSize: 13, color: "#e5e7eb", fontWeight: 600 }}>{v}</p>
          </div>
        ))}
        <div style={{ background: "#1f2937", borderRadius: 6, padding: "10px 12px", border: "1px solid #374151", gridColumn: "span 2" }}>
          <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>주소</p>
          <p style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 600, wordBreak: "break-all" }}>{address}</p>
        </div>
      </div>

      {/* 담당자 배정 */}
      <div style={{ background: "#1f2937", borderRadius: 8, padding: 16, border: "1px solid #374151" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 10 }}>담당자 배정</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ASSIGNEES.map((name) => (
            <button
              key={name}
              onClick={() => assignTo(selItem.id, name)}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                background: selItem.assignee === name ? "#3b82f6" : "#374151",
                color: selItem.assignee === name ? "#fff" : "#9ca3af",
                border: "none", fontWeight: selItem.assignee === name ? 600 : 400,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div style={{ background: "#1f2937", borderRadius: 8, padding: 16, border: "1px solid #374151" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 10 }}>메모</p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="현장 메모, 조치 내용 등을 입력하세요..."
          style={{
            width: "100%", minHeight: 80, background: "#111827", border: "1px solid #374151",
            borderRadius: 6, padding: "8px 12px", color: "#e5e7eb", fontSize: 12,
            resize: "vertical", outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => saveMemo(selItem.id)}
          style={{
            marginTop: 8, padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer",
          }}
        >
          저장
        </button>
      </div>

    </div>
  );
}

export default function Inbox({ feed }: Props) {
  const [items, setItems] = useState<InboxItem[]>(() =>
    feed.map((msg, i) => ({
      id: `INB-${String(i + 1).padStart(3, "0")}`,
      msg,
      status: i < 3 ? "미검토" : i < 7 ? "검토중" : i < 13 ? "작업지시" : i < 17 ? "완료" : "오탐",
      assignee: i < 3 ? null : ASSIGNEES[i % ASSIGNEES.length],
      memo: "",
      updatedAt: msg.TIMESTAMP,
    }))
  );

  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "전체">("전체");
  const [memo, setMemo] = useState("");

  const filtered = items.filter((it) => filterStatus === "전체" || it.status === filterStatus);

  const counts = Object.fromEntries(
    (["미검토", "검토중", "작업지시", "완료", "오탐"] as Status[]).map((s) => [
      s,
      items.filter((it) => it.status === s).length,
    ])
  ) as Record<Status, number>;

  function changeStatus(id: string, next: Status) {
    setItems((prev) =>
      prev.map((it) => it.id === id ? { ...it, status: next, updatedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14) } : it)
    );
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: next } : null);
  }

  function assignTo(id: string, assignee: string) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, assignee } : it));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, assignee } : null);
  }

  function saveMemo(id: string) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, memo } : it));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, memo } : null);
  }

  const selItem = selected ? items.find((it) => it.id === selected.id) ?? selected : null;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* 좌측 리스트 */}
      <div style={{ width: 420, display: "flex", flexDirection: "column", borderRight: "1px solid #374151", flexShrink: 0 }}>

        {/* 상태 필터 탭 */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #374151", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["전체", "미검토", "검토중", "작업지시", "완료", "오탐"] as const).map((s) => {
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
            return (
              <div
                key={it.id}
                onClick={() => { setSelected(it); setMemo(it.memo); }}
                style={{
                  padding: "12px 16px", borderBottom: "1px solid #374151", cursor: "pointer",
                  background: isSelected ? "#1e3a5f" : "transparent",
                  borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#1f2937"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{it.id}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 9999, background: smeta.bg, color: smeta.color, fontWeight: 600 }}>
                    {it.status}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <img src={SAMPLE_IMAGES[i % SAMPLE_IMAGES.length]} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 12, padding: "1px 6px", borderRadius: 4, background: (meta?.color ?? "#6b7280") + "33", color: meta?.color ?? "#9ca3af", fontWeight: 600 }}>
                        {meta?.label ?? cls}
                      </span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{(prob * 100).toFixed(0)}%</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{it.msg.DEVICE_ID} · {elapsed(it.msg.TIMESTAMP)}</p>
                  </div>
                </div>
                {it.assignee && (
                  <p style={{ fontSize: 11, color: "#6b7280" }}>담당: {it.assignee}</p>
                )}
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
