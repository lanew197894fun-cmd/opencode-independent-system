#!/usr/bin/env node

import { FraudDetector } from "./fraud-detector";

async function main() {
  console.clear();
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║           詐騙訊息偵測系統 v1.0.0                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log();

  const detector = new FraudDetector();

  console.log("📱 詐騙訊息偵測系統已就緒\n");

  const testMessages = [
    {
      text: "緊急通知：您的銀行帳號因安全威脅被鎖定，請立即點擊連結重新認證以避免損失。",
      expected: "極高風險",
    },
    {
      text: "您好，這是您上週購買的商品，請確認收貨地址是否正確。",
      expected: "安全",
    },
    {
      text: "【Netflix】您的帳號已被鎖定，請立即驗證以避免服務中斷。",
      expected: "高風險",
    },
    {
      text: "我是你同學，我急需用錢，請匯款到這個帳戶...",
      expected: "極高風險",
    },
  ];

  console.log("═".repeat(60));
  console.log("🧪 測試訊息分析");
  console.log("═".repeat(60));

  for (const msg of testMessages) {
    const result = await detector.analyze(msg.text);
    console.log(`\n📝 訊息: ${msg.text.substring(0, 40)}...`);
    console.log(`   風險分數: ${result.riskScore}`);
    console.log(`   風險等級: ${result.riskLevel}`);
    console.log(`   建議: ${result.recommendation}`);
  }

  console.log("\n═".repeat(60));
  console.log("✅ 測試完成");
  console.log("═".repeat(60));

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question(
      "\n📱 請輸入訊息進行分析 (輸入 :exit 結束): ",
      async (input) => {
        if (input.trim() === ":exit") {
          console.log("\n👋 再見！");
          rl.close();
          process.exit(0);
        }

        if (input.trim()) {
          const result = await detector.analyze(input);
          console.log("\n" + "═".repeat(60));
          console.log("📊 分析結果");
          console.log("═".repeat(60));
          console.log(`🔴 風險分數: ${result.riskScore}/100`);
          console.log(`⚠️  風險等級: ${result.riskLevel}`);
          console.log(`💡 建議: ${result.recommendation}`);
          console.log("\n📋 檢測項目:");
          result.findings.forEach((f) => {
            const icon = f.found ? "❌" : "✅";
            console.log(
              `   ${icon} ${f.type}: ${f.found ? f.details?.keywords?.join(", ") || "偵測到" : "無"}`,
            );
          });
          console.log("═".repeat(60));
        }
        prompt();
      },
    );
  };

  prompt();
}

main().catch(console.error);
