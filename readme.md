# headingImageGenerator.js

このスクリプトは、CSVの設定に従って見出し画像を生成します。

## 使い方

### 1. headingImageGenerator.js をインストール

```
$ cd (your directory)
$ git clone https://github.com/tomk79/headingImageGenerator.git
$ cd headingImageGenerator
$ npm install
```
### 2. data.csv を編集

```
$ vim data.csv
```

### 3. テンプレートを編集

```
$ vim htdocs/index.html
```

### 4. 編集したテンプレートの表示を確認

```
$ node headingImageGenerator.js port=8080 mode=preview
```

この状態で、ブラウザで http://127.0.0.1:8080/ へアクセスします。
プレビューを修了するときは、Ctrl+C を押します。

### 5. 見出し画像を出力する

```
$ node headingImageGenerator.js port=8080
```

コマンドが修了するまでしばらく待ちます。
カレントディレクトリにoutputディレクトリが作成され、その中にPNG画像が出力されます。



## オプション

- port - スクリプト内で立ち上げるサーバーのポート番号。省略時 80 を使用。
- mode - 実行モード。preview を指定すると、プレビューモードでサーバーを起動。省略時に、書き出しを実行する。
- unit - 一度に投げるキューの数を指定。省略時は 1。同時に複数投げた方が、全体の処理は早く終る場合がある。
- pathCsv - CSVのパスを指定。省略時、カレントディレクトリの ./data.csv を読み込む。
- pathOutput - 出力先ディレクトリを指定。省略時、カレントディレクトリに output ディレクトリを作成して書き出す。

下記はオプションの指定例。

```
$ node headingImageGenerator.js port=80 mode=preview unit=1 pathCsv=./data.csv pathOutput=./output/
```

## change log

### headingImageGenerator.js 1.0.1 (2014/\*/\*)

- ----------

### headingImageGenerator.js 1.0.0 (2014/4/13)

- 初版リリース

