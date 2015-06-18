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
 * @fileoverview Controllers for the unresolved answers section of the
 *   state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('StateStatistics', [
    '$scope', 'explorationData', 'editorContextService', 'explorationStatesService',
    function($scope, explorationData, editorContextService, explorationStatesService) {
  $scope.unresolvedAnswersList = [];

  var INTERACTIONS_WITHOUT_UNRESOLVED_ANSWERS = ['Continue'];

  $scope.initStateStatistics = function(data) {
    // Do not show unresolved answers if the interaction is of type 'Continue'.
    $scope.unresolvedAnswers = (
      INTERACTIONS_WITHOUT_UNRESOLVED_ANSWERS.indexOf(data.interaction.id) !== -1 ?
      {} : data.unresolved_answers);
    $scope.generateUnresolvedAnswersList();
  };

  $scope.$on('refreshStateEditor', function(evt) {
    $scope.stateName = editorContextService.getActiveStateName();
    var stateData = explorationStatesService.getState($scope.stateName);
    $scope.initStateStatistics(stateData);
  });

  $scope.generateUnresolvedAnswersList = function() {
    $scope.unresolvedAnswersList = [];
    for (var answerItem in $scope.unresolvedAnswers) {
      $scope.unresolvedAnswersList.push({
        'answer': answerItem,
        'count': $scope.unresolvedAnswers[answerItem]
      });
    }
  };

  $scope.deleteUnresolvedAnswer = function(answer) {
    $scope.unresolvedAnswers[answer] = 0;
    explorationData.resolveAnswers($scope.stateName, [answer]);
    $scope.generateUnresolvedAnswersList();
  };
}]);
