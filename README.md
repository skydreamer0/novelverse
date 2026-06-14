# Novelverse - 小說轉場景管線 (Novel-to-Scene Pipeline)

Novelverse 是 **小說轉場景 (Novel-to-Scene)** 管線的協調工作區。此管線旨在系統性地將小說章節轉化為有證據支持、可視化且具互動性/可遊玩的 HTML 場景原型。

本專案的核心哲學是**嚴格忠於小說原著**。我們不採用單一且發散的 AI 提示詞來直接生成場景，而是使用一個確定性的、分階段的提取管線，並結合嚴格的 Schema 格式驗證與讀者安全（Reader-Safe）投射。

---

## 📂 專案目錄結構

工作區的結構經過精心設計，將原始參考資料、管線定義與生成產物進行分離：

```text
novelverse/
├── README.md               # 本專案介紹與操作指引（中文版）
├── AGENTS.md               # 根目錄 AI 代理守則（工作區邊界與規則）
├── .gitignore              # Git 忽略配置檔案
├── .gitmodules             # 連結小說子倉庫的 Submodule 元數據
├── docs/                   # 根目錄級別的管線說明文件
│   ├── roadmaps/           # 管線發展路線圖與進度紀錄
│   └── superpowers/        # Superpowers 設計規格與執行計劃
│       ├── specs/
│       └── plans/
├── novel/                  # [GIT 子模組] 唯讀/可變的參考源倉庫
│                           # 包含小說正文、閱讀器應用程式及設定資料庫 (Canon)。
└── 03_SCENE_PIPELINE/      # 未來生成場景卡與原型的存放路徑
    ├── schemas/            # 用於格式驗證的 JSON Schemas
    ├── scene-cards/        # 通過驗證的章節與場景級別中介資料卡 (JSON)
    ├── reports/            # 驗證報告（追蹤雜湊值與語法檢查）
    ├── visual-briefs/      # 視覺設計簡報
    ├── html-scene-briefs/  # DOM 結構與互動 Schema 檔案
    └── prototypes/         # 可遊玩的 HTML/JS/CSS 場景模組
```

---

## 🔄 小說轉場景管線流程

管線依序由以下幾個結構化階段構成：

```
小說章節正文 ──> 證據提取 ──> 場景卡 (JSON) ──> 視覺簡報 ──> HTML 場景簡報 ──> 可遊玩場景
```

1. **小說章節正文**：最核心的真實來源（位於 `novel/01_NOVEL_CONTENT/`）。
2. **證據提取 (Evidence Pass)**：提取小說中支持事實、實體、節奏和空間關係的精確原文句子。
3. **場景卡 (Scene Card)**：生成結構化的 JSON 資料，呈現角色、地點、物品及時間節奏，並通過 JSON Schema 驗證。
4. **視覺簡報 (Visual Brief)**：定義美學細節（色調、光影、佈局、道具），並精確對照原文證據。
5. **HTML 場景簡報 (HTML Scene Brief)**：定義技術規格，包含 DOM 結構、狀態變數、顯示規則與使用者互動邏輯。
6. **可遊玩場景 (Playable Scene)**：最終基於 HTML/CSS/JS 的模組化前端互動介面，忠實呈現故事脈絡。

---

## 🛠️ 開始使用

### 複製專案 (Clone)
因為本專案使用 Git 子模組 (Submodules) 來追蹤小說參考源，請使用遞迴方式複製此倉庫：

```bash
git clone --recursive https://github.com/skydreamer0/novelverse.git
```

如果您已經在沒有載入子模組的情況下複製了專案，請執行以下命令初始化並更新子模組：

```bash
git submodule update --init --recursive
```

### 子模組作業須知
`novel/` 子目錄是一個獨立的 Git 倉庫，連結至 `https://github.com/skydreamer0/novel_ark-micro-civ.git`。
- **重要提醒**：請勿直接從根目錄對 `novel/` 子目錄提交變更。所有小說正文的修改、閱讀器應用的調整，以及設定檔案 (Canon) 的更新，都必須在 `novel/` 目錄下進行提交與推送。

---

## ⚠️ 貢獻者與 AI 代理的核心作業守則

在開始工作前，請務必閱讀 [AGENTS.md](file:///Users/george/Documents/novelverse/AGENTS.md) 與 [novel/AGENTS.md](file:///Users/george/Documents/novelverse/novel/AGENTS.md) 以取得完整指引。

1. **工作區邊界**：`novel/` 僅作為唯讀參考資料來源。除非有明確指示，否則切勿將新的管線規格、計劃、Schema 或生成的場景卡放置於 `novel/` 目錄中。
2. **檔案編碼**：所有繁體中文文字檔案必須採用 **UTF-8（無 BOM）** 格式儲存以避免亂碼。切勿在 Windows 環境中使用 PowerShell 的 `>` 或 `Out-File` 來寫入或重定向中文檔案。
3. **讀者安全 (Reader-Safe) 政策**：生成供玩家遊玩的場景時，嚴禁洩漏未來章節的走向、作者草稿筆記或 AI 處理流程相關的描述語句。
4. **證據優先 (Evidence-First)**：每一個場景描述、空間佈局或實體設定，都必須有對應的小說原文作為證據支持，否則僅能列為內部評估項目。
