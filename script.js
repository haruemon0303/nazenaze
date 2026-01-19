/**
 * なぜなぜ君 - メインスクリプト
 *
 * MVP版：ダミーLLMで動作
 * 将来的にcallLLM関数を差し替えることで本物のLLM APIに接続可能
 */

// ========================================
// 状態管理
// ========================================
let conversationHistory = [];
let currentSuggestions = [
    { short: "お金儲けするには？", full: "お金儲けするにはどうすればいい？" },
    { short: "健康で長生きするには？", full: "健康で長生きするにはどうすればいい？" },
    { short: "異性にモテるには？", full: "異性にモテるにはどうすればいい？" }
];

// ========================================
// ダミーLLM実装（MVP版）
// ========================================
/**
 * LLM APIを呼び出す関数（現在はダミー実装）
 *
 * @param {string} prompt - ユーザーの質問
 * @param {Array} context - 会話履歴
 * @returns {Promise<{answer: string, suggestions: Array}>} 回答と次の質問候補
 *
 * ＜本物のLLMに接続する際の実装例＞
 *
 * async function callLLM(prompt, context) {
 *   // 例1: OpenAI API
 *   const response = await fetch('https://api.openai.com/v1/chat/completions', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${API_KEY}` // 注意：フロントエンドにAPIキーを置かない！
 *     },
 *     body: JSON.stringify({
 *       model: 'gpt-3.5-turbo',
 *       messages: [
 *         { role: 'system', content: '博士口調で200-400字で答え、次の質問候補3つを提案してください' },
 *         ...context,
 *         { role: 'user', content: prompt }
 *       ]
 *     })
 *   });
 *
 *   // 例2: 自前のEdge Function経由（推奨）
 *   const response = await fetch('/api/chat', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ prompt, context })
 *   });
 *
 *   const data = await response.json();
 *   return {
 *     answer: data.answer,
 *     suggestions: data.suggestions
 *   };
 * }
 */
async function callLLM(prompt, context) {
    // ローディング時間をシミュレート
    await new Promise(resolve => setTimeout(resolve, 800));

    // ダミー回答生成
    const answers = generateDummyAnswer(prompt, context);

    return {
        answer: answers.answer,
        suggestions: answers.suggestions
    };
}

/**
 * ダミー回答生成ロジック
 */
function generateDummyAnswer(prompt, context) {
    // プロンプトに応じた回答例
    const answerTemplates = {
        'お金': {
            answer: `むむ、お金の話じゃな。博士が教えよう。

【前提】
お金は「価値の交換手段」じゃ。つまり、他人に価値を提供した対価として得られるものなんじゃよ。

【理由】
収入を増やすには以下の3つのアプローチがあるぞい：

1. **スキルを高める** - 希少性の高い技術や知識を身につける
2. **他人の問題を解決する** - 困っている人が多いほど需要が高い
3. **資産を作る** - 自分が働かなくても収入を生む仕組みを持つ

【具体例】
プログラミング、デザイン、営業力など、市場価値の高いスキルを磨くのが近道じゃ。また、株式投資や不動産など、資産運用の知識も重要じゃぞ。

【次の問い】
さて、どの道を深掘りしたいかね？`,
            suggestions: [
                { short: "スキルを高めるには？", full: "スキルを高めるには具体的にどうすればいい？" },
                { short: "投資の始め方は？", full: "投資を始めるには何から学べばいい？" },
                { short: "副業で稼ぐには？", full: "副業で稼ぐには何が効率的？" }
            ]
        },
        '健康': {
            answer: `健康長寿の秘訣じゃな。博士の知見を授けよう。

【前提】
人間の寿命は遺伝が約25%、残り75%は生活習慣で決まるんじゃよ。つまり、自分でコントロールできる部分が大きいんじゃ。

【理由】
長生きの鍵は以下の要素じゃ：

1. **食事** - バランスの取れた栄養、腹八分目
2. **運動** - 適度な有酸素運動と筋トレ
3. **睡眠** - 質の良い7-8時間の睡眠
4. **ストレス管理** - 慢性ストレスは万病のもと
5. **社会的つながり** - 孤独は健康リスクを高める

【具体例】
地中海式食事、週3回の30分ウォーキング、瞑想習慣などが科学的に効果が実証されておるぞい。

【次の問い】
どの健康習慣から始めたいかね？`,
            suggestions: [
                { short: "良い食事とは？", full: "健康に良い食事の具体的な内容は？" },
                { short: "運動習慣のコツは？", full: "運動習慣を続けるコツは？" },
                { short: "睡眠の質を上げるには？", full: "睡眠の質を上げるにはどうすればいい？" }
            ]
        },
        'モテ': {
            answer: `ほほう、人間関係の話じゃな。博士が解説しよう。

【前提】
「モテる」とは、多くの人から好かれ、魅力的だと思われることじゃ。外見だけでなく、内面的な魅力も重要なんじゃよ。

【理由】
魅力を高める要素はこうじゃ：

1. **清潔感** - 第一印象の基本中の基本
2. **自信** - 自己肯定感は態度に表れる
3. **傾聴力** - 相手の話をしっかり聞く
4. **ユーモア** - 一緒にいて楽しい雰囲気を作る
5. **成長意欲** - 向上心のある人は魅力的じゃ

【具体例】
清潔な服装、適度な運動で体型維持、相手の目を見て話を聞く、自分の興味を持って取り組むことを持つ、などじゃな。

【次の問い】
どの要素を磨きたいかね？`,
            suggestions: [
                { short: "自信をつけるには？", full: "自信をつけるには何をすればいい？" },
                { short: "会話力を高めるには？", full: "会話力を高めるにはどうすればいい？" },
                { short: "第一印象を良くするには？", full: "第一印象を良くするコツは？" }
            ]
        },
        default: {
            answer: `ふむふむ、興味深い質問じゃな。「${prompt}」について博士が考察しよう。

【前提】
この問いには複数の側面があるんじゃよ。物事を多角的に見ることが大切じゃ。

【理由】
一般的に、このような疑問には以下のアプローチが有効じゃ：

1. **基本を理解する** - まず原理原則を学ぶ
2. **実践する** - 知識だけでなく経験を積む
3. **振り返る** - 結果を分析し改善する
4. **継続する** - 地道な努力が成果を生む

【具体例】
例えば、新しいスキルを学ぶときは、基礎から始めて小さな成功体験を重ね、習慣化することが重要じゃ。

【次の問い】
より具体的にどの部分を深掘りしたいかね？`,
            suggestions: [
                { short: "基本から学ぶには？", full: "基本から学ぶにはどうすればいい？" },
                { short: "実践のコツは？", full: "実践するときのコツは何？" },
                { short: "継続する秘訣は？", full: "継続するための秘訣は？" }
            ]
        }
    };

    // キーワードマッチング
    let matchedTemplate = answerTemplates.default;

    if (prompt.includes('お金') || prompt.includes('儲') || prompt.includes('稼') || prompt.includes('収入')) {
        matchedTemplate = answerTemplates['お金'];
    } else if (prompt.includes('健康') || prompt.includes('長生き') || prompt.includes('病気')) {
        matchedTemplate = answerTemplates['健康'];
    } else if (prompt.includes('モテ') || prompt.includes('異性') || prompt.includes('恋愛')) {
        matchedTemplate = answerTemplates['モテ'];
    }

    return matchedTemplate;
}

/**
 * 質問候補をランダムに生成（更新ボタン用）
 */
function generateRandomSuggestions(baseContext = null) {
    const randomSuggestionPool = [
        { short: "成功する人の特徴は？", full: "成功する人の特徴は何？" },
        { short: "幸せになるには？", full: "幸せになるにはどうすればいい？" },
        { short: "時間を有効に使うには？", full: "時間を有効に使うにはどうすればいい？" },
        { short: "良い人間関係を築くには？", full: "良い人間関係を築くにはどうすればいい？" },
        { short: "ストレスを減らすには？", full: "ストレスを減らすにはどうすればいい？" },
        { short: "集中力を高めるには？", full: "集中力を高めるにはどうすればいい？" },
        { short: "創造性を育むには？", full: "創造性を育むにはどうすればいい？" },
        { short: "自己肯定感を高めるには？", full: "自己肯定感を高めるにはどうすればいい？" },
        { short: "やる気を出すには？", full: "やる気を出すにはどうすればいい？" },
        { short: "良い習慣を身につけるには？", full: "良い習慣を身につけるにはどうすればいい？" }
    ];

    // ランダムに3つ選択
    const shuffled = [...randomSuggestionPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
}

// ========================================
// UI更新関数
// ========================================
/**
 * 質問候補ボタンを更新
 */
function updateSuggestions(suggestions) {
    currentSuggestions = suggestions;
    saveSuggestions();

    const buttonsContainer = document.getElementById('questionButtons');
    buttonsContainer.innerHTML = '';

    suggestions.forEach((suggestion) => {
        const button = document.createElement('button');
        button.className = 'question-btn';
        button.textContent = suggestion.short;
        button.dataset.question = suggestion.full;

        button.addEventListener('click', () => {
            document.getElementById('userInput').value = suggestion.full;
            handleSend();
        });

        buttonsContainer.appendChild(button);
    });
}

/**
 * 回答を表示
 */
function displayAnswer(question, answer, timestamp) {
    const container = document.getElementById('responseContainer');

    // 初回の場合はwelcomeメッセージを削除
    const welcomeMsg = container.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // 会話アイテムを作成
    const conversationItem = document.createElement('div');
    conversationItem.className = 'conversation-item';

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-text';
    questionDiv.textContent = `Q: ${question}`;

    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer-text';
    answerDiv.textContent = answer;

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    timestampDiv.textContent = formatTimestamp(timestamp);

    conversationItem.appendChild(questionDiv);
    conversationItem.appendChild(answerDiv);
    conversationItem.appendChild(timestampDiv);

    // 最新の回答を一番上に表示
    container.insertBefore(conversationItem, container.firstChild);
}

/**
 * ローディング表示
 */
function showLoading() {
    const container = document.getElementById('responseContainer');

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerHTML = `
        <span>博士が考え中...</span>
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    container.insertBefore(loadingDiv, container.firstChild);
}

/**
 * ローディング削除
 */
function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.remove();
    }
}

/**
 * エラー表示
 */
function showError(message) {
    const container = document.getElementById('responseContainer');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `エラー: ${message}`;

    container.insertBefore(errorDiv, container.firstChild);

    // 5秒後に自動削除
    setTimeout(() => errorDiv.remove(), 5000);
}

/**
 * タイムスタンプのフォーマット
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 1分以内
    if (diff < 60000) {
        return 'たった今';
    }
    // 1時間以内
    if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分前`;
    }
    // 今日
    if (date.toDateString() === now.toDateString()) {
        return `今日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    // それ以外
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ========================================
// イベントハンドリング
// ========================================
/**
 * 質問送信処理
 */
async function handleSend() {
    const input = document.getElementById('userInput');
    const question = input.value.trim();

    if (!question) {
        return;
    }

    // 入力欄をクリア
    input.value = '';

    // ボタンを無効化
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    try {
        // ローディング表示
        showLoading();

        // LLMを呼び出し
        const result = await callLLM(question, conversationHistory);

        // ローディング非表示
        hideLoading();

        // タイムスタンプ
        const timestamp = Date.now();

        // 回答を表示
        displayAnswer(question, result.answer, timestamp);

        // 履歴に追加
        conversationHistory.unshift({
            question,
            answer: result.answer,
            timestamp
        });

        // 履歴を10件に制限
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(0, 10);
        }

        // 質問候補を更新
        updateSuggestions(result.suggestions);

        // localStorageに保存
        saveHistory();

    } catch (error) {
        hideLoading();
        showError('回答の取得に失敗しました。もう一度お試しください。');
        console.error('Error in handleSend:', error);
    } finally {
        // ボタンを有効化
        sendBtn.disabled = false;
    }
}

/**
 * 更新ボタンの処理
 */
function handleRefresh() {
    const newSuggestions = generateRandomSuggestions(conversationHistory[0]);
    updateSuggestions(newSuggestions);
}

// ========================================
// localStorage管理
// ========================================
function saveHistory() {
    try {
        localStorage.setItem('nazenaze_history', JSON.stringify(conversationHistory));
    } catch (error) {
        console.error('Failed to save history:', error);
    }
}

function loadHistory() {
    try {
        const saved = localStorage.getItem('nazenaze_history');
        if (saved) {
            conversationHistory = JSON.parse(saved);

            // 履歴を表示
            conversationHistory.slice().reverse().forEach(item => {
                displayAnswer(item.question, item.answer, item.timestamp);
            });
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

function saveSuggestions() {
    try {
        localStorage.setItem('nazenaze_suggestions', JSON.stringify(currentSuggestions));
    } catch (error) {
        console.error('Failed to save suggestions:', error);
    }
}

function loadSuggestions() {
    try {
        const saved = localStorage.getItem('nazenaze_suggestions');
        if (saved) {
            const suggestions = JSON.parse(saved);
            updateSuggestions(suggestions);
        }
    } catch (error) {
        console.error('Failed to load suggestions:', error);
    }
}

// ========================================
// 初期化
// ========================================
function init() {
    // localStorage から履歴と候補を読み込み
    loadHistory();
    loadSuggestions();

    // イベントリスナーを設定
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const refreshBtn = document.getElementById('refreshBtn');

    sendBtn.addEventListener('click', handleSend);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    refreshBtn.addEventListener('click', handleRefresh);

    console.log('なぜなぜ君 initialized!');
}

// DOMContentLoadedで初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
