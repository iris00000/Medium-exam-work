# Moodle SCORM 課程部署指南

## 📋 部署前檢查清單

### 檔案結構確認
```
✓ imsmanifest.xml          (必需) - SCORM 課程清單
✓ index.html               (必需) - 主頁面
✓ styles.css               (必需) - 樣式
✓ script.js                (必需) - 頁面控制
✓ sketch.js                (必需) - 答題程式
✓ scorm_api_wrapper.js     (必需) - SCORM API
✓ video.mp4                (可選) - 教學影片
```

### Moodle 系統要求
- ✓ Moodle 3.0 或更高版本
- ✓ SCORM 模組已啟用 (通常預設啟用)
- ✓ PHP 7.0+
- ✓ 足夠的儲存空間 (影片大小 + 課程檔案)

---

## 🔧 部署步驟

### 第 1 步：準備 SCORM 課程包

#### Windows 用戶：
```powershell
# 進入課程資料夾
cd "C:\Users\User\Downloads\20251030-main\20251030-main"

# 建立 ZIP 檔案 (所有檔案在根目錄)
# 確保 imsmanifest.xml 在 ZIP 的最頂層

# 使用 PowerShell (Windows 10/11)
Compress-Archive -Path @(
    "imsmanifest.xml",
    "index.html",
    "styles.css",
    "script.js",
    "sketch.js",
    "scorm_api_wrapper.js",
    "video.mp4"
) -DestinationPath "dietary-health-quiz.zip" -Force
```

#### Mac/Linux 用戶：
```bash
cd ~/Downloads/20251030-main/20251030-main
zip -r dietary-health-quiz.zip imsmanifest.xml index.html styles.css script.js sketch.js scorm_api_wrapper.js video.mp4
```

### 第 2 步：上傳到 Moodle

1. **登入 Moodle** → 進入課程
2. **開啟編輯模式** (右上角「編輯」按鈕)
3. **新增活動/資源** → 選擇 **SCORM/AICC**
4. **設定名稱** 
   - 活動名稱：「飲食與健康知識大考驗」
5. **上傳套件**
   - 點擊「選擇檔案」
   - 選擇 `dietary-health-quiz.zip`
   - 點擊「上傳」
6. **設定完成要求** (可選)
   - ☑ 完成時標記為已完成
   - 最低分數：60 (及格)
7. **保存並顯示**

### 第 3 步：測試課程

1. **以學生身份檢視**
   - 點擊「以學生身份檢視此課程」
2. **進行完整測試**
   - 播放影片
   - 點擊「開始答題」
   - 完成所有 6 道題目
   - 查看成績
3. **檢查成績記錄**
   - 返回課程
   - 檢查「成績」報告
   - 應該看到你的成績和時間記錄

---

## 📊 成績記錄系統

### 自動記錄項目
- ✅ **成績** (0-100 分)
- ✅ **通過/不通過** (60 分及格)
- ✅ **作答次數** (允許多次嘗試)
- ✅ **作答時間** (完整的時間戳記)
- ✅ **課程狀態** (已完成/未完成)

### Moodle 成績簿檢視
1. 進入課程 → **成績**
2. 選擇「飲食與健康知識大考驗」
3. 查看：
   - 學生名單
   - 各學生分數
   - 作答時間
   - 作答次數

### 導出成績報告
1. 成績頁面 → **匯出** 
2. 選擇格式 (Excel/CSV)
3. 包含內容：
   - 學生 ID
   - 姓名
   - 成績
   - 通過/不通過
   - 日期時間

---

## 🐛 常見問題排解

### 問題 1：上傳後顯示「無效的 SCORM 套件」
**解決方案：**
- 確保 `imsmanifest.xml` 在 ZIP 的最頂層
- 不要在 ZIP 中建立子資料夾
- 檢查 XML 格式是否正確

### 問題 2：成績不會保存
**解決方案：**
- 確保 `scorm_api_wrapper.js` 已正確載入
- 檢查瀏覽器控制台是否有錯誤
- 嘗試用不同瀏覽器 (Chrome/Firefox)
- 清除快取並重新整理

### 問題 3：影片無法播放
**解決方案：**
- 確保 `video.mp4` 已上傳到 ZIP
- 檢查檔案格式 (建議用 MP4 H.264 編碼)
- 如果檔案很大，檢查 Moodle 上傳限制設定

### 問題 4：p5.js 無法載入
**解決方案：**
- 檢查網路連線 (需要訪問 CDN)
- 或下載 p5.js 並放在本地

---

## 📝 監控學生進度

### 查看單個學生報告
1. 進入課程 → **參與者**
2. 點擊學生名字
3. 點擊「飲食與健康知識大考驗」活動
4. 查看「嘗試」紀錄

### 群組統計
1. 進入課程 → **成績** → **統計資訊**
2. 查看：
   - 平均分數
   - 最高/最低分
   - 及格率
   - 完成率

---

## 🔐 安全建議

- ✓ 不要在 ZIP 中放入敏感資訊
- ✓ 定期備份課程檔案
- ✓ 只允許授權教師編輯
- ✓ 使用 HTTPS 訪問 Moodle

---

## 🚀 進階設定

### 設定重做次數限制
在 Moodle 中設定 → **活動完成追蹤**
- 最多允許嘗試: 3 (或自訂)

### 設定時間限制
在 sketch.js 中修改：
```javascript
const timeLimit = 600; // 10 分鐘 (秒)
```

### 自訂及格分數
在 scorm_api_wrapper.js 中：
```javascript
completeCourse(score, maxScore = 100, passingScore = 70); // 改為 70 分
```

---

## 📞 技術支持

如有問題，檢查：
1. Moodle 版本是否支援 SCORM 1.2
2. 瀏覽器控制台 (F12) 錯誤訊息
3. Moodle 伺服器日誌
4. SCORM 套件完整性

---

## ✅ 完成檢查

上傳後應該能：
- [ ] 進入課程看到活動
- [ ] 播放影片
- [ ] 完成答題
- [ ] 看到成績
- [ ] 成績顯示在 Moodle 成績簿
- [ ] 可以重新作答
- [ ] 所有成績都被記錄

---

**課程建立日期：** 2025-01-30  
**SCORM 版本：** 1.2  
**相容性：** Moodle 3.0+
