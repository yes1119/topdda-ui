export type FixStatus = "4" | "5" | "0";
export type DeviceStatus = "online" | "offline" | "detected";
export type Severity = "low" | "medium" | "high";

export interface SensorData {
  LAT: string;
  LON: string;
  SPEED: string;
  DIRECTION: string;
  FIX_STATUS: FixStatus;
}

export interface DetectionObject {
  OBJECT_TYPE: string;
  OBJECT_PRBL: number;
  OBJECT_REGION: [number, number, number, number]; // [xmin, ymin, xmax, ymax]
}

export interface IotMessage {
  TYPE: "INF" | "STAT";
  TIMESTAMP: string;
  TIMESTAMP_UNIX: string;
  DEVICE_ID: string;
  IMAGE_PATH?: string;
  SENSOR: SensorData;
  OBJECT_LIST?: DetectionObject[];
}

export interface Device {
  id: string;
  ip: string;
  status: DeviceStatus;
  lastSeen: string;
  todayDetections: number;
  version: string;
  lat: number;
  lon: number;
  speed: number;
  fixStatus: FixStatus;
}

export const CLASS_META: Record<string, { label: string; severity: Severity; color: string }> = {
  wall:                        { label: "벽체",           severity: "low",    color: "#6b7280" },
  building_under_cons:         { label: "공사중 건물",     severity: "low",    color: "#3b82f6" },
  excavator:                   { label: "굴삭기",          severity: "medium", color: "#f97316" },
  cable_sagging:               { label: "케이블 처짐",     severity: "high",   color: "#ef4444" },
  tilted_pole:                 { label: "기울어진 전신주", severity: "high",   color: "#ef4444" },
  normal_pole:                 { label: "정상 전신주",     severity: "low",    color: "#22c55e" },
  protective_tube_defective:   { label: "보호관 불량",     severity: "high",   color: "#ef4444" },
  manhole_defective:           { label: "맨홀 불량",       severity: "high",   color: "#ef4444" },
  opened_closure:              { label: "열린 클로저",     severity: "high",   color: "#ef4444" },
  poor_fixation_closure:       { label: "클로저 고정 불량",severity: "medium", color: "#f97316" },
  closure_cable_poor_fixation: { label: "클로저 케이블 불량", severity: "medium", color: "#f97316" },
};
