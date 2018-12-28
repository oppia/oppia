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
 * @fileoverview Controller for the edit state content suggestion in learner
 view.
 */

oppia.controller('EditStateContentSuggestionForLearnerView', [
  '$scope', '$uibModalInstance', 'newContent', 'oldContent',
  'description',
  function($scope, $uibModalInstance, newContent, oldContent,
      description) {
    $scope.isInCreatorMode = false;
    $scope.isInLearnerMode = true;
    $scope.isInEditorMode = false;
    $scope.heading = 'I18N_LEARNER_DASHBOARD_SUGGESTION_TEXT';
    $scope.newContent = newContent;
    $scope.oldContent = oldContent;
    $scope.description = description;
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);
