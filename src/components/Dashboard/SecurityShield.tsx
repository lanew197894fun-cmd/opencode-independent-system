import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import {
  Shield,
  Wifi,
  Clock,
  Lock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SecurityStatus {
  vpn_enabled: boolean;
  monitor_enabled: boolean;
  rdp_protection: boolean;
  active_threats: number;
  blocked_ips: string[];
  last_check: string;
}

export function SecurityShield() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const result = await invoke<SecurityStatus>("get_security_status");
      setStatus(result);
    } catch (error) {
      console.error("獲取安全狀態失敗:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableFullProtection = async () => {
    setLoading(true);
    try {
      await invoke("enable_full_protection");
      await fetchStatus();
    } catch (error) {
      console.error("啟用防護失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-dark-700 rounded-2xl border border-dark-500 p-4">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl border border-blue-500/30 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 標題區 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-400" />
          <span className="text-sm font-medium text-white">
            🛡️ 三層防護系統
          </span>
        </div>
        <button
          onClick={handleEnableFullProtection}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-xs text-white rounded-lg transition-colors"
        >
          {loading ? "啟用中..." : "一鍵啟用"}
        </button>
      </div>

      {/* 三層防護狀態 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* 第一層：VPN */}
        <div
          className={`flex flex-col items-center p-2 rounded-lg ${
            status.vpn_enabled
              ? "bg-green-900/30 border border-green-500/30"
              : "bg-red-900/30 border border-red-500/30"
          }`}
        >
          <Wifi
            size={16}
            className={status.vpn_enabled ? "text-green-400" : "text-red-400"}
          />
          <span className="text-xs text-gray-300 mt-1">VPN</span>
          <span
            className={`text-xs ${status.vpn_enabled ? "text-green-400" : "text-red-400"}`}
          >
            {status.vpn_enabled ? "啟用" : "停用"}
          </span>
        </div>

        {/* 第二層：24小時監控 */}
        <div
          className={`flex flex-col items-center p-2 rounded-lg ${
            status.monitor_enabled
              ? "bg-green-900/30 border border-green-500/30"
              : "bg-red-900/30 border border-red-500/30"
          }`}
        >
          <Clock
            size={16}
            className={
              status.monitor_enabled ? "text-green-400" : "text-red-400"
            }
          />
          <span className="text-xs text-gray-300 mt-1">24小時監控</span>
          <span
            className={`text-xs ${status.monitor_enabled ? "text-green-400" : "text-red-400"}`}
          >
            {status.monitor_enabled ? "運行中" : "停止"}
          </span>
        </div>

        {/* 第三層：RDP防護 */}
        <div
          className={`flex flex-col items-center p-2 rounded-lg ${
            status.rdp_protection
              ? "bg-green-900/30 border border-green-500/30"
              : "bg-red-900/30 border border-red-500/30"
          }`}
        >
          <Lock
            size={16}
            className={
              status.rdp_protection ? "text-green-400" : "text-red-400"
            }
          />
          <span className="text-xs text-gray-300 mt-1">RDP防護</span>
          <span
            className={`text-xs ${status.rdp_protection ? "text-green-400" : "text-red-400"}`}
          >
            {status.rdp_protection ? "啟用" : "停用"}
          </span>
        </div>
      </div>

      {/* 威脅統計 */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-yellow-400" />
          <span>活躍威脅: {status.active_threats}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-green-400" />
          <span>封鎖IP: {status.blocked_ips.length}</span>
        </div>
      </div>

      {/* 最後檢查時間 */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        最後檢查: {new Date(status.last_check).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}
