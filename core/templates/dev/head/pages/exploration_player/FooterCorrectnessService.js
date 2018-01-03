// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview CorrectnessFooter service in learner's view if the answer
 *  submitted is correct.
 */

oppia.factory('footerCorrectnessService', [function() {
  var submittedAnswerIsCorrect = false;
  var correctnessFeedbackIsEnabled = false;
  
  return {
    init: function(value) {
      correctnessFeedbackIsEnabled = value;
      return;
    },
    isCorrectnessFooterEnabled: function() {
      return correctnessFeedbackIsEnabled && submittedAnswerIsCorrect;
    },
    setSubmittedAnswerIsCorrect: function(value) {
      submittedAnswerIsCorrect = value;
    }
  };
}]);
