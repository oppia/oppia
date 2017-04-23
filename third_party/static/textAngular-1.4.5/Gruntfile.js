module.exports = function (grunt) {

	// load all grunt tasks
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-istanbul-coverage');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-karma-coveralls');
	grunt.loadNpmTasks('grunt-conventional-changelog');
	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-git');
	grunt.loadNpmTasks('grunt-shell');

	grunt.registerTask('compile', ['concat', 'copy:setupFiles', 'jshint', 'uglify']);
	grunt.registerTask('default', ['compile', 'test']);
	grunt.registerTask('test', ['clean:coverage', 'jshint', 'karma', 'coverage']);
	grunt.registerTask('travis-test', ['concat', 'copy:setupFiles', 'jshint', 'karma', 'coverage', 'coveralls']);

	grunt.registerTask('release', ['bump-only','compile', 'demo_pages', 'changelog','gitcommit','bump-commit', 'shell:publish']);
	grunt.registerTask('release:patch', ['bump-only:patch','compile','changelog','gitcommit','bump-commit', 'shell:publish']);
	grunt.registerTask('release:minor', ['bump-only:minor','compile','changelog','gitcommit','bump-commit', 'shell:publish']);
	grunt.registerTask('release:major', ['bump-only:major','compile','changelog','gitcommit','bump-commit', 'shell:publish']);
	grunt.registerTask('release:prerelease', ['bump-only:prerelease','compile','changelog','gitcommit','bump-commit', 'shell:publish']);

	var testConfig = function (configFile, customOptions) {
		var options = { configFile: configFile, keepalive: true };
		var travisOptions = process.env.TRAVIS && { browsers: ['PhantomJS'], reporters: ['dots','coverage'] };
		return grunt.util._.extend(options, customOptions, travisOptions);
	};

    grunt.registerMultiTask('demo_pages', 'Compile demo pages', function(){
        var d = this.data;
        var srcPath = function(fname){ return d.cwd + fname; };
        var destPath = function(fname){ return d.dest + fname; };

        grunt.file.expand({cwd: d.cwd}, d.src).forEach(function(each){
            grunt.file.copy(srcPath(each), destPath(each), {
                process: function (contents, path){
                    return grunt.template.process(contents, {
                        data: {
                            js: Object.keys(grunt.config('uglify.my_target.files')),
                            version: grunt.config('pkg.version')
                        }
                    });
                }
            });
        });
    });

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		changelog: {options: {dest: 'changelog.md'}},
		bump: {
			options: {
				files: ['package.json','bower.json'],
				commitFiles: ['package.json', 'changelog.md','bower.json'],
				pushTo: 'origin',
				updateConfigs: ['pkg']
			}
		},
		gitcommit: {
			release: {
				options: {
					message: "chore(release): Build Dist files"
				},
				files: {
					src: ['src/*', 'src/demo/*','dist/*']
				}
			}
		},
		shell: {
			publish: {
				command: "npm publish"
			}
		},
		clean: {
            coverage: ["coverage"],
            dist: ["dist"],
        },
		coverage: {
			options: {
                thresholds: {
                    'statements': 100,
                    'branches': 100,
                    'lines': 100,
                    'functions': 100
                },
			dir: 'coverage'
			}
		},
		coveralls: {
			options: {
				debug: true,
				coverage_dir: 'coverage',
				force: true
			}
		},
		karma: {
			jquery: {
				options: testConfig('karma-jquery.conf.js')
			},
			jqlite: {
				options: testConfig('karma-jqlite.conf.js')
			}
		},
		jshint: {
			files: ['src/*.js', 'test/*.spec.js', 'test/taBind/*.spec.js', '!src/textAngular-sanitize.js'],// don't hint the textAngularSanitize as they will fail
			options: {
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				boss: true,
				eqnull: true,
				globals: {}
			}
		},
		copy: {
			setupFiles: {
				expand: true,
				cwd: 'src/',
				src: ['textAngularSetup.js', 'textAngular.css', 'textAngular-sanitize.js'],
				dest: 'dist/'
			}
		},
		concat: {
			options: {
				banner: "/*\n@license textAngular\nAuthor : Austin Anderson\nLicense : 2013 MIT\nVersion <%- pkg.version %>\n\nSee README.md or https://github.com/fraywing/textAngular/wiki for requirements and use.\n*/\n\n/*\nCommonjs package manager support (eg componentjs).\n*/\n\n/* istanbul ignore next:  */\n'undefined'!=typeof module&&'undefined'!=typeof exports&&module.exports===exports&&(module.exports='textAngular');\n\n(function(){ // encapsulate all variables so they don't become global vars\n\"use strict\";",
				footer: "})();"
			},
			dist: {
                files:{
                    'dist/textAngular.js': ['src/globals.js','src/factories.js','src/DOM.js','src/validators.js','src/taBind.js','src/main.js'],
                }
			},
		},
		uglify: {
			options: {
				mangle: true,
				compress: {},
				wrap: true,
				preserveComments: 'some'
			},
			my_target: {
				files: {
					'dist/textAngular-rangy.min.js': ['bower_components/rangy/rangy-core.js', 'bower_components/rangy/rangy-selectionsaverestore.js'],
					'dist/textAngular-sanitize.min.js': ['src/textAngular-sanitize.js'],
					'dist/textAngular.min.js': ['dist/textAngularSetup.js','dist/textAngular.js']
				}
			}
		},
        demo_pages: {
            main: {
                cwd: 'src/demo/',
                src: '*.html',
                dest: 'demo/'
            }
        },
		watch: {
			files: "src/*.js",
			tasks: "compile"
		}
	});
};
