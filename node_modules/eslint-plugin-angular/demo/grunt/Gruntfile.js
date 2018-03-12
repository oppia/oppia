(function () {
    
    module.exports = function(grunt) {

  grunt.initConfig({
   eslint: {
    options: {
    },
    target: ['app/**/*.js']
   }
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.registerTask('default', ['eslint']);
    };
})();