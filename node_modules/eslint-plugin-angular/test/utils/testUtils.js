'use strict';

var fs = require('fs');

module.exports = {
    getFiles: function(options) {
        var files = fs.readdirSync(options.basePath).filter(function(filename) {
            return options.ignoreFiles.indexOf(filename) < 0;
        });
        files.basePath = options.basePath;
        return files;
    },
    detectMissingFilesForRules: function(ruleNames, options) {
        var files = options.files;
        var basePath = files.basePath;
        ruleNames.forEach(function(ruleName) {
            var expectedFilename = ruleName + '.js';
            if (files.indexOf(expectedFilename) < 0) {
                throw new Error('Missing ' + options.type + ' "' + basePath + expectedFilename + '" for rule "' + ruleName + '"');
            }
        });
    },
    detectMissingRuleDefinitionForFiles: function(files, options) {
        var basePath = files.basePath;
        var ruleNames = options.ruleNames;
        files.forEach(function(fileName) {
            var expectedRulename = fileName.replace(/\.js$/, '');
            if (ruleNames.indexOf(expectedRulename) < 0) {
                throw new Error('Missing rule definition "' + expectedRulename + '" for "' + basePath + fileName + '"');
            }
        });
    }
};
