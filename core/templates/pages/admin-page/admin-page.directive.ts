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
 * @fileoverview Data and directive for the Oppia admin page.
 */

require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/focus-on.directive.ts');
require('pages/admin-page/navbar/admin-navbar.component.ts');
require(
  'pages/admin-page/activities-tab/' +
  'admin-prod-mode-activities-tab.component.ts');
require('pages/admin-page/config-tab/admin-config-tab.directive.ts');
require('pages/admin-page/misc-tab/admin-misc-tab.directive.ts');
require('pages/admin-page/roles-tab/admin-roles-tab.directive.ts');
require('pages/admin-page/features-tab/admin-features-tab.component');
require('value_generators/valueGeneratorsRequires.ts');

require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-router.service.ts');
require('services/csrf-token.service.ts');
require('services/utils.service.ts');

angular.module('oppia').directive('adminPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/admin-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$location', '$rootScope', '$scope',
        'AdminRouterService', 'CsrfTokenService', 'PlatformFeatureService',
        'DEV_MODE',
        function(
            $location, $rootScope, $scope,
            AdminRouterService, CsrfTokenService, PlatformFeatureService,
            DEV_MODE) {
          var ctrl = this;
          ctrl.isActivitiesTabOpen = function() {
            return AdminRouterService.isActivitiesTabOpen();
          };
          ctrl.isConfigTabOpen = function() {
            return AdminRouterService.isConfigTabOpen();
          };
          ctrl.isFeaturesTabOpen = function() {
            return AdminRouterService.isFeaturesTabOpen();
          };
          ctrl.isRolesTabOpen = function() {
            return AdminRouterService.isRolesTabOpen();
          };
          ctrl.isMiscTabOpen = function() {
            return AdminRouterService.isMiscTabOpen();
          };
          ctrl.setStatusMessage = function(statusMessage) {
            ctrl.statusMessage = statusMessage;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
            $rootScope.$applyAsync();
          };

          ctrl.isDummyFeatureEnabled = function() {
            return PlatformFeatureService.status.DummyFeature.isEnabled;
          };

          ctrl.$onInit = function() {
            $scope.$on('$locationChangeSuccess', function() {
              AdminRouterService.showTab($location.path().replace('/', '#'));
            });
            ctrl.inDevMode = DEV_MODE;
            ctrl.statusMessage = '';
            CsrfTokenService.initializeToken();
          };
        }
      ]
    };
  }
]);
