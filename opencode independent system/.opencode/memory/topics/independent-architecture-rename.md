## fact: 獨立架構命名變更.從計散機演變而來.避免混淆正式命名

## decision: 命名原則.系統正式名稱用「獨立架構」.英文簡寫 ia

## fact: 獨立架構曾用名.計散機|ji-san-ji|JiSanJi|計算機

## fact: 類別命名對照表

- JiSanJiSystem → IndependentArchitectureSystem
- JiSanJiCLI → IndependentArchitectureCLI

## fact: 目錄命名對照表

- 資料夾: ji-san-ji/ → independent-architecture/
- 配置目錄: ~/.ji-san-ji/ → ~/.independent-architecture/
- Skill: independent-debug → independent-architecture
- Skill: ji-san-ji-debug → independent-architecture-debug

## fact: log service 命名規範

- 格式: independent-architecture-{module}
- 模組: system|model|knowledge|memory|monitor|search|problem-solver|security

## decision: Skill命名規範.功能類型-子功能.例:independent-architecture|independent-architecture-debug

## fact: 文檔命名對照

- JI_SAN_JI_FRAMEWORK.md → INDEPENDENT_ARCHITECTURE_FRAMEWORK.md

## decision: 重構後驗證方式.用grep確認無殘留舊名.命令:grep -r "ji-san-ji|JiSanJi|計散機|計算機"

## decision: 架構命名原則.先有代號後正名.避免代號殘留造成混淆

## fact: 獨立架構起源.初期以計算機功能測試.後演變完整AI系統

## decision: 知識庫格式.fact:事實|decision:原則|用|分隔多值

## decision: 知識庫目的.供AI跨對話學習.格式需結構化易解析
