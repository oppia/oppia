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
 * @fileoverview Directive for the topic info tab.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('topicInfoTab', ['UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      link: function(scope, element, attrs, ctrl) {
        // This is needed in order for the $ctrl scope to be retrievable during
        // Karma unit testing. The usual function getControllerScope() couldn't
        // be used here as the functions local to the controller could only be
        // accessed as scope.$ctrl.<fn_name>, which is not a part of IScope and
        // hence threw typescript errors.
        element[0].getLocalControllerScope = function() {
          return ctrl;
        };
      },
      scope: {},
      bindToController: {
        getTopicName: '&topicName',
        getTopicDescription: '&topicDescription',
        getStoryCount: '&storyCount',
        getSubtopicCount: '&subtopicCount',
        getChapterCount: '&chapterCount'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-viewer-page/info-tab/topic-info-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', 'WindowDimensionsService',
        function(
            $rootScope, WindowDimensionsService) {
          var ctrl = this;

          ctrl.checkSmallScreenWidth = function() {
            if (WindowDimensionsService.getWidth() <= 1024) {
              return true;
            }
            return false;
          };

          ctrl.$onInit = function() {
            ctrl.screenHasSmallWidth = ctrl.checkSmallScreenWidth();
            ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
              subscribe(evt => {
                ctrl.screenHasSmallWidth = ctrl.checkSmallScreenWidth();

                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the directive is migrated to angular
                $rootScope.$apply();
              });
          };

          ctrl.$onDestroy = function() {
            if (ctrl.resizeSubscription) {
              ctrl.resizeSubscription.unsubscribe();
            }
          };
        }
      ]
    };
  }]);
