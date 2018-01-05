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
 * @fileoverview Service for managing the redirection to a refresher
 * exploration.
 */

oppia.factory('RefresherExplorationConfirmationModalService', [
  '$uibModal', 'UrlInterpolationService', 'UrlService',
  'ExplorationPlayerService',
  function($uibModal, UrlInterpolationService, UrlService,
      ExplorationPlayerService) {
    return {
      displayRedirectConfirmationModal: function(
          refresherExplorationId, redirectConfirmationCallback) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_player/' +
            'refresher_exploration_confirmation_modal_directive.html'),
          backdrop: 'static',
          controller: [
            '$scope', '$uibModalInstance', '$window',
            function($scope, $uibModalInstance, $window) {
              $scope.confirmRedirect = function() {
                redirectConfirmationCallback();
                var url = '/explore/' + refresherExplorationId;
                url = UrlService.addField(
                  url, 'parent', ExplorationPlayerService.getExplorationId());
                $window.open(url, '_self');
                $uibModalInstance.dismiss('cancel');
              };
              $scope.cancelRedirect = function() {
                $uibModalInstance.dismiss('cancel');
              };
            }
          ]
        });
      }
    }
  }
]);
