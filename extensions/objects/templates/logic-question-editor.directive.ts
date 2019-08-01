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
 * @fileoverview Directive for logic question editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

var oppia = require('AppInit.ts').module;

oppia.directive('logicQuestionEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/logic_question_editor_directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.alwaysEditable = true;
        ctrl.localValue = {
          assumptionsString: logicProofShared.displayExpressionArray(
            ctrl.value.assumptions,
            logicProofData.BASE_STUDENT_LANGUAGE.operators),
          targetString: logicProofShared.displayExpression(
            ctrl.value.results[0],
            logicProofData.BASE_STUDENT_LANGUAGE.operators),
          errorMessage: '',
          proofString: ctrl.value.default_proof_string
        };

        // NOTE: we use ng-change rather than $watch because the latter runs in
        // response to any change to the watched value, and we only want to
        // respond to changes made by the user.
        ctrl.changeAssumptions = function() {
          ctrl.convertThenBuild(
            'logicQuestionAssumptions', 'assumptionsString');
        };
        ctrl.changeTarget = function() {
          ctrl.convertThenBuild('logicQuestionTarget', 'targetString');
        };
        ctrl.changeProof = function() {
          ctrl.convertThenBuild('logicQuestionProof', 'proofString');
        };

        ctrl.convertThenBuild = function(elementID, nameOfString) {
          var element = document.getElementById(elementID);
          var cursorPosition = (<HTMLInputElement>element).selectionEnd;
          ctrl.localValue[nameOfString] =
            logicProofConversion.convertToLogicCharacters(
              ctrl.localValue[nameOfString]);
          ctrl.buildQuestion();
          // NOTE: angular will reset the position of the cursor after this
          // function runs, so we need to delay our re-resetting.
          setTimeout(function() {
            (<HTMLInputElement>element).selectionEnd = cursorPosition;
          }, 2);
        };

        ctrl.buildQuestion = function() {
          try {
            var builtQuestion = angular.copy(
              logicProofTeacher.buildQuestion(
                ctrl.localValue.assumptionsString,
                ctrl.localValue.targetString,
                LOGIC_PROOF_DEFAULT_QUESTION_DATA.vocabulary));
            ctrl.value = {
              assumptions: builtQuestion.assumptions,
              results: builtQuestion.results,
              default_proof_string: ctrl.localValue.proofString
            };
            ctrl.localValue.errorMessage = '';
          } catch (err) {
            ctrl.localValue.errorMessage = err.message;
          }
        };
      }]
    };
  }]);
