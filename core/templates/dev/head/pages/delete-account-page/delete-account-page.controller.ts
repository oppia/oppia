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
 * @fileoverview Data and controllers for the Oppia 'edit preferences' page.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('deleteAccountPage', [
  '$http', '$window', 'UrlInterpolationService',
  function($http, $window, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/delete-account-page/delete-account-page.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$uibModal',
        function($uibModal) {
          var ctrl = this;
          ctrl.deleteAccount = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/delete-account-page/templates/' +
                'delete-account-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', function(
                    $scope, $uibModalInstance) {
                  $scope.reallyDelete = $uibModalInstance.close;

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function() {
              $http['delete']('/delete-account-handler').then(function() {
                $window.location = (
                  '/logout?redirect_url=pending-account-deletion');
              });
            });
          };
        }
      ]
    };
  }]);
