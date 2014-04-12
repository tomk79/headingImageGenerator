/**
 * node headingImageGenerator.js
 * @author Tomoya Koyanagi
 */
(function() {
	console.log('---------');
	console.log('Starting "headingImageGenerator.js"');


	var fs = require('fs');
	var csv = require('csv');//https://github.com/wdavidw/node-csv
	var phantom = require('node-phantom');//https://github.com/alexscheelmeyer/node-phantom

	var conf = {
		documentRoot: __dirname+'/htdocs/',// ドキュメントルートのファイルパス
		pathCsv: __dirname+'/data.csv',// CSVファイルパス
		pathOutput: __dirname+'/output/',// PNG出力ディレクトリパス
		port: 80, // nodeサーバーのポート番号
		unit: 1, // nodeサーバーのポート番号
		version: '0.0.1-nb' // headingImageGenerator.js のバージョン
	};

	console.log('version '+conf.version);
	console.log('script filename = '+__filename);
	console.log('working dir = '+__dirname);
	console.log('---------');
	console.log('');

	var idx = 2;
	var options = (function(){
		var rtn = {};
		for( var idx = 0; process.argv.length > idx; idx ++ ){
			if(process.argv[idx].match(new RegExp('^(.*?)\=(.*)$'))){
				rtn[RegExp.$1] = RegExp.$2;
			}
		}
		return rtn;
	})();

	// オプションをコンフィグに反映
	if( options.pathCsv )   { conf.pathCsv = options.pathCsv; }
	if( options.pathOutput ){ conf.pathOutput = options.pathOutput; }
	if( options.port )      { conf.port = options.port; }
	if( options.unit )      { conf.unit = options.unit; }

	// --------------------------------------
	// setup webserver
	(function(){
		var http = require('http');
		var url = require('url');

		var server = http.createServer(function(request, response) {
			// アクセスされたURLを解析してパスを抽出
			var parsedUrl = url.parse(request.url, true);
			var params = parsedUrl.query;
			var path = parsedUrl.pathname;

			var data = {};
			data.label = params.label||'ダミーテキスト';

			// ディレクトリトラバーサル防止
			if (path.indexOf("..") != -1) {
				path = '/';
			}
			if(path.length-1 == path.lastIndexOf('/')) {
				// リクエストが「/」で終わっている場合、index.htmlをつける。
				path += 'index.html';
			}
			fs.readFile(conf.documentRoot + path, function(error, bin){
				if(error) {
					response.writeHead(404, 'NotFound', {'Content-Type': 'text/html; charset=UTF-8'});
					response.write('<!DOCTYPE html>');
					response.write('<html>');
					response.write('<head>');
					response.write('<title>Not found.</title>');
					response.write('</head>');
					response.write('<body>');
					response.write('<h1>404 Not found.</h1>');
					response.write('<p>File NOT found.</p>');
					response.write('</body>');
					response.write('</html>');
					response.end();
				} else {
					var pathExt = (function (path) {
						var i = path.lastIndexOf('.');
						return (i < 0) ? '' : path.substr(i + 1);
					})(path);
					var mime = 'text/html';
					switch( pathExt ){
						case 'html': case 'htm':             mime = 'text/html';break;
						case 'js':                           mime = 'text/javascript';break;
						case 'css':                          mime = 'text/css';break;
						case 'gif':                          mime = 'image/gif';break;
						case 'jpg': case 'jpeg': case 'jpe': mime = 'image/jpeg';break;
						case 'png':                          mime = 'image/png';break;
						case 'svg':                          mime = 'image/svg+xml';break;
					}

					bin = bin.toString();
					bin = bin.replace( '{$label}', data.label );

					response.writeHead(200, { 'Content-Type': mime });
					response.write(bin);
					response.end();
				}
			});

		});

		// 指定ポートでLISTEN状態にする
		server.listen( conf.port );

	})();






	var tasks = [];
	var taskProgress = 0;
	var done = 0;
	function loadCSV(){
		fs.readFile(conf.pathCsv, function(error, csvData){
			if( error ){
				console.log('error: '+ conf.pathCsv +' could not open.');
				process.exit();
			}

			csv()
				.from.string(
					csvData,
					{}
				)
				.to.array(function(data){
					for( var i in data ){
						var row = {};
						var idx = 0;
						row['label'] = data[i][idx++];
						row['templateName'] = data[i][idx++]||'index';
						row['width'] = Number(data[i][idx++]);
						row['height'] = Number(data[i][idx++]);
						row['fileName'] = require('crypto').createHash('md5').update(row['label'], 'utf8').digest('hex')+'.png';
						tasks.push(row);
					}
					generateImage();
				})
			;

		});
	}

	function generateImage(){
		console.log('');
		console.log('-- processing tasks.');

		while( 1 ){
			if( tasks.length <= taskProgress ){
				console.log('All task clear.');
				console.log('');
				break;
			}

			var row = tasks[taskProgress];
			console.log('    '+row.label);

			webCapFile(
				row,
				'http://127.0.0.1:'+conf.port+'/'+row.templateName+'.html?label='+encodeURIComponent( row.label ),
				conf.pathOutput+'/'+row.fileName,
				row.width,
				row.height,
				row.width,
				row.height,
				function(row){
					console.log('        generating image "' + row.label + '" (as "'+row.fileName+'") done.');
					done ++;
					if( done%conf.unit == 0 ){
						generateImage();
					}
					if( tasks.length <= done ){
						console.log( '' );
						console.log( '' );
						console.log( 'Done all.' );
						console.log( 'exit;'+"\n" );
						process.exit();
					}
				}
			);
			taskProgress++;
			if( taskProgress%conf.unit == 0 ){
				break;
			}
		}
		return true;
	}

	/**
	 * webCapFile
	 * thanks -> http://slowquery.hatenablog.com/entry/2013/02/25/005712
	 */
	function webCapFile(task,url,filename,viewW,viewH,clipW,clipH,callBack){
		phantom.create(function(error,ph){
			ph.createPage(function(err,page){
				page.set('viewportSize',{width:viewW,height:viewH},function(err){
					page.set('clipRect',{width:clipW,height:clipH},function(err){
						page.open(url,function(err,status){
							page.render(filename,function(err){
								ph.exit();
								callBack(task);
							});
						});
					});
				});
			});
		});
	}

	if( options.mode != 'preview' ){
		// previewモードの時は、サーバーだけ立ち上げる
		loadCSV();
	}else{
		console.log('Standby as "preview" mode.');
		console.log('Access http://127.0.0.1:'+conf.port+'/ on your browser.');
		console.log('Press Ctrl+C to exit.');
		console.log('');
	}

}).call(this);