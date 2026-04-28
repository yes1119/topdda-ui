import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { Device, IotMessage } from "../types";
import { CLASS_META } from "../types";

interface Props {
  devices: Device[];
  feed: IotMessage[];
}

const DAILY_DATA = [
  { day: "04/18", detections: 28 },
  { day: "04/19", detections: 45 },
  { day: "04/20", detections: 37 },
  { day: "04/21", detections: 62 },
  { day: "04/22", detections: 54 },
  { day: "04/23", detections: 71 },
  { day: "04/24", detections: 70 },
];

const CARD_STYLE: React.CSSProperties = {
  background: "#1f2937",
  borderRadius: 8,
  border: "1px solid #374151",
  padding: "16px 20px",
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  marginBottom: 16,
};

export default function Report({ devices, feed }: Props) {
  const totalDetections = devices.reduce((s, d) => s + d.todayDetections, 0);
  const onlineCount = devices.filter((d) => d.status !== "offline").length;
  const highCount = feed.filter(
    (f) => CLASS_META[f.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? ""]?.severity === "high"
  ).length;

  // 클래스별 검출 건수
  const classCounts: Record<string, number> = {};
  feed.forEach((f) => {
    const cls = f.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? "";
    if (!cls) return;
    classCounts[cls] = (classCounts[cls] ?? 0) + 1;
  });
  const pieData = Object.entries(classCounts)
    .map(([cls, count]) => ({
      name: CLASS_META[cls]?.label ?? cls,
      value: count,
      color: CLASS_META[cls]?.color ?? "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);

  // 차량별 검출 건수
  const vehicleData = devices.map((d) => ({
    id: d.id,
    detections: d.todayDetections,
    color: d.status === "offline" ? "#374151" : "#3b82f6",
  }));

  // 심각도별 집계
  const severityCounts = { high: 0, medium: 0, low: 0 };
  feed.forEach((f) => {
    const sev = CLASS_META[f.OBJECT_LIST?.[0]?.OBJECT_TYPE ?? ""]?.severity;
    if (sev) severityCounts[sev]++;
  });

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* KPI 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, flexShrink: 0 }}>
        {[
          { label: "오늘 총 검출",   value: totalDetections,      sub: "건",        border: "#3b82f6" },
          { label: "고위험 검출",    value: highCount,             sub: "건",        border: "#ef4444" },
          { label: "운행 차량",      value: `${onlineCount} / ${devices.length}`, sub: "대", border: "#22c55e" },
          { label: "주간 총 검출",   value: DAILY_DATA.reduce((s, d) => s + d.detections, 0), sub: "건 (7일)", border: "#a855f7" },
        ].map((c) => (
          <div key={c.label} style={{ ...CARD_STYLE, padding: "14px 16px", borderLeft: `4px solid ${c.border}` }}>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>{c.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>{c.value}</p>
            <p style={{ fontSize: 11, color: "#6b7280" }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* 차트 행 1 — 일별 검출 + 클래스별 비율 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 12, flexShrink: 0 }}>
        {/* 일별 검출 바차트 */}
        <div style={CARD_STYLE}>
          <p style={TITLE_STYLE}>일별 검출 건수 (최근 7일)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DAILY_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#60a5fa" }}
              />
              <Bar dataKey="detections" name="검출 건수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 클래스별 파이차트 */}
        <div style={CARD_STYLE}>
          <p style={TITLE_STYLE}>검출 유형 비율</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 12 }}
                itemStyle={{ color: "#e5e7eb" }}
              />
              <Legend
                formatter={(value) => <span style={{ color: "#9ca3af", fontSize: 11 }}>{value}</span>}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 차트 행 2 — 차량별 검출 + 심각도 + 검출 유형 상세 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flexShrink: 0 }}>
        {/* 차량별 오늘 검출 */}
        <div style={CARD_STYLE}>
          <p style={TITLE_STYLE}>차량별 오늘 검출 건수</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vehicleData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="id" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#60a5fa" }}
              />
              <Bar dataKey="detections" name="검출 건수" radius={[0, 4, 4, 0]}>
                {vehicleData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 심각도 요약 */}
        <div style={CARD_STYLE}>
          <p style={TITLE_STYLE}>심각도별 검출 현황</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[
              { label: "고위험", count: severityCounts.high,   color: "#ef4444", bg: "#ef444420" },
              { label: "중위험", count: severityCounts.medium, color: "#f97316", bg: "#f9731620" },
              { label: "저위험", count: severityCounts.low,    color: "#22c55e", bg: "#22c55e20" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: "#d1d5db" }}>{s.count}건</span>
                </div>
                <div style={{ height: 8, background: "#374151", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${feed.length ? (s.count / feed.length) * 100 : 0}%`,
                    background: s.color,
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* 검출 유형 상세 테이블 */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>유형별 상세</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pieData.map((p) => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    <span style={{ color: p.color, marginRight: 6 }}>●</span>{p.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 600 }}>{p.value}건</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
