module.exports = function (grunt) {
  'use strict';

  var BoostrapCK4Skin;

  var resourcesPath = 'skins/bootstrapck/';

  BoostrapCK4Skin = {
    scss: ['skins/bootstrapck/scss/**/*.scss'],
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      BoostrapCK4SkinScss: {
        files: BoostrapCK4Skin.scss,
        tasks: ['sass', 'cssmin'],
      },
      livereload: {
        files: ['skins/bootstrapck/*.css'],
        options: {
          livereload: true,
        },
      },
    },

    sass: {
      BoostrapCK4Skin: {
        options: {
          style: 'compressed',
        },
        files: [
          {
            'skins/bootstrapck/.temp/css/editor.css':
              'skins/bootstrapck/scss/components/editor.scss',
            'skins/bootstrapck/.temp/css/dialog.css':
              'skins/bootstrapck/scss/dialog/dialog.scss',
            'skins/bootstrapck/.temp/css/editor_ie.css':
              'skins/bootstrapck/scss/browser-specific/ie/editor_ie.scss',
            'skins/bootstrapck/.temp/css/dialog_ie.css':
              'skins/bootstrapck/scss/browser-specific/ie/dialog_ie.scss',
            'skins/bootstrapck/.temp/css/editor_ie8.css':
              'skins/bootstrapck/scss/browser-specific/ie8/editor_ie8.scss',
            'skins/bootstrapck/.temp/css/dialog_ie8.css':
              'skins/bootstrapck/scss/browser-specific/ie8/dialog_ie8.scss',
            'skins/bootstrapck/.temp/css/editor_ie7.css':
              'skins/bootstrapck/scss/browser-specific/ie7/editor_ie7.scss',
            'skins/bootstrapck/.temp/css/dialog_ie7.css':
              'skins/bootstrapck/scss/browser-specific/ie7/dialog_ie7.scss',
            'skins/bootstrapck/.temp/css/editor_iequirks.css':
              'skins/bootstrapck/scss/browser-specific/iequirks/editor_iequirks.scss',
            'skins/bootstrapck/.temp/css/dialog_iequirks.css':
              'skins/bootstrapck/scss/browser-specific/iequirks/dialog_iequirks.scss',
            'skins/bootstrapck/.temp/css/editor_gecko.css':
              'skins/bootstrapck/scss/browser-specific/gecko/editor_gecko.scss',
            'skins/bootstrapck/.temp/css/dialog_opera.css':
              'skins/bootstrapck/scss/browser-specific/opera/dialog_opera.scss',
          },
        ],
      },
    },

    cssmin: {
      BoostrapCK4Skin: {
        files: {
          'skins/bootstrapck/editor.css': [
            'skins/bootstrapck/.temp/css/editor.css',
          ],
          'skins/bootstrapck/dialog.css': [
            'skins/bootstrapck/.temp/css/dialog.css',
          ],
          'skins/bootstrapck/editor_ie.css': [
            'skins/bootstrapck/.temp/css/editor_ie.css',
          ],
          'skins/bootstrapck/dialog_ie.css': [
            'skins/bootstrapck/.temp/css/dialog_ie.css',
          ],
          'skins/bootstrapck/editor_ie8.css': [
            'skins/bootstrapck/.temp/css/editor_ie8.css',
          ],
          'skins/bootstrapck/dialog_ie8.css': [
            'skins/bootstrapck/.temp/css/dialog_ie8.css',
          ],
          'skins/bootstrapck/editor_ie7.css': [
            'skins/bootstrapck/.temp/css/editor_ie7.css',
          ],
          'skins/bootstrapck/dialog_ie7.css': [
            'skins/bootstrapck/.temp/css/dialog_ie7.css',
          ],
          'skins/bootstrapck/editor_iequirks.css': [
            'skins/bootstrapck/.temp/css/editor_iequirks.css',
          ],
          'skins/bootstrapck/dialog_iequirks.css': [
            'skins/bootstrapck/.temp/css/dialog_iequirks.css',
          ],
          'skins/bootstrapck/editor_gecko.css': [
            'skins/bootstrapck/.temp/css/editor_gecko.css',
          ],
          'skins/bootstrapck/dialog_opera.css': [
            'skins/bootstrapck/.temp/css/dialog_opera.css',
          ],
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('build', ['sass', 'cssmin']);
};
