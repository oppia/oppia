// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for refresher exploration confirmation modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').controller(
  'RefresherExplorationConfirmationModalController', [
    '$controller', '$scope', '$timeout', '$uibModalInstance', '$window',
    'ExplorationEngineService', 'UrlInterpolationService', 'UrlService',
    'redirectConfirmationCallback', 'refresherExplorationId',
    function(
        $controller, $scope, $timeout, $uibModalInstance, $window,
        ExplorationEngineService, UrlInterpolationService, UrlService,
        redirectConfirmationCallback, refresherExplorationId) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });

      $scope.confirmRedirect = function() {
        redirectConfirmationCallback();

        var collectionId = UrlService.getUrlParams().collection_id;
        var parentIdList = UrlService.getQueryFieldValuesAsList(
          'parent');
        var EXPLORATION_URL_TEMPLATE = '/explore/<exploration_id>';
        var url = UrlInterpolationService.interpolateUrl(
          EXPLORATION_URL_TEMPLATE, {
            exploration_id: refresherExplorationId
          });
        if (collectionId) {
          url = UrlService.addField(
            url, 'collection_id', collectionId);
        }
        for (var i = 0; i < parentIdList.length; i++) {
          url = UrlService.addField(url, 'parent', parentIdList[i]);
        }
        url = UrlService.addField(
          url, 'parent', ExplorationEngineService.getExplorationId());

        // Wait a little before redirecting the page to ensure other
        // tasks started here (e.g. event recording) have sufficient
        // time to complete.
        // TODO(bhenning): Find a reliable way to send events that
        // does not get interrupted with browser redirection.
        $timeout(function() {
          $window.open(url, '_self');
        }, 150);

        // Close the dialog to ensure the confirmation cannot be
        // called multiple times.
        $uibModalInstance.close();
      };
    }
  ]);
