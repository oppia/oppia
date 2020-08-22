// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a subtopic tile.
 */

require('domain/topic_viewer/topic-viewer-domain.constants.ajs.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/assets-backend-api.service.ts');

angular.module('oppia').directive('subtopicSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        classroomUrlFragment: '<',
        subtopic: '<',
        topicId: '<',
        topicUrlFragment: '<'
      },
      template: require('./subtopic-summary-tile.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$window', 'AssetsBackendApiService', 'ENTITY_TYPE',
        'SUBTOPIC_VIEWER_URL_TEMPLATE',
        function(
            $window, AssetsBackendApiService, ENTITY_TYPE,
            SUBTOPIC_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.openSubtopicPage = function() {
            // This component is being used in the topic editor as well and
            // we want to disable the linking in this case.
            if (!ctrl.classroomUrlFragment || !ctrl.topicUrlFragment) {
              return;
            }
            $window.open(
              UrlInterpolationService.interpolateUrl(
                SUBTOPIC_VIEWER_URL_TEMPLATE, {
                  classroom_url_fragment: ctrl.classroomUrlFragment,
                  topic_url_fragment: ctrl.topicUrlFragment,
                  subtopic_url_fragment: ctrl.subtopic.getUrlFragment()
                }
              ), '_self'
            );
          };

          ctrl.$onInit = function() {
            if (ctrl.subtopic.getThumbnailFilename()) {
              ctrl.thumbnailUrl = (
                AssetsBackendApiService.getThumbnailUrlForPreview(
                  ENTITY_TYPE.TOPIC, ctrl.topicId,
                  ctrl.subtopic.getThumbnailFilename()));
            } else {
              ctrl.thumbnailUrl = null;
            }
          };
        }
      ]
    };
  }]);

import { Directive, ElementRef, Injector, Input } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

@Directive({
  selector: 'subtopic-summary-tile'
})
export class SubtopicSummaryTileDirective extends UpgradeComponent {
  @Input() classroomUrlFragment;
  @Input() subtopic;
  @Input() topicId;
  @Input() topicUrlFragment;
  constructor(elementRef: ElementRef, injector: Injector) {
    super('subtopicSummaryTile', elementRef, injector);
  }
}
