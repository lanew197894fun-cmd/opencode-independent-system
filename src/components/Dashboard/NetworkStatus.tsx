import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import {
  Wifi,
  WifiOff,
  Monitor,
  RefreshCw,
  Settings,
  Save,
  X,
  Trash2,
  Search,
  Smartphone,
  Signal,
} from "lucide-react";

interface NetworkStatusProps {
  refreshInterval?: number;
}

const ROUTER_BRANDS = [
  { name: "ASUS (常見)", defaultIP: "192.168.1.1", url: "router.asus.com" },
  { name: "ASUS (新機)", defaultIP: "192.168.50.1", url: "192.168.50.1:8443" },
  { name: "TP-Link", defaultIP: "192.168.0.1", url: "tplinkwifi.net" },
  { name: "Netgear", defaultIP: "192.168.0.1", url: "routerlogin.net" },
  { name: "Linksys", defaultIP: "192.168.1.1", url: "linksyssmartwifi.com" },
  { name: "D-Link", defaultIP: "192.168.0.1", url: "dlinkrouter.local" },
  { name: "小米", defaultIP: "192.168.31.1", url: "miwifi.com" },
  { name: "華為", defaultIP: "192.168.1.1", url: "huaweihome.com" },
  { name: "自定義", defaultIP: "", url: "" },
];

interface GatewayInfo {
  ip: string;
  interface: string;
  is_default: boolean;
}

interface WifiStatus {
  connected: boolean;
  ssid: string;
  signal_strength: number;
  ip_address: string;
}

export function NetworkStatus({ refreshInterval = 5000 }: NetworkStatusProps) {
  const [routerStatus, setRouterStatus] = useState<boolean | null>(null);
  const [serverPortStatus, setServerPortStatus] = useState<boolean | null>(
    null,
  );
  const [wifiStatus, setWifiStatus] = useState<WifiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [routerIP, setRouterIP] = useState("192.168.50.1");
  const [serverPort, setServerPort] = useState("18789");
  const [selectedBrand, setSelectedBrand] = useState("ASUS (新機)");
  const [settingsModified, setSettingsModified] = useState(false);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [showGatewayList, setShowGatewayList] = useState(false);

  const checkNetwork = async () => {
    setLoading(true);
    try {
      const router = await invoke<boolean>("check_router_status", {
        gatewayIp: routerIP,
      });
      setRouterStatus(router);

      const server = await invoke<boolean>("check_server_port", {
        host: "127.0.0.1",
        port: parseInt(serverPort),
        timeoutMs: 2000,
      });
      setServerPortStatus(server);

      try {
        const wifi = await invoke<WifiStatus>("get_wifi_status");
        setWifiStatus(wifi);
      } catch {
        setWifiStatus(null);
      }

      setLastCheck(new Date());
    } catch (error) {
      console.error("網路偵測失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    const selected = ROUTER_BRANDS.find((b) => b.name === brand);
    if (selected) {
      setRouterIP(selected.defaultIP);
    }
    setSettingsModified(true);
  };

  const handleRouterIPChange = (value: string) => {
    setRouterIP(value);
    setSelectedBrand("自定義");
    setSettingsModified(true);
  };

  const handleServerPortChange = (value: string) => {
    setServerPort(value);
    setSettingsModified(true);
  };

  const handleSaveSettings = () => {
    setShowSettings(false);
    setSettingsModified(false);
    checkNetwork();
  };

  const handleCancelSettings = () => {
    setSelectedBrand("ASUS (新機)");
    setRouterIP("192.168.50.1");
    setServerPort("18789");
    setSettingsModified(false);
    setShowSettings(false);
  };

  const handleAutoDetect = async () => {
    try {
      const allGateways = await invoke<GatewayInfo[]>("get_all_gateways");
      setGateways(allGateways);
      setShowGatewayList(true);
    } catch {
      // 降級到單一網關偵測
      try {
        const gateway = await invoke<string>("get_default_gateway");
        if (gateway) {
          setRouterIP(gateway);
          setSelectedBrand("自定義");
          setSettingsModified(true);
        }
      } catch {
        console.error("自動偵測失敗");
      }
    }
  };

  const handleSelectGateway = (gateway: GatewayInfo) => {
    setRouterIP(gateway.ip);
    setSelectedBrand("自定義");
    setSettingsModified(true);
    setShowGatewayList(false);
  };

  const handleRepair = async () => {
    try {
      await invoke("repair_network_status");
      checkNetwork();
    } catch (error) {
      console.error("網路修復失敗:", error);
    }
  };

  const handleDeleteConfig = () => {
    setRouterIP("");
    setServerPort("");
    setSelectedBrand("自定義");
    setSettingsModified(true);
  };

  useEffect(() => {
    checkNetwork();
    const interval = setInterval(checkNetwork, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <motion.div
      className="bg-dark-700 rounded-2xl border border-dark-500 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wifi size={18} className="text-blue-400" />
          <span className="text-sm font-medium text-white">龍蝦偵測網關</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <RefreshCw size={14} className="animate-spin text-gray-400" />
          )}
          <button
            onClick={checkNetwork}
            className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-white flex items-center gap-1"
          >
            <RefreshCw size={12} />
            重新整理
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white flex items-center gap-1"
          >
            <Settings size={12} />
            設定
          </button>
          <button
            onClick={handleRepair}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white flex items-center gap-1"
          >
            一鍵修復
          </button>
        </div>
      </div>

      {/* 狀態顯示 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 路由器狀態 */}
        <div className="flex items-center gap-2">
          {routerStatus ? (
            <Wifi size={16} className="text-green-400" />
          ) : (
            <WifiOff size={16} className="text-red-400" />
          )}
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">路由器</span>
            <span className="text-xs text-gray-500">{routerIP}</span>
            <span
              className={`text-sm ${routerStatus ? "text-green-400" : "text-red-400"}`}
            >
              {routerStatus ? "連線正常" : "無法連線"}
            </span>
          </div>
        </div>

        {/* 伺服器端口狀態 */}
        <div className="flex items-center gap-2">
          {serverPortStatus ? (
            <Monitor size={16} className="text-green-400" />
          ) : (
            <Monitor size={16} className="text-red-400" />
          )}
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">伺服器埠號</span>
            <span className="text-xs text-gray-500">:{serverPort}</span>
            <span
              className={`text-sm ${serverPortStatus ? "text-green-400" : "text-red-400"}`}
            >
              {serverPortStatus ? "監聽中" : "未監聽"}
            </span>
          </div>
        </div>

        {/* WiFi 狀態 */}
        {wifiStatus && (
          <div className="flex items-center gap-2 col-span-2 bg-dark-600 rounded-lg p-2">
            <Smartphone size={16} className="text-blue-400" />
            <div className="flex flex-col flex-1">
              <span className="text-xs text-gray-400">WiFi 連線</span>
              <span className="text-sm text-white">
                {wifiStatus.connected ? wifiStatus.ssid : "未連線"}
              </span>
            </div>
            {wifiStatus.connected && (
              <div className="flex items-center gap-1">
                <Signal
                  size={14}
                  className={
                    wifiStatus.signal_strength > 70
                      ? "text-green-400"
                      : wifiStatus.signal_strength > 30
                        ? "text-yellow-400"
                        : "text-red-400"
                  }
                />
                <span className="text-xs text-gray-400">
                  {wifiStatus.signal_strength}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 上次偵測時間 */}
      {lastCheck && (
        <div className="mt-3 text-xs text-gray-500 text-right">
          上次偵測: {lastCheck.toLocaleTimeString()}
        </div>
      )}

      {/* 設定彈窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-dark-700 rounded-2xl border border-dark-500 p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Settings size={18} />
                網路設定
              </h3>
              <button
                onClick={handleCancelSettings}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* 路由器品牌選擇 */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">
                路由器品牌
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white"
              >
                {ROUTER_BRANDS.map((brand) => (
                  <option key={brand.name} value={brand.name}>
                    {brand.name} ({brand.defaultIP || "自訂"})
                  </option>
                ))}
              </select>
            </div>

            {/* 路由器 IP */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">
                路由器 IP
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={routerIP}
                  onChange={(e) => handleRouterIPChange(e.target.value)}
                  placeholder="192.168.1.1"
                  className="flex-1 bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white"
                />
                <button
                  onClick={handleAutoDetect}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white flex items-center gap-1"
                  title="自動偵測所有網關"
                >
                  <Search size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                點擊搜尋圖示可偵測所有網關（多層路由）
              </p>
            </div>

            {/* 伺服器端口 */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">
                監控端口
              </label>
              <input
                type="number"
                value={serverPort}
                onChange={(e) => handleServerPortChange(e.target.value)}
                placeholder="18789"
                className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* 按鈕列 */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleDeleteConfig}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                刪除
              </button>
              <button
                onClick={handleCancelSettings}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white"
              >
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={!settingsModified}
                className={`flex-1 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 ${
                  settingsModified
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                <Save size={16} />
                儲存
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 網關列表彈窗 */}
      {showGatewayList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-dark-700 rounded-2xl border border-dark-500 p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Search size={18} />
                偵測到的網關
              </h3>
              <button
                onClick={() => setShowGatewayList(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">選擇要監控的路由器：</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {gateways.map((gateway, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectGateway(gateway)}
                  className="w-full bg-dark-600 hover:bg-dark-500 border border-dark-500 rounded-lg p-3 text-left flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-medium">{gateway.ip}</div>
                    <div className="text-xs text-gray-400">
                      網段: {gateway.interface || "未知"}
                    </div>
                  </div>
                  {gateway.is_default && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white">
                      預設
                    </span>
                  )}
                </button>
              ))}
            </div>

            {gateways.length === 0 && (
              <p className="text-center text-gray-400 py-4">未偵測到其他網關</p>
            )}

            <button
              onClick={() => setShowGatewayList(false)}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white"
            >
              關閉
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
