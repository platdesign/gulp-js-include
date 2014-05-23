var 
		pluginName = 'gulp-js-include'
	,	fs		= require("fs")
	,	path	= require("path")
	,	es		= require("event-stream")
	,	gutil	= require("gulp-util");

DIRECTIVE_REGEX = /^(.*=\s*(require|include|require_tree|include_tree)\s+([\w\.\/-]+))$/gm


function err(message) {
	throw new gutil.PluginError(pluginName, message);
}

function replaceStmts(content, basePath) {

	var matches;

	while (matches = DIRECTIVE_REGEX.exec(content)) {
		var includePath = path.join(basePath, matches[3].replace(/['"]/g, ''));

		var search = matches[1];

		switch(matches[2]) {
			case 'include':
			case 'require':
				var replace = getContentOfFile( includePath );
				content = replaceContent(content, search, replace);
			break;

			case 'require_tree':
			case 'include_tree':
				var replace = getContentOfDir( includePath );
				content = replaceContent(content, search, replace);
			break;
		}

	}
	return content;
}

function replaceContent(content, search, replace) {
	return content.split(search).join(  replace );
}

function getContentOfFile(file) {
	var content = String();

	if( fs.existsSync( file ) ) {
		var fileContent = String( fs.readFileSync( file, {encoding:'utf8'} ) );
		content = replaceStmts(fileContent, path.dirname( file ));
	}

	return content;
}

function getContentOfDir(dir) {
	var content = String();

	if( fs.existsSync( dir ) ) {
		var files = fs.readdirSync(dir);

		for(var i in files){
			if (!files.hasOwnProperty(i)) continue;
			var filename = path.join(dir, files[i]);
			var stats = fs.statSync(filename);

			if (stats.isDirectory()){
				content += getContentOfDir( filename );
			}else{
				var ext = path.extname(filename);
				if( ext === '.js' || ext === '.JS' ) {
					content += getContentOfFile( filename );
				}
			}
		}
	}

	return content;
}




function replaceStmtsInFile(file) {
	var fileBasePath = path.dirname( file.path );
	var content = String(file.contents);
	
	file.contents = new Buffer( replaceStmts(content, fileBasePath) );
}


module.exports = function() {

    return es.map(function(file, callback){
    	if (file.isNull()) {
    		return callback(null, file);
    	}

    	if (file.isStream()) {
    		err('stream not supported');
    	}

    	if (file.isBuffer()) {
    		file.contents = new Buffer( replaceStmts(String(file.contents), path.dirname( file.path )) );
    	}

    	callback(null, file);
    });
}
