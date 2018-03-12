'use strict';

var eslintAngularIndex = require('../index.js');
var testUtils = require('./utils/testUtils.js');

var ruleNames = Object.keys(eslintAngularIndex.rules).filter(function(ruleName) {
    // filter legacy rules
    return !/^ng_/.test(ruleName);
});

var ruleFiles = testUtils.getFiles({
    basePath: './rules/',
    ignoreFiles: ['index.js', 'utils']
});

var testFiles = testUtils.getFiles({
    basePath: './test/',
    ignoreFiles: ['index.js', 'utils']
});

testUtils.detectMissingFilesForRules(ruleNames, {
    type: 'file',
    files: ruleFiles
});

testUtils.detectMissingFilesForRules(ruleNames, {
    type: 'test',
    files: testFiles
});

testUtils.detectMissingRuleDefinitionForFiles(ruleFiles, {
    ruleNames: ruleNames
});

testUtils.detectMissingRuleDefinitionForFiles(testFiles, {
    ruleNames: ruleNames
});
