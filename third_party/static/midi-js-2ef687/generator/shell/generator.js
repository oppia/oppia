/*
	Audio Generator : 0.1.4 : 2012/01/20
	------------------------------------------------
		  NodeJS : http://nodejs.org/
			Atob : npm install atob
			Btoa : npm install btoa
	   Commander : npm install commander
		 MP3Wrap : http://mp3wrap.sourceforge.net/ -- brew install mp3wrap
		 MP3Splt : http://mp3splt.sourceforge.net/ -- brew install mp3splt
		 MP3Info : brew install mp3info
			 OGG : http://www.rarewares.org/ogg-oggenc.php -- brew install vorbis-tools
			Lame : http://lame.sourceforge.net/ -- brew install lame
	------------------------------------------------
*/

var program = require("commander")
	.version("0.1.0")
	.option("-f, --from [value]", "Input format")
	.option("-t, --to [value]", "Output format")
	.option("-c, --convert", "Convert formats")
	.parse(process.argv);

if (program.rawArgs.join("").indexOf("-") === -1) {
	console.log(program.helpInformation())
	return;
}

var fs = require("fs");
var exec = require("child_process").exec;
var oggdec = "oggdec ";
var oggenc = "oggenc -m 32 -M 64 ";
var lame = "lame -v -b 8 -B 32 ";
var QUEUE = require(__dirname + "/../../js/Window/Queue.js");

if (program.convert) {
	var dir = __dirname + "/Vessel/";
	var readDir = function(dir, callback) {
		fs.readdir(dir, function(err, list) {
			queue = new QUEUE({
				items: list,
				oncomplete: callback,
				next: function(item) { // from ogg>wav>mp3
					if (item[0] === ".") return queue.next();
					if (item.indexOf("wav") === -1) return queue.next();
//					exec(oggdec + dir + item, function() {
						exec(lame + "'" + dir + item.replace(".ogg", ".wav") + "'");
//					});
					queue.next();
				}
			});
		});
	};
	///
	readDir(dir);
}