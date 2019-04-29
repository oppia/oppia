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
 * @fileoverview Service for the 'embed exploration' modal.
 */

oppia.factory('ExplorationEmbedButtonService', [
  '$uibModal', 'SiteAnalyticsService', 'UrlInterpolationService',
  function($uibModal, SiteAnalyticsService, UrlInterpolationService) {
    return {
      showModal: function(explorationId) {
        $uibModal.open({
          backdrop: true,
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/embed_modal/' +
            'embed_exploration_modal_directive.html'),
          resolve: {
            explorationId: function() {
              return explorationId;
            }
          },
          controller: [
            '$scope', '$uibModalInstance', '$window', 'explorationId',
            function($scope, $uibModalInstance, $window, explorationId) {
              $scope.explorationId = explorationId;
              $scope.serverName = (
                $window.location.protocol + '//' + $window.location.host);

              $scope.close = function() {
                $uibModalInstance.dismiss('close');
              };

              $scope.selectText = function(evt) {
                var codeDiv = evt.currentTarget;
                var range = document.createRange();
                range.setStartBefore(codeDiv.firstChild);
                range.setEndAfter(codeDiv.lastChild);
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
              };
            }
          ]
        });

        SiteAnalyticsService.registerOpenEmbedInfoEvent(explorationId);
      }
    };
  }
]);
