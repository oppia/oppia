module.exports = function (grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  // Default task.
  grunt.registerTask('default', ['jshint', 'karma:unit']);
  grunt.registerTask('serve', ['connect:continuous', 'karma:continuous', 'watch']);
  grunt.registerTask('dist', ['ngmin', 'uglify']);

  // HACK TO ACCESS TO THE COMPONENT-PUBLISHER
  function fakeTargetTask(prefix){
    return function(){

      if (this.args.length !== 1) return grunt.log.fail('Just give the name of the ' + prefix + ' you want like :\ngrunt ' + prefix + ':bower');

      var done = this.async();
      var spawn = require('child_process').spawn;
      spawn('./node_modules/.bin/gulp', [ prefix, '--branch='+this.args[0] ].concat(grunt.option.flags()), {
        cwd : './node_modules/angular-ui-publisher',
        stdio: 'inherit'
      }).on('close', done);
    };
  }

  grunt.registerTask('build', fakeTargetTask('build'));
  grunt.registerTask('publish', fakeTargetTask('publish'));
  //

  var testConfig = function (configFile, customOptions) {
    var options = { configFile: configFile, singleRun: true };
    var travisOptions = process.env.TRAVIS && { browsers: [ 'Firefox', 'PhantomJS'], reporters: ['dots'] };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };

  // Project configuration.
  grunt.initConfig({
    bower: 'bower_components',
    dist : '<%= bower %>/angular-ui-docs',
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: ['/**',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' */',
        ''].join('\n')
    },

    watch: {
      src: {
        files: ['src/*'],
        tasks: ['jshint:src', 'karma:unit:run', 'dist', 'build:gh-pages']
      },
      test: {
        files: ['test/*.js'],
        tasks: ['jshint:test', 'karma:unit:run']
      },
      demo: {
        files: ['demo/*', 'publish.js'],
        tasks: ['jshint', 'build:gh-pages']
      },
      livereload: {
        files: ['out/built/gh-pages/**/*'],
        options: { livereload: true }
      }
    },

    karma: {
      unit: testConfig('test/karma.conf.js'),
      server: {configFile: 'test/karma.conf.js'},
      continuous: {configFile: 'test/karma.conf.js',  background: true }
    },

    connect: {
      options: {
        base : 'out/built/gh-pages',
        open: true,
        livereload: true
      },
      server: { options: { keepalive: true } },
      continuous: { options: { keepalive: false } }
    },

    jshint: {
      src: {
        files:{ src : ['src/*.js', 'demo/**/*.js'] },
        options: { jshintrc: '.jshintrc' }
      },
      test: {
        files:{ src : [ 'test/*.spec.js', 'publish.js', 'gruntFile.js'] },
        options: grunt.util._.extend({}, grunt.file.readJSON('.jshintrc'), {
          node: true,
          globals: {
            angular: false,
            inject: false,
            jQuery: false,

            jasmine: false,
            afterEach: false,
            beforeEach: false,
            ddescribe: false,
            describe: false,
            expect: false,
            iit: false,
            it: false,
            spyOn: false,
            xdescribe: false,
            xit: false
          }
        })
      }
    },

    uglify: {
      options: {banner: '<%= meta.banner %>'},
      build: {
        expand: true,
        cwd: 'dist',
        src: ['*.js'],
        ext: '.min.js',
        dest: 'dist'
      }
    },

    ngmin: {
      main: {
        expand: true,
        cwd: 'src',
        src: ['*.js'],
        dest: 'dist'
      }
    },

    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    }
  });

};
