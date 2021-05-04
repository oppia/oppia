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
 * @fileoverview Controller for state diff modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('components/code-mirror/codemirror-mergeview.component.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/context.service.ts');

angular.module('oppia').controller('StateDiffModalController', [
  '$controller', '$http', '$scope', '$timeout', '$uibModalInstance',
  'ContextService', 'UrlInterpolationService', 'headers', 'newState',
  'newStateName', 'oldState', 'oldStateName',
  function(
      $controller, $http, $scope, $timeout, $uibModalInstance,
      ContextService, UrlInterpolationService, headers, newState,
      newStateName, oldState, oldStateName) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    var STATE_YAML_URL = UrlInterpolationService.interpolateUrl(
      '/createhandler/state_yaml/<exploration_id>', {
        exploration_id: (
          ContextService.getExplorationId())
      });

    $scope.headers = headers;
    $scope.newStateName = newStateName;
    $scope.oldStateName = oldStateName;
    /*
     * $scope.yamlStrs is an object with keys 'earlierVersion' and
     * 'laterVersion', whose values are the YAML representations of
     * the compared versions.
     */
    $scope.yamlStrs = {};

    if (oldState) {
      $http.post(STATE_YAML_URL, {
        state_dict: oldState.toBackendDict(),
        width: 50
      }).then(function(response) {
        $scope.yamlStrs.leftPane = response.data.yaml;
      });
    } else {
      // Note: the timeout is needed or the string will be sent
      // before codemirror has fully loaded and will not be
      // displayed. This causes issues with the e2e tests.
      $timeout(function() {
        $scope.yamlStrs.leftPane = '';
      }, 200);
    }

    if (newState) {
      $http.post(STATE_YAML_URL, {
        state_dict: newState.toBackendDict(),
        width: 50
      }).then(function(response) {
        $scope.yamlStrs.rightPane = response.data.yaml;
      });
    } else {
      // Note: the timeout is needed or the string will be sent
      // before codemirror has fully loaded and will not be
      // displayed. This causes issues with the e2e tests.
      $timeout(function() {
        $scope.yamlStrs.rightPane = '';
      }, 200);
    }

    // Options for the codemirror mergeview.
    $scope.CODEMIRROR_MERGEVIEW_OPTIONS = {
      lineNumbers: true,
      readOnly: true,
      mode: 'yaml',
      viewportMargin: 100
    };
  }
]);
