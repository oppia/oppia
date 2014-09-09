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
 * @fileoverview Controller for the snapshots skin.
 *
 * @author sll@google.com (Sean Lip)
 */

function SnapshotsSkin($scope, warningsData, oppiaPlayerService) {
  $scope.initializePage = function() {
    $scope.inputTemplate = '';
    $scope.currentQuestion = '';
    oppiaPlayerService.loadInitialState(function(data) {
      $scope.currentQuestion = data.init_html;
      $scope.inputTemplate = oppiaPlayerService.getInteractiveWidgetHtml(data.state_name);
      $scope.explorationTitle = oppiaPlayerService.getExplorationTitle();
    });
  };

  $scope.initializePage();

  $scope.submitAnswer = function(answer, handler) {
    oppiaPlayerService.submitAnswer(answer, handler, function(data) {
      if (data.finished) {
        $scope.currentQuestion = 'You have finished.';
        $scope.inputTemplate = '';
        return;
      }

      if (!data.sticky) {
        // The previous widget is not sticky and should be replaced.
        $scope.inputTemplate = oppiaPlayerService.getInteractiveWidgetHtml(
          data.state_name) + oppiaPlayerService.getRandomSuffix();
      }

      // The randomSuffix is also needed for 'previousReaderAnswer', 'feedback'
      // and 'question', so that the aria-live attribute will read it out.
      $scope.currentQuestion = data.question_html + oppiaPlayerService.getRandomSuffix();
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
SnapshotsSkin.$inject = ['$scope', 'warningsData', 'oppiaPlayerService'];
