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
 * @fileoverview Service for displaying different types of modals depending
 * on the type of response received as a result of the autosaving request.
 */

oppia.factory('AutosaveInfoModalsService', [
  '$log', '$timeout', '$uibModal', '$window',
  'ChangesInHumanReadableFormService', 'ExplorationDataService',
  'LocalStorageService', 'UrlInterpolationService',
  function(
      $log, $timeout, $uibModal, $window,
      ChangesInHumanReadableFormService, ExplorationDataService,
      LocalStorageService, UrlInterpolationService) {
    var _isModalOpen = false;
    var _refreshPage = function(delay) {
      $timeout(function() {
        $window.location.reload();
      }, delay);
    };

    return {
      showNonStrictValidationFailModal: function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/' +
            'save_validation_fail_modal_directive.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: [
            '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
              $scope.closeAndRefresh = function() {
                $uibModalInstance.dismiss('cancel');
                _refreshPage(20);
              };
            }
          ]
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          _isModalOpen = false;
        });

        _isModalOpen = true;
      },
      isModalOpen: function() {
        return _isModalOpen;
      },
      showVersionMismatchModal: function(lostChanges) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/' +
            'save_version_mismatch_modal_directive.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: ['$scope', function($scope) {
            // When the user clicks on discard changes button, signal backend
            // to discard the draft and reload the page thereafter.
            $scope.discardChanges = function() {
              ExplorationDataService.discardDraft(function() {
                _refreshPage(20);
              });
            };

            $scope.hasLostChanges = (lostChanges && lostChanges.length > 0);
            if ($scope.hasLostChanges) {
              // TODO(sll): This should also include changes to exploration
              // properties (such as the exploration title, category, etc.).
              $scope.lostChangesHtml = (
                ChangesInHumanReadableFormService.makeHumanReadable(
                  lostChanges).html());
              $log.error('Lost changes: ' + JSON.stringify(lostChanges));
            }
          }],
          windowClass: 'oppia-autosave-version-mismatch-modal'
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          _isModalOpen = false;
        });

        _isModalOpen = true;
      },
      showLostChangesModal: function(lostChanges, explorationId) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/lost_changes_modal_directive.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: ['$scope', '$uibModalInstance', function(
              $scope, $uibModalInstance) {
            // When the user clicks on discard changes button, signal backend
            // to discard the draft and reload the page thereafter.
            $scope.close = function() {
              LocalStorageService.removeExplorationDraft(explorationId);
              $uibModalInstance.dismiss('cancel');
            };

            $scope.lostChangesHtml = (
              ChangesInHumanReadableFormService.makeHumanReadable(
                lostChanges).html());
            $log.error('Lost changes: ' + JSON.stringify(lostChanges));
          }],
          windowClass: 'oppia-lost-changes-modal'
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          _isModalOpen = false;
        });

        _isModalOpen = true;
      }
    };
  }
]);
