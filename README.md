# 食物大考驗 - 影片與答題系統

## 檔案結構
```
20251030-main/
├── index.html          # 主頁面
├── styles.css          # 樣式表
├── script.js           # 頁面切換邏輯
├── sketch.js           # p5.js 答題程式
├── video.mp4           # 影片檔案（需自行放置）
└── README.md           # 本說明檔
```

## 使用方法

### 1. 準備影片檔案
- 將你的影片檔案（支援 MP4、WebM、Ogg 格式）放在同一資料夾
- 重新命名為 `video.mp4`（或修改 index.html 中的 src 路徑）

### 2. 本地測試
```bash
# 使用 Python 啟動本機 HTTP server
python -m http.server 8000

# 或用 Node.js
npx http-server
```
然後訪問 `http://localhost:8000`

### 3. 部署到 Moodle
- 將所有檔案打包成 ZIP
- 上傳到 Moodle 的「文件」或「資源」區域
- 或嵌入到 HTML 區塊中

## 支援的影片格式
- **MP4** (.mp4) - 推薦，相容性最好
- **WebM** (.webm) - 開源格式
- **Ogg** (.ogg) - 開源格式

## 修改影片檔名
若影片檔名不是 `video.mp4`，編輯 `index.html` 第 13 行：
```html
<source src="your-video-name.mp4" type="video/mp4">
```

## 功能說明
1. **播放影片** - 點擊影片下方的播放按鈕或控制列
2. **開始答題** - 按下影片右下角的「開始答題」按鈕
3. **作答** - 點擊選項提交答案
4. **查看分數** - 完成所有題目後顯示成績
5. **重新測驗** - 返回影片或重新開始答題

## 瀏覽器相容性
- Chrome / Edge：完全支援
- Firefox：完全支援
- Safari：完全支援
- IE 11：不支援
