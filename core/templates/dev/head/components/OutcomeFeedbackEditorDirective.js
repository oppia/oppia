// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives for the outcome feedback editor.
 */

oppia.directive('outcomeFeedbackEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      outcome: '='
    },
    templateUrl: 'rules/outcomeFeedbackEditor',
    controller: ['$scope', function($scope) {
      $scope.OUTCOME_FEEDBACK_SCHEMA = {
        type: 'html'
      };

      $scope.$on('saveOutcomeFeedbackDetails', function() {
        // Remove null feedback. If the first element of the feedback is null or
        // empty, clear the entire feedback array. This is so that if the first
        // feedback is removed all feedback is thereby removed. Only the first
        // feedback is usable and editable. This also preserves all feedback
        // entries after the first if the first is non-empty.
        var nonemptyFeedback = [];
        for (var i = 0; i < $scope.outcome.feedback.length; i++) {
          var feedbackStr = $scope.outcome.feedback[i];
          if (feedbackStr) {
            feedbackStr = feedbackStr.trim();
          }
          if (feedbackStr) {
            nonemptyFeedback.push(feedbackStr);
          }
          if (!feedbackStr && i === 0) {
            // If the first feedback is empty, copy no more feedback after.
            break;
          }
        }
        $scope.outcome.feedback = nonemptyFeedback;
      });
    }]
  };
}]);
