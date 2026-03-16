// VPN × 24靈 × RDP 安全防護系統

export interface ConnectionResult {
  allowed: boolean;
  riskScore: number;
  reason: string;
  sessionId?: string;
}

export interface RdpEnforceResult {
  blocked: boolean;
  reason: string;
  audit?: AuditLog;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  vpnIp: string;
  action: string;
  riskScore: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface ShieldStatus {
  vpnEnabled: boolean;
  guardEnabled: boolean;
  rdpProtection: boolean;
  auditEnabled: boolean;
  vpnSubnet: string;
}

export class SecurityShield {
  private vpnSubnet = "10.8.0.0/24";
  private auditLogs: AuditLog[] = [];
  private sessions: Map<string, SessionContext> = new Map();

  constructor() {
    console.log("[24靈] 安全防護系統初始化");
    console.log(`[VPN] VPN 子網: ${this.vpnSubnet}`);
    console.log("[24靈] 風險評分引擎就緒");
    console.log("[RDP] RDP 攔截器已註冊");
    console.log("[審計] 審計日誌系統啟動");
  }

  getStatus(): ShieldStatus {
    return {
      vpnEnabled: true,
      guardEnabled: true,
      rdpProtection: true,
      auditEnabled: true,
      vpnSubnet: this.vpnSubnet,
    };
  }

  // 連線檢查
  checkConnection(sourceIp: string): ConnectionResult {
    const riskScore = this.calculateRiskScore(sourceIp);
    const allowed = riskScore < 70;

    const result: ConnectionResult = {
      allowed,
      riskScore,
      reason: allowed ? "風險分數低於閾值" : "風險分數過高",
    };

    // 記錄審計日誌
    this.writeAudit({
      timestamp: new Date().toISOString(),
      vpnIp: sourceIp,
      action: allowed ? "CONN_ALLOW" : "CONN_DENY",
      riskScore,
      reason: result.reason,
    });

    return result;
  }

  // RDP 強制執行
  enforceRdp(sourceIp: string, action: string): RdpEnforceResult {
    const isFromVpn = this.isVpnIp(sourceIp);
    const riskScore = this.calculateRiskScore(sourceIp);

    let blocked = false;
    let reason = "";

    if (!isFromVpn) {
      blocked = true;
      reason = "非 VPN 來源，拒絕 RDP 連線";
    } else if (riskScore >= 70) {
      blocked = true;
      reason = `風險分數過高 (${riskScore})，自動阻擋`;
    } else {
      reason = "VPN 來源且風險分數正常，放行";
    }

    const audit = this.writeAudit({
      timestamp: new Date().toISOString(),
      vpnIp: sourceIp,
      action: blocked ? "RDP_DENY" : "RDP_ALLOW",
      riskScore,
      reason,
      metadata: { actionType: action },
    });

    return { blocked, reason, audit };
  }

  // 風險評分計算
  private calculateRiskScore(sourceIp: string): number {
    let score = 0;

    // 1. VPN 來源檢查
    if (!this.isVpnIp(sourceIp)) {
      score += 50;
    }

    // 2. IP 異常檢查
    if (this.isPrivateIp(sourceIp) && !this.isVpnIp(sourceIp)) {
      score += 20;
    }

    // 3. 未知來源
    if (sourceIp === "unknown" || sourceIp === "") {
      score += 30;
    }

    return Math.min(score, 100);
  }

  // 判斷是否為 VPN IP
  private isVpnIp(ip: string): boolean {
    const [baseIp] = this.vpnSubnet.split("/");
    const vpnBase = baseIp.split(".").slice(0, 3).join(".");
    return ip.startsWith(vpnBase + ".");
  }

  // 判斷是否為私有 IP
  private isPrivateIp(ip: string): boolean {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    return false;
  }

  // 寫入審計日誌
  private writeAudit(log: Omit<AuditLog, "id">): AuditLog {
    const auditLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.auditLogs.push(auditLog);

    // 保持日誌數量在合理範圍
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-500);
    }

    return auditLog;
  }

  // 取得最近審計日誌
  getRecentLogs(count: number = 10): AuditLog[] {
    return this.auditLogs.slice(-count);
  }

  // 取得審計日誌
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }
}

// Session 上下文
interface SessionContext {
  vpnIp: string;
  userId: string;
  connectTime: Date;
  riskScore: number;
  state: "ALLOW" | "WATCH" | "DENY";
}
