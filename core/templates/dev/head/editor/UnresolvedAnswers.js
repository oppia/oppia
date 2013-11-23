// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Controllers for the unresolved answers section of the
 *   state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

function UnresolvedAnswers($scope, warningsData, explorationData) {

  $scope.initUnresolvedAnswers = function(data) {
    $scope.unresolvedAnswers = data.unresolved_answers;
    $scope.generateUnresolvedAnswersMap();
  };

  $scope.$on('stateEditorInitialized', function(evt, stateId) {
    $scope.stateId = stateId;
    if ($scope.stateId) {
      var dataOrPromise = explorationData.getStateData($scope.stateId);
      if (dataOrPromise) {
        if ('then' in dataOrPromise) {
          dataOrPromise.then($scope.initUnresolvedAnswers);
        } else {
          $scope.initUnresolvedAnswers(data);
        }
      } else {
        console.log('No state data exists for state ' + $scope.stateId);
      }
    }
  });

  $scope.generateUnresolvedAnswersMap = function() {
    $scope.unresolvedAnswersMap = [];
    for (var answerItem in $scope.unresolvedAnswers) {
      $scope.unresolvedAnswersMap.push({
        'answer': answerItem,
        'count': $scope.unresolvedAnswers[answerItem]
      });
    }
  };

  $scope.deleteUnresolvedAnswer = function(answer) {
    $scope.unresolvedAnswers[answer] = 0;
    explorationData.saveStateData($scope.stateId, {
      'resolved_answers': [answer]
    });
    $scope.generateUnresolvedAnswersMap();
  };
}

InteractiveWidgetEditor.$inject = [
  '$scope', 'warningsData', 'explorationData'
];
