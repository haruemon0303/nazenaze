# なぜなぜ君

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://yourusername.github.io/nazenaze/)

**なぜなぜ君**は、あなたの「なぜ？」に延々と答え続けるAIチャットボットです。
博士風のキャラクターが、質問に対して分かりやすく答え、さらに深掘りできる質問候補を提示してくれます。

## 🎯 特徴

- **スマホ最適化**: タップしやすいボタン（最低44px）とレスポンシブデザイン
- **質問候補ガイド**: 3つの質問候補ボタンで「何を聞けばいいか迷わない」設計
- **会話履歴**: 過去の質問と回答をlocalStorageに保存し、リロード後も継続
- **外部依存ゼロ**: HTML/CSS/JavaScriptのみで動作（CDN不要）
- **GitHub Pages対応**: 静的ホスティングで即座に公開可能

## 🚀 使い方

### 基本的な使い方

1. **質問ボタンをタップ**: 画面に表示される3つの質問候補から選ぶ
2. **自由入力**: 入力欄に自分の質問を入力して送信ボタンをタップ
3. **回答を読む**: 博士が200〜400字程度で分かりやすく回答
4. **さらに深掘り**: 回答後、新しい質問候補が3つ表示される
5. **候補を更新**: ヘッダーの更新ボタン（↻）で別の質問候補に切り替え

### デモを試す

GitHub Pagesでホスティングする場合：

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/nazenaze.git

# ブラウザでindex.htmlを開く
open index.html
```

または、GitHub Pagesの設定から直接デプロイできます。

## 📱 デザインコンセプト

### なぜ3つの質問候補？

人間は**選択肢が多すぎると迷い、少なすぎると物足りなさ**を感じます（決定麻痺）。
3つという数は、以下の理由で最適です：

- **認知負荷が低い**: 一目で選択肢を把握できる
- **迷わず選べる**: 多すぎず少なすぎず、適度な自由度
- **継続性**: 毎回違う候補が出ることで飽きない

質問候補は回答内容に応じて動的に更新されるため、会話が自然に深まっていきます。

## 🔧 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **デザイン**: レスポンシブデザイン、safe-area対応（iOS対応）
- **ストレージ**: localStorage（会話履歴と質問候補を保存）
- **ホスティング**: GitHub Pages（または任意の静的ホスティング）

### ファイル構成

```
nazenaze/
├── index.html      # メインHTMLファイル
├── style.css       # スタイルシート（スマホ最適化）
├── script.js       # ロジック（ダミーLLM実装）
└── README.md       # このファイル
```

## ⚠️ セキュリティ上の重要な注意

### APIキーを公開リポジトリに置かないでください

このMVP版は**ダミーLLM**で動作しますが、本物のLLM APIに接続する際は**絶対にAPIキーをリポジトリに含めないでください**。

#### ❌ やってはいけないこと

```javascript
// NG: APIキーをコードに直接記述
const API_KEY = 'sk-xxxxxxxxxxxx';  // 絶対にやらない！

// NG: .envファイルをGitにコミット
// .env
OPENAI_API_KEY=sk-xxxxxxxxxxxx  // コミットしない！
```

#### ✅ 推奨される方法

1. **環境変数に保存** (ローカル開発のみ)
2. **バックエンド/Edge Functionを経由**（推奨）
3. **.gitignoreに追加**

```bash
# .gitignore に追加
.env
.env.local
*.key
config/secrets.js
```

## 🔌 本物のLLMに接続する方法

現在のMVP版は`script.js`内の`callLLM`関数がダミー実装です。
本物のLLM APIに接続するには、この関数を差し替えるだけでOKです。

### 方法A: バックエンド/Edge Function経由（推奨）

セキュアな方法は、フロントエンドから直接LLM APIを呼ばず、**自前のサーバーやEdge Functionを経由**することです。

#### 例1: Vercel Edge Functionsを使う

```javascript
// script.js の callLLM 関数を以下に置き換え
async function callLLM(prompt, context) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context })
    });

    const data = await response.json();
    return {
        answer: data.answer,
        suggestions: data.suggestions
    };
}
```

```javascript
// api/chat.js (Vercel Edge Function)
export const config = { runtime: 'edge' };

export default async function handler(req) {
    const { prompt, context } = await req.json();

    // OpenAI APIを呼び出し（APIキーはVercelの環境変数に保存）
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: '博士口調で200-400字で答え、次の質問候補3つをJSON形式で提案してください'
                },
                { role: 'user', content: prompt }
            ]
        })
    });

    const data = await response.json();
    const answer = data.choices[0].message.content;

    // 質問候補をパース（LLMのレスポンスから抽出）
    const suggestions = extractSuggestions(answer);

    return new Response(JSON.stringify({ answer, suggestions }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
```

#### 例2: Cloudflare Workers

```javascript
// workers/chat.js
export default {
    async fetch(request, env) {
        const { prompt, context } = await request.json();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '博士口調で答えてください' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        return new Response(JSON.stringify({
            answer: data.choices[0].message.content,
            suggestions: generateSuggestions(data)
        }));
    }
};
```

#### 例3: AWS Lambda + API Gateway

Lambda関数でOpenAI APIを呼び出し、API Gateway経由でフロントエンドからアクセス。

### 方法B: ローカル開発用（環境変数）

ローカル環境でのみ動作させる場合、`.env`ファイルを使用できます。

```bash
# .env (絶対にGitにコミットしない！)
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

```javascript
// script.js（開発用のみ、本番では使わない）
async function callLLM(prompt, context) {
    // 注意: これは開発環境のみ。本番ではバックエンド経由にすること
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`  // Webpack等でバンドル時に埋め込み
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: '博士口調で200-400字で答えてください' },
                { role: 'user', content: prompt }
            ]
        })
    });

    const data = await response.json();
    return {
        answer: data.choices[0].message.content,
        suggestions: extractSuggestions(data)
    };
}
```

**⚠️ 警告**: この方法は開発環境のみで使用し、本番環境では絶対に使わないでください。

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します！以下の点にご協力ください：

- コードの変更は最小限に
- セキュリティ上の問題があれば即座に報告
- APIキーや秘密情報を含めない

## 📮 お問い合わせ

Issue または Pull Request でお気軽にどうぞ。

---

**楽しい「なぜなぜ」ライフを！** 🎓
