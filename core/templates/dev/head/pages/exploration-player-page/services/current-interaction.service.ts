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
    var _submitAnswerFn = null;
    var _onSubmitFn = null;
    var _validityCheckFn = null;
    var _presubmitHooks = [];

    return {
      setOnSubmitFn: function(onSubmit) {
        /**
         * The ConversationSkinDirective should register its onSubmit
         * callback here.
         *
         * @param {function(answer, interactionRulesService)} onSubmit
         */
        _onSubmitFn = onSubmit;
      },
      registerCurrentInteraction: function(submitAnswerFn, validityCheckFn) {
        /**
         * Each interaction directive should call registerCurrentInteraction
         * when the interaction directive is first created.
         *
         * @param {function|null} submitAnswerFn - Should grab the learner's
         *   answer and pass it to onSubmit. The interaction can pass in
         *   null if it does not use the progress nav's submit button
         *   (ex: MultipleChoiceInput).
         * @param {function} validityCheckFn - The progress nav will use this
         *   to decide whether or not to disable the submit button. If the
         *   interaction passes in null, the submit button will remain
         *   enabled (for the entire duration of the current interaction).
         */
        _submitAnswerFn = submitAnswerFn || null;
        _validityCheckFn = validityCheckFn || null;
      },
      registerPresubmitHook: function(hookFn) {
        /* Register a hook that will be called right before onSubmit.
         * All hooks for the current interaction will be cleared right
         * before loading the next card.
         */
        _presubmitHooks.push(hookFn);
      },
      clearPresubmitHooks: function() {
        /* Clear out all the hooks for the current interaction. Should
         * be called before loading the next card.
         */
        _presubmitHooks = [];
      },
      onSubmit: function(answer, interactionRulesService) {
        for (var i = 0; i < _presubmitHooks.length; i++) {
          _presubmitHooks[i]();
        }
        _onSubmitFn(answer, interactionRulesService);
      },
      submitAnswer: function() {
        /* This starts the answer submit process, it should be called once the
         * learner presses the "Submit" button.
         */
        if (_submitAnswerFn === null) {
          throw Error('The current interaction did not ' +
                      'register a _submitAnswerFn.');
        } else {
          _submitAnswerFn();
        }
      },
      isSubmitButtonDisabled: function() {
        /* Returns whether or not the Submit button should be disabled based on
         * the validity of the current answer. If the interaction does not pass
         * in a _validityCheckFn, then _validityCheckFn will be null and by
         * default we assume the answer is valid, so the submit button should
         * not be disabled.
         */
        if (_validityCheckFn === null) {
          return false;
        }
        return !_validityCheckFn();
      },
    };
  }
]);
