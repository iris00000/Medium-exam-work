let p5Sketch = null;
let videoElement = null;

document.addEventListener('DOMContentLoaded', function() {
    const videoSection = document.getElementById('videoSection');
    const quizSection = document.getElementById('quizSection');
    const startQuizBtn = document.getElementById('startQuizBtn');
    const backToVideoBtn = document.getElementById('backToVideoBtn');
    const p5Container = document.getElementById('p5-container');
    
    // 獲取影片元素
    videoElement = document.getElementById('videoPlayer');

    // 點擊「開始答題」按鈕
    startQuizBtn.addEventListener('click', function() {
        console.log('點擊開始答題按鈕');
        videoSection.classList.remove('active');
        quizSection.classList.add('active');
        
        // 暫停影片（但不清除播放進度）
        if (videoElement) {
            videoElement.pause();
            console.log('✓ 影片已暫停，播放位置保存');
        }
        
        // 確保容器有正確的大小
        console.log('p5-container 寬度:', p5Container.clientWidth);
        console.log('p5-container 高度:', p5Container.clientHeight);
        
        // 延遲創建 p5.js 實例，確保 DOM 已準備好
        setTimeout(function() {
            if (!p5Sketch) {
                console.log('開始創建 p5.js 實例');
                try {
                    // 清空容器
                    p5Container.innerHTML = '';
                    
                    // 確保容器和 sketch 都已定義
                    if (typeof sketch === 'undefined') {
                        console.error('✗ sketch 未定義！');
                        return;
                    }
                    
                    if (!p5Container) {
                        console.error('✗ p5-container 元素不存在！');
                        return;
                    }

                    // 建立 p5.js 實例
                    p5Sketch = new p5(sketch);
                    console.log('✓ p5.js 實例已成功創建');
                    
                    // 驗證實例
                    if (p5Sketch && p5Sketch.canvas) {
                        console.log('✓ Canvas 已建立，大小:', p5Sketch.width, 'x', p5Sketch.height);
                        // 將 canvas 移到正確的容器
                        p5Container.appendChild(p5Sketch.canvas);
                        console.log('✓ Canvas 已新增到容器');
                    } else {
                        console.warn('⚠ Canvas 未找到');
                    }
                } catch (e) {
                    console.error('✗ p5.js 實例創建失敗:', e);
                    console.error('錯誤訊息:', e.message);
                    console.error('堆疊追蹤:', e.stack);
                }
            } else {
                console.warn('⚠ p5.js 實例已存在');
            }
        }, 200);
    });

    // 點擊「返回影片」按鈕
    backToVideoBtn.addEventListener('click', function() {
        console.log('點擊返回影片按鈕');
        quizSection.classList.remove('active');
        videoSection.classList.add('active');
        
        // 繼續播放影片
        if (videoElement) {
            videoElement.play();
            console.log('✓ 影片繼續播放');
        }
        
        // 移除 p5.js sketch
        if (p5Sketch) {
            console.log('移除 p5.js 實例');
            try {
                p5Sketch.remove();
                p5Sketch = null;
                console.log('✓ p5.js 實例已移除');
            } catch (e) {
                console.error('✗ p5.js 實例移除失敗:', e);
            }
        }
    });

    // 監聽視窗大小變化
    window.addEventListener('resize', function() {
        if (p5Sketch && quizSection.classList.contains('active')) {
            try {
                p5Sketch.resizeCanvas(window.innerWidth, window.innerHeight);
                console.log('✓ Canvas 已調整大小');
            } catch (e) {
                console.warn('無法調整 canvas 大小:', e);
            }
        }
    });

    // 按 Enter 鍵開始答題
    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && videoSection.classList.contains('active')) {
            startQuizBtn.click();
        }
    });

    console.log('✓ script.js 已載入完成');
});

function loadQuizContent() {
    // 這裡可以添加載入答題內容的邏輯
    const quizContent = document.getElementById('quizContent');
    quizContent.innerHTML = `
        <div class="quiz-question">
            <h2>問題 1</h2>
            <p>這是示例問題，請根據影片內容回答。</p>
            <div class="options">
                <label><input type="radio" name="q1"> 選項 A</label>
                <label><input type="radio" name="q1"> 選項 B</label>
                <label><input type="radio" name="q1"> 選項 C</label>
                <label><input type="radio" name="q1"> 選項 D</label>
            </div>
        </div>
    `;
}
