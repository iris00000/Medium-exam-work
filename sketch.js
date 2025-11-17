let sketch = function(p) {
    let quizData;
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let gameState = 'start';
    let scoreSavedToSCORM = false;

    let hoverIndex = -1;
    let selectedIndex = -1;
    let transitionAlpha = 0;

    const FORCE_FOOD_QUESTIONS = true;
    const FOOD_QUESTIONS = [
        {
            question: "關於洋芋片和含糖飲料，下列哪個敘述是「正確」的？",
            options: [
                "只要能吃飽，就等同於一頓營養均衡的正餐。",
                "它們富含維生素和礦物質，是身體主要的營養來源。",
                "它們被稱為「空熱量」食物，熱量高但營養價值很低。",
                "每天食用少量，對身體完全沒有任何負面影響。"
            ],
            answer: "它們被稱為「空熱量」食物，熱量高但營養價值很低。"
        },
        {
            question: "長期攝取過多高糖、高油、高鹽的「垃圾食物」，最「不可能」增加下列哪種健康風險？",
            options: [
                "體重增加與肥胖",
                "改善皮膚狀況，使其更有光澤",
                "增加罹患第二型糖尿病的風險",
                "導致心血管疾病"
            ],
            answer: "改善皮膚狀況，使其更有光澤"
        },
        {
            question: "下列哪一組食物組合，最接近「好好吃飯」的均衡營養原則？",
            options: [
                "炸雞、薯條、可樂",
                "蔬菜沙拉（淋油醋醬）、烤鮭魚、糙米飯",
                "一大碗泡麵，加一顆蛋",
                "巧克力蛋糕配一杯全糖珍珠奶茶"
            ],
            answer: "蔬菜沙拉（淋油醋醬）、烤鮭魚、糙米飯"
        },
        {
            question: "下列何者「不是」攝取均衡營養（好好吃飯）對身體的主要好處？",
            options: [
                "提供穩定能量，保持體力充沛",
                "幫助維持健康的體重",
                "增強免疫系統，減少生病機會",
                "立即治愈所有慢性疾病"
            ],
            answer: "立即治愈所有慢性疾病"
        },
        {
            question: "關於垃圾食物的「空熱量」（Empty Calories）特性，下列哪個敘述是「錯誤」的？",
            options: [
                "這些食物通常提供很高的熱量。",
                "這些食物所含的維生素、礦物質等必需營養素很少。",
                "即使吃了很多空熱量食物，身體仍可能處於營養不良的狀態。",
                "「空熱量」是指這些食物完全不含任何熱量。"
            ],
            answer: "「空熱量」是指這些食物完全不含任何熱量。"
        },
        {
            question: "除了體重增加，經常食用垃圾食物還可能對精神或體力造成什麼影響？",
            options: [
                "精神奕奕，專注力大幅提升",
                "血糖快速波動，導致精神不濟、容易疲倦",
                "睡眠品質顯著改善，不再失眠",
                "情緒變得極度穩定，不會有任何波動"
            ],
            answer: "血糖快速波動，導致精神不濟、容易疲倦"
        }
    ];

    let cursorParticles = [];
    let selectionEffects = [];

    let optionBoxes = [];
    const optionHeight = 60;
    const optionMargin = 20;

    p.preload = function() {
        quizData = p.loadTable('quiz.csv', 'csv', 'header');
    };

    p.setup = function() {
        console.log('p5.js setup 開始');
        
        // 建立全視窗大小的 canvas
        let canv = p.createCanvas(window.innerWidth, window.innerHeight);
        
        // 重要：設定 canvas 的位置和樣式，確保不被其他元素擋住
        canv.style('position', 'fixed');
        canv.style('top', '0');
        canv.style('left', '0');
        canv.style('display', 'block');
        canv.style('z-index', '999');
        
        p.textFont('Arial');

        console.log('Canvas 已建立:', p.width, 'x', p.height);
        console.log('Canvas z-index:', canv.style('z-index'));

        if (FORCE_FOOD_QUESTIONS) {
            questions = FOOD_QUESTIONS.slice();
            console.info('✓ 使用內建食物題目');
        } else {
            if (!quizData || (quizData && typeof quizData.getRowCount === 'function' && quizData.getRowCount() === 0)) {
                console.warn('⚠ questions.csv 未載入 — 使用內建範例題目');
                questions = [
                    { question: "壽司的主要材料是？", options: ["生魚片", "米飯", "麵條", "豆腐"], answer: "米飯" },
                    { question: "披薩起源於哪個國家？", options: ["法國", "義大利", "美國", "西班牙"], answer: "義大利" }
                ];
            } else {
                processQuizData();
            }
        }

        prepareShuffledForAll();

        p.noCursor();
        console.log('✓ p5.js setup 完成，題目數:', questions.length);
    };

    p.draw = function() {
        p.background(240, 245, 250);

        switch (gameState) {
            case 'start':
                drawStartScreen();
                break;
            case 'quiz':
                drawQuizScreen();
                break;
            case 'results':
                drawResultsScreen();
                break;
        }

        drawCursorEffect();
        drawSelectionEffects();
    };

    p.windowResized = function() {
        if (p.windowWidth > 0 && p.windowHeight > 0) {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            console.log('✓ Canvas 已調整:', p.width, 'x', p.height);
        }
    };

    function processQuizData() {
        for (let row of quizData.rows) {
            let q = {
                question: row.get('Question'),
                options: [
                    row.get('OptionA'),
                    row.get('OptionB'),
                    row.get('OptionC'),
                    row.get('OptionD')
                ],
                answer: row.get('Answer')
            };
            questions.push(q);
        }
    }

    function shuffleArray(arr) {
        let a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            let j = p.floor(p.random() * (i + 1));
            [a[i], a[j] ] = [a[j], a[i]];
        }
        return a;
    }

    function prepareShuffledForAll() {
        for (let q of questions) {
            if (!q.shuffledOptions) {
                q.shuffledOptions = shuffleArray(q.options);
                q.correctIndex = q.shuffledOptions.indexOf(q.answer);
            }
        }
    }

    function drawStartScreen() {
        // 簡化背景
        p.background(200, 220, 255);

        let padding = 20; // 定義 padding 變數

        p.textAlign(p.CENTER, p.CENTER);
        
        // 標題陰影效果
        p.fill(0, 0, 0, 30);
        p.textSize(50);
        p.text('飲食與健康知識大考驗', p.width / 2 + 3, p.height / 2 - 97);
        
        // 標題主體
        p.fill(50);
        p.textSize(48);
        p.text('飲食與健康知識大考驗', p.width / 2, p.height / 2 - 100);

        // 副標題
        p.fill(100);
        p.textSize(18);
        p.textAlign(p.CENTER, p.TOP);
        p.text('完成 6 道題目，測試你的飲食健康知識', p.width / 2, p.height / 2 - 30);

        // 顯示 SCORM 狀態
        if (typeof scormAPI !== 'undefined') {
            p.fill(100);
            p.textSize(14);
            p.textAlign(p.CENTER, p.TOP);
            const scormStatus = scormAPI.isInitialized() ? '✓ 已連結 Moodle' : '⚠ 離線模式';
            const attemptCount = scormAPI.getAttemptCount();
            const statusY = 20;
            
            p.fill(255, 255, 255, 200);
            p.stroke(200);
            p.strokeWeight(1);
            const statusText = `${scormStatus} | 作答次數: ${attemptCount + 1}`;
            const textWidth = p.textWidth(statusText) + 20;
            p.rect(p.width / 2 - textWidth / 2, statusY - 12, textWidth, 24, 6);
            
            p.fill(scormAPI.isInitialized() ? p.color(0, 150, 50) : p.color(255, 150, 0));
            p.noStroke();
            p.textSize(13);
            p.text(statusText, p.width / 2, statusY);
        }

        // 開始按鈕
        let btnX = p.width / 2 - 150;
        let btnY = p.height / 2 + 50;
        let btnW = 300;
        let btnH = 80;
        let isHovering = p.mouseX > btnX && p.mouseX < btnX + btnW && p.mouseY > btnY && p.mouseY < btnY + btnH;

        p.fill(0, 0, 0, 20);
        p.noStroke();
        p.rect(btnX + 5, btnY + 5, btnW, btnH, 20);

        if (isHovering) {
            drawGradientRect(btnX, btnY, btnW, btnH, 
                            100, 200, 255, 120, 180, 255, 20);
            p.stroke(50, 150, 255);
            p.strokeWeight(3);
        } else {
            drawGradientRect(btnX, btnY, btnW, btnH, 
                            150, 220, 255, 100, 180, 255, 20);
            p.stroke(100, 180, 255);
            p.strokeWeight(2);
        }
        
        p.noStroke();
        p.fill(255);
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('或按 Enter', p.width / 2, btnY + btnH + 30);

        p.fill(0);
        p.noStroke();
        p.textSize(32);
        p.textStyle(p.BOLD);
        p.text('點擊開始', p.width / 2, p.height / 2 + 90);

        // 返回影片按鈕 - 位於左下角
        let backBtnX = padding;
        let backBtnY = p.height - padding - 60;
        let backBtnW = 150;
        let backBtnH = 50;
        let isBackBtnHovering = p.mouseX > backBtnX && p.mouseX < backBtnX + backBtnW && p.mouseY > backBtnY && p.mouseY < backBtnY + backBtnH;

        // 按鈕陰影
        p.fill(0, 0, 0, 15);
        p.noStroke();
        p.rect(backBtnX + 2, backBtnY + 2, backBtnW, backBtnH, 10);

        // 按鈕背景
        if (isBackBtnHovering) {
            drawGradientRect(backBtnX, backBtnY, backBtnW, backBtnH,
                            150, 150, 150, 100, 100, 100, 10);
            p.stroke(80, 80, 80);
            p.strokeWeight(2);
        } else {
            drawGradientRect(backBtnX, backBtnY, backBtnW, backBtnH,
                            180, 180, 180, 130, 130, 130, 10);
            p.stroke(120, 120, 120);
            p.strokeWeight(1);
        }

        // 按鈕文字
        p.fill(255);
        p.noStroke();
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('← 返回影片', backBtnX + backBtnW / 2, backBtnY + backBtnH / 2);
    }

    function drawQuizScreen() {
        if (currentQuestionIndex >= questions.length) {
            gameState = 'results';
            return;
        }

        let q = questions[currentQuestionIndex];

        if (!q.shuffledOptions) {
            q.shuffledOptions = shuffleArray(q.options);
            q.correctIndex = q.shuffledOptions.indexOf(q.answer);
        }

        optionBoxes = [];
        
        // 簡化背景繪製
        p.background(240, 245, 250);

        let vw = p.width;
        let vh = p.height;
        let scale = p.constrain(vw / 1200, 0.6, 1.15);
        let questionFontSize = p.round(28 * scale);
        let optionFontSize = p.round(18 * scale);
        let optH = p.round(70 * scale);
        let optMargin = p.round(16 * scale);
        let padding = p.round(32 * scale);

        let narrow = vw < 800;

        if (narrow) {
            let topY = padding;
            let leftX = padding;
            let contentW = vw - padding * 2;

            drawProgressBar(leftX, topY - 10, contentW, currentQuestionIndex, questions.length);

            p.fill(80);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(p.round(16 * scale));
            p.text(`第 ${currentQuestionIndex + 1} / ${questions.length} 題`, leftX, topY + 10);

            p.fill(255, 255, 255, 240);
            p.stroke(200, 200, 200);
            p.strokeWeight(2);
            let qY = topY + p.round(40 * scale);
            let questionBoxH = p.min(vh * 0.38, 320 * scale);
            p.rect(leftX, qY - 10, contentW, questionBoxH + 20, 12);

            p.fill(50);
            let adjustedQuestionSize = p.constrain(questionFontSize, 16, 22);
            p.textSize(adjustedQuestionSize);
            p.textAlign(p.LEFT, p.TOP);
            p.text(q.question, leftX + 15, qY, contentW - 30, questionBoxH);

            let cols = vw < 420 ? 1 : 2;
            let availableW = contentW;
            let optionW = p.floor((availableW - (cols - 1) * optMargin) / cols);
            let startY = qY + questionBoxH + padding + 10;

            for (let i = 0; i < q.shuffledOptions.length; i++) {
                let row = p.floor(i / cols);
                let col = i % cols;
                let x = leftX + col * (optionW + optMargin);
                let y = startY + row * (optH + optMargin);
                let isHovering = p.mouseX > x && p.mouseX < x + optionW && p.mouseY > y && p.mouseY < y + optH;

                drawOptionButton(x, y, optionW, optH, q.shuffledOptions[i], isHovering, i, optionFontSize);
                optionBoxes.push({ x: x, y: y, w: optionW, h: optH, index: i });
            }

            // 放棄測驗按鈕 - 位於底部右側
            let quitBtnX = vw - padding - 140;
            let quitBtnY = vh - padding - 60;
            let quitBtnW = 130;
            let quitBtnH = 50;
            let isQuitBtnHovering = p.mouseX > quitBtnX && p.mouseX < quitBtnX + quitBtnW && p.mouseY > quitBtnY && p.mouseY < quitBtnY + quitBtnH;

            // 按鈕陰影
            p.fill(0, 0, 0, 15);
            p.noStroke();
            p.rect(quitBtnX + 2, quitBtnY + 2, quitBtnW, quitBtnH, 10);

            // 按鈕背景
            if (isQuitBtnHovering) {
                drawGradientRect(quitBtnX, quitBtnY, quitBtnW, quitBtnH,
                                255, 100, 100, 200, 50, 50, 10);
                p.stroke(200, 0, 0);
                p.strokeWeight(2);
            } else {
                drawGradientRect(quitBtnX, quitBtnY, quitBtnW, quitBtnH,
                                255, 150, 150, 220, 80, 80, 10);
                p.stroke(200, 100, 100);
                p.strokeWeight(1);
            }

            // 按鈕文字
            p.fill(255);
            p.noStroke();
            p.textSize(12);
            p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('放棄測驗', quitBtnX + quitBtnW / 2, quitBtnY + quitBtnH / 2);
        } else {
            // 寬螢幕版本 - 移除左側問題框，題目顯示在頂部，選項全寬度
            let topPadding = padding;
            let contentX = padding;
            let contentW = vw - padding * 2;

            // 顯示進度條
            drawProgressBar(contentX, topPadding - 10, contentW, currentQuestionIndex, questions.length);

            // 顯示題號
            p.fill(80);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(p.round(16 * scale));
            p.text(`第 ${currentQuestionIndex + 1} / ${questions.length} 題`, contentX, topPadding + 10);

            // 題目顯示在頂部（不需要框）
            let questionY = topPadding + p.round(40 * scale);
            p.fill(50);
            let adjustedQuestionSize = p.constrain(questionFontSize, 20, 28);
            p.textSize(adjustedQuestionSize);
            p.textAlign(p.LEFT, p.TOP);
            // 直接顯示題目文字，不畫框
            p.text(q.question, contentX, questionY, contentW, p.round(80 * scale));

            // 選項佈局 - 2 列
            let optionsStartY = questionY + p.round(100 * scale);
            let cols = 2;
            let availableW = contentW;
            let optionW = p.floor((availableW - (cols - 1) * optMargin) / cols);
            let rows = p.ceil(q.shuffledOptions.length / cols);
            let totalOptionsH = rows * optH + (rows - 1) * optMargin;
            let startY = optionsStartY;

            p.textSize(optionFontSize);
            for (let i = 0; i < q.shuffledOptions.length; i++) {
                let row = p.floor(i / cols);
                let col = i % cols;
                let x = contentX + col * (optionW + optMargin);
                let y = startY + row * (optH + optMargin);
                let isHovering = p.mouseX > x && p.mouseX < x + optionW && p.mouseY > y && p.mouseY < y + optH;

                drawOptionButton(x, y, optionW, optH, q.shuffledOptions[i], isHovering, i, optionFontSize);
                optionBoxes.push({ x: x, y: y, w: optionW, h: optH, index: i });
            }

            // 放棄測驗按鈕 - 位於右下角
            let quitBtnX = vw - padding - 150;
            let quitBtnY = vh - padding - 60;
            let quitBtnW = 140;
            let quitBtnH = 50;
            let isQuitBtnHovering = p.mouseX > quitBtnX && p.mouseX < quitBtnX + quitBtnW && p.mouseY > quitBtnY && p.mouseY < quitBtnY + quitBtnH;

            // 按鈕陰影
            p.fill(0, 0, 0, 15);
            p.noStroke();
            p.rect(quitBtnX + 2, quitBtnY + 2, quitBtnW, quitBtnH, 10);

            // 按鈕背景
            if (isQuitBtnHovering) {
                drawGradientRect(quitBtnX, quitBtnY, quitBtnW, quitBtnH,
                                255, 100, 100, 200, 50, 50, 10);
                p.stroke(200, 0, 0);
                p.strokeWeight(2);
            } else {
                drawGradientRect(quitBtnX, quitBtnY, quitBtnW, quitBtnH,
                                255, 150, 150, 220, 80, 80, 10);
                p.stroke(200, 100, 100);
                p.strokeWeight(1);
            }

            // 按鈕文字
            p.fill(255);
            p.noStroke();
            p.textSize(13);
            p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('放棄測驗', quitBtnX + quitBtnW / 2, quitBtnY + quitBtnH / 2);
        }
    }

    function drawResultsScreen() {
        // 簡化背景
        p.background(200, 220, 255);

        let finalScore = (score / questions.length) * 100;
        let resultText = '';
        let resultColor = null;

        if (finalScore >= 80) {
            drawPraiseAnimation();
            resultColor = p.color(0, 150, 50);
            resultText = `太棒了！`;
        } else if (finalScore >= 50) {
            drawEncouragementAnimation(p.color(50, 150, 255));
            resultColor = p.color(0, 100, 150);
            resultText = `不錯喔！`;
        } else {
            drawEncouragementAnimation(p.color(255, 150, 50));
            resultColor = p.color(150, 50, 0);
            resultText = `再接再厲！`;
        }

        // 結果卡片背景 - 修正位置計算
        let cardW = 500;
        let cardH = 320;
        let cardX = p.width / 2 - cardW / 2;
        let cardY = p.height / 2 - cardH / 2;
        
        p.fill(255, 255, 255, 245);
        p.stroke(200);
        p.strokeWeight(2);
        p.rect(cardX, cardY, cardW, cardH, 15);

        // 結果標題
        p.fill(resultColor);
        p.textSize(42);
        p.textAlign(p.CENTER, p.TOP);
        p.text(resultText, p.width / 2, cardY + 25);

        // 成績顯示
        p.fill(resultColor);
        p.textSize(72);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`${finalScore.toFixed(0)}`, p.width / 2, cardY + 110);

        // 分數單位
        p.fill(100);
        p.textSize(22);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`/ 100 分`, p.width / 2, cardY + 150);

        // 通過/不通過
        const isPassed = finalScore >= 60;
        p.fill(isPassed ? p.color(0, 150, 50) : p.color(200, 50, 0));
        p.textSize(18);
        p.textAlign(p.CENTER, p.CENTER);
        const statusText = isPassed ? '✓ 已通過' : '✗ 未通過';
        p.text(statusText, p.width / 2, cardY + 195);

        // 保存成績到 SCORM
        if (typeof scormAPI !== 'undefined' && !scoreSavedToSCORM) {
            scormAPI.completeCourse(finalScore, 100, 60);
            scoreSavedToSCORM = true;
            
            if (scormAPI.isInitialized()) {
                p.fill(0, 150, 0);
                p.textSize(13);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('✓ 成績已保存至 Moodle', p.width / 2, cardY + 230);
            }
        }

        // 重新測驗按鈕 - 修正位置
        let btnX = p.width / 2 - 140;
        let btnY = cardY + cardH + 40;
        let btnW = 280;
        let btnH = 70;
        let isHovering = p.mouseX > btnX && p.mouseX < btnX + btnW && p.mouseY > btnY && p.mouseY < btnY + btnH;

        // 按鈕陰影
        p.fill(0, 0, 0, 15);
        p.noStroke();
        p.rect(btnX + 3, btnY + 3, btnW, btnH, 12);

        // 按鈕
        if (isHovering) {
            drawGradientRect(btnX, btnY, btnW, btnH,
                            255, 180, 50, 255, 150, 0, 12);
            p.stroke(255, 120, 0);
            p.strokeWeight(3);
        } else {
            drawGradientRect(btnX, btnY, btnW, btnH,
                            255, 220, 150, 255, 180, 50, 12);
            p.stroke(255, 180, 50);
            p.strokeWeight(2);
        }

        p.fill(0);
        p.noStroke();
        p.textSize(28);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('重新測驗', p.width / 2, btnY + btnH / 2);
    }

    // ========== 新增美化函式 ==========

    // 繪製漸層背景
    function drawGradientBackground(r1, g1, b1, r2, g2, b2) {
        // 每隔幾像素繪製一條線，加速效能
        let step = p.max(1, p.floor(p.height / 200));
        for (let y = 0; y < p.height; y += step) {
            let inter = p.map(y, 0, p.height, 0, 1);
            let r = p.lerp(r1, r2, inter);
            let g = p.lerp(g1, g2, inter);
            let b = p.lerp(b1, b2, inter);
            p.stroke(r, g, b);
            p.strokeWeight(step);
            p.line(0, y, p.width, y);
        }
        p.noStroke();
    }

    // 繪製漸層矩形
    function drawGradientRect(x, y, w, h, r1, g1, b1, r2, g2, b2, radius) {
        // 每隔幾像素繪製一條線，加速效能
        let step = p.max(1, p.floor(h / 50));
        for (let i = 0; i < h; i += step) {
            let inter = p.map(i, 0, h, 0, 1);
            let r = p.lerp(r1, r2, inter);
            let g = p.lerp(g1, g2, inter);
            let b = p.lerp(b1, b2, inter);
            p.stroke(r, g, b);
            p.strokeWeight(step);
            p.line(x, y + i, x + w, y + i);
        }
        p.noStroke();
    }

    // 繪製選項按鈕
    function drawOptionButton(x, y, w, h, text, isHovering, index, fontSize) {
        // 按鈕陰影
        p.fill(0, 0, 0, isHovering ? 25 : 15);
        p.noStroke();
        p.rect(x + 3, y + 3, w, h, 10);

        // 按鈕主體
        if (isHovering) {
            // 簡化：直接填充而不用漸層，提升效能
            p.fill(200, 230, 255, 255);
            p.stroke(0, 120, 255);
            p.strokeWeight(3);
        } else {
            p.fill(255, 255, 255, 240);
            p.stroke(180, 200, 220);
            p.strokeWeight(2);
        }
        p.rect(x, y, w, h, 10);

        // 按鈕文字 - 使用自動換行，確保文字不超出框線
        p.fill(0);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(fontSize);
        
        // 為了防止文字超出，使用帶寬度限制的 text() 函數
        let textPadding = 35; // 左邊預留給字母標籤
        let textWidth = w - textPadding - 8; // 右邊也預留邊距
        let textHeight = h - 16; // 上下預留邊距
        
        p.text(text, x + textPadding, y + 8, textWidth, textHeight);

        // 選項字母標籤
        p.fill(isHovering ? p.color(0, 120, 255) : p.color(100, 150, 200));
        p.textSize(14);
        p.textAlign(p.LEFT, p.TOP);
        p.text(String.fromCharCode(65 + index), x + 12, y + 10);
    }

    // 繪製進度條 - 優化版本
    function drawProgressBar(x, y, w, current, total) {
        let progress = current / total;
        let barH = 6;

        // 進度條背景
        p.fill(255, 255, 255, 200);
        p.stroke(200);
        p.strokeWeight(1);
        p.rect(x, y, w, barH, 3);

        // 進度條填充 - 使用漸層矩形取代逐像素繪製
        let progressW = w * progress;
        if (progressW > 0) {
            drawGradientRect(x, y, progressW, barH, 
                            100, 200, 255, 0, 150, 50, 3);
        }

        // 進度文字
        p.fill(100);
        p.textSize(12);
        p.textAlign(p.RIGHT, p.TOP);
        p.noStroke();
        p.text(`${current + 1}/${total}`, x + w + 10, y - 2);
    }

    // ----------------------------------------
    // 6. 動畫與特效函式
    // ----------------------------------------

    function drawPraiseAnimation() {
        // 每 5 幀隨機在畫面上產生一個 "煙火"
        if (p.frameCount % 5 === 0) {
            let x = p.random(p.width);
            let y = p.random(p.height * 0.7); // 集中在畫面上半部
            let baseHue = p.random(360); // 隨機色相
            // 產生 20 個粒子
            for (let i = 0; i < 20; i++) {
                selectionEffects.push(new Particle(x, y, baseHue));
            }
        }
    }

    function drawEncouragementAnimation(baseColor) {
        // 每 3 幀隨機在畫面底部產生一個 "氣泡"
        if (p.frameCount % 3 === 0) {
            let x = p.random(p.width);
            let y = p.height + 20; // 從底部開始
            selectionEffects.push(new Bubble(x, y, baseColor));
        }
    }

    function drawCursorEffect() {
        // 在滑鼠位置產生新粒子
        cursorParticles.push(new CursorParticle(p.mouseX, p.mouseY));

        // 限制粒子數量以提升效能
        if (cursorParticles.length > 100) {
            cursorParticles.splice(0, 10);
        }

        // 繪製並更新所有粒子
        for (let i = cursorParticles.length - 1; i >= 0; i--) {
            let ps = cursorParticles[i];
            ps.update();
            ps.display();
            if (ps.isFinished()) {
                cursorParticles.splice(i, 1);
            }
        }
        
        // 主游標 - 重要：確保游標可見
        p.fill(0, 150, 255, 200);
        p.stroke(100, 200, 255, 150);
        p.strokeWeight(2);
        p.circle(p.mouseX, p.mouseY, 15);
        
        // 游標中心點
        p.fill(255);
        p.noStroke();
        p.circle(p.mouseX, p.mouseY, 3);
    }

    function drawSelectionEffects() {
        // 限制特效數量
        if (selectionEffects.length > 200) {
            selectionEffects.splice(0, 50);
        }

        for (let i = selectionEffects.length - 1; i >= 0; i--) {
            let e = selectionEffects[i];
            e.update();
            e.display();
            if (e.isFinished()) {
                selectionEffects.splice(i, 1); // 移除結束的特效
            }
        }
    }

    // ----------------------------------------
    // 7. 使用者互動
    // ----------------------------------------
    p.mousePressed = function() {
        if (gameState === 'start') {
            // 檢查是否點擊開始按鈕
            let btnX = p.width / 2 - 150;
            let btnY = p.height / 2 + 50;
            let btnW = 300;
            let btnH = 80;
            if (p.mouseX > btnX && p.mouseX < btnX + btnW && p.mouseY > btnY && p.mouseY < btnY + btnH) {
                gameState = 'quiz'; // 開始測驗
                return;
            }

            // 檢查是否點擊返回影片按鈕
            let padding = 20;
            let backBtnX = padding;
            let backBtnY = p.height - padding - 60;
            let backBtnW = 150;
            let backBtnH = 50;
            if (p.mouseX > backBtnX && p.mouseX < backBtnX + backBtnW && p.mouseY > backBtnY && p.mouseY < backBtnY + backBtnH) {
                // 返回影片介面 - 觸發 HTML 中的返回按鈕
                console.log('✓ 返回影片按鈕被點擊（canvas）');
                if (typeof document !== 'undefined') {
                    try {
                        // 觸發隱藏的返回按鈕點擊事件
                        let backBtn = document.getElementById('backToVideoBtn');
                        if (backBtn) {
                            backBtn.click();
                            console.log('✓ 已觸發 backToVideoBtn 點擊事件');
                        } else {
                            console.warn('⚠ backToVideoBtn 元素不存在');
                            // 備用方案：直接切換 DOM
                            document.getElementById('videoSection').classList.add('active');
                            document.getElementById('quizSection').classList.remove('active');
                            resetQuiz();
                        }
                    } catch (e) {
                        console.error('✗ 切換 DOM 出錯:', e);
                    }
                }
                return;
            }
        } else if (gameState === 'quiz') {
            // 檢查是否點擊了某個選項
            for (let box of optionBoxes) {
                if (p.mouseX > box.x && p.mouseX < box.x + box.w && p.mouseY > box.y && p.mouseY < box.y + box.h) {
                    checkAnswer(box.index, box.x + box.w / 2, box.y + box.h / 2);
                    break;
                }
            }

            // 檢查是否點擊放棄測驗按鈕
            let vw = p.width;
            let vh = p.height;
            let padding = p.round(32 * (vw / 1200));
            let quitBtnX = vw - padding - 150;
            let quitBtnY = vh - padding - 60;
            let quitBtnW = 140;
            let quitBtnH = 50;
            
            if (p.mouseX > quitBtnX && p.mouseX < quitBtnX + quitBtnW && p.mouseY > quitBtnY && p.mouseY < quitBtnY + quitBtnH) {
                // 放棄測驗，返回影片介面
                if (typeof window !== 'undefined') {
                    document.getElementById('videoSection').classList.add('active');
                    document.getElementById('quizSection').classList.remove('active');
                    // 重置測驗狀態
                    resetQuiz();
                }
                return;
            }
        } else if (gameState === 'results') {
            // 檢查是否點擊重玩按鈕 - 修正位置
            let cardW = 500;
            let cardH = 320;
            let cardX = p.width / 2 - cardW / 2;
            let cardY = p.height / 2 - cardH / 2;
            
            let btnX = p.width / 2 - 140;
            let btnY = cardY + cardH + 40;
            let btnW = 280;
            let btnH = 70;
            if (p.mouseX > btnX && p.mouseX < btnX + btnW && p.mouseY > btnY && p.mouseY < btnY + btnH) {
                resetQuiz();
            }
        }
    };

    // ----------------------------------------
    // 8. 輔助函式
    // ----------------------------------------

    function checkAnswer(selectedIndex, clickX, clickY) {
        let q = questions[currentQuestionIndex];
        let correct = (selectedIndex === q.correctIndex);

        if (correct) {
            score++;
            // 產生 "正確" 的特效 (綠色)
            selectionEffects.push(new SelectionRing(clickX, clickY, p.color(0, 255, 0)));
        } else {
            // 產生 "錯誤" 的特效 (紅色)
            selectionEffects.push(new SelectionRing(clickX, clickY, p.color(255, 0, 0)));
        }

        // 移至下一題
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            // 下一題確保有亂序版本
            let nextQ = questions[currentQuestionIndex];
            if (!nextQ.shuffledOptions) {
                nextQ.shuffledOptions = shuffleArray(nextQ.options);
                nextQ.correctIndex = nextQ.shuffledOptions.indexOf(nextQ.answer);
            }
        } else {
            gameState = 'results';
        }
    }

    function resetQuiz() {
        score = 0;
        currentQuestionIndex = 0;
        gameState = 'start';
        selectionEffects = [];
        scoreSavedToSCORM = false; // 重置成績保存標記
    }

    // ----------------------------------------
    // 9. 特效類別
    // ----------------------------------------

    class CursorParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = p.random(-1, 1);
            this.vy = p.random(-1, 1);
            this.size = p.random(3, 7);
            this.life = 50;
            this.color = p.color(0, p.random(150, 255), 255, this.life * 5);
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            this.color.setAlpha(this.life * 5);
        }
        display() {
            p.noStroke();
            p.fill(this.color);
            p.circle(this.x, this.y, this.size);
        }
        isFinished() {
            return this.life <= 0;
        }
    }

    class SelectionRing {
        constructor(x, y, c) {
            this.x = x;
            this.y = y;
            this.color = c;
            this.size = 0;
            this.maxSize = 100;
            this.life = 30;
        }
        update() {
            this.size = p.lerp(this.size, this.maxSize, 0.2);
            this.life--;
            this.color.setAlpha(this.life * (255 / 30));
        }
        display() {
            p.noFill();
            p.stroke(this.color);
            p.strokeWeight(4);
            p.circle(this.x, this.y, this.size);
        }
        isFinished() {
            return this.life <= 0;
        }
    }

    class Particle {
        constructor(x, y, baseHue) {
            this.x = x;
            this.y = y;
            this.angle = p.random(p.TWO_PI);
            this.speed = p.random(2, 8);
            this.vx = p.cos(this.angle) * this.speed;
            this.vy = p.sin(this.angle) * this.speed;
            this.gravity = 0.1;
            this.life = 100;
            p.colorMode(p.HSB, 360, 100, 100, 1);
            this.color = p.color(baseHue + p.random(-20, 20), 90, 90, 1);
            p.colorMode(p.RGB, 255);
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.life -= 1.5;
        }
        display() {
            p.noStroke();
            this.color.setAlpha(this.life / 100);
            p.fill(this.color);
            p.circle(this.x, this.y, 8);
            this.color.setAlpha(1);
        }
        isFinished() {
            return this.life <= 0;
        }
    }

    class Bubble {
        constructor(x, y, c) {
            this.x = x + p.random(-20, 20);
            this.y = y;
            this.vx = p.random(-1, 1);
            this.vy = p.random(-1, -4);
            this.size = p.random(10, 30);
            this.life = 120;
            this.color = c;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
        }
        display() {
            p.noFill();
            this.color.setAlpha(this.life * 2);
            p.stroke(this.color);
            p.strokeWeight(2);
            p.circle(this.x, this.y, this.size);
        }
        isFinished() {
            return this.life <= 0;
        }
    }
};

// ----------------------------------------
// 全域設定與 p5.js 實例化
// ----------------------------------------
// let myp5 = new p5(sketch, 'p5-container');

// --- 可選：調整畫布大小（響應式）---
// function windowResized() {
//     let container = document.getElementById('p5-container');
//     myp5.resizeCanvas(container.clientWidth, container.clientHeight);
// }
