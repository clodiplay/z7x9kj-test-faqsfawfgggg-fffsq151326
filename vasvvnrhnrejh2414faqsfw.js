// ==UserScript==
// @name         AutoDonator (GitHub CDN)
// @namespace    https://clodiplay.github.io/
// @version      2.12
// @description  Автодонат с GitHub. Автообновление включено.
// @match        https://www.donationalerts.com/dashboard/activity-feed/donations
// @require      https://clodiplay.github.io/z7x9kj-test-faqsfawfgggg-fffq151326/vasvvnrhnrejh2414faqsfw
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==


(function() {
    'use strict';

    /*****************************************
     * 1. Стили22dasdas
     *****************************************/
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            font-family: sans-serif;fasf
        }
        /* Основная панель */
        #autoDonatorPanel {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background-color: rgba(20,20,20,0.95);
            color: #fff;
            padding: 15px;
            border: 2px solid #FFA500;
            border-radius: 8px;
            width: 400px;           /* Начальная ширина */
            font-size: 16px;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
            transition: width 0.4s ease; /* Анимация при смене ширины */
        }
        /* При расширении */
        #autoDonatorPanel.extended {
            width: 700px; /* Ширина при расширении */
        }
        #autoDonatorToggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background-color: rgba(20,20,20,0.95);
            color: #FFA500;
            border: 2px solid #FFA500;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            text-align: center;
            line-height: 36px;
            cursor: pointer;
            font-size: 20px;
            display: none;
        }
        #autoDonatorPanel h3 {
            margin: 0 0 10px;
            text-align: center;
            font-size: 18px;
        }
        #autoDonatorPanel button {
            padding: 5px 10px;
            margin: 5px 2px;
            border: none;
            border-radius: 4px;
            background-color: #FFA500;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        #autoDonatorPanel button:hover {
            background-color: #afa;
        }
        #autoDonatorLog {
            border: 1px solid #FFA500;
            padding: 5px;
            height: 150px;
            overflow-y: auto;
            background-color: #111;
            font-family: monospace;
            font-size: 14px;
        }
        .log-line {
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        .log-line.visible {
            opacity: 1;
        }
        /* Кнопка сброса памяти (♻️) */
        #resetMessagesBtn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #FFA500;
            font-size: 18px;
            cursor: pointer;
        }
        #resetMessagesBtn:hover {
            color: #ffb733;
        }
        /* Дополнительный блок слева от основной панели (по умолчанию скрыт) */
        #extraFunctionsBlock {
            display: none;
            position: absolute;
            top: 0;
            right: 100%;           /* располагаем блок слева от панели */
            margin-right: 20px;    /* отступ между блоками */
            border: 1px solid #FFF;
            padding: 10px;
            background-color: rgba(20,20,20,0.95);
            color: #fff;
        }
        /* Когда панель имеет класс .extended, показываем блок */
        #autoDonatorPanel.extended #extraFunctionsBlock {
            display: block;
        }
        /* Тёмно-оранжевые поля ввода (внутри панели) */
        #autoDonatorPanel input[type="text"],
        #autoDonatorPanel input[type="number"],
        #autoDonatorPanel input[type="file"] {
            background-color: #7A3B00; /* тёмно-оранжевый */
            color: #fff;
            border: 1px solid #FFA500;
            margin-top: 3px;
            margin-bottom: 5px;
            padding: 3px;
        }
        #autoDonatorPanel input[type="text"]::placeholder {
            color: #ccc;
        }
    `;
    document.head.appendChild(style);

    /*****************************************
     * 2. Функция для создания поля выбора файла с индикатором статуса
     *****************************************/
    function createFileInput(labelText, id) {
        const container = document.createElement('div');
        container.style.marginBottom = '8px';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.display = 'block';
        label.style.marginBottom = '2px';
        container.appendChild(label);

        const input = document.createElement('input');
        input.type = 'file';
        input.id = id;
        container.appendChild(input);

        // Индикатор статуса
        const status = document.createElement('span');
        status.id = "status_" + id;
        status.style.marginLeft = '10px';
        status.style.fontWeight = 'bold';
        status.textContent = "❌ не сохранено в памяти";
        status.style.color = "red";
        container.appendChild(status);

        return container;
    }

    /*****************************************
     * 3. Создание панели
     *****************************************/
    const panel = document.createElement('div');
    panel.id = "autoDonatorPanel";
    panel.innerHTML = `
        <button id="resetMessagesBtn" title="Сброс памяти, возврат к первоначальной памяти">♻️</button>
        <h3>Автодонатер</h3>
    `;
    document.body.appendChild(panel);

    // Кнопка для показа панели, когда она скрыта
    const toggleBtn = document.createElement('div');
    toggleBtn.id = "autoDonatorToggle";
    toggleBtn.textContent = "☰";
    document.body.appendChild(toggleBtn);

    /*****************************************
     * 4. Поля загрузки (никнеймы, сообщения)
     *****************************************/
    panel.appendChild(createFileInput('Никнеймы', 'nicknamesFile'));
    panel.appendChild(createFileInput('Сообщения для донатов', 'messagesFile'));

    /*****************************************
     * 5. Поля задержки (основной режим)
     *****************************************/
    const delayContainer = document.createElement('div');
    delayContainer.style.marginBottom = '8px';
    delayContainer.innerHTML = `
        <label>Тайминг запуска (сек):</label><br>
        <input type="number" id="minDelay" value="60" style="width:50px;"> до
        <input type="number" id="maxDelay" value="300" style="width:50px;">
    `;
    panel.appendChild(delayContainer);

    /*****************************************
     * 6. Диапазоны сумм (основной)
     *****************************************/
    const rangesContainer = document.createElement('div');
    rangesContainer.style.marginBottom = '8px';
    rangesContainer.innerHTML = `<label>Диапазоны (% от, до):</label>`;
    panel.appendChild(rangesContainer);

    function createRangeRow(percent = '', from = '', to = '') {
        const row = document.createElement('div');
        row.style.marginBottom = '4px';
        row.innerHTML = `
            <input type="number" class="rangePercent" placeholder="%" value="${percent}" style="width:40px;">
            <input type="number" class="rangeFrom" placeholder="от" value="${from}" style="width:50px;">
            <input type="number" class="rangeTo" placeholder="до" value="${to}" style="width:50px;">
            <button class="removeRange">❌</button>
        `;
        row.querySelector('.removeRange').addEventListener('click', () => {
            rangesContainer.removeChild(row);
        });
        rangesContainer.appendChild(row);
    }
    createRangeRow();

    const addRangeBtn = document.createElement('button');
    addRangeBtn.textContent = '+ Добавить диапазон';
    panel.appendChild(addRangeBtn);
    addRangeBtn.addEventListener('click', () => createRangeRow());

    /*****************************************
     * 7. Кастомное сообщение
     *****************************************/
    const customMsgContainer = document.createElement('div');
    customMsgContainer.style.marginBottom = '8px';
    customMsgContainer.innerHTML = `
        <label>Кастомное сообщение</label><br>
        <input type="text" id="customMessage" style="width:90%;">
    `;
    panel.appendChild(customMsgContainer);

    /*****************************************
     * 8. Блок кнопок (основной)
     *****************************************/
    const btnContainer = document.createElement('div');
    btnContainer.style.textAlign = 'center';
    panel.appendChild(btnContainer);

    const startBtn = document.createElement('button');
    startBtn.textContent = '▶️ Старт';
    btnContainer.appendChild(startBtn);

    const customSendBtn = document.createElement('button');
    customSendBtn.textContent = '📨 Отправить донат';
    btnContainer.appendChild(customSendBtn);

    const checkLinesBtn = document.createElement('button');
    checkLinesBtn.textContent = 'Проверить строки';
    btnContainer.appendChild(checkLinesBtn);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Сохранить настройки';
    btnContainer.appendChild(saveBtn);

    const hideBtn = document.createElement('button');
    hideBtn.textContent = 'Скрыть меню';
    btnContainer.appendChild(hideBtn);

    // Кнопка «Доп. функции» (расширяет панель)
    const extraMenuBtn = document.createElement('button');
    extraMenuBtn.textContent = 'Доп. функции';
    btnContainer.appendChild(extraMenuBtn);

    /*****************************************
     * 9. Лог
     *****************************************/
    const logArea = document.createElement('div');
    logArea.id = 'autoDonatorLog';
    panel.appendChild(logArea);

    /*****************************************
     * 10. Доп. блок (изначально скрыт, при extended показывается)
     *****************************************/
    const extraBlock = document.createElement('div');
    extraBlock.id = 'extraFunctionsBlock';
    extraBlock.innerHTML = `
       <h4>Доп. функции</h4>
       <div style="margin-bottom:5px;">
         <label>Доп. Интервал (сек):</label><br>
         От <input type="number" id="extraMin" value="120" style="width:60px;">
         до <input type="number" id="extraMax" value="300" style="width:60px;">
       </div>
       <div style="margin-bottom:5px;">
         <label>Ник доп. режима:</label><br>
         <input type="text" id="extraNick" value="ExtraNick" style="width:120px;">
       </div>
       <div style="margin-bottom:5px;">
         <label>Файл доп. сообщений:</label><br>
         <input type="file" id="extraFile">
       </div>
       <button id="extraStartBtn">Старт (Доп. режим)</button>
       <p style="font-size:12px;">(Упорядоченно: удаляется сообщение из памяти после отправки)</p>
    `;
    panel.appendChild(extraBlock);

    /*****************************************
     * 11. Глобальные переменные
     *****************************************/
    let autoRunning = false, autoTimeout = null;
    let nicknamesData = [], messagesData = [];

    // Доп. режим
    let extraRunning = false, extraTimeout = null;
    let extraMessages = [], extraIndex = 0;

    /*****************************************
     * 12. Функция обновления индикатора статуса
     *****************************************/
    function updateStatusIndicator(inputId, isSaved) {
        const statusEl = document.getElementById("status_" + inputId);
        if (statusEl) {
            if (isSaved) {
                statusEl.textContent = "✅ Уже сохранено в памяти";
                statusEl.style.color = "green";
            } else {
                statusEl.textContent = "❌ не сохранено в памяти";
                statusEl.style.color = "red";
            }
        }
    }

    /*****************************************
     * 13. Функция логирования
     *****************************************/
    function logMessage(msg) {
        const time = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = `[${time}] — ${msg}`;
        if (msg.includes('Ожидание')) {
            line.style.color = 'yellow';
        } else if (msg.includes('Донат отправлен')) {
            line.style.color = 'lightgreen';
        } else if (msg.includes('Ошибка')) {
            line.style.color = 'red';
        } else {
            line.style.color = 'white';
        }
        logArea.appendChild(line);
        setTimeout(() => line.classList.add('visible'), 10);
        logArea.scrollTop = logArea.scrollHeight;
    }

    /*****************************************
     * 14. Загрузка файлов
     *****************************************/
    function loadFile(inputEl, callback) {
        const file = inputEl.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => callback(e.target.result);
        reader.readAsText(file, 'utf-8');
    }
    function loadNicknames() {
        loadFile(document.getElementById('nicknamesFile'), text => {
            nicknamesData = text.split('\n').map(s => s.trim()).filter(Boolean);
            GM_setValue('nicknamesMemory', nicknamesData);
            logMessage(`Никнеймы загружены: ${nicknamesData.length}`);
            updateStatusIndicator('nicknamesFile', true);
        });
    }
    function loadMessages() {
        loadFile(document.getElementById('messagesFile'), text => {
            messagesData = text.split('\n').map(s => s.trim()).filter(Boolean);
            GM_setValue('messagesMemory', messagesData);
            logMessage(`Сообщения загружены: ${messagesData.length}`);
            updateStatusIndicator('messagesFile', true);
        });
    }
    document.getElementById('nicknamesFile').addEventListener('change', loadNicknames);
    document.getElementById('messagesFile').addEventListener('change', loadMessages);

    // Доп. файл
    function loadExtraMessages() {
        loadFile(document.getElementById('extraFile'), text => {
            extraMessages = text.split('\n').map(s => s.trim()).filter(Boolean);
            GM_setValue('extraMessagesMemory', extraMessages);
            extraIndex = 0;
            logMessage(`Доп. сообщения загружены: ${extraMessages.length}`);
        });
    }
    document.getElementById('extraFile').addEventListener('change', loadExtraMessages);

    // Восстановление данных из памяти
    const storedNicks = GM_getValue('nicknamesMemory', []);
    if (Array.isArray(storedNicks) && storedNicks.length > 0) {
        nicknamesData = storedNicks;
        logMessage(`🔁 Восстановлено никнеймов: ${nicknamesData.length}`);
        updateStatusIndicator('nicknamesFile', true);
    } else {
        updateStatusIndicator('nicknamesFile', false);
    }
    const storedMsgs = GM_getValue('messagesMemory', []);
    if (Array.isArray(storedMsgs) && storedMsgs.length > 0) {
        messagesData = storedMsgs;
        logMessage(`🔁 Восстановлено сообщений: ${messagesData.length}`);
        updateStatusIndicator('messagesFile', true);
    } else {
        updateStatusIndicator('messagesFile', false);
    }
    const storedExtra = GM_getValue('extraMessagesMemory', []);
    if (Array.isArray(storedExtra) && storedExtra.length > 0) {
        extraMessages = storedExtra;
        logMessage(`🔁 Восстановлено доп. сообщений: ${extraMessages.length}`);
    }

    // Кнопка сброса памяти
    const resetBtn = document.getElementById('resetMessagesBtn');
    resetBtn.addEventListener('click', () => {
        GM_setValue('nicknamesMemory', []);
        GM_setValue('messagesMemory', []);
        GM_setValue('extraMessagesMemory', []);
        nicknamesData = [];
        messagesData = [];
        extraMessages = [];
        logMessage('♻️ Память никнеймов, сообщений и доп. сообщений сброшена.');
        updateStatusIndicator('nicknamesFile', false);
        updateStatusIndicator('messagesFile', false);
    });

    /*****************************************
     * 15. Сохранение настроек
     *****************************************/
    function saveSettings() {
        const rows = rangesContainer.querySelectorAll('div');
        const ranges = [];
        rows.forEach(row => {
            ranges.push({
                percent: row.querySelector('.rangePercent').value,
                from: row.querySelector('.rangeFrom').value,
                to: row.querySelector('.rangeTo').value
            });
        });
        const settings = {
            minDelay: document.getElementById('minDelay').value,
            maxDelay: document.getElementById('maxDelay').value,
            customMessage: document.getElementById('customMessage').value,
            ranges
        };
        GM_setValue('autoDonatorSettings', settings);
        logMessage('Настройки сохранены.');
    }
    saveBtn.addEventListener('click', saveSettings);

    const savedSettings = GM_getValue('autoDonatorSettings', null);
    if (savedSettings) {
        document.getElementById('minDelay').value = savedSettings.minDelay || 60;
        document.getElementById('maxDelay').value = savedSettings.maxDelay || 300;
        document.getElementById('customMessage').value = savedSettings.customMessage || '';
        rangesContainer.innerHTML = '';
        if (savedSettings.ranges && savedSettings.ranges.length) {
            savedSettings.ranges.forEach(r => {
                createRangeRow(r.percent, r.from, r.to);
            });
        } else {
            createRangeRow();
        }
        logMessage('Настройки загружены из памяти.');
    }

    /*****************************************
     * 16. Функции pickWeightedAmount, getRandomItem
     *****************************************/
    function parseRanges() {
        const rows = rangesContainer.querySelectorAll('div');
        let total = 0;
        const result = [];
        rows.forEach(row => {
            const percent = parseInt(row.querySelector('.rangePercent').value);
            const from = parseInt(row.querySelector('.rangeFrom').value);
            const to = parseInt(row.querySelector('.rangeTo').value);
            if (!isNaN(percent) && !isNaN(from) && !isNaN(to)) {
                total += percent;
                result.push({ percent, from, to });
            }
        });
        if (total !== 100) {
            logMessage('❌ Сумма процентов должна быть 100');
            return null;
        }
        return result;
    }
    function pickWeightedAmount(ranges) {
        const r = Math.floor(Math.random() * 100) + 1;
        let total = 0;
        for (const { percent, from, to } of ranges) {
            total += percent;
            if (r <= total) {
                return Math.floor(Math.random() * (to - from + 1)) + from;
            }
        }
        return Math.floor(Math.random() * 500) + 1;
    }
    function getRandomItem(arr) {
        if (!arr || !arr.length) return null;
        const i = Math.floor(Math.random() * arr.length);
        return arr[i];
    }

    /*****************************************
     * 17. Основной автодонат
     *****************************************/
    async function sendDonation(customMsg = null) {
        const ranges = parseRanges();
        if (!ranges) return;
        const donateBtn = document.querySelector('button.b-donations__btn');
        if (!donateBtn) {
            logMessage('Не найдена кнопка доната.');
            return;
        }
        donateBtn.click();
        await new Promise(r => setTimeout(r, 1000));

        let nickname = getRandomItem(nicknamesData) || "Anonymous";
        let message = customMsg;
        if (!message) {
            if (messagesData.length === 0) {
                logMessage('🚨 Сообщения закончились!');
                return;
            }
            // Берём случайное сообщение
            const idx = Math.floor(Math.random() * messagesData.length);
            message = messagesData[idx];
            messagesData.splice(idx, 1);
            GM_setValue('messagesMemory', messagesData);
        }
        const amount = pickWeightedAmount(ranges);

        const nicknameInput = document.querySelector('#add_donation input[type=text]');
        const amountInput = document.querySelectorAll('#add_donation input[type=text]')[1];
        const messageTextarea = document.querySelector('#add_donation textarea');
        if (nicknameInput && amountInput && messageTextarea) {
            nicknameInput.value = nickname;
            amountInput.value = amount;
            messageTextarea.value = message;
        } else {
            logMessage('Не найдены поля ввода.');
            return;
        }
        const checkbox = document.querySelector('#add_donation label span.b-checkbox__pseudo');
        if (checkbox) checkbox.click();
        await new Promise(r => setTimeout(r, 500));

        const sendBtn = document.querySelector('#add_donation button.b-btn');
        if (sendBtn) {
            sendBtn.click();
            logMessage(`✅ Донат отправлен!\n💬 ${message}\n💰 ${amount}₽`);
        } else {
            logMessage('Не найдена кнопка отправки доната.');
        }
    }

    function startAutoDonator() {
        autoRunning = true;
        const min = parseInt(document.getElementById('minDelay').value) || 60;
        const max = parseInt(document.getElementById('maxDelay').value) || 300;

        function loop() {
            if (!autoRunning) return;
            const delay = Math.floor(Math.random() * (max - min + 1)) + min;
            logMessage(`⏳ Ожидание ${delay}с до следующего доната...`);
            autoTimeout = setTimeout(async () => {
                await sendDonation();
                loop();
            }, delay * 1000);
        }
        loop();
    }
    startBtn.addEventListener('click', () => {
        if (autoRunning) {
            autoRunning = false;
            if (autoTimeout) clearTimeout(autoTimeout);
            startBtn.textContent = '▶️ Старт';
            logMessage('Автодонат остановлен.');
        } else {
            autoRunning = true;
            startBtn.textContent = '⏸ Пауза';
            logMessage('Автодонат запущен.');
            startAutoDonator();
        }
    });

    customSendBtn.addEventListener('click', () => {
        const customMsg = document.getElementById('customMessage').value.trim();
        if (!customMsg) {
            logMessage('⚠️ Пустое сообщение.');
            return;
        }
        sendDonation(customMsg);
        document.getElementById('customMessage').value = '';
    });

    checkLinesBtn.addEventListener('click', () => {
        const remaining = messagesData.length;
        logMessage(`Осталось сообщений: ${remaining}`);

        const min = parseInt(document.getElementById('minDelay').value) || 60;
        const max = parseInt(document.getElementById('maxDelay').value) || 300;
        const avg = (min + max) / 2;
        const totalSec = remaining * avg;
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        logMessage(`Примерно хватит на ${hours}ч ${minutes}м при среднем ~${Math.round(avg)}с.`);
    });

    // Скрыть панель
    hideBtn.addEventListener('click', () => {
        panel.style.display = 'none';
        toggleBtn.style.display = 'block';
    });
    toggleBtn.addEventListener('click', () => {
        panel.style.display = 'block';
        toggleBtn.style.display = 'none';
    });

    /*****************************************
     * 18. Дополнительный режим
     *****************************************/
    let extended = false;
    extraMenuBtn.addEventListener('click', () => {
        extended = !extended;
        if (extended) {
            panel.classList.add('extended');
            logMessage("Панель расширена (доп. функции).");
        } else {
            panel.classList.remove('extended');
            logMessage("Доп. функции скрыты (панель вернулась).");
        }
    });

    // Поля и кнопка в доп. режиме
    const extraMinInput = document.getElementById('extraMin');
    const extraMaxInput = document.getElementById('extraMax');
    const extraNickInput = document.getElementById('extraNick');
    const extraStartBtn = document.getElementById('extraStartBtn');

    async function sendExtraDonation() {
        const donateBtn = document.querySelector('button.b-donations__btn');
        if (!donateBtn) {
            logMessage('Доп: Не найдена кнопка доната.');
            return;
        }
        donateBtn.click();
        await new Promise(r => setTimeout(r, 1000));

        // Ник
        const enick = extraNickInput.value.trim() || "ExtraNick";

        // Сообщение (по порядку, удаляем из массива)
        if (extraMessages.length === 0) {
            logMessage('Доп: Сообщения закончились!');
            return;
        }
        const emessage = extraMessages[0]; // берём первый
        extraMessages.splice(0, 1);          // удаляем его
        GM_setValue('extraMessagesMemory', extraMessages);

        // Сумма = random из extraMin..extraMax
        const emin = parseInt(extraMinInput.value) || 50;
        const emax = parseInt(extraMaxInput.value) || 100;
        const eamount = Math.floor(Math.random() * (emax - emin + 1)) + emin;

        // Заполняем поля
        const nicknameInput = document.querySelector('#add_donation input[type=text]');
        const amountInput = document.querySelectorAll('#add_donation input[type=text]')[1];
        const messageTextarea = document.querySelector('#add_donation textarea');
        if (nicknameInput && amountInput && messageTextarea) {
            nicknameInput.value = enick;
            amountInput.value = eamount;
            messageTextarea.value = emessage;
        } else {
            logMessage('Доп: Не найдены поля ввода.');
            return;
        }
        const checkbox = document.querySelector('#add_donation label span.b-checkbox__pseudo');
        if (checkbox) checkbox.click();
        await new Promise(r => setTimeout(r, 500));

        const sendBtn = document.querySelector('#add_donation button.b-btn');
        if (sendBtn) {
            sendBtn.click();
            logMessage(`✅ [Доп] Донат отправлен!\n👤 ${enick}\n💬 ${emessage}\n💰 ${eamount}₽`);
        } else {
            logMessage('Доп: Не найдена кнопка отправки доната.');
        }
    }
    function startExtraLoop() {
        extraRunning = true;
        function loop() {
            if (!extraRunning) return;
            const emin = parseInt(extraMinInput.value) || 50;
            const emax = parseInt(extraMaxInput.value) || 100;
            const edelay = Math.floor(Math.random() * (emax - emin + 1)) + emin;
            logMessage(`⏳ [Доп] Ожидание ${edelay}с до следующего доп. доната...`);
            extraTimeout = setTimeout(async () => {
                await sendExtraDonation();
                loop();
            }, edelay * 1000);
        }
        loop();
    }

    extraStartBtn.addEventListener('click', () => {
        if (extraRunning) {
            extraRunning = false;
            if (extraTimeout) clearTimeout(extraTimeout);
            extraStartBtn.textContent = 'Старт (Доп. режим)';
            logMessage('Доп. режим остановлен.');
        } else {
            extraRunning = true;
            extraStartBtn.textContent = 'Стоп (Доп. режим)';
            logMessage('Доп. режим запущен.');
            startExtraLoop();
        }
    });

})();
