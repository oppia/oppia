// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Facilitates communication between the current interaction
 * and the progress nav. The former holds data about the learner's answer,
 * while the latter contains the actual "Submit" button which triggers the
 * answer submission process.
 */

oppia.factory('CurrentInteractionService', [
  function() {
    var _submitAnswer;
    var _onSubmit;
    var _shouldHideSubmitButton;
    var _validityCheckFn;

    return {
      setOnSubmitFn: function(onSubmit) {
        /**
         * The ConversationSkinDirective should register its onSubmit
         * callback here.
         *
         * @param {function(answer, interactionRulesService)} onSubmit
         */
        _onSubmit = onSubmit;
      },
      registerCurrentInteraction: function(
          submitAnswer,
          validityCheckFn,
          shouldHideSubmitButton) {
        /**
         * Every interaction directive should register themselves here,
         * even those which do not use the progress nav. All arguments are
         * optional.
         *
         * @param {function} submitAnswer - Called when the learner presses the
         *   progress nav's submit button. Should grab the learner's answer
         *   and pass it to onSubmit. The interaction can omit this param if
         *   it does not use the progress nav's submit button
         *   (ex: MultipleChoiceInput).
         * @param {function} validityCheckFn - The progress nav will use this
         *   to decide whether or not to disable the submit button. The
         *   interaction can omit this param if it does not use the progress
         *   nav's submit button.
         * @param {boolean} shouldHideSubmitButton - Interactions which do not
         *   use the progress nav submit button can hide it entirely with this
         *   flag. Omitting this param is the same as passing in false.
         */
        _submitAnswer = submitAnswer;
        _validityCheckFn = validityCheckFn;
        _shouldHideSubmitButton = Boolean(shouldHideSubmitButton);
      },
      onSubmit: function(answer, interactionRulesService) {
        _onSubmit(answer, interactionRulesService);
      },
      submitAnswer: function() {
        if (typeof _submitAnswer === 'undefined') {
          throw Error('The current interaction did not ' +
                      'register a submitAnswer function.');
        } else {
          _submitAnswer();
        }
      },
      isSubmitButtonDisabled: function() {
        if (typeof _validityCheckFn === 'undefined') {
          return false;
        } else {
          return !_validityCheckFn();
        }
      },
      isSubmitButtonShown: function() {
        return _shouldHideSubmitButton;
      },
    };
  }
]);
