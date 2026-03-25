#!/usr/bin/env node

import { SecurityShield } from "./security-shield";

async function main() {
  console.clear();
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║        VPN × 24靈 × RDP 安全防護系統 v1.0.0            ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log();

  const shield = new SecurityShield();

  console.log("🛡️  安全防護系統已就緒\n");

  console.log("═".repeat(60));
  console.log("📊 系統狀態");
  console.log("═".repeat(60));

  const status = shield.getStatus();
  console.log(`🔐 VPN 狀態: ${status.vpnEnabled ? "✅ 啟用" : "❌ 關閉"}`);
  console.log(`🧠 24靈核心: ${status.guardEnabled ? "✅ 運作中" : "❌ 關閉"}`);
  console.log(`💻 RDP 防護: ${status.rdpProtection ? "✅ 啟用" : "❌ 關閉"}`);
  console.log(`📝 審計日誌: ${status.auditEnabled ? "✅ 啟用" : "❌ 關閉"}`);
  console.log(`🔗 VPN IP 範圍: ${status.vpnSubnet}`);

  console.log("\n═".repeat(60));
  console.log("🧪 連線測試");
  console.log("═".repeat(60));

  const testConnections = [
    { ip: "10.8.0.2", expected: "允許" },
    { ip: "192.168.1.100", expected: "拒絕" },
    { ip: "8.8.8.8", expected: "拒絕" },
  ];

  for (const conn of testConnections) {
    const result = shield.checkConnection(conn.ip);
    const icon = result.allowed === (conn.expected === "允許") ? "✅" : "❌";
    console.log(`\n${icon} 來源: ${conn.ip}`);
    console.log(`   結果: ${result.allowed ? "允許" : "拒絕"}`);
    console.log(`   風險分數: ${result.riskScore}`);
    console.log(`   原因: ${result.reason}`);
  }

  console.log("\n═".repeat(60));
  console.log("⚔️ RDP 模擬攔截測試");
  console.log("═".repeat(60));

  const rdpTests = [
    { ip: "10.8.0.2", action: "RDP", expected: "允許" },
    { ip: "203.0.113.50", action: "RDP", expected: "阻擋" },
  ];

  for (const test of rdpTests) {
    const result = shield.enforceRdp(test.ip, test.action);
    const icon = result.blocked === (test.expected === "阻擋") ? "✅" : "❌";
    console.log(`\n${icon} ${test.action} 從 ${test.ip}`);
    console.log(`   動作: ${result.blocked ? "🚫 阻擋" : "✅ 放行"}`);
    if (result.audit) {
      console.log(`   審計 ID: ${result.audit.id}`);
    }
  }

  console.log("\n═".repeat(60));
  console.log("📋 最近的審計日誌");
  console.log("═".repeat(60));

  const logs = shield.getRecentLogs(5);
  for (const log of logs) {
    const icon = log.action.includes("DENY") ? "🚫" : "✅";
    console.log(`\n${icon} [${log.timestamp}]`);
    console.log(`   VPN IP: ${log.vpnIp}`);
    console.log(`   動作: ${log.action}`);
    console.log(`   風險: ${log.riskScore}`);
    console.log(`   原因: ${log.reason}`);
  }

  console.log("\n═".repeat(60));
  console.log("✅ 測試完成");
  console.log("═".repeat(60));

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n💡 可用指令:");
  console.log("   :status   - 顯示系統狀態");
  console.log("   :check <IP> - 檢查連線");
  console.log("   :rdp <IP> - 模擬 RDP 連線");
  console.log("   :logs    - 顯示審計日誌");
  console.log("   :exit    - 結束程式\n");

  const prompt = () => {
    rl.question("🤖 請輸入指令: ", async (input) => {
      const cmd = input.trim().toLowerCase();

      if (cmd === ":exit" || cmd === "exit" || cmd === "q") {
        console.log("\n👋 安全防護系統關閉");
        rl.close();
        process.exit(0);
      } else if (cmd === ":status") {
        const s = shield.getStatus();
        console.log("\n📊 系統狀態:");
        console.log(`   VPN: ${s.vpnEnabled ? "✅" : "❌"}`);
        console.log(`   24靈: ${s.guardEnabled ? "✅" : "❌"}`);
        console.log(`   RDP: ${s.rdpProtection ? "✅" : "❌"}`);
        console.log(`   審計: ${s.auditEnabled ? "✅" : "❌"}`);
        prompt();
      } else if (cmd.startsWith(":check ")) {
        const ip = input.slice(7).trim();
        const result = shield.checkConnection(ip);
        console.log(`\n🔍 ${ip} 檢查結果:`);
        console.log(`   允許: ${result.allowed ? "✅" : "❌"}`);
        console.log(`   風險分數: ${result.riskScore}`);
        console.log(`   原因: ${result.reason}`);
        prompt();
      } else if (cmd.startsWith(":rdp ")) {
        const ip = input.slice(5).trim();
        const result = shield.enforceRdp(ip, "RDP");
        console.log(`\n🔐 RDP ${ip}:`);
        console.log(`   結果: ${result.blocked ? "🚫 阻擋" : "✅ 放行"}`);
        if (result.audit) {
          console.log(`   審計 ID: ${result.audit.id}`);
        }
        prompt();
      } else if (cmd === ":logs") {
        const logs = shield.getRecentLogs(10);
        console.log("\n📋 審計日誌:");
        for (const log of logs) {
          const icon = log.action.includes("DENY") ? "🚫" : "✅";
          console.log(
            `   ${icon} ${log.timestamp} ${log.vpnIp} ${log.action} (風險: ${log.riskScore})`,
          );
        }
        prompt();
      } else {
        console.log("\n❌ 未知指令");
        prompt();
      }
    });
  };

  prompt();
}

main().catch(console.error);
