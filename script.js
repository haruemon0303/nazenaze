/**
 * なぜなぜ君 - メインスクリプト
 *
 * Workers（OpenAI）版：
 * - フロントにはAPIキーを置かない
 * - Cloudflare Workers（workers.dev）経由でOpenAIを呼ぶ
 */

// ========================================
// 接続先（Cloudflare Workers）
// ========================================
const WORKER_API_URL = "https://nazonaze-api.nazonaze-kun.workers.dev/api/ask";

// ========================================
// 状態管理
// ========================================
let conversationHistory = [];
let currentSuggestions = [
  { short: "お金儲けするには？", full: "お金儲けするにはどうすればいい？" },
  { short: "健康で長生きするには？", full: "健康で長生きするにはどうすればいい？" },
  { short: "異性にモテるには？", full: "異性にモテるにはどうすればいい？" },
];

// ========================================
// LLM呼び出し（Workers経由）
// ========================================
/**
 * Workers APIを呼び出して回答を取得
 * @param {string} prompt ユーザーの質問
 * @param {Array} context 会話履歴（このアプリ内の形式）
 * @returns {Promise<{answer: string, suggestions: Array<{short:string, full:string}>}>}
 */
async function callLLM(prompt, context) {
  // Workersが期待する history 形式に変換（直近8件）
  const history = buildWorkerHistory(context, 8);

  const res = await fetch(WORKER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Workersは {question, history} を受ける
    body: JSON.stringify({ question: prompt, history }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Worker API error: ${res.status} ${t}`);
  }

  const data = await res.json();
  // data: { answer: string, suggestions: [string,string,string] }

  const answer = String(data.answer ?? "").trim();
  const suggestionsText = Array.isArray(data.suggestions) ? data.suggestions : [];

  // UI用の {short, full} に変換（短縮表示は軽く整形）
  const suggestions = normalizeSuggestionsToUI(suggestionsText);

  return { answer, suggestions };
}

/**
 * このアプリの履歴（{question,answer,timestamp}）を
 * Workersが期待する [{role, content}] に変換する
 */
function buildWorkerHistory(appHistory, limit = 8) {
  // appHistory は "最新が先頭" で入っている
  const slice = Array.isArray(appHistory) ? appHistory.slice(0, limit) : [];

  // Workers側は roles: user/assistant
  // 時系列順に送りたいので、古い→新しい順に並べ替える
  const ordered = slice.slice().reverse();

  const history = [];
  ordered.forEach((item) => {
    if (item && item.question) {
      history.push({ role: "user", content: String(item.question) });
    }
    if (item && item.answer) {
      history.push({ role: "assistant", content: String(item.answer) });
    }
  });

  return history;
}

/**
 * Workersから返ってくる suggestions: [string,string,string] を
 * UI用 [{short, full}] に変換
 */
function normalizeSuggestionsToUI(suggestionsText) {
  const fallback = [
    { short: "前提は？", full: "この話の前提条件は何？" },
    { short: "具体例は？", full: "具体例で説明して" },
    { short: "対象は？", full: "それは誰にとっての話？" },
  ];

  if (!Array.isArray(suggestionsText) || suggestionsText.length < 3) return fallback;

  const s0 = String(suggestionsText[0] ?? "").trim();
  const s1 = String(suggestionsText[1] ?? "").trim();
  const s2 = String(suggestionsText[2] ?? "").trim();

  if (!s0 || !s1 || !s2) return fallback;

  const uniq = Array.from(new Set([s0, s1, s2]));
  if (uniq.length < 3) return fallback;

  return [
    { short: shortenSuggestion(s0), full: s0 },
    { short: shortenSuggestion(s1), full: s1 },
    { short: shortenSuggestion(s2), full: s2 },
  ];
}

/**
 * ボタン表示を短くする（長すぎるとUIが崩れる）
 */
function shortenSuggestion(text) {
  // 「（例：...）」などの補足を削る
  let t = text.replace(/（[^）]*）/g, "").trim();

  // 長すぎる場合は省略
  const MAX = 12;
  if (t.length > MAX) {
    t = t.slice(0, MAX) + "…";
  }

  // 末尾に？がないなら付ける（選択肢っぽさ）
  if (!t.endsWith("？") && !t.endsWith("?")) {
    t = t + "？";
  }
  return t;
}

// ========================================
// 質問候補生成（更新ボタン用）
// ========================================
/**
 * 更新ボタンで候補を入れ替える
 * MVPはランダムだが、直近の履歴があれば少し寄せる
 */
function generateRandomSuggestions(baseContext = null) {
  const randomSuggestionPool = [
    { short: "成功のコツは？", full: "成功するためのコツは何？" },
    { short: "幸せとは？", full: "幸せになるにはどうすればいい？" },
    { short: "時間術は？", full: "時間を有効に使うにはどうすればいい？" },
    { short: "人間関係は？", full: "良い人間関係を築くにはどうすればいい？" },
    { short: "ストレスは？", full: "ストレスを減らすにはどうすればいい？" },
    { short: "集中力は？", full: "集中力を高めるにはどうすればいい？" },
    { short: "創造性は？", full: "創造性を育むにはどうすればいい？" },
    { short: "自己肯定感は？", full: "自己肯定感を高めるにはどうすればいい？" },
    { short: "やる気は？", full: "やる気を出すにはどうすればいい？" },
    { short: "習慣化は？", full: "良い習慣を身につけるにはどうすればいい？" },
  ];

  // 直近の質問があれば、関連ワードで少し寄せる（雑でOK）
  const hint = baseContext && baseContext.question ? String(baseContext.question) : "";
  let pool = randomSuggestionPool;

  if (hint.includes("お金") || hint.includes("稼") || hint.includes("副業")) {
    pool = [
      { short: "単価を上げる？", full: "収入単価を上げるにはどうすればいい？" },
      { short: "支出を減らす？", full: "支出を減らすには何が効果的？" },
      { short: "投資とは？", full: "投資は何から始めればいい？" },
      ...randomSuggestionPool,
    ];
  } else if (hint.includes("健康") || hint.includes("睡眠") || hint.includes("運動")) {
    pool = [
      { short: "食事は？", full: "健康に良い食事の基本は？" },
      { short: "睡眠は？", full: "睡眠の質を上げるにはどうすればいい？" },
      { short: "運動は？", full: "運動を習慣化するコツは？" },
      ...randomSuggestionPool,
    ];
  }

  // ランダムに3つ選択
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
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

  const buttonsContainer = document.getElementById("questionButtons");
  buttonsContainer.innerHTML = "";

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.className = "question-btn";
    button.textContent = suggestion.short;
    button.dataset.question = suggestion.full;

    button.addEventListener("click", () => {
      document.getElementById("userInput").value = suggestion.full;
      handleSend();
    });

    buttonsContainer.appendChild(button);
  });
}

/**
 * 回答を表示
 */
function displayAnswer(question, answer, timestamp) {
  const container = document.getElementById("responseContainer");

  // 初回の場合はwelcomeメッセージを削除
  const welcomeMsg = container.querySelector(".welcome-message");
  if (welcomeMsg) welcomeMsg.remove();

  // 会話アイテムを作成
  const conversationItem = document.createElement("div");
  conversationItem.className = "conversation-item";

  const questionDiv = document.createElement("div");
  questionDiv.className = "question-text";
  questionDiv.textContent = `Q: ${question}`;

  const answerDiv = document.createElement("div");
  answerDiv.className = "answer-text";
  answerDiv.textContent = answer;

  const timestampDiv = document.createElement("div");
  timestampDiv.className = "timestamp";
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
  const container = document.getElementById("responseContainer");

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "loading";
  loadingDiv.id = "loadingIndicator";
  loadingDiv.innerHTML = `
    <span>博士が考え中...</span>
    <div class="loading-dots">
      <span></span><span></span><span></span>
    </div>
  `;

  container.insertBefore(loadingDiv, container.firstChild);
}

/**
 * ローディング削除
 */
function hideLoading() {
  const loading = document.getElementById("loadingIndicator");
  if (loading) loading.remove();
}

/**
 * エラー表示
 */
function showError(message) {
  const container = document.getElementById("responseContainer");

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
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

  if (diff < 60000) return "たった今";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;

  if (date.toDateString() === now.toDateString()) {
    return `今日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// ========================================
// イベントハンドリング
// ========================================
/**
 * 質問送信処理
 */
async function handleSend() {
  const input = document.getElementById("userInput");
  const question = input.value.trim();
  if (!question) return;

  // 入力欄をクリア
  input.value = "";

  // ボタンを無効化
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = true;

  try {
    showLoading();

    // LLM呼び出し（Workers経由）
    const result = await callLLM(question, conversationHistory);

    hideLoading();

    const timestamp = Date.now();
    displayAnswer(question, result.answer, timestamp);

    // 履歴に追加（最新が先頭）
    conversationHistory.unshift({ question, answer: result.answer, timestamp });

    // 履歴を10件に制限
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(0, 10);
    }

    // 質問候補を更新（Workersのsuggestions）
    updateSuggestions(result.suggestions);

    // localStorageに保存
    saveHistory();
  } catch (error) {
    hideLoading();
    console.error("Error in handleSend:", error);
    showError("回答の取得に失敗しました。通信状況を確認して再試行してください。");
  } finally {
    sendBtn.disabled = false;
  }
}

/**
 * 更新ボタンの処理（候補を入れ替え）
 */
function handleRefresh() {
  const base = conversationHistory[0] || null;
  const newSuggestions = generateRandomSuggestions(base);
  updateSuggestions(newSuggestions);
}

// ========================================
// localStorage管理
// ========================================
function saveHistory() {
  try {
    localStorage.setItem("nazenaze_history", JSON.stringify(conversationHistory));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem("nazenaze_history");
    if (saved) {
      conversationHistory = JSON.parse(saved);

      // 履歴を表示（古い→新しい順で表示したいのでreverse）
      conversationHistory
        .slice()
        .reverse()
        .forEach((item) => {
          displayAnswer(item.question, item.answer, item.timestamp);
        });
    }
  } catch (error) {
    console.error("Failed to load history:", error);
  }
}

function saveSuggestions() {
  try {
    localStorage.setItem("nazenaze_suggestions", JSON.stringify(currentSuggestions));
  } catch (error) {
    console.error("Failed to save suggestions:", error);
  }
}

function loadSuggestions() {
  try {
    const saved = localStorage.getItem("nazenaze_suggestions");
    if (saved) {
      const suggestions = JSON.parse(saved);
      // suggestionsが壊れていた場合に備えて最低限チェック
      if (Array.isArray(suggestions) && suggestions.length === 3) {
        updateSuggestions(suggestions);
      }
    }
  } catch (error) {
    console.error("Failed to load suggestions:", error);
  }
}

// ========================================
// 初期化
// ========================================
function init() {
  loadHistory();
  loadSuggestions();

  const sendBtn = document.getElementById("sendBtn");
  const userInput = document.getElementById("userInput");
  const refreshBtn = document.getElementById("refreshBtn");

  sendBtn.addEventListener("click", handleSend);

  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSend();
  });

  refreshBtn.addEventListener("click", handleRefresh);

  // 初期候補を描画（localStorageに無ければデフォルト）
  updateSuggestions(currentSuggestions);

  console.log("なぜなぜ君 initialized!");
}

// DOMContentLoadedで初期化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
