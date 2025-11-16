# 404エラー修正ガイド

## 問題
フロントエンドが表示されるが、データが読み込まれず、ブラウザのコンソールに以下のエラーが表示される：
```
Failed to load resource: the server responded with a status of 404 ()
POST https://your-frontend.onrender.com/api/... 404 (Not Found)
```

## 原因
フロントエンドがバックエンドAPIに接続できていません。環境変数 `VITE_API_URL` が未設定です。

## 解決方法（3分で完了）

### ステップ1: バックエンドのURLを確認

1. [Renderダッシュボード](https://dashboard.render.com/)にログイン
2. バックエンドサービス（例: `musical-administration-backend`）をクリック
3. ページ上部のURLをコピー
   - 例: `https://musical-administration-backend-xxxx.onrender.com`

### ステップ2: フロントエンドに環境変数を設定

1. フロントエンドサービス（例: `musical-administration-frontend`）をクリック
2. 左メニューの **「Environment」** をクリック
3. **「Add Environment Variable」** をクリック
4. 以下を入力：
   ```
   Key:   VITE_API_URL
   Value: https://あなたのバックエンドURL/api
   ```
   
   **例:**
   ```
   Key:   VITE_API_URL
   Value: https://musical-administration-backend-xxxx.onrender.com/api
   ```
   
   ⚠️ **重要:** 必ず末尾に `/api` を付けてください！

5. **「Save Changes」** をクリック

### ステップ3: 再デプロイを待つ

- フロントエンドが自動的に再デプロイされます
- 進行状況は「Events」タブで確認できます
- 通常3-5分で完了します
- 「Deploy succeeded」と表示されたら完了

### ステップ4: 確認

1. フロントエンドのURLにアクセス
2. ページをリロード（Ctrl+F5 または Cmd+Shift+R）
3. 管理画面でデータが表示されることを確認

## まだエラーが出る場合

### チェックリスト

1. ✅ `VITE_API_URL` の値が正しいか確認
   - バックエンドのURLで始まっているか
   - 末尾に `/api` があるか
   - `https://` で始まっているか

2. ✅ バックエンドが正常に動作しているか確認
   - バックエンドサービスのステータスが「Live」か
   - ブラウザで `https://バックエンドURL/api/health` にアクセス
   - `{"status":"ok","message":"Server is running"}` が表示されればOK

3. ✅ データベースが接続されているか確認
   - バックエンドの「Environment」タブで `DATABASE_URL` が設定されているか
   - データベーススキーマが適用されているか（DEPLOYMENT.md参照）

4. ✅ フロントエンドの再デプロイが完了しているか
   - 「Events」タブで最新のデプロイが成功しているか確認

## それでも解決しない場合

以下の情報を添えてサポートに連絡：

1. バックエンドのURL
2. フロントエンドのURL
3. `VITE_API_URL` の設定値
4. ブラウザのコンソールエラー全文（F12 → Console）
5. Renderの「Logs」タブのエラーメッセージ
