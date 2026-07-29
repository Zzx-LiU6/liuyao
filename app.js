// ================================================================
// ===== 六爻核心数据 =====
// ================================================================

const BA_GUA = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
const SIXTY_FOUR_GUA = {
    '乾': { '乾': '乾为天', '兑': '天泽履', '离': '天火同人', '震': '天雷无妄', '巽': '天风姤', '坎': '天水讼', '艮': '天山遁',
        '坤': '天地否' },
    '兑': { '乾': '泽天夬', '兑': '兑为泽', '离': '泽火革', '震': '泽雷随', '巽': '泽风大过', '坎': '泽水困', '艮': '泽山咸',
        '坤': '泽地萃' },
    '离': { '乾': '火天大有', '兑': '火泽睽', '离': '离为火', '震': '火雷噬嗑', '巽': '火风鼎', '坎': '火水未济', '艮': '火山旅',
        '坤': '火地晋' },
    '震': { '乾': '雷天大壮', '兑': '雷泽归妹', '离': '雷火丰', '震': '震为雷', '巽': '雷风恒', '坎': '雷水解', '艮': '雷山小过',
        '坤': '雷地豫' },
    '巽': { '乾': '风天小畜', '兑': '风泽中孚', '离': '风火家人', '震': '风雷益', '巽': '巽为风', '坎': '风水涣', '艮': '风山渐',
        '坤': '风地观' },
    '坎': { '乾': '水天需', '兑': '水泽节', '离': '水火既济', '震': '水雷屯', '巽': '水风井', '坎': '坎为水', '艮': '水山蹇',
        '坤': '水地比' },
    '艮': { '乾': '山天大畜', '兑': '山泽损', '离': '山火贲', '震': '山雷颐', '巽': '山风蛊', '坎': '山水蒙', '艮': '艮为山',
        '坤': '山地剥' },
    '坤': { '乾': '地天泰', '兑': '地泽临', '离': '地火明夷', '震': '地雷复', '巽': '地风升', '坎': '地水师', '艮': '地山谦',
        '坤': '坤为地' }
};

const YAO_TYPES = {
    '老阳': { symbol: '━━━━━', dong: true, value: 1 },
    '少阳': { symbol: '━━━━━', dong: false, value: 1 },
    '少阴': { symbol: '━ ━', dong: false, value: 0 },
    '老阴': { symbol: '━ ━', dong: true, value: 0 }
};
const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

// ================================================================
// ===== 状态 =====
// ================================================================

let state = {
    question: '',
    mode: 'electronic',
    results: [],
    step: 0,
    isComplete: false,
    isFlipping: false,
    history: [],
};

// ================================================================
// ===== DOM 引用 =====
// ================================================================

const $ = id => document.getElementById(id);
const qInput = $('questionInput');
const stepQ = $('stepQuestion');
const stepC = $('stepCasting');
const stepR = $('stepResult');
const stepDisplay = $('stepDisplay');
const wrapper1 = $('wrapper1');
const wrapper2 = $('wrapper2');
const wrapper3 = $('wrapper3');
const throwBtn = $('throwBtn');
const manualOpts = $('manualOptions');
const manualHint = $('manualHint');
const resultHint = $('resultHint');
const progressText = $('progressText');
const modeBadge = $('modeBadge');
const castingHint = $('castingHint');

const yaoEls = [];
for (let i = 1; i <= 6; i++) {
    yaoEls.push({
        line: $('yao' + i),
        status: $('status' + i),
        row: document.querySelector(`.yao-row[data-index="${i-1}"]`)
    });
}

// ================================================================
// ===== 工具 =====
// ================================================================

function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function closeModal(id) {
    $(id).classList.remove('open');
}

function secureRandom() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967295;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ================================================================
// ===== 核心六爻 =====
// ================================================================

function getYaoType(c1, c2, c3) {
    const yang = (c1 ? 1 : 0) + (c2 ? 1 : 0) + (c3 ? 1 : 0);
    if (yang === 3) return '老阳';
    if (yang === 2) return '少阳';
    if (yang === 1) return '少阴';
    return '老阴';
}

function getRandomCoins() {
    return [secureRandom() > 0.5, secureRandom() > 0.5, secureRandom() > 0.5];
}

function getBenGua(types) {
    const xia = types.slice(0, 3).map(t => YAO_TYPES[t].value);
    const shang = types.slice(3, 6).map(t => YAO_TYPES[t].value);
    const xiaNum = xia[2] * 4 + xia[1] * 2 + xia[0];
    const shangNum = shang[2] * 4 + shang[1] * 2 + shang[0];
    const xiaGua = BA_GUA[xiaNum];
    const shangGua = BA_GUA[shangNum];
    return { shangGua, xiaGua, name: SIXTY_FOUR_GUA[shangGua]?.[xiaGua] || '未知卦' };
}

function getBianGua(types) {
    const newTypes = types.map(t => {
        if (t === '老阳') return '少阴';
        if (t === '老阴') return '少阳';
        return t;
    });
    return getBenGua(newTypes);
}

function getDongYao(types) {
    const pos = [];
    types.forEach((t, i) => { if (YAO_TYPES[t].dong) pos.push(i + 1); });
    return pos;
}

function generateResultText(question, benGua, bianGua, dongPos, types) {
    const lines = types.map((t, i) => {
        const sym = YAO_TYPES[t].symbol;
        const isDong = YAO_TYPES[t].dong;
        return `${YAO_NAMES[i]}：${sym}${isDong ? '  ✦ 动爻' : ''}`;
    }).reverse().join('\n');

    let text = `【六爻起卦记录】\n\n问题：${question}\n\n`;
    text += `本卦：${benGua.name}（${benGua.shangGua}上${benGua.xiaGua}下）\n`;
    if (dongPos.length > 0) {
        text += `变卦：${bianGua.name}（${bianGua.shangGua}上${bianGua.xiaGua}下）\n`;
        text += `动爻：${dongPos.map(p => `第${p}爻`).join('、')}\n\n`;
    } else {
        text += `变卦：无（静卦）\n动爻：无\n\n`;
    }
    text += `【爻位详情】\n${lines}\n\n`;
    text += `【请解读】请根据以上卦象，针对我的问题进行详细解读。`;
    return text;
}

// ================================================================
// ===== 历史记录 =====
// ================================================================

function loadHistory() {
    try {
        const d = localStorage.getItem('liuyaoHistory');
        state.history = d ? JSON.parse(d) : [];
    } catch { state.history = []; }
}

function saveHistory(question, benGua, bianGua, dongPos, types) {
    const entry = {
        id: Date.now(),
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        question: question,
        benGua: benGua.name,
        bianGua: dongPos.length > 0 ? bianGua.name : '静卦',
        dongYao: dongPos.map(p => `第${p}爻`).join('、') || '无',
        guaXiang: `${benGua.shangGua}↑${benGua.xiaGua}↓`,
        types: types,
    };
    state.history.unshift(entry);
    if (state.history.length > 30) state.history.pop();
    localStorage.setItem('liuyaoHistory', JSON.stringify(state.history));
}

function openHistoryModal() {
    const list = $('historyList');
    if (state.history.length === 0) {
        list.innerHTML = `<div class="history-empty">暂无起卦记录</div>`;
    } else {
        let html = '';
        state.history.forEach(item => {
            html += `
                <div class="history-item" onclick="restoreHistory(${item.id})">
                    <span class="h-del" onclick="event.stopPropagation();deleteHistory(${item.id})">✕</span>
                    <div class="h-time">${item.time}</div>
                    <div class="h-question">${item.question}</div>
                    <div class="h-gua">${item.benGua} → ${item.bianGua} ｜ 动爻：${item.dongYao}</div>
                </div>
            `;
        });
        list.innerHTML = html;
    }
    $('historyModal').classList.add('open');
}

function restoreHistory(id) {
    const entry = state.history.find(h => h.id === id);
    if (!entry) return;
    const types = entry.types;
    const benGua = getBenGua(types);
    const dongPos = getDongYao(types);
    const bianGua = dongPos.length > 0 ? getBianGua(types) : benGua;

    // ---- 恢复 state，让复制功能正常工作 ----
    state.results = types.slice(); // 拷贝一份
    state.question = entry.question;
    state.step = 6;
    state.isComplete = true;

    showResultWithData(entry.question, types, benGua, bianGua, dongPos);
    closeModal('historyModal');
    showToast('📜 已恢复历史卦象');
}

function deleteHistory(id) {
    state.history = state.history.filter(h => h.id !== id);
    localStorage.setItem('liuyaoHistory', JSON.stringify(state.history));
    openHistoryModal();
}

function clearAllHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        state.history = [];
        localStorage.removeItem('liuyaoHistory');
        openHistoryModal();
        showToast('🗑 已清空');
    }
}

// ================================================================
// ===== 铜钱渲染 =====
// ================================================================

function createCoinElement(isYang) {
    const coin = document.createElement('div');
    coin.className = 'coin-3d';

    // ---- 单个厚度层（实心铜色填充） ----
    const thickness = document.createElement('div');
    thickness.className = 'coin-thickness';
    // 横向渐变模拟侧面厚度，边缘更亮、中间微凹
    thickness.style.background = `
        radial-gradient(ellipse at 50% 50%, 
            #b08860 0%, 
            #c8a880 20%, 
            #9a7a5a 50%, 
            #7a5a3a 80%, 
            #5a4028 100%
        )
    `;
    thickness.style.boxShadow = 'inset 0 0 25px rgba(0,0,0,0.5)';
    thickness.style.transform = 'translateZ(-2px)';
    thickness.style.zIndex = '0';
    coin.appendChild(thickness);

    // 字面（正面）
    const front = document.createElement('div');
    front.className = 'coin-face front';
    front.style.backgroundImage = "url('images/coin-front.png')";
    front.style.backgroundSize = "cover";
    front.style.backgroundPosition = "center";
    front.style.zIndex = '1';
    coin.appendChild(front);

    // 花面（背面）
    const back = document.createElement('div');
    back.className = 'coin-face back';
    back.style.backgroundImage = "url('images/coin-back.png')";
    back.style.backgroundSize = "cover";
    back.style.backgroundPosition = "center";
    back.style.zIndex = '1';
    coin.appendChild(back);

    // 随机角度
    const finalAngle = isYang ? 180 : 0;
    const randomX = (Math.random() - 0.5) * 8;
    const randomY = (Math.random() - 0.5) * 8 + finalAngle;
    const randomZ = (Math.random() - 0.5) * 6;
    coin.style.setProperty('--final-x', randomX + 'deg');
    coin.style.setProperty('--final-y', randomY + 'deg');
    coin.style.setProperty('--final-z', randomZ + 'deg');
    coin.style.transform = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;

    return coin;
}

function renderCoins(results) {
    const wrappers = [wrapper1, wrapper2, wrapper3];
    wrappers.forEach((w, idx) => {
        w.innerHTML = '';
        const coin = createCoinElement(results[idx]);
        w.appendChild(coin);
    });
}

function renderPlaceholder() {
    [wrapper1, wrapper2, wrapper3].forEach(w => {
        w.innerHTML = `<div class="coin-placeholder">?</div>`;
    });
}

function throwCoinsAnimated(results, callback) {
    const wrappers = [wrapper1, wrapper2, wrapper3];
    const throwClasses = ['throw-1', 'throw-2', 'throw-3'];

    wrappers.forEach((w, idx) => {
        const coin = createCoinElement(results[idx]);
        w.innerHTML = '';
        w.appendChild(coin);

        coin.classList.remove('throw-1', 'throw-2', 'throw-3');
        const classIdx = idx;
        coin.classList.add(throwClasses[classIdx]);

        const finalAngle = results[idx] ? 180 : 0;
        const randomX = (Math.random() - 0.5) * 10;
        const randomY = (Math.random() - 0.5) * 10 + finalAngle;
        const randomZ = (Math.random() - 0.5) * 8;
        coin.style.setProperty('--final-x', randomX + 'deg');
        coin.style.setProperty('--final-y', randomY + 'deg');
        coin.style.setProperty('--final-z', randomZ + 'deg');
    });

    const maxDuration = 1050;
    setTimeout(() => {
        callback();
    }, maxDuration);
}

// ================================================================
// ===== UI 交互 =====
// ================================================================

function startCasting() {
    const q = qInput.value.trim();
    if (!q) { showToast('⚠️ 请先输入你想问的问题'); return; }
    state.question = q;
    stepQ.classList.add('hidden');
    stepC.classList.remove('hidden');
    resetCasting();
    showToast('🪙 心念问题，每次点击抛一次');
}

function resetCasting() {
    state.results = [];
    state.step = 0;
    state.isComplete = false;
    state.isFlipping = false;

    yaoEls.forEach((el, i) => {
        el.line.textContent = '⚫';
        el.line.style.color = '';
        el.status.textContent = '待定';
        el.status.className = 'status';
        el.row.classList.remove('done');
    });

    renderPlaceholder();
    resultHint.textContent = '';
    progressText.textContent = '0 / 6';
    stepDisplay.innerHTML = `第 1 次 <span class="sub">（初爻）</span>`;

    throwBtn.disabled = false;
    throwBtn.textContent = '🔄 抛铜钱';
    document.querySelectorAll('.manual-options .btn').forEach(b => b.disabled = false);
    switchMode(state.mode);
}

function switchMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-toggle .btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    if (mode === 'electronic') {
        manualOpts.classList.add('hidden');
        manualHint.classList.add('hidden');
        throwBtn.classList.remove('hidden');
        modeBadge.textContent = '电子铜钱';
        castingHint.textContent = '心念问题，点击「抛铜钱」——每次只抛一次';
    } else {
        manualOpts.classList.remove('hidden');
        manualHint.classList.remove('hidden');
        throwBtn.classList.add('hidden');
        modeBadge.textContent = '真实抛币';
        castingHint.textContent = '用三枚硬币抛六次，每次在下方选择结果';
    }
}

function throwOnce() {
    if (state.isFlipping || state.step >= 6) return;
    state.isFlipping = true;
    throwBtn.disabled = true;
    throwBtn.textContent = '⏳ 落定中...';

    const results = getRandomCoins();
    throwCoinsAnimated(results, () => {
        const yaoType = getYaoType(results[0], results[1], results[2]);
        recordYao(yaoType, results);
        state.isFlipping = false;
        throwBtn.disabled = false;
        throwBtn.textContent = '🔄 抛铜钱';
    });
}

function manualSelect(yangCount) {
    if (state.step >= 6) return;
    const map = { 3: 0, 2: 1, 1: 2, 0: 3 };
    const actualYang = map[yangCount];
    const results = [];
    for (let i = 0; i < 3; i++) results.push(i < actualYang);
    shuffleArray(results);

    document.querySelectorAll('.manual-options .btn').forEach(b => b.classList.remove('selected'));
    const btns = document.querySelectorAll('.manual-options .btn');
    const idxMap = { 3: 0, 2: 1, 1: 2, 0: 3 };
    btns[idxMap[yangCount]]?.classList.add('selected');

    renderCoins(results);
    const yaoType = getYaoType(results[0], results[1], results[2]);
    recordYao(yaoType, results);
}

function renderYaoLine(element, yaoType) {
    const isDong = YAO_TYPES[yaoType].dong;
    const symbol = YAO_TYPES[yaoType].symbol;

    if (symbol === '━━━━━') {
        element.innerHTML = `<span class="yang-line${isDong ? ' dong-color' : ''}"></span>${isDong ? ' <span class="dong-mark">○</span>' : ''}`;
    } else {
        element.innerHTML =
            `<span class="yin-line${isDong ? ' dong-color' : ''}"></span><span class="yin-line${isDong ? ' dong-color' : ''}"></span>${isDong ? ' <span class="dong-mark">×</span>' : ''}`;
    }
}

function recordYao(yaoType, coinResults) {
    if (state.step >= 6) return;
    state.results.push(yaoType);
    const idx = state.step;
    const yaoIdx = idx;
    const el = yaoEls[yaoIdx];

    renderYaoLine(el.line, yaoType);

    const isDong = YAO_TYPES[yaoType].dong;
    el.status.textContent = isDong ? '✦ 动爻' : '静爻';
    el.status.className = 'status' + (isDong ? ' dong' : '');
    el.row.classList.add('done');

    state.step++;
    progressText.textContent = `${state.step} / 6`;
    const stepNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
    resultHint.innerHTML = `第${state.step}次：<span class="gold">${yaoType}</span>${isDong ? ' ✦动爻' : ' 静爻'}`;

    if (state.step < 6) {
        stepDisplay.innerHTML = `第 ${state.step + 1} 次 <span class="sub">（${stepNames[state.step]}）</span>`;
    } else {
        stepDisplay.textContent = '✅ 六次完成！';
        state.isComplete = true;
        throwBtn.disabled = true;
        throwBtn.textContent = '✅ 已完成';
        document.querySelectorAll('.manual-options .btn').forEach(b => b.disabled = true);
        setTimeout(showResult, 500);
    }
}

// ================================================================
// ===== 显示结果 =====
// ================================================================

function showResult() {
    const types = state.results;
    if (types.length !== 6) return;
    const benGua = getBenGua(types);
    const dongPos = getDongYao(types);
    const bianGua = dongPos.length > 0 ? getBianGua(types) : benGua;
    showResultWithData(state.question, types, benGua, bianGua, dongPos);
    saveHistory(state.question, benGua, bianGua, dongPos, types);
}

function showResultWithData(question, types, benGua, bianGua, dongPos) {
    $('resultQuestion').textContent = question;
    $('resultBenGua').textContent = benGua.name + `（${benGua.shangGua}↑${benGua.xiaGua}↓）`;
    $('resultBianGua').textContent = dongPos.length > 0 ? bianGua.name + `（${bianGua.shangGua}↑${bianGua.xiaGua}↓）` :
        '无（静卦）';
    $('resultDongYao').textContent = dongPos.length === 0 ? '无动爻' : dongPos.map(p => `第${p}爻`).join('、');
    $('resultGuaXiang').textContent = `${benGua.shangGua}上 ${benGua.xiaGua}下`;

    // ---- 结果页爻位详情（用CSS绘制横线，和记录区保持一致） ----
    let html = '';
    for (let i = 5; i >= 0; i--) {
        const t = types[i];
        const isDong = YAO_TYPES[t].dong;
        const symbol = YAO_TYPES[t].symbol;
        const lineColor = isDong ? '#c88a3c' : '#e8ddd0';

        let lineHtml;
        if (symbol === '━━━━━') {
            // 阳爻：一根长横线
            lineHtml = `<span style="display:inline-block;width:72px;height:3px;background:${lineColor};border-radius:2px;"></span>`;
        } else {
            // 阴爻：两根短横线
            lineHtml = `
                <span style="display:inline-block;width:32px;height:3px;background:${lineColor};border-radius:2px;"></span>
                <span style="display:inline-block;width:32px;height:3px;background:${lineColor};border-radius:2px;margin-left:6px;"></span>
            `;
        }

        html += `
            <div class="row">
                <span class="label">${YAO_NAMES[i]}</span>
                ${lineHtml}
                ${isDong ? ' <span class="dong-mark">✦</span>' : ''}
            </div>
        `;
    }
    $('resultYaoDetail').innerHTML = html;

    stepC.classList.add('hidden');
    stepR.classList.remove('hidden');
    showToast('🔮 卦象已生成！');
}

// ================================================================
// ===== 复制 + AI跳转 =====
// ================================================================

function copyResult() {
    const types = state.results;
    if (types.length !== 6) { showToast('⚠️ 卦象不完整'); return; }
    const benGua = getBenGua(types);
    const dongPos = getDongYao(types);
    const bianGua = dongPos.length > 0 ? getBianGua(types) : benGua;
    const text = generateResultText(state.question, benGua, bianGua, dongPos, types);

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 已复制！选择AI平台');
        $('aiModal').classList.add('open');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('📋 已复制！选择AI平台');
        $('aiModal').classList.add('open');
    });
}

function openAI(platform) {
    const urls = {
        chatgpt: 'https://chat.openai.com/',
        deepseek: 'https://chat.deepseek.com/',
        gemini: 'https://gemini.google.com/',
        claude: 'https://claude.ai/'
    };
    if (urls[platform]) {
        window.open(urls[platform], '_blank');
        showToast('🔗 已打开 ' + platform.charAt(0).toUpperCase() + platform.slice(1));
    }
}

// ================================================================
// ===== 重置全部 =====
// ================================================================

function resetAll() {
    state.question = '';
    state.results = [];
    state.step = 0;
    state.isComplete = false;
    state.isFlipping = false;
    stepQ.classList.remove('hidden');
    stepC.classList.add('hidden');
    stepR.classList.add('hidden');
    qInput.value = '';
    renderPlaceholder();
    yaoEls.forEach((el, i) => {
        el.line.textContent = '⚫';
        el.line.style.color = '';
        el.status.textContent = '待定';
        el.status.className = 'status';
        el.row.classList.remove('done');
    });
    progressText.textContent = '0 / 6';
    resultHint.textContent = '';
    stepDisplay.innerHTML = `第 1 次 <span class="sub">（初爻）</span>`;
    document.querySelectorAll('.manual-options .btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.mode-toggle .btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === 'electronic');
    });
    switchMode('electronic');
    showToast('↺ 已重置');
}

// ================================================================
// ===== 初始化 =====
// ================================================================

loadHistory();
document.addEventListener('DOMContentLoaded', function() {
    switchMode('electronic');
    renderPlaceholder();
    qInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') startCasting();
    });
});