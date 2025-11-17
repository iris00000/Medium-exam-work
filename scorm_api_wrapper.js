/**
 * SCORM API 包裝層 (SCORM 1.2)
 * 用於與 Moodle 等 SCORM 學習平台通訊
 * 
 * 功能:
 * - 初始化 SCORM 會話
 * - 記錄學生成績
 * - 追蹤學習進度
 * - 處理作答次數
 * - 計算學習時間
 */

class SCORMAPIWrapper {
    constructor() {
        this.API = null;
        this.apiInitialized = false;
        this.scoreUpdated = false;
        this.attemptCount = 0;
        this.startTime = Date.now();
        this.debugMode = true; // 開啟偵錯模式
        
        this.log('SCORM API 初始化開始...');
        this.initAPI();
    }

    /**
     * 日誌輸出函數
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('zh-TW');
        const prefix = `[${timestamp}] SCORM:`;
        
        switch (type) {
            case 'success':
                console.log(`%c${prefix} ✓ ${message}`, 'color: green; font-weight: bold;');
                break;
            case 'error':
                console.error(`%c${prefix} ✗ ${message}`, 'color: red; font-weight: bold;');
                break;
            case 'warn':
                console.warn(`%c${prefix} ⚠ ${message}`, 'color: orange; font-weight: bold;');
                break;
            default:
                console.log(`%c${prefix} ℹ ${message}`, 'color: blue;');
        }
    }

    /**
     * 初始化 SCORM API
     * 搜尋 Moodle 或其他 SCORM 播放器提供的 API
     */
    initAPI() {
        let api = null;
        
        // 方法 1: 檢查當前視窗
        if (typeof window.API !== 'undefined') {
            api = window.API;
            this.log('在當前視窗找到 API 物件');
        }
        // 方法 2: 檢查父視窗 (iframe 情況)
        else if (typeof window.parent !== 'undefined' && typeof window.parent.API !== 'undefined') {
            api = window.parent.API;
            this.log('在父視窗找到 API 物件');
        }
        // 方法 3: 遞迴搜尋父視窗鏈
        else {
            api = this.findAPI(window.parent);
        }

        if (api) {
            this.API = api;
            this.apiInitialized = true;
            this.log('SCORM API 已成功連接', 'success');
            
            // 初始化課程
            this.initializeCourse();
        } else {
            this.log('SCORM API 未找到，將以本地模式運作（不會記錄成績到平台）', 'warn');
            this.apiInitialized = false;
        }
    }

    /**
     * 遞迴搜尋 API 物件
     */
    findAPI(win, depth = 0) {
        const maxDepth = 10;
        let api = null;
        
        if (depth > maxDepth) {
            return null;
        }
        
        try {
            // 檢查當前層級
            if (typeof win.API !== 'undefined') {
                this.log(`在第 ${depth} 層找到 API 物件`);
                return win.API;
            }
            
            // 檢查父層級
            if (win.parent && win.parent !== win) {
                api = this.findAPI(win.parent, depth + 1);
            }
        } catch (e) {
            this.log(`第 ${depth} 層搜尋出錯: ${e.message}`, 'warn');
        }
        
        return api;
    }

    /**
     * 初始化課程工作階段
     */
    initializeCourse() {
        if (!this.API || !this.apiInitialized) {
            this.log('無法初始化課程: API 未就緒', 'warn');
            return;
        }

        try {
            // 通知 SCORM 平台課程已開始
            const result = this.API.LMSInitialize('');
            
            if (result === 'true') {
                this.log('課程工作階段已初始化', 'success');
                
                // 取得之前的作答次數
                const attemptStr = this.API.LMSGetValue('cmi.core.lesson_location');
                this.attemptCount = attemptStr ? parseInt(attemptStr) : 0;
                this.log(`當前作答次數: ${this.attemptCount}`);
                
                // 取得課程狀態
                const status = this.API.LMSGetValue('cmi.core.lesson_status');
                this.log(`課程狀態: ${status}`);
            } else {
                this.log('課程初始化失敗', 'error');
            }
        } catch (e) {
            this.log(`SCORM 初始化錯誤: ${e.message}`, 'error');
        }
    }

    /**
     * 設定學生成績
     * @param {number} score - 得分 (0-100)
     * @param {number} maxScore - 滿分 (預設 100)
     * @param {string} status - 完成狀態 ('passed' 或 'failed' 或 'completed')
     * @returns {boolean} 是否成功
     */
    setScore(score, maxScore = 100, status = 'completed') {
        if (!this.API || !this.apiInitialized) {
            this.log('SCORM API 未初始化，無法保存成績', 'warn');
            return false;
        }

        try {
            this.log(`嘗試保存成績: ${score}/${maxScore} (${status})`);
            
            // 設定成績
            const scoreRaw = Math.round((score / maxScore) * 100);
            const result1 = this.API.LMSSetValue('cmi.core.score.raw', scoreRaw.toString());
            this.log(`設定原始分數: ${scoreRaw}`);
            
            const result2 = this.API.LMSSetValue('cmi.core.score.max', '100');
            const result3 = this.API.LMSSetValue('cmi.core.score.min', '0');
            
            // 設定完成狀態
            let finalStatus = status;
            if (status !== 'passed' && status !== 'failed' && status !== 'completed') {
                finalStatus = 'completed';
            }
            const result4 = this.API.LMSSetValue('cmi.core.lesson_status', finalStatus);
            this.log(`設定課程狀態: ${finalStatus}`);
            
            // 設定作答時間
            const timeSpent = this.getTimeSpent();
            const result5 = this.API.LMSSetValue('cmi.core.session_time', timeSpent);
            this.log(`設定作答時間: ${timeSpent}`);
            
            // 增加作答次數
            this.attemptCount++;
            const result6 = this.API.LMSSetValue('cmi.core.lesson_location', this.attemptCount.toString());
            this.log(`更新作答次數: ${this.attemptCount}`);
            
            // 設定開始/結束時間
            const now = new Date();
            const startTime = this.formatSCORMTime(now);
            this.API.LMSSetValue('cmi.core.entry', 'ab-initio');
            
            // 保存變更
            const saveResult = this.API.LMSCommit('');
            
            if (saveResult === 'true') {
                this.log(`成績已保存至平台: ${scoreRaw}/100 (${finalStatus})`, 'success');
                this.scoreUpdated = true;
                return true;
            } else {
                this.log('成績保存失敗: LMSCommit 返回 false', 'error');
                return false;
            }
        } catch (e) {
            this.log(`設定成績時出錯: ${e.message}`, 'error');
            return false;
        }
    }

    /**
     * 完成課程並記錄成績
     * @param {number} score - 得分
     * @param {number} maxScore - 滿分
     * @param {number} passingScore - 及格分數 (預設 60)
     * @returns {boolean} 是否成功
     */
    completeCourse(score, maxScore = 100, passingScore = 60) {
        const percentage = (score / maxScore) * 100;
        const isPassed = percentage >= passingScore;
        const status = isPassed ? 'passed' : 'failed';
        
        this.log(`課程完成: ${score}/${maxScore} (${percentage.toFixed(1)}%) - ${status}`);
        
        return this.setScore(score, maxScore, status);
    }

    /**
     * 取得課程狀態
     * @returns {string} 課程狀態
     */
    getCourseStatus() {
        if (!this.API || !this.apiInitialized) {
            this.log('無法取得課程狀態: API 未初始化', 'warn');
            return null;
        }

        try {
            const status = this.API.LMSGetValue('cmi.core.lesson_status');
            this.log(`取得課程狀態: ${status}`);
            return status;
        } catch (e) {
            this.log(`取得課程狀態失敗: ${e.message}`, 'error');
            return null;
        }
    }

    /**
     * 取得學生成績
     * @returns {object} 包含成績資訊的物件
     */
    getScore() {
        if (!this.API || !this.apiInitialized) {
            return null;
        }

        try {
            const raw = this.API.LMSGetValue('cmi.core.score.raw');
            const max = this.API.LMSGetValue('cmi.core.score.max');
            const min = this.API.LMSGetValue('cmi.core.score.min');
            
            return {
                raw: raw ? parseInt(raw) : 0,
                max: max ? parseInt(max) : 100,
                min: min ? parseInt(min) : 0
            };
        } catch (e) {
            this.log(`取得成績失敗: ${e.message}`, 'error');
            return null;
        }
    }

    /**
     * 計算學習時間
     * @returns {string} SCORM 格式的時間字串
     */
    getTimeSpent() {
        // 以毫秒計算已花費時間
        const totalMilliseconds = Date.now() - this.startTime;
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        
        // 轉換為 SCORM 時間格式 (HH:MM:SS)
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const timeStr = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
        return timeStr;
    }

    /**
     * 格式化時間為 SCORM 格式
     * @param {Date} date - 日期物件
     * @returns {string} SCORM 格式時間字串
     */
    formatSCORMTime(date) {
        const year = date.getFullYear();
        const month = this.pad(date.getMonth() + 1);
        const day = this.pad(date.getDate());
        const hours = this.pad(date.getHours());
        const minutes = this.pad(date.getMinutes());
        const seconds = this.pad(date.getSeconds());
        
        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    }

    /**
     * 填充數字至兩位數
     * @param {number} num - 數字
     * @returns {string} 填充後的字串
     */
    pad(num) {
        return String(num).padStart(2, '0');
    }

    /**
     * 取得 SCORM 初始化狀態
     * @returns {boolean} 是否已初始化
     */
    isInitialized() {
        return this.apiInitialized;
    }

    /**
     * 取得作答次數
     * @returns {number} 作答次數
     */
    getAttemptCount() {
        return this.attemptCount;
    }

    /**
     * 取得成績是否已保存
     * @returns {boolean} 是否已保存
     */
    isScoreSaved() {
        return this.scoreUpdated;
    }

    /**
     * 設定自訂資料
     * @param {string} key - 資料鍵值
     * @param {string} value - 資料值
     * @returns {boolean} 是否成功
     */
    setCustomValue(key, value) {
        if (!this.API || !this.apiInitialized) {
            this.log('無法設定自訂值: API 未初始化', 'warn');
            return false;
        }

        try {
            const result = this.API.LMSSetValue(key, value);
            if (result === 'true') {
                this.log(`設定自訂值成功: ${key} = ${value}`);
                return true;
            } else {
                this.log(`設定自訂值失敗: ${key}`, 'warn');
                return false;
            }
        } catch (e) {
            this.log(`設定自訂值出錯: ${e.message}`, 'error');
            return false;
        }
    }

    /**
     * 取得自訂資料
     * @param {string} key - 資料鍵值
     * @returns {string} 資料值
     */
    getCustomValue(key) {
        if (!this.API || !this.apiInitialized) {
            return null;
        }

        try {
            const value = this.API.LMSGetValue(key);
            this.log(`取得自訂值: ${key} = ${value}`);
            return value;
        } catch (e) {
            this.log(`取得自訂值出錯: ${e.message}`, 'error');
            return null;
        }
    }

    /**
     * 取得所有成績資訊摘要
     * @returns {object} 成績摘要物件
     */
    getScoreSummary() {
        const score = this.getScore();
        const status = this.getCourseStatus();
        const timeSpent = this.getTimeSpent();
        
        return {
            initialized: this.apiInitialized,
            score: score,
            status: status,
            attemptCount: this.attemptCount,
            timeSpent: timeSpent,
            saved: this.scoreUpdated
        };
    }

    /**
     * 完全退出課程
     */
    exitCourse() {
        if (!this.API || !this.apiInitialized) {
            this.log('無法退出課程: API 未初始化', 'warn');
            return;
        }

        try {
            const result = this.API.LMSFinish('');
            if (result === 'true') {
                this.log('課程已正常結束', 'success');
            } else {
                this.log('課程結束返回異常值', 'warn');
            }
        } catch (e) {
            this.log(`課程退出失敗: ${e.message}`, 'error');
        }
    }

    /**
     * 獲取 SCORM 版本資訊
     * @returns {object} 版本資訊
     */
    getVersionInfo() {
        return {
            wrapper: '1.0',
            scormVersion: '1.2',
            supportedFeatures: [
                'score tracking',
                'status tracking',
                'time tracking',
                'attempt counting',
                'custom values'
            ]
        };
    }

    /**
     * 列印偵錯資訊
     */
    printDebugInfo() {
        console.group('SCORM API 偵錯資訊');
        console.log('版本資訊:', this.getVersionInfo());
        console.log('初始化狀態:', this.apiInitialized);
        console.log('成績摘要:', this.getScoreSummary());
        console.groupEnd();
    }
}

// ============================================
// 全域 SCORM API 實例
// ============================================

// 建立全域 SCORM API 實例
const scormAPI = new SCORMAPIWrapper();

// 當視窗關閉時，正常退出 SCORM 課程
window.addEventListener('beforeunload', function() {
    if (scormAPI && scormAPI.isInitialized()) {
        scormAPI.exitCourse();
    }
});

// 暴露 API 到全域作用域，方便使用
window.scormAPI = scormAPI;

// 列印初始化完成訊息
console.log('%cSCORM API Wrapper v1.0 已載入', 'color: green; font-weight: bold; font-size: 14px;');
console.log('使用方式: scormAPI.completeCourse(score, maxScore)');
