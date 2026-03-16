// 詐騙訊息偵測系統

export interface FraudResult {
  riskScore: number;
  riskLevel: string;
  findings: Finding[];
  recommendation: string;
}

export interface Finding {
  type: string;
  found: boolean;
  score: number;
  details?: Record<string, unknown>;
}

export class FraudDetector {
  private urgentKeywords = [
    "緊急",
    "立即",
    "馬上",
    "立刻",
    "火速",
    "緊急處理",
    "時間緊迫",
    "最後機會",
    "錯過不再",
  ];

  private threatKeywords = [
    "帳號鎖定",
    "安全威脅",
    "資料外洩",
    "損失財產",
    "法律責任",
    "罰款",
    "刑事責任",
    "鎖定",
    "異常",
  ];

  private personalInfoKeywords = [
    "身分證",
    "身分證字號",
    "身分證號碼",
    "銀行帳號",
    "帳戶",
    "卡號",
    "信用卡",
    "密碼",
    "驗證碼",
    "OTP",
  ];

  private moneyKeywords = [
    "匯款",
    "轉帳",
    "購買點數",
    "支付",
    "手續費",
    "代收",
    "代付",
    "代購",
    "投資",
    "獲利",
  ];

  private authorityKeywords = [
    "銀行客服",
    "警政署",
    "刑事局",
    "財政部",
    "國稅局",
    "政府機關",
    "檢察官",
    "法官",
    "Netflix",
    "Google",
    "Microsoft",
    "Apple",
    "Meta",
    "AWS",
  ];

  private urgentRegex = /緊急|立即|馬上|立刻|火速|最後機會/;
  private threatRegex =
    /帳號鎖定|安全威脅|資料外洩|損失財產|法律責任|罰款|異常|鎖定/;
  private personalRegex = /身分證|銀行帳號|帳戶|卡號|信用卡|密碼|驗證碼|OTP/;
  private moneyRegex = /匯款|轉帳|購買點數|支付|手續費|代收|代付|投資|獲利/;
  private linkRegex = /https?:\/\/[\w.-]+/g;
  private shortLinkRegex = /bit\.ly|tinyurl|goo\.gl|ow\.ly/;

  async analyze(message: string): Promise<FraudResult> {
    let riskScore = 0;
    const findings: Finding[] = [];

    // 1. 緊急用語檢測
    const urgentResult = this.checkKeywords(message, this.urgentKeywords, 25);
    if (urgentResult.found) {
      riskScore += urgentResult.score;
      findings.push({ type: "緊急用語", ...urgentResult });
    }

    // 2. 威脅語句檢測
    const threatResult = this.checkKeywords(message, this.threatKeywords, 35);
    if (threatResult.found) {
      riskScore += threatResult.score;
      findings.push({ type: "威脅語句", ...threatResult });
    }

    // 3. 連結檢測
    const links = message.match(this.linkRegex) || [];
    const hasShortLinks = this.shortLinkRegex.test(message);
    if (links.length > 0 || hasShortLinks) {
      const linkScore = links.length * 15 + (hasShortLinks ? 20 : 0);
      riskScore += Math.min(linkScore, 60);
      findings.push({
        type: "陌生連結",
        found: true,
        score: linkScore,
        details: { totalLinks: links.length, hasShortLinks },
      });
    }

    // 4. 個資索取檢測
    const personalResult = this.checkKeywords(
      message,
      this.personalInfoKeywords,
      55,
    );
    if (personalResult.found) {
      riskScore += personalResult.score;
      findings.push({ type: "個資索取", ...personalResult });
    }

    // 5. 金錢要求檢測
    const moneyResult = this.checkKeywords(message, this.moneyKeywords, 65);
    if (moneyResult.found) {
      riskScore += moneyResult.score;
      findings.push({ type: "金錢要求", ...moneyResult });
    }

    // 6. 權威冒充檢測
    const authorityResult = this.checkKeywords(
      message,
      this.authorityKeywords,
      40,
    );
    if (authorityResult.found) {
      riskScore += authorityResult.score;
      findings.push({ type: "權威冒充", ...authorityResult });
    }

    // 7. 風險評估
    const riskLevel = this.assessRiskLevel(riskScore);
    const recommendation = this.getRecommendation(riskLevel);

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      findings,
      recommendation,
    };
  }

  private checkKeywords(
    text: string,
    keywords: string[],
    baseScore: number,
  ): { found: boolean; score: number; details?: Record<string, unknown> } {
    const found: string[] = [];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        found.push(keyword);
      }
    }

    if (found.length > 0) {
      const score = Math.min(baseScore + found.length * 5, baseScore + 30);
      return { found: true, score, details: { keywords: found } };
    }

    return { found: false, score: 0 };
  }

  private assessRiskLevel(score: number): string {
    if (score >= 80) return "極高風險";
    if (score >= 60) return "高風險";
    if (score >= 40) return "中等風險";
    if (score >= 20) return "低風險";
    return "安全";
  }

  private getRecommendation(level: string): string {
    const recommendations: Record<string, string> = {
      極高風險: "⚠️ 高度懷疑為詐騙訊息！請勿點擊任何連結，立即刪除並回報。",
      高風險: "⚠️ 可能是詐騙訊息！請仔細確認，勿提供任何個資或進行金錢交易。",
      中等風險: "🔍 需進一步確認！請與官方管道聯繫，勿直接回應。",
      低風險: "⚠️ 請留意！訊息內容可能有疑慮，建議提高警覺。",
      安全: "✅ 訊息內容安全，但仍建議保持警覺。",
    };
    return recommendations[level] || "請小心處理此訊息。";
  }
}
