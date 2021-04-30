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
 * @fileoverview Directive for displaying roles and actions.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('rolesAndActionsVisualizer', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        roleToActions: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/roles-tab/' +
        'roles-and-actions-visualizer.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$filter', function() {
          var ctrl = this;
          ctrl.avatarPictureUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/user_blue_72px.png');

          var getSortedReadableTexts = function(texts) {
            var readableTexts = [];
            texts.forEach(text => {
              readableTexts.push(
                text.toLowerCase()
                  .replaceAll('_', ' ')
                  .replace(/^\w/, (c) => c.toUpperCase()));
            });

            return readableTexts.sort();
          };

          ctrl.$onInit = function() {
            for (var role in ctrl.roleToActions) {
              var readableRole = getSortedReadableTexts([role])[0];
              ctrl.roleToActions[readableRole] = getSortedReadableTexts(
                ctrl.roleToActions[role]);
              delete ctrl.roleToActions[role];
            }

            ctrl.roles = Object.keys(ctrl.roleToActions).sort();
            ctrl.activeRole = ctrl.roles[0];

            ctrl.setActiveRole = function(role) {
              ctrl.activeRole = role;
            };
          };
        }
      ]
    };
  }]);
