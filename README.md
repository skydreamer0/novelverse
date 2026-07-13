# Novelverse - 小說轉場景工作區 (Novel-to-Scene Workspace)

Novelverse 是將小說章節系統性轉化為**有證據支持、可視化且具互動性/可遊玩場景原型 (Playable Scenes)** 的協調工作區。

本專案圍繞著賽博龐克小說**《末日母艦：我的體內有個微縮文明》**（位於 `novel/` 子模組）展開，旨在透過確定性、分階段的提取管線與 Schema 格式驗證，忠實還原小說場景，並提供 2D 視覺小說與 3D WebGL 原型展示。

---

## 📂 專案目錄結構

工作區結構將小說源碼、管線定義與生成產物進行分離，實際目錄結構如下：

```text
novelverse/
├── README.md               # 本專案說明文件（繁體中文）
├── AGENTS.md               # 根目錄 AI 代理守則（工作區邊界與規則）
├── .gitignore              # Git 忽略配置
├── .gitmodules             # Git 子模組元數據
├── docs/                   # 根目錄級別的管線設計與路線文件
│   ├── roadmaps/           # 管線發展路線圖與進度紀錄
│   └── superpowers/        # 設計規格與執行計劃
└── 03_SCENE_PIPELINE/      # 場景管線與互動原型
    ├── schemas/            # 用於格式驗證的 JSON Schemas
    ├── prototypes/         # 2D 視覺小說 / 文字冒險互動原型引擎 (Vite + CSS + JS)
    └── 3d-prototype/       # 3D 第三人稱冒險原型展示 (Vite + Three.js)
```

> [!NOTE]
> `novel/` 為 Git 子模組，連結至小說專案倉庫，包含小說章節正文、閱讀器應用程式及設定資料庫 (Canon)。

---

## 🚀 快速開始

### 1. 複製專案與更新子模組
本專案依賴 Git 子模組載入小說參考源。複製倉庫時請務必遞迴載入子模組：

```bash
# 遞迴複製專案
git clone --recursive https://github.com/skydreamer0/novelverse.git
```

如果您已經直接複製了專案，請在根目錄執行以下命令初始化並更新子模組：

```bash
git submodule update --init --recursive
```

---

### 2. 執行互動原型

本工作區目前提供兩種形式的互動原型，均使用 [Vite](https://vitejs.dev/) 作為開發伺服器。

#### 🔹 2D 視覺小說/文字冒險原型 (`prototypes`)
基於 HTML/CSS/JS 構建的輕量化 2D 互動引擎，內建選擇選單 (ChoiceMenu) 與對話框 (DialogueBox)。
```bash
# 進入 2D 原型目錄
cd 03_SCENE_PIPELINE/prototypes

# 安裝依賴
npm install

# 啟動本地開發伺服器
npm run dev
```

#### 🔹 3D 第三人稱冒險原型 (`3d-prototype`)
基於 [Three.js](https://threejs.org/) 構建的 3D 虛擬場景，包含玩家移動、相機跟隨與簡易場景互動。
```bash
# 進入 3D 原型目錄
cd 03_SCENE_PIPELINE/3d-prototype

# 安裝依賴
npm install

# 啟動本地開發伺服器
npm run dev
```

啟動後，瀏覽器將提示本地伺服器網址（通常為 `http://localhost:5173/`），點擊即可預覽與互動。

---

## 🔄 小說轉場景管線流程 (Novel-to-Scene)

管線的核心哲學是**嚴格忠於小說原著**，不採用發散的單一 AI 提示詞直接生成，而是依序通過以下確定性階段：

```text
小說章節正文 ──> 證據提取 ──> 場景卡 (JSON) ──> 視覺簡報 ──> HTML 場景簡報 ──> 可遊玩場景
```

1. **小說章節正文**：最核心的真實來源（位於 `novel/01_NOVEL_CONTENT/`）。
2. **證據提取 (Evidence Pass)**：從原文中提取出支持事實、實體、節奏與空間關係的精確句子。
3. **場景卡 (Scene Card)**：生成結構化的 JSON 數據，定義角色、地點、物品與節奏，並通過 JSON Schema 驗證。
4. **視覺簡報 (Visual Brief)**：定義視覺設計細節（如色調、光影、道具分佈），並精確對照原文證據。
5. **HTML 場景簡報 (HTML Scene Brief)**：定義技術規格，包括 DOM 結構、狀態變數、顯示規則與互動邏輯（對照 `03_SCENE_PIPELINE/schemas/html-scene-brief.schema.json`）。
6. **可遊玩場景 (Playable Scene)**：基於 HTML/CSS/JS 的互動前端介面，忠實還原故事脈絡。

---

## ⚠️ 開發者與 AI 代理守則

在進行任何開發或修改前，請務必閱讀 [AGENTS.md](AGENTS.md) 與 [novel/AGENTS.md](novel/AGENTS.md) 以取得完整作業規範。

### 1. 工作區邊界 (Workspace Boundaries)
* **`novel/` 目錄**：僅作為**唯讀參考資料來源**。除非有明確指示，否則**切勿**將新的管線規格、計劃、Schema 或生成的場景卡放置於 `novel/` 目錄中。
* 所有小說本文的修改或閱讀器更新必須在 `novel/` 倉庫下獨立提交，不應直接從根目錄提交變更。

### 2. 檔案編碼規範 (Encoding Policy)
* 所有繁體中文文字檔案必須採用 **UTF-8（無 BOM）** 格式儲存。
* **嚴禁**在 Windows 環境中使用 PowerShell 的 `>`、`>>`、`Out-File` 或 `Set-Content` 來寫入或重定向中文檔案，這會導致編碼損毀（亂碼）。建議使用 Python 的 `pathlib` 進行明確編碼的讀寫。

### 3. 讀者安全政策 (Reader-Safe Policy)
* 生成供玩家遊玩的場景時，**嚴禁洩漏**未來章節的走向、作者草稿筆記或 AI 處理流程相關的描述語句。
