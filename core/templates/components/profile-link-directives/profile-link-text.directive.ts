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
 * @fileoverview Directives for creating text links to a user's profile page.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('profileLinkText', [
  'UrlInterpolationService', 'SYSTEM_USER_IDS',
  function(UrlInterpolationService, SYSTEM_USER_IDS) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        username: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/profile-link-directives/' +
        'profile-link-text.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.isUsernameLinkable = function(username) {
          return SYSTEM_USER_IDS.indexOf(username) === -1;
        };
      }]
    };
  }]);
