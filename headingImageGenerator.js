(function() {
	var server = require('webserver').create();
	var fs = require('fs');

	var conf = {
		// ドキュメントルートのファイルパス
		documentRoot:'./templates/'
	};

	var idx = 0;
	var options = {
		port: phantom.args[idx++]
	};

	if( !options.port ){
		console.log("[ERROR] No port number given."+"\n");
		return phantom.exit();
	}
	// if( !options.saveTo ){
	// 	console.log("[ERROR] No output path given."+"\n");
	// 	return phantom.exit();
	// }


	// ----------------------------------------------------------------------------
	// setup server
	var listening = server.listen(options.port, function (request, response) {
		var fs = require('fs');

		// アクセスされたURLを解析してパスを抽出
		var path = request.url;

		// ディレクトリトラバーサル防止
		if (path.indexOf("..") != -1) {
			path = '/';
		}
		if(path.length-1 == path.lastIndexOf('/')) {
			// リクエストが「/」で終わっている場合、index.htmlをつける。
			path += 'index.html';
		}
		var bin = fs.read(conf.documentRoot + path);

		// 拡張子からmimeタイプを判定
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

		// レスポンスヘッダを出力
		response.statusCode = 200;
		response.headers = {"Cache": "no-cache", "Content-Type": mime};

		// レスポンスbodyを出力
		response.write(bin);

		// 通信を終了
		response.close();
	});
	if (!listening) {
		console.log("could not create web server listening on port " + options.port);
		return phantom.exit();
	}



	// ----------------------------------------------------------------------------
	// creating "webpage"
	var webpage = require('webpage').create();
	webpage.viewportSize = {
		width: 300,
		height: 90
	};
	webpage.clipRect = {
		top: 0,
		left: 0,
		width: 300,
		height: 90
	};
	// webpage.settings.userAgent = options.userAgent;
	webpage.onLoadFinished = function() {
		console.log('page Load Finished.');
	};
	var templateUrl = 'http://localhost:'+options.port+'/template.html'

	webpage.open(templateUrl, function(status) {
		if (status === 'success') {
			window.setTimeout( function(){
				if( webpage.render( './test.png' ) ){
					console.log('Success!');
				}else{
					console.log('Error: Disable to save image file.');
				}
				return phantom.exit();
			}, 500 );
			return;
		}else{
			console.log('Error: on page loading. ('+status+' : '+templateUrl+')');
			return phantom.exit();
		}
	});

}).call(this);
