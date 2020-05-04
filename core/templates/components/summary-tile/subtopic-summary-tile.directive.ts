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

angular.module('oppia').directive('subtopicSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getSkillCount: '&skillCount',
        getSubtopicId: '&subtopicId',
        getSubtopicTitle: '&subtopicTitle',
        getTopicName: '&topicName'
      },
      template: require('./subtopic-summary-tile.directive.html'),
      controllerAs: '$ctrl',
      controller: ['SUBTOPIC_VIEWER_URL_TEMPLATE',
        function(SUBTOPIC_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.getSubtopicLink = function() {
            return UrlInterpolationService.interpolateUrl(
              SUBTOPIC_VIEWER_URL_TEMPLATE, {
                topic_name: ctrl.getTopicName(),
                subtopic_id: ctrl.getSubtopicId().toString()
              });
          };

          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
        }
      ]
    };
  }]);
import { Directive, ElementRef, Injector } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

@Directive({
  selector: 'subtopic-summary-tile'
})
export class SubtopicSummaryTileDirective extends UpgradeComponent {
  constructor(elementRef: ElementRef, injector: Injector) {
    super('subtopicSummaryTile', elementRef, injector);
  }
}
