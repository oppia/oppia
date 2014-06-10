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
      $scope.explorationTitle = data.title;
      $scope.currentQuestion = data.init_html;
      $scope.inputTemplate = data.interactive_html;
    }, function(data) {
      warningsData.addWarning(
        data.error || 'There was an error loading the exploration.');
    });
  };

  $scope.initializePage();

  $scope.submitAnswer = function(answer, handler) {
    oppiaPlayerService.submitAnswer(answer, handler, function(data) {
      if (data.state_name === 'END') {
        $scope.currentQuestion = 'You have finished.';
        $scope.inputTemplate = '';
        return;
      }

      // This is a bit of a hack. When a refresh happens, AngularJS compares
      // $scope.inputTemplate to the previous value of $scope.inputTemplate.
      // If they are the same, then $scope.inputTemplate is not updated, and
      // the reader's previous answers still remain present. The random suffix
      // makes the new template different from the previous one, and thus
      // indirectly forces a refresh.
      var randomSuffix = '';
      var N = Math.round(Math.random() * 1000);
      for (var i = 0; i < N; i++) {
        randomSuffix += ' ';
      }

      if (data.interactive_html) {
        // A non-empty interactive_html means that the previous widget
        // is not sticky and should be replaced.
        $scope.inputTemplate = data.interactive_html + randomSuffix;
      }

      // The randomSuffix is also needed for 'previousReaderAnswer', 'feedback'
      // and 'question', so that the aria-live attribute will read it out.
      $scope.currentQuestion = data.question_html + randomSuffix;
    }, function(data) {
      warningsData.addWarning(
        data.error || 'There was an error processing your input.');
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
SnapshotsSkin.$inject = ['$scope', 'warningsData', 'oppiaPlayerService'];
