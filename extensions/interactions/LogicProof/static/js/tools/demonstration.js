// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var logicDemo = angular.module('logicDemo', []);

logicDemo.controller('TestCtrl', function($scope) {
  $scope.buildIndexer = function(n) {
    var output = [];
    for (var i = 0; i < n; i++) {
      output.push(i);
    }
    return output;
  };

  $scope.buildErrors = function(n) {
    var output = [];
    for (var i = 0; i < n; i++) {
      output.push('');
    }
    return output;
  };

  $scope.questionData = {
    language: logicProofData.BASE_STUDENT_LANGUAGE,
    vocabulary: DEFAULT_VOCABULARY,
    mistake_table: [[], [], [], []],
    general_messages: logicProofData.BASE_GENERAL_MESSAGES
  };

  $scope.proofString = (
    'from P\u2227Q we have P\nfrom P\u2227Q we have Q\nfrom Q and P we have ' +
    'Q\u2227P');

  $scope.displayMessage = function(message, line) {
    $scope.proofError = '';
    for (var i = 0; i < line; i++) {
      $scope.proofError += ' \n';
    }
    var pointer = 0;
    while (pointer < message.length) {
      var nextSpace = message.slice(pointer, pointer + 70).lastIndexOf(' ');
      var breakPoint = (
        (nextSpace <= 0 || pointer + 70 >= message.length) ? 70 :
          nextSpace + 1);
      $scope.proofError += (
        message.slice(pointer, pointer + breakPoint) + '\n');
      pointer += breakPoint;
    }
  };

  $scope.editProof = function() {
    $scope.checkSuccess = false;
    if ($scope.proofString.slice(-1) === '\n') {
      var questionInstance = logicProofStudent.buildInstance(
        $scope.questionData);
      try {
        logicProofStudent.validateProof($scope.proofString, questionInstance);
      } catch (err) {
        $scope.displayMessage(err.message, err.line);
      }
    } else {
      $scope.proofError = '';
    }
  };

  $scope.submitProof = function() {
    var questionInstance = logicProofStudent.buildInstance(
      $scope.questionData);
    try {
      var proof = logicProofStudent.buildProof(
        $scope.proofString, questionInstance);
      logicProofStudent.checkProof(proof, questionInstance);
      $scope.proofError = '';
      $scope.checkSuccess = true;
    } catch (err) {
      $scope.displayMessage(err.message, err.line);
      $scope.checkSuccess = false;
    }
  };

  // LOCAL CHECK (for testing only)
  $scope.doLocalCheck = function() {
    questionInstance = logicProofStudent.buildInstance($scope.questionData);
    proof = logicProofStudent.buildProof($scope.proofString, questionInstance);
    $scope.localCheck = 'mistake not found';
    var parameters = {
      proof: proof,
      assumptions: questionInstance.assumptions,
      target: questionInstance.results[0]
    };
    for (var i = 0; i < questionInstance.mistake_table.length; i++) {
      for (var j = 0;
        j < questionInstance.mistake_table[i].entries.length; j++) {
        var mistake = questionInstance.mistake_table[i].entries[j];
        if (mistake.name === $scope.mistakeName) {
          $scope.localCheck = logicProofStudent.evaluate(
            mistake.occurs, {
              n: parseInt($scope.line)
            }, questionInstance.control_model, parameters, {});
        }
      }
    }
  };

  // QUESTION
  $scope.assumptionsString = 'P\u2227Q';
  $scope.targetString = 'Q\u2227P';
  $scope.submitQuestion = function() {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    $scope.questionError = '';
    try {
      var attempt = logicProofTeacher.buildQuestion(
        $scope.assumptionsString, $scope.targetString,
        $scope.questionData.vocabulary);
      $scope.questionData.assumptions = attempt.assumptions;
      $scope.questionData.results = attempt.results;
      $scope.questionData.language.operators = attempt.operators;
      $scope.questionSuccess = true;
      $scope.assumptionsDisplay = logicProofShared.displayExpressionArray(
        $scope.questionData.assumptions,
        $scope.questionData.language.operators);
      $scope.targetDisplay = logicProofShared.displayExpression(
        $scope.questionData.results[0],
        $scope.questionData.language.operators);
    } catch (err) {
      $scope.questionError = err.message;
      $scope.questionSuccess = false;
    }
  };

  $scope.submitQuestion();

  // LINE TEMPLATES
  $scope.lineTemplateStrings = DEFAULT_LINE_TEMPLATE_STRINGS;
  $scope.lineTemplateIndexer = $scope.buildIndexer(
    $scope.lineTemplateStrings.length);
  $scope.submitLineTemplates = function() {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    try {
      $scope.questionData.line_templates = (
        logicProofTeacher2.buildLineTemplateTable(
          $scope.lineTemplateStrings, $scope.questionData.vocabulary));
      $scope.lineTemplateSuccess = true;
      $scope.LineTemplateErrors = $scope.buildErrors(
        $scope.lineTemplateStrings.length);
    } catch (err) {
      $scope.LineTemplateErrors = err;
      $scope.lineTemplateSuccess = false;
    }
  };

  $scope.submitLineTemplates();

  // MISTAKE TABLE
  $scope.mistakeStrings = [{
    name: 'layout',
    entries: DEFAULT_LAYOUT_MISTAKE_STRINGS
  }, {
    name: 'variables',
    entries: DEFAULT_VARIABLE_MISTAKE_STRINGS
  }, {
    name: 'logic',
    entries: DEFAULT_LOGIC_MISTAKE_STRINGS
  }, {
    name: 'target',
    entries: DEFAULT_TARGET_MISTAKE_STRINGS
  }];
  $scope.mistakeIndexer = $scope.buildIndexer($scope.mistakeStrings.length);
  $scope.mistakeSectionIndexer = [];
  $scope.mistakeSuccess = [];
  $scope.mistakeErrors = [];
  for (var i = 0; i < $scope.mistakeStrings.length; i++) {
    $scope.mistakeSectionIndexer.push(
      $scope.buildIndexer($scope.mistakeStrings[i].entries.length));
    $scope.mistakeSuccess.push(true);
    $scope.mistakeErrors.push([]);
  }

  $scope.submitMistakes = function(sectionNumber) {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    try {
      $scope.questionData.mistake_table[sectionNumber] = (
        logicProofTeacher2.buildMistakeSection(
          $scope.mistakeStrings[sectionNumber].name,
          $scope.mistakeStrings[sectionNumber].entries,
          $scope.questionData.control_functions));
      $scope.mistakeSuccess[sectionNumber] = true;
      $scope.mistakeErrors[sectionNumber] = $scope.buildErrors(
        $scope.mistakeStrings[sectionNumber].entries.length);
    } catch (err) {
      $scope.mistakeSuccess[sectionNumber] = false;
      $scope.mistakeErrors[sectionNumber] = err;
    }
  };

  // CONTROL FUNCTIONS
  $scope.controlFunctionStrings = DEFAULT_CONTROL_FUNCTION_STRINGS;
  $scope.controlFunctionIndexer = $scope.buildIndexer(
    $scope.controlFunctionStrings.length);
  $scope.submitControlFunctions = function() {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    $scope.controlFunctionErrors = $scope.buildErrors(
      $scope.controlFunctionStrings.length);
    try {
      $scope.questionData.control_functions = (
        logicProofTeacher2.buildControlFunctionTable(
          $scope.controlFunctionStrings));
      $scope.controlFunctionSuccess = true;
    } catch (err) {
      $scope.controlFunctionErrors[err.line] = err.message;
      $scope.controlFunctionSuccess = false;
    }
  };

  $scope.submitControlFunctions();
  // Mistake sections depend on control functions so we build them after.
  for (var i = 0; i < $scope.mistakeStrings.length; i++) {
    $scope.submitMistakes(i);
  }

  $scope.REPLACEMENT_PAIRS = [{
    old: '\u2227',
    // eslint-disable quote-props
    'new': '\\u2227'
  }, {
    old: '\u2228',
    'new': '\\u2228'
  }, {
    old: '\u2200',
    'new': '\\u2200'
  }, {
    old: '\u2203',
    'new': '\\u2203'
  }, {
    old: '\u2208',
    'new': '\\u2208'
    // eslint-enable quote-props
  }];

  // JSON.stringify will display '\u2227' from strings.js as '∧'. We do not
  // want to write unicode in generatedDefaultData.js so we convert to '\\u2227'
  // which JSON.stringify will display as '\u2227'.
  $scope.replaceUnicode = function(input) {
    var output = input;
    for (var i = 0; i < $scope.REPLACEMENT_PAIRS.length; i++) {
      // We use this as .replace() only replaces one instance.
      output = output.split($scope.REPLACEMENT_PAIRS[i].old).join(
        $scope.REPLACEMENT_PAIRS[i]['new']);
    }
    return output;
  };

  // JAVASCRIPT CONSTRUCTION
  $scope.requestJavascript = function() {
    if ($scope.questionSuccess && $scope.lineTemplateSuccess &&
        $scope.mistakeSuccess[0] && $scope.mistakeSuccess[1] &&
        $scope.mistakeSuccess[2] && $scope.mistakeSuccess[3] &&
        $scope.controlFunctionSuccess) {
      var docStart = 'LOGIC_PROOF_DEFAULT_QUESTION_DATA = {' +
        'assumptions: [],' +
        'results: [],' +
        'language: logicProofData.BASE_STUDENT_LANGUAGE,' +
        'general_messages: logicProofData.BASE_GENERAL_MESSAGES,';
      document.write(docStart + $scope.replaceUnicode(
        JSON.stringify({
          line_templates: $scope.questionData.line_templates,
          vocabulary: $scope.questionData.vocabulary,
          mistake_table: $scope.questionData.mistake_table,
          control_functions: $scope.questionData.control_functions
        })).substring(1));
    }
  };
});
