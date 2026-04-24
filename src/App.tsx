import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import DeviceDetail from "./components/DeviceDetail";
import Gallery from "./components/Gallery";
import Devices from "./components/Devices";
import { MOCK_DEVICES, MOCK_FEED, VEHICLE_ROUTES, MOCK_HISTORY } from "./mockData";

type Page = "dashboard" | "detail" | "gallery" | "devices";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  function handleNavigate(p: Page, deviceId?: string) {
    setPage(p);
    if (deviceId) setSelectedDevice(deviceId);
  }

  function handleSelectDevice(id: string) {
    setPage("detail");
    setSelectedDevice(id);
  }

  const device = MOCK_DEVICES.find((d) => d.id === selectedDevice) ?? MOCK_DEVICES[0];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "#111827" }}>
      <Sidebar
        devices={MOCK_DEVICES}
        currentPage={page}
        selectedDevice={selectedDevice}
        onNavigate={handleNavigate}
      />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {page === "dashboard" && (
          <Dashboard devices={MOCK_DEVICES} feed={MOCK_FEED} onSelectDevice={handleSelectDevice} />
        )}
        {page === "detail" && (
          <DeviceDetail
            device={device}
            path={VEHICLE_ROUTES[device.id] ?? []}
            history={MOCK_HISTORY[device.id] ?? []}
          />
        )}
        {page === "gallery" && (
          <Gallery feed={MOCK_FEED} />
        )}
        {page === "devices" && (
          <Devices devices={MOCK_DEVICES} onSelectDevice={handleSelectDevice} />
        )}
      </main>
    </div>
  );
}
