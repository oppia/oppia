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

/**
 * @fileoverview Unit tests for logic demo test controller.
 */

import logicProofStudent from 'interactions/LogicProof/static/js/student';
import logicProofTeacher from 'interactions/LogicProof/static/js/teacher';
import logicProofTeacher2 from
  'interactions/LogicProof/static/js/tools/teacher2';

require(
  './logic-demo-test.controller.ts');

describe('Logic demo test', function() {
  var $scope = null;

  beforeEach(angular.mock.module('logicDemo'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    $controller('LogicDemoTestController', {
      $scope: $scope
    });
  }));

  it('should build indexer according to a number', function() {
    expect($scope.buildIndexer(10)).toEqual(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should build errors according to a number', function() {
    var n = 10;
    expect($scope.buildErrors(n)).toEqual(new Array(n).fill(''));
  });

  it('should display a message broke into lines depending on its length',
    function() {
      var message = (
        'This is a mocked message to test the display message method' +
        ' through unit tests and check if this message is going to be' +
        ' break into lines that has up to 70 lines.');
      var line = 1;
      $scope.displayMessage(message, line);

      expect($scope.proofError).toBe(
        ' \n' + 'This is a mocked message to test the display message method' +
        ' through \nunit tests and check if this message is going to be break' +
        ' into lines \nthat has up to 70 lines.\n');
    });

  it('should edit a proof', function() {
    spyOn(logicProofStudent, 'validateProof').and.callThrough();
    $scope.proofString = (
      'from P\u2227Q we have P\nfrom P\u2227Q we have Q\nfrom Q and P we' +
      ' have Q\u2227P\n');
    $scope.editProof();

    expect(logicProofStudent.validateProof).toHaveBeenCalled();

    $scope.proofString = (
      'from P\u2227Q we have P\nfrom P\u2227Q we have Q\nfrom Q and P we' +
      ' have Q\u2227P');
  });

  it('should not edit a proof if validating it throws an error', function() {
    spyOn(logicProofStudent, 'validateProof').and.throwError(Object.assign(
      new Error, {
        message: 'Checking if submit proof function will throw an error if' +
        ' checkProof throw an error as well and then this message should be' +
        ' formatted.',
        line: 1
      }
    ));
    $scope.proofString = (
      'from P\u2227Q we have P\nfrom P\u2227Q we have Q\nfrom Q and P we' +
      ' have Q\u2227P\n');
    $scope.editProof();

    expect($scope.proofError).toBe(
      ' \n' + 'Checking if submit proof function will throw an error if' +
      ' checkProof \nthrow an error as well and then this message' +
      ' should be formatted.\n');

    $scope.proofString = (
      'from P\u2227Q we have P\nfrom P\u2227Q we have Q\nfrom Q and P we' +
      ' have Q\u2227P');
  });

  it('should edit a proof even if it does not end with \n', function() {
    spyOn(logicProofStudent, 'validateProof').and.callThrough();
    $scope.editProof();

    expect(logicProofStudent.validateProof).not.toHaveBeenCalled();
    expect($scope.proofError).toBe('');
  });

  it('should submit a proof', function() {
    $scope.submitProof();
    expect($scope.proofError).toBe('');
    expect($scope.checkSuccess).toBe(true);
  });

  it('should not submit a proof if its checking throws an error', function() {
    spyOn(logicProofStudent, 'checkProof').and.throwError(Object.assign(
      new Error, {
        message: 'Checking if submit proof function will throw an error if' +
        ' checkProof throw an error as well and then this message should be' +
        ' formatted.',
        line: 1
      }
    ));

    $scope.submitProof();
    expect($scope.proofError).toBe(
      ' \n' + 'Checking if submit proof function will throw an error if' +
      ' checkProof \nthrow an error as well and then this message' +
      ' should be formatted.\n');
    expect($scope.checkSuccess).toBe(false);
  });

  it('should do a local check', function() {
    var mistakeTableSample = [{
      entries: [{
        name: 'incorrect_variable_forall',
        occurs: {
          top_kind_name: 'variable',
          top_operator_name: 'n'
        },
      }]
    }];
    $scope.questionData.mistake_table = mistakeTableSample;
    $scope.mistakeName = 'incorrect_variable_forall';
    $scope.line = 10;
    $scope.doLocalCheck();

    expect($scope.localCheck).toBe(10);

    $scope.questionData.mistake_table = [[], [], [], []];
    $scope.line = undefined;
    $scope.mistakeName = undefined;
  });

  it('should submit a question', function() {
    $scope.submitQuestion();

    expect($scope.questionData.assumptions).toEqual([{
      top_kind_name: 'binary_connective',
      top_operator_name: 'and',
      arguments: [{
        top_kind_name: 'variable',
        top_operator_name: 'P',
        arguments: [],
        dummies: []
      }, {
        top_kind_name: 'variable',
        top_operator_name: 'Q',
        arguments: [],
        dummies: []
      }],
      dummies: []
    }]);
    expect($scope.questionData.results).toEqual([{
      top_kind_name: 'binary_connective',
      top_operator_name: 'and',
      arguments: [{
        top_kind_name: 'variable',
        top_operator_name: 'Q',
        arguments: [],
        dummies: []
      }, {
        top_kind_name: 'variable',
        top_operator_name: 'P',
        arguments: [],
        dummies: []
      }],
      dummies: []
    }]);
    expect($scope.questionData.language.operators).toEqual({
      and: {
        kind: 'binary_connective',
        typing: [{
          arguments: [{
            type: 'boolean', arbitrarily_many: false
          }, {
            type: 'boolean', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['∧']
      },
      or: {
        kind: 'binary_connective',
        typing: [{
          arguments: [{
            type: 'boolean', arbitrarily_many: false
          }, {
            type: 'boolean', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['∨']
      },
      implies: {
        kind: 'binary_connective',
        typing: [{
          arguments: [{
            type: 'boolean', arbitrarily_many: false
          }, {
            type: 'boolean', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['=>']
      },
      iff: {
        kind: 'binary_connective',
        typing: [{
          arguments: [{
            type: 'boolean', arbitrarily_many: false
          }, {
            type: 'boolean', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<=>']
      },
      not: {
        kind: 'unary_connective',
        typing: [{
          arguments: [{
            type: 'boolean', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['~']
      },
      for_all: {
        kind: 'quantifier',
        typing: [{
          arguments: [{
            type: 'boolean', arbitrarily_many: false
          }],
          dummies: [{
            type: 'element', arbitrarily_many: false
          }],
          output: 'boolean'
        }],
        symbols: ['∀', '.']
      },
      exists: {
        kind: 'quantifier',
        typing: [{
          arguments: [{
            type: 'boolean', arbitrarily_many: false
          }],
          dummies: [{
            type: 'element', arbitrarily_many: false
          }],
          output: 'boolean'
        }],
        symbols: ['∃', '.']
      },
      equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['=']
      },
      not_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['!=']
      },
      less_than: {
        kind: 'binary_relation',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<']
      },
      greater_than: {
        kind: 'binary_relation',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['>']
      },
      less_than_or_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['<=']
      },
      greater_than_or_equals: {
        kind: 'binary_relation',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'boolean'
        }],
        symbols: ['>=']
      },
      addition: {
        kind: 'binary_function',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'element'
        }],
        symbols: ['+']
      },
      subtraction: {
        kind: 'binary_function',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'element'
        }],
        symbols: ['-']
      },
      multiplication: {
        kind: 'binary_function',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'element'
        }],
        symbols: ['*']
      },
      division: {
        kind: 'binary_function',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'element'
        }],
        symbols: ['/']
      },
      exponentiation: {
        kind: 'binary_function',
        typing: [{
          arguments: [{
            type: 'element', arbitrarily_many: false
          }, {
            type: 'element', arbitrarily_many: false
          }],
          dummies: [],
          output: 'element'
        }],
        symbols: ['^']
      },
      P: {
        kind: 'variable',
        typing: [{
          arguments: [],
          dummies: [],
          output: 'boolean'
        }]
      },
      Q: {
        kind: 'variable',
        typing: [{
          arguments: [],
          dummies: [],
          output: 'boolean'
        }]
      }
    });
    expect($scope.assumptionsDisplay).toBe('P∧Q');
    expect($scope.targetDisplay).toBe('Q∧P');
  });

  it('should not submit a question if building it throws an error', function() {
    expect($scope.questionError).toBe('');
    spyOn(logicProofTeacher, 'buildQuestion').and.throwError(
      'Throwing an error');
    $scope.submitQuestion();

    expect($scope.questionError).toBe('Throwing an error');
    expect($scope.questionSuccess).toBe(false);
  });

  it('should submit line templates', function() {
    var LINE_TEMPLATE_STRINGS_LENGTH = 40;
    $scope.submitLineTemplates();

    expect($scope.LineTemplateErrors).toEqual(new Array(
      LINE_TEMPLATE_STRINGS_LENGTH).fill(''));
    expect($scope.lineTemplateSuccess).toBe(true);
  });

  it('should not submit line templates if building line template throws an' +
    ' error', function() {
    spyOn(logicProofTeacher2, 'buildLineTemplateTable').and.throwError(
      'Line template errors');

    $scope.submitLineTemplates();

    expect($scope.LineTemplateErrors).toEqual(
      new Error('Line template errors'));
    expect($scope.lineTemplateSuccess).toBe(false);
  });

  it('should submit mistakes', function() {
    const MISTAKE_STRINGS_LENGTH = 40;
    spyOn(logicProofTeacher2, 'buildMistakeSection').and.returnValue({
      entries: [],
      name: ''
    });
    var sectionNumber = 0;
    $scope.submitMistakes(sectionNumber);

    expect($scope.mistakeSuccess[sectionNumber]).toBe(true);
    expect($scope.LineTemplateErrors).toEqual(new Array(
      MISTAKE_STRINGS_LENGTH).fill(''));
  });

  it('should not submit mistakes if building it throws an error', function() {
    var sectionNumber = 0;
    spyOn(logicProofTeacher2, 'buildMistakeSection').and.throwError(
      'Mistake section errors');

    $scope.submitMistakes(sectionNumber);

    expect($scope.mistakeSuccess[sectionNumber]).toBe(false);
    expect($scope.mistakeErrors[sectionNumber]).toEqual(
      new Error('Mistake section errors'));
  });

  it('should submit control functions', function() {
    spyOn(logicProofTeacher2, 'buildControlFunctionTable').and.returnValue([]);
    $scope.submitControlFunctions();

    expect($scope.controlFunctionSuccess).toBe(true);
    expect($scope.questionData.control_functions).toEqual([]);
  });

  it('should not submit control functions if building it throws an error',
    function() {
      spyOn(logicProofTeacher2, 'buildControlFunctionTable').and.callFake(
        function() {
          throw Object.assign(new Error, {
            message: 'Control function table errors',
            line: 0
          });
        });

      $scope.submitControlFunctions();

      expect($scope.controlFunctionSuccess).toBe(false);
      expect($scope.controlFunctionErrors[0]).toBe(
        'Control function table errors');
    });

  it('should replace unicode', function() {
    var input = (
      'from P\u2227Q we have P\nfrom P\u2228Q we have Q\nfrom Q and P we' +
      ' have Q\u2200P');
    var expectedInput = (
      'from P\\u2227Q we have P\nfrom P\\u2228Q we have Q\nfrom Q and P we' +
      ' have Q\\u2200P');
    expect($scope.replaceUnicode(input)).toBe(expectedInput);
  });

  it('should request javascript', function() {
    spyOn(logicProofTeacher2, 'buildMistakeSection').and.returnValue({
      entries: [],
      name: ''
    });
    spyOn(logicProofTeacher2, 'buildControlFunctionTable').and.returnValue([]);

    $scope.submitMistakes(0);
    $scope.submitMistakes(1);
    $scope.submitMistakes(2);
    $scope.submitMistakes(3);
    $scope.submitControlFunctions();

    spyOn(document, 'write').and.callThrough();

    $scope.requestJavascript();

    expect(document.write).toHaveBeenCalled();
  });
});
