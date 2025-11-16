# Renderへのデプロイ手順

このガイドでは、香盤表・スケジュール管理システムをRenderにデプロイする手順を説明します。

## 事前準備

1. [Render](https://render.com/)のアカウントを作成
2. GitHubアカウントを用意
3. プロジェクトをGitHubリポジトリにプッシュ

## デプロイ方法

### オプション1: render.yamlを使用した自動デプロイ（推奨）

このリポジトリには`render.yaml`が含まれているため、Renderが自動的にインフラストラクチャをセットアップします。

1. Renderダッシュボードにログイン
2. 「New +」→「Blueprint」を選択
3. GitHubリポジトリを接続
4. `render.yaml`が自動的に検出される
5. 「Apply」をクリック

Renderが自動的に以下を作成します：
- PostgreSQLデータベース
- バックエンドWebサービス
- フロントエンドStatic Site

### オプション2: 手動デプロイ

手動でデプロイする場合は、README.mdの「Renderへのデプロイ」セクションを参照してください。

## デプロイ後の設定

### 1. データベーススキーマの適用

バックエンドサービスのデプロイが完了したら、データベーススキーマを適用します：

1. Renderダッシュボードで「koubanhyou-db」を開く
2. 「Connect」の下にある「External Database URL」をコピー
3. ターミナルで以下を実行：

```bash
# schema.sqlの内容をPostgreSQLに適用
psql <External Database URL> < backend/schema.sql
```

または、Renderのシェルを使用：

1. Renderダッシュボードで「koubanhyou-backend」を開く
2. 「Shell」タブをクリック
3. 以下のコマンドを実行：

```bash
cd backend
psql $DATABASE_URL -f schema.sql
```

### 2. フロントエンドのAPI URL設定

`render.yaml`を使用した場合、環境変数は自動的に設定されます。

手動デプロイの場合：
1. フロントエンドサービスの環境変数に`VITE_API_URL`を追加
2. 値をバックエンドのURL（例: `https://koubanhyou-backend.onrender.com/api`）に設定
3. サービスを再デプロイ

## デプロイ後の確認

1. フロントエンドのURLにアクセス（例: `https://koubanhyou-frontend.onrender.com`）
2. 管理画面からメンバーと曲を追加
3. 香盤表とスケジュールが正しく表示されることを確認

## トラブルシューティング

### サービスが起動しない

**バックエンド:**
- Renderのログを確認
- `DATABASE_URL`環境変数が正しく設定されているか確認
- `package.json`の`start`スクリプトが正しいか確認

**フロントエンド:**
- ビルドログを確認
- `VITE_API_URL`が正しく設定されているか確認

### データベース接続エラー

1. PostgreSQLサービスが正常に動作しているか確認
2. バックエンドの環境変数`DATABASE_URL`が正しいか確認
3. データベースのInternal Database URLを使用しているか確認（同じRender内のサービス間では内部URLを使用）

### CORSエラー

バックエンドの`server.js`でCORSが有効になっているか確認：

```javascript
app.use(cors());
```

### 無料プランの制限

Renderの無料プランには以下の制限があります：
- 15分間アクティビティがないとサービスがスリープ
- 月間750時間の稼働時間
- PostgreSQLは90日後に削除される可能性

本番環境では有料プランの使用を推奨します。

## アップデート手順

1. GitHubリポジトリにコードをプッシュ
2. Renderが自動的に検出して再デプロイ
3. データベーススキーマに変更がある場合は、手動で適用

## バックアップ

定期的にデータベースをバックアップすることを推奨します：

```bash
# データベースのバックアップ
pg_dump <Database URL> > backup.sql

# 復元
psql <Database URL> < backup.sql
```

## サポート

問題が発生した場合：
1. Renderのドキュメントを確認: https://render.com/docs
2. Renderのログを確認
3. GitHubのIssuesで報告
