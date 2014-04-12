(function() {
	var fs = require('fs');
	var csv = require('csv');//https://github.com/wdavidw/node-csv
	var phantom = require('node-phantom');//https://github.com/alexscheelmeyer/node-phantom

	var conf = {
		// ドキュメントルートのファイルパス
		documentRoot:'./htdocs/'
	};

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

	if( !options.port ){
		console.log("[ERROR] No port number given."+"\n");
		return process.exit();
	}

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
		server.listen( options.port );

	})();

	// process.exit();

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

	var tasks = [];
	var done = 0;
	function loadCSV(){
		fs.readFile('./data.csv', function(error, csvData){
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
						row['templateName'] = data[i][idx++];
						row['width'] = Number(data[i][idx++]);
						row['height'] = Number(data[i][idx++]);
						row['fileName'] = require('crypto').createHash('md5').update(row['label'], 'utf8').digest('hex')+'.png';
						tasks.push(row);
					}
					startGenerateImages();
				})
			;

		});
	}

	function startGenerateImages(){
		console.log(tasks.length);

		for( var i in tasks ){
			var row = tasks[i];
			console.log(row);

			webCapFile(
				row,
				'http://127.0.0.1:'+options.port+'/'+row.templateName+'.html?label='+encodeURIComponent( row.label ),
				'./output/'+row.fileName,
				row.width,
				row.height,
				row.width,
				row.height,
				function(row){
					console.log(row.label + ' done.');
					done ++;
					if( tasks.length == done ){
						console.log( 'all task done.'+"\n" );
						console.log( 'exit;'+"\n" );
						process.exit();
					}
				}
			);
		}
	}

	if( options.mode != 'preview' ){
		loadCSV();
	}

}).call(this);