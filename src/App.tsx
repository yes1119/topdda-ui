import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import DeviceDetail from "./components/DeviceDetail";
import Devices from "./components/Devices";
import Report from "./components/Report";
import Inbox from "./components/Inbox";
import { MOCK_DEVICES, MOCK_FEED, MOCK_HISTORY } from "./mockData";

type Page = "dashboard" | "live" | "devices" | "report" | "inbox";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [liveDevice, setLiveDevice] = useState<string>(MOCK_DEVICES[0].id);

  function handleSelectDevice(id: string) {
    setLiveDevice(id);
    setPage("live");
  }

  const device = MOCK_DEVICES.find((d) => d.id === liveDevice) ?? MOCK_DEVICES[0];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "#111827" }}>
      <Sidebar
        devices={MOCK_DEVICES}
        currentPage={page}
        onNavigate={setPage}
      />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {page === "dashboard" && (
          <Dashboard devices={MOCK_DEVICES} feed={MOCK_FEED} onSelectDevice={handleSelectDevice} />
        )}
        {page === "live" && (
          <DeviceDetail
            devices={MOCK_DEVICES}
            device={device}
            selectedId={liveDevice}
            onSelectDevice={setLiveDevice}
            history={MOCK_HISTORY[device.id] ?? []}
          />
        )}
        {page === "devices" && (
          <Devices devices={MOCK_DEVICES} onSelectDevice={handleSelectDevice} />
        )}
        {page === "inbox" && (
          <Inbox feed={MOCK_FEED} />
        )}
        {page === "report" && (
          <Report devices={MOCK_DEVICES} feed={MOCK_FEED} />
        )}
      </main>
    </div>
  );
}
