# クイックスタートガイド

## プロジェクト構成

```
koubanhyou-system/
├── backend/                  # バックエンド（Node.js + Express）
│   ├── routes/              # APIルート
│   ├── db.js                # データベース接続
│   ├── schema.sql           # データベーススキーマ
│   ├── server.js            # メインサーバー
│   └── package.json         # 依存関係
├── frontend/                # フロントエンド（React + Vite）
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── App.jsx          # メインアプリ
│   │   ├── main.jsx         # エントリーポイント
│   │   └── index.css        # スタイル
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── sample_data/             # サンプルCSVファイル
│   ├── members.csv
│   └── songs.csv
├── README.md                # 詳細ドキュメント
├── DEPLOYMENT.md            # デプロイ手順
└── render.yaml              # Render設定（自動デプロイ用）
```

## ローカルで試す（5分で起動）

### 1. PostgreSQLの起動

```bash
# Dockerを使用する場合（推奨）
docker run --name koubanhyou-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=koubanhyou_db \
  -p 5432:5432 \
  -d postgres:14

# データベーススキーマを適用
docker exec -i koubanhyou-postgres psql -U postgres -d koubanhyou_db < backend/schema.sql
```

### 2. バックエンドの起動

```bash
cd backend
npm install

# .envファイルを作成
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/koubanhyou_db
NODE_ENV=development
PORT=3001
EOF

# 起動
npm run dev
```

### 3. フロントエンドの起動

新しいターミナルで：

```bash
cd frontend
npm install
npm run dev
```

### 4. ブラウザでアクセス

http://localhost:3000 を開きます。

### 5. サンプルデータの読み込み

1. 管理画面（メンバー管理）を開く
2. 「CSVインポート」で `sample_data/members.csv` をインポート
3. 曲管理を開く
4. 「CSVインポート」で `sample_data/songs.csv` をインポート
5. 香盤表管理でメンバーと曲の紐付けを設定

## Renderへのデプロイ（10分で完了）

### 方法1: ワンクリックデプロイ（最も簡単）

1. GitHubに新しいリポジトリを作成
2. このプロジェクトをプッシュ：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなたのユーザー名/koubanhyou-system.git
git push -u origin main
```

3. [Render Dashboard](https://dashboard.render.com/) にログイン
4. 「New +」→「Blueprint」を選択
5. GitHubリポジトリを接続
6. `render.yaml`が検出されたら「Apply」をクリック

完了！Renderが自動的にデータベース、バックエンド、フロントエンドをデプロイします。

### 方法2: 手動デプロイ

詳細は `DEPLOYMENT.md` を参照してください。

## デプロイ後の初期設定

1. バックエンドのURLを確認（例: `https://koubanhyou-backend.onrender.com`）

2. データベーススキーマを適用：

```bash
# Renderのシェルにアクセスして実行
cd backend
psql $DATABASE_URL -f schema.sql
```

3. フロントエンドにアクセスして動作確認

4. サンプルデータをインポートして機能を確認

## 主な機能

### ユーザー画面

**香盤表**
- メンバーと曲のマトリクス表示
- メンバー名クリックで個別表示
- 楽譜・音源へのダイレクトリンク

**スケジュール**
- 日程と出欠の管理
- 年月日クリックでタイムスケジュール表示
- メンバー別フィルター

### 管理画面

**メンバー管理**
- メンバーの追加・編集・削除
- CSV インポート/エクスポート
- 香盤表・スケジュール表示の切り替え

**曲管理**
- 曲の追加・編集・削除
- Dropboxリンクの管理
- CSV インポート/エクスポート

**香盤表管理**
- クリックで出番の○/空欄を切り替え
- リアルタイム更新

**スケジュール管理**
- スケジュールの追加・編集・削除
- 対象曲・対象役の設定
- 出欠入力（○、△、×、またはテキスト）

## カスタマイズ

### タイトルの変更

`frontend/index.html` と `frontend/src/components/UserKoubanhyou.jsx` の該当部分を編集してください。

### スタイルの変更

`frontend/src/index.css` でカラーやレイアウトをカスタマイズできます。

### Dropboxリンクの設定

1. Dropboxで楽譜・音源ファイルを共有
2. 共有リンクを取得（末尾を `?dl=1` に変更するとダイレクトリンクに）
3. 曲管理画面でリンクを設定

## よくある質問

**Q: 無料で使えますか？**
A: はい。Renderの無料プランで使用できます。ただし、以下の制限があります：
- 15分間非アクティブでスリープ
- 月間750時間まで
- PostgreSQLは90日後に削除される可能性

**Q: データをバックアップするには？**
A: 管理画面からCSVエクスポート機能を使用するか、データベースを直接バックアップしてください。

**Q: スマートフォンで使えますか？**
A: はい。レスポンシブデザインで、スマートフォンやタブレットでも使用できます。

**Q: 複数の公演に使えますか？**
A: 現在は1公演用です。複数公演に対応させるには、データベーススキーマの拡張が必要です。

## サポート

- README.md: 詳細なドキュメント
- DEPLOYMENT.md: デプロイ手順
- GitHubのIssuesで質問・バグ報告

## ライセンス

MIT License - 自由に使用・改変できます
