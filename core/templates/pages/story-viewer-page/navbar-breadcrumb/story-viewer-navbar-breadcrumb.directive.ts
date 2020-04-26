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
 * @fileoverview Directive for the navbar breadcrumb of the story viewer.
 */

require('domain/story_viewer/story-viewer-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').directive('storyViewerNavbarBreadcrumb', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-viewer-page/navbar-breadcrumb/' +
        'story-viewer-navbar-breadcrumb.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$rootScope', 'StoryViewerBackendApiService', 'UrlService',
        function($rootScope, StoryViewerBackendApiService, UrlService) {
          var ctrl = this;
          ctrl.$onInit = function() {
            StoryViewerBackendApiService.fetchStoryData(
              UrlService.getStoryIdFromViewerUrl()).then(
              function(storyDataDict) {
                ctrl.storyTitle = storyDataDict.story_title;
                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the directive is migrated to angular
                $rootScope.$apply();
              });
          };
        }
      ]
    };
  }]);
