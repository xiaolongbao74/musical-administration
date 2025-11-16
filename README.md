# 香盤表・スケジュール管理システム

「トムは真夜中の庭で～ハイライト版～」の香盤表とスケジュール管理システムです。

## 機能

### ユーザー画面
- **香盤表**: メンバーと曲のマトリクス表示、楽譜・音源へのリンク
- **スケジュール**: メンバーとスケジュールのマトリクス表示、タイムスケジュール表示

### 管理画面
- **メンバー管理**: CRUD操作、CSV インポート/エクスポート
- **曲管理**: CRUD操作、CSV インポート/エクスポート
- **香盤表管理**: メンバーと曲の紐付け管理
- **スケジュール管理**: スケジュールの追加・編集、出欠管理

## 技術スタック

- **フロントエンド**: React + Vite
- **バックエンド**: Node.js + Express
- **データベース**: PostgreSQL
- **デプロイ**: Render

## ローカル開発環境のセットアップ

### 前提条件
- Node.js 18以上
- PostgreSQL 14以上

### 1. データベースのセットアップ

PostgreSQLをインストールして起動後、データベースを作成します：

```bash
# PostgreSQLに接続
psql -U postgres

# データベースを作成
CREATE DATABASE koubanhyou_db;

# データベースに接続
\c koubanhyou_db

# スキーマを実行
\i backend/schema.sql
```

### 2. バックエンドのセットアップ

```bash
cd backend
npm install
```

`.env`ファイルを作成：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/koubanhyou_db
NODE_ENV=development
PORT=3001
```

バックエンドを起動：

```bash
npm run dev
```

### 3. フロントエンドのセットアップ

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:3000 にアクセスします。

## Renderへのデプロイ

### 1. PostgreSQLデータベースの作成

1. Renderダッシュボードで「New +」→「PostgreSQL」を選択
2. データベース名を入力（例: koubanhyou-db）
3. 作成完了後、「Internal Database URL」をコピー

### 2. バックエンドのデプロイ

1. GitHubにコードをプッシュ
2. Renderダッシュボードで「New +」→「Web Service」を選択
3. GitHubリポジトリを接続
4. 設定：
   - **Name**: koubanhyou-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 環境変数を設定：
   - `DATABASE_URL`: PostgreSQLのInternal Database URL
   - `NODE_ENV`: production
6. 「Create Web Service」をクリック

デプロイ後、データベーススキーマを適用：

```bash
# Renderのシェルに接続して実行
psql $DATABASE_URL < schema.sql
```

### 3. フロントエンドのデプロイ

フロントエンドの`vite.config.js`を更新：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

`.env.production`ファイルを作成：

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

1. Renderダッシュボードで「New +」→「Static Site」を選択
2. GitHubリポジトリを接続
3. 設定：
   - **Name**: koubanhyou-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist
4. 環境変数を設定：
   - `VITE_API_URL`: バックエンドのURL（例: https://koubanhyou-backend.onrender.com/api）
5. 「Create Static Site」をクリック

## CSVファイルのフォーマット

### メンバー（members.csv）
```csv
number,role,name,show_in_koubanhyou,show_in_schedule
1,トム,山田太郎,true,true
2,ハティ,佐藤花子,true,true
```

### 曲（songs.csv）
```csv
ba,song_number,song_name,score_link,audio_link,is_active
第1場,1,オープニング,https://dropbox.com/score1.pdf,https://dropbox.com/audio1.mp3,true
第2場,2,庭への扉,https://dropbox.com/score2.pdf,https://dropbox.com/audio2.mp3,true
```

## 使い方

### 初期セットアップ

1. **メンバー管理**でメンバーを追加またはCSVインポート
2. **曲管理**で曲を追加またはCSVインポート
3. **香盤表管理**で各メンバーの出番を設定（セルをクリックして○を付ける）
4. **スケジュール管理**でスケジュールを追加し、出欠を入力

### ユーザー画面の使い方

- **香盤表**: メンバー名をクリックすると、そのメンバーの出番のみ表示
- **スケジュール**: 
  - メンバー名をクリックすると、そのメンバーの関連スケジュールのみ表示
  - 年月日をクリックすると、その日のタイムスケジュールをポップアップ表示

## トラブルシューティング

### データベース接続エラー
- `DATABASE_URL`の環境変数が正しく設定されているか確認
- PostgreSQLが起動しているか確認

### CORS エラー
- バックエンドのCORS設定を確認
- フロントエンドの`VITE_API_URL`が正しいか確認

### デプロイ後にデータが表示されない
- Renderのログを確認
- データベーススキーマが正しく適用されているか確認
- 環境変数が正しく設定されているか確認

## ライセンス

MIT License
