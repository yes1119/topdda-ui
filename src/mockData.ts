import type { Device, IotMessage } from "./types";

export const MOCK_DEVICES: Device[] = [
  { id: "edge-test-125", ip: "192.168.5.125", status: "online",   lastSeen: "2초 전",  todayDetections: 42, version: "v1.3.0", lat: 37.5012, lon: 127.0396, speed: 38.2, fixStatus: "4" },
  { id: "edge-test-126", ip: "192.168.5.126", status: "online",   lastSeen: "5초 전",  todayDetections: 17, version: "v1.3.0", lat: 37.4985, lon: 127.0451, speed: 52.1, fixStatus: "4" },
  { id: "edge-test-124", ip: "192.168.5.124", status: "online",   lastSeen: "8초 전",  todayDetections: 8,  version: "v1.3.0", lat: 37.5034, lon: 127.0312, speed: 12.0, fixStatus: "5" },
];

// 각 차량의 이동 경로 waypoints (위도/경도 배열)
export const VEHICLE_ROUTES: Record<string, [number, number][]> = {
  "edge-test-125": [
    [37.4980, 127.0370], [37.4992, 127.0385], [37.5005, 127.0396],
    [37.5012, 127.0410], [37.5020, 127.0425], [37.5015, 127.0440],
    [37.5005, 127.0450], [37.4995, 127.0445], [37.4988, 127.0430],
    [37.4980, 127.0415], [37.4975, 127.0400], [37.4980, 127.0370],
  ],
  "edge-test-126": [
    [37.4985, 127.0451], [37.4975, 127.0465], [37.4968, 127.0478],
    [37.4960, 127.0490], [37.4955, 127.0505], [37.4962, 127.0518],
    [37.4975, 127.0510], [37.4985, 127.0498], [37.4992, 127.0482],
    [37.4988, 127.0468], [37.4985, 127.0451],
  ],
  "edge-test-124": [
    [37.5034, 127.0312], [37.5040, 127.0325], [37.5045, 127.0340],
    [37.5038, 127.0352], [37.5028, 127.0348], [37.5020, 127.0335],
    [37.5025, 127.0320], [37.5034, 127.0312],
  ],
};

function randomClass() {
  return "excavator";
}

function randomCoord(base: number, range: number) {
  return +(base + (Math.random() - 0.5) * range).toFixed(6);
}

export const MOCK_FEED: IotMessage[] = Array.from({ length: 20 }, (_, i) => {
  const device = MOCK_DEVICES[i % 3];
  const cls = randomClass();
  const ts = Date.now() - i * 8000;
  const tsStr = new Date(ts).toISOString().replace(/[-:T.Z]/g, "").slice(0, 17);
  return {
    TYPE: "INF",
    TIMESTAMP: tsStr,
    TIMESTAMP_UNIX: String(ts / 1000),
    DEVICE_ID: device.id,
    IMAGE_PATH: `edge-images/${device.id}/20260415/${tsStr}.jpg`,
    SENSOR: {
      LAT: String(randomCoord(device.lat, 0.01)),
      LON: String(randomCoord(device.lon, 0.01)),
      SPEED: String(+(Math.random() * 60).toFixed(1)),
      DIRECTION: String(+(Math.random() * 360).toFixed(1)),
      FIX_STATUS: "4",
    },
    OBJECT_LIST: [
      {
        OBJECT_TYPE: cls,
        OBJECT_PRBL: +(0.5 + Math.random() * 0.45).toFixed(2),
        OBJECT_REGION: [
          +(0.1 + Math.random() * 0.3).toFixed(4),
          +(0.1 + Math.random() * 0.3).toFixed(4),
          +(0.5 + Math.random() * 0.4).toFixed(4),
          +(0.5 + Math.random() * 0.4).toFixed(4),
        ],
      },
    ],
  };
});

function makeMockHistory(deviceId: string, baseLat: number, baseLon: number, count: number): IotMessage[] {
  return Array.from({ length: count }, (_, i) => {
    const cls = randomClass();
    const ts = Date.now() - i * 30000;
    const tsStr = new Date(ts).toISOString().replace(/[-:T.Z]/g, "").slice(0, 17);
    return {
      TYPE: "INF" as const,
      TIMESTAMP: tsStr,
      TIMESTAMP_UNIX: String(ts / 1000),
      DEVICE_ID: deviceId,
      IMAGE_PATH: `edge-images/${deviceId}/20260415/${tsStr}.jpg`,
      SENSOR: {
        LAT: String(randomCoord(baseLat, 0.008)),
        LON: String(randomCoord(baseLon, 0.008)),
        SPEED: String(+(Math.random() * 60).toFixed(1)),
        DIRECTION: String(+(Math.random() * 360).toFixed(1)),
        FIX_STATUS: "4",
      },
      OBJECT_LIST: [
        {
          OBJECT_TYPE: cls,
          OBJECT_PRBL: +(0.5 + Math.random() * 0.45).toFixed(2),
          OBJECT_REGION: [0.15, 0.2, 0.65, 0.8],
        },
      ],
    };
  });
}

export const MOCK_HISTORY: Record<string, IotMessage[]> = {
  "edge-test-125": makeMockHistory("edge-test-125", 37.5012, 127.0396, 12),
  "edge-test-126": makeMockHistory("edge-test-126", 37.4985, 127.0451, 8),
  "edge-test-124": makeMockHistory("edge-test-124", 37.5034, 127.0312, 5),
};
