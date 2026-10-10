# 宅建 一問一答ドリル（公開用）

HTML・CSS・JavaScriptだけで動く静的サイトです。サーバー側の処理やデータベースは不要です。

## フォルダ構成

```
index.html        一問一答・弱点復習・重要数字（トップ）
about.html        運営者情報・お問い合わせ
privacy.html      プライバシーポリシー・免責事項
assets/config.js  広告・アフィリエイトの設定（ここだけ書き換えれば枠が出る）
assets/data.js    問題データと重要数字（問題の追加・修正はここ）
assets/app.js     学習画面の動作
assets/common.js  広告・アフィリエイト枠の描画（全ページ共通）
assets/style.css  デザイン
img/              キャラクター画像（不動まもり）
robots.txt / sitemap.xml
```

## 公開前に必ず書き換える箇所

1. `YOUR-DOMAIN` を実際のドメインに置き換える
   （index.html・about.html・privacy.html・robots.txt・sitemap.xml）
2. about.html の【要記入】：運営者名、お問い合わせ先
3. privacy.html の【要記入】：制定日、運営者名
4. privacy.html の「Amazonのアソシエイトとして…」の一文
   Amazonアソシエイトに参加しない場合は削除。参加する場合は、規約で求められる表記と一致しているかを参加時に確認してください。

## 公開方法（例：GitHub Pages）

1. GitHubで新しいリポジトリを作り、このフォルダの中身をすべてアップロード
2. リポジトリの Settings → Pages で、ブランチ `main`・フォルダ `/ (root)` を選んで保存
3. 数分後に `https://ユーザー名.github.io/リポジトリ名/` で公開されます

Cloudflare Pages や Netlify でも、このフォルダをそのままアップロードすれば公開できます。

## 広告を有効にする手順

### アフィリエイト（先に始められる）
1. ASP（A8.net など）や Amazonアソシエイトに登録し、紹介リンクを発行
2. `assets/config.js` の `affiliates` に追加
   ```js
   affiliates: [
     { title: "宅建 過去問題集 2027年版", note: "解説が丁寧で独学向き", url: "発行されたリンク" }
   ]
   ```
3. トップページ下部に「PR まもりのおすすめ教材」の枠が表示されます

### Google AdSense（問題数が増えてから）
1. AdSenseに申請し、審査に通るとパブリッシャーID（`ca-pub-…`）が発行されます
2. サイト直下に `ads.txt` を作成（中身はAdSense管理画面に表示される1行）
3. 広告ユニットを作成し、`assets/config.js` の `adsenseClient` と `adSlots` に入力
4. 表示位置：一周完了・復習完了の画面、重要数字タブの下、ページ下部
   （問題を解いている最中には表示しない設計です）

審査で「サイトの準備が整っていない」等の理由で落ちることがあります。問題数を増やし、論点ごとの解説ページ（文章）を追加してから申請するのがおすすめです。

## 問題の追加方法

`assets/data.js` の `window.QUESTIONS` に1行追加します。

```js
{id:41,c:"gyo",q:"問題文",a:true,e:"解説（根拠条文を書く）"},
```

- `id`：重複しない番号
- `c`：`gyo`（宅建業法）／`min`（権利関係）／`hou`（法令上の制限）／`zei`（税・その他）
- `a`：`true` が ○、`false` が ×

## 年1回の更新

宅建試験は毎年4月1日時点の法令で出題されます。毎年春に法改正を確認し、data.js の内容と、index.html 下部の「照合日」を更新してください。
