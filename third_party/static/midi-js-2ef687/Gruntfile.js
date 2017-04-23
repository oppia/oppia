/*
	Build environment
	----------------------------------------
	1) Install NodeJS:
		http://nodejs.org/
	2) Install dev dependencies
	  npm install
	3) Install Grunt CLI globally
		npm install grunt-cli -g
*/

module.exports = function (grunt) {
	grunt.initConfig({
		concat: {
			'build/MIDI.js': [
				'js/MIDI/AudioDetect.js',
				'js/MIDI/LoadPlugin.js',
				'js/MIDI/Plugin.js',
				'js/MIDI/Player.js',
				'js/Window/DOMLoader.XMLHttp.js', // req when using XHR
				'js/Window/DOMLoader.script.js', // req otherwise
//				'js/Color/SpaceW3.js', // optional
//				'js/MusicTheory/Synesthesia.js', // optional
//				'js/Widgets/Loader.js', // optional
//				'js/Window/Event.js' // optional
			]
		},
		uglify: {
			'build/MIDI.min.js': [
				'build/MIDI.js'
			]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	///
	grunt.registerTask('default', ['concat', 'uglify']);
	///
};