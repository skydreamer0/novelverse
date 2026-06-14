# 設計規格書：Novel-to-Scene Extraction

**日期**：2026-06-14
**狀態**：草案
**背景**：建立「小說文本 → 場景理解 → 視覺化規格 → 可互動 HTML / 遊戲式場景」的第一階段。小說正文與正典資料會持續改稿，因此第一階段只做有來源證據的抽取規格，不直接生成最終畫面。

---

## 1. 核心目標

- **從第 1 章開始**：以 `novel/01_NOVEL_CONTENT/01_第一卷_艙底種火/第01章_欠稅通知.md` 作為第一個樣本。
- **Extraction-first**：先產出章節級 Scene Card，再延伸到 Visual Brief 與 HTML Scene Brief。
- **證據優先**：Scene Card 的角色、地點、物件、氛圍、互動候選都必須能追溯到章節原文或有效正典資料。
- **適應改稿**：Scene Card 是可重建的衍生資料，不取代小說正文、`STATE.md`、`CANON_*` 或 `VOLUMES/`。
- **避免劇透與亂補**：抽取器只能使用目前指定章節、已允許的正典範圍與明確來源，不把後卷真相提前寫入第 1 章場景。

## 2. 資料源優先級

第一階段採用下列資料源順序：

1. **章節正文**：`novel/01_NOVEL_CONTENT/**/第NN章_*.md`。這是 Scene Card 的主要證據來源。
2. **卷架構**：`novel/02_PROJECT_DATABASE/VOLUMES/volNN.md`。用於確認章節在該卷中的功能定位，但不覆蓋正文細節。
3. **當前狀態**：`novel/02_PROJECT_DATABASE/STATE.md`。用於理解全書進度與版本，但抽第 1 章時不得把後續揭露灌入讀者可見欄位。
4. **正典主檔**：`CANON_world.md`、`CANON_characters.md`、`CANON_power.md`。只作校準與維護追溯，必須標明是 canon support，不可無證據地改寫正文場景。
5. **封存資料**：`novel/02_PROJECT_DATABASE/04_ARCHIVE/` 不作為現行故事證據，除非使用者明確要求查舊案。

## 3. 第一階段範圍

### 3.1 In Scope

- 定義 `chapter_scene_card` schema。
- 以第 1 章產出一張章節級 Scene Card。
- 每張 chapter card 可包含 2-5 個 `sceneBeats`，第 1 章預期包含：
  - 艙底第九維修段修復氧氣管線。
  - 公共終端發布四十點生存貢獻需求與七十二小時限期。
  - 黑市中林燼向蘇嵐接下裂縫回收任務。
  - 前往第七投放帶，進入裂縫任務前置。
- 每個 scene beat 至少附一條 `evidence`。
- 建立 Visual Brief 的種子欄位，但不要求本階段生成 HTML。

### 3.2 Out of Scope

- 不修改小說正文。
- 不修改 reader UI、PWA 或 `reader/public-dossier/`。
- 不建立完整遊戲引擎或互動系統。
- 不自動生成圖片資產。
- 不把第 1 章拆成完整場景資料庫；場景級卡片留到 schema 穩定後再做。

## 4. Scene Card Schema

第一版 schema 以 JSON 為主。建議後續實作將衍生資料放在 `03_SCENE_PIPELINE/scene-cards/`，讓它與小說正文、內部正典、讀者公開資料層分開；正式路徑仍由 implementation plan 最終確認。建議結構如下：

```json
{
  "schemaVersion": "novel-scene-card.v1",
  "cardType": "chapter_scene_card",
  "chapter": 1,
  "title": "欠稅通知",
  "sourcePath": "novel/01_NOVEL_CONTENT/01_第一卷_艙底種火/第01章_欠稅通知.md",
  "sourceHash": "sha256-later",
  "storyTime": "七十二小時清退倒數開始",
  "primaryViewpoint": "林燼",
  "locations": [],
  "characters": [],
  "objects": [],
  "institutions": [],
  "sceneBeats": [],
  "visualBriefSeeds": {},
  "interactionSeeds": [],
  "spoilerPolicy": {
    "readerVisibleUntilChapter": 1,
    "allowedCanonDepth": "chapter-local"
  },
  "evidence": []
}
```

## 5. Field Definitions

| 欄位 | 用途 |
| --- | --- |
| `schemaVersion` | 後續改 schema 時避免舊卡片不可辨識。 |
| `cardType` | 第一階段固定為 `chapter_scene_card`。 |
| `chapter` / `title` / `sourcePath` | 明確對應原文章節。 |
| `sourceHash` | 用於偵測章節改稿後 Scene Card 是否需要重建。 |
| `storyTime` | 章節內的劇情時間或狀態錨點，不等於檔案修改時間。 |
| `primaryViewpoint` | 本章主要感知主體。第 1 章為林燼。 |
| `locations` | 場景地點，只收原文或正典支持的名稱。 |
| `characters` | 本章出場或被明確提及、對場景有作用的角色。 |
| `objects` | 可視覺化或可互動的重要物件。 |
| `institutions` | 審計局、黑市、刀犬幫等制度或組織。 |
| `sceneBeats` | 章節中的主要場景節拍，每個 beat 包含目的、空間、行動與證據。 |
| `visualBriefSeeds` | 色彩、光線、氣味、材質、構圖等後續視覺 brief 種子。 |
| `interactionSeeds` | 可互動元素候選，例如點擊欠稅紅字、查看腕環、接取晶片。 |
| `spoilerPolicy` | 限制抽取器不要將後續章節真相提前放進第 1 章讀者可見輸出。 |
| `evidence` | 卡片層級的來源證據清單。細節欄位也可各自掛 evidence id。 |

## 6. Evidence Model

每條 evidence 至少包含：

```json
{
  "id": "ev-ch001-001",
  "sourcePath": "novel/01_NOVEL_CONTENT/01_第一卷_艙底種火/第01章_欠稅通知.md",
  "locator": {
    "type": "text-anchor",
    "anchor": "氧氣味是甜的。"
  },
  "quote": "氧氣味是甜的。",
  "supports": ["visualBriefSeeds.mood", "locations[0]"],
  "confidence": "high"
}
```

第一版使用 `text-anchor`，避免中文檔案在不同工具中行號漂移。後續可加 `lineRange` 或段落 index，但不作為唯一定位依據。

## 7. 第 1 章預期抽取結果

第 1 章的 Scene Card 應能穩定抽出：

- **主要視角**：林燼。
- **核心狀態**：四十點生存貢獻需求、七十二小時限期、清退/回收序列威脅。
- **地點**：艙底第九維修段、公共終端、黑市、第七投放帶。
- **角色**：林燼、程領班、蘇嵐、賀鐵（任務帶隊者，提及但未必出場）。
- **物件**：半截扳手、腕環、公共終端、透明晶片、灰藍色藥劑、義腿。
- **機構/勢力**：轉化區審計局、刀犬幫、黑市。
- **視覺質地**：低氧、冷凝水、鏽蝕、紫色 LED、病態終端紅字、寒冷投放帶。
- **互動候選**：檢查腕環欠稅通知、查看終端公告、接取任務晶片、翻看裂縫回收備註。

## 8. Data Flow

```text
chapter markdown
  ↓
chapter parser
  ↓
candidate extractor
  ↓
canon support lookup
  ↓
chapter_scene_card.json
  ↓
visual brief / html scene brief（後續階段）
```

抽取流程應保留兩種輸出：

- **reader-safe fields**：可給讀者或互動場景使用，不含後續劇透。
- **internal fields**：維護用來源、canon support、confidence、重建狀態，不直接顯示給讀者。

## 9. Error Handling

- 找不到章節檔：回報 missing source，不產卡。
- 章節 hash 改變：標記 card stale，需要重建。
- 正典支持與正文衝突：正文優先，並在 `warnings` 記錄 canon conflict。
- evidence 缺失：該欄位不得進入 reader-safe 輸出。
- 抽取信心不足：保留在 internal candidate，不進入正式 Scene Card。

## 10. Testing And Acceptance

第一階段驗收以第 1 章為準：

- `chapter_scene_card` 通過 schema 驗證。
- 每個 `sceneBeat` 至少有 1 條 evidence。
- `characters`、`locations`、`objects` 中每個正式項目至少有 1 條 evidence 或 canon support。
- reader-safe fields 不包含「伏筆」「後續揭露」「V7 才揭露」「作者需注意」「AI 續寫」等後設語。
- 改動第 1 章內容後，`sourceHash` 能使 card 被標記為 stale。
- 不讀取 `04_ARCHIVE/` 作為現行證據。

## 11. Follow-up Phases

1. **Implementation Plan**：建立最小 CLI 或 script，從第 1 章產生 Scene Card。
2. **Chapter Batch**：第 1-5 章批次抽取，檢查 schema 是否承受不同章節型態。
3. **Scene-level Split**：當章節級 card 穩定後，把第 1 章拆成多張 scene cards。
4. **Visual Brief Generator**：從 Scene Card 生成可審核的視覺 brief。
5. **HTML Scene Prototype**：挑第 1 章其中一個 scene beat 生成可互動 HTML 原型。
