
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

	urequire: {
	    _all: {
		clean: true,
	    },

	    lib: {
		main: 'lib/math-expressions',		
		path: '.',
		dstPath: 'build/math-expressions.js',
		template: 'combined',

		bundle: {
		    filez: [
			"lib/**",
			"lib/debug",
			"node_modules/xml-parser/index.js",
			"node_modules/number-theory/index.js",						
			"node_modules/number-theory/lib/**",
			"node_modules/underscore/underscore-min.js",
		    ],
		    dependencies: {
			replace: {
			    "lib/debug": "debug",
			    "node_modules/number-theory/index.js": "number-theory",
			    "node_modules/xml-parser/index.js": "xml-parser",
			    "node_modules/underscore/underscore-min.js": "underscore"
			},
			rootExports: {
			    "lib/math-expressions": "MathExpression"
			}
		    }
		}
	    }
	}
    });

    grunt.loadNpmTasks('grunt-urequire');
    grunt.registerTask('default',  ['urequire']);
};
