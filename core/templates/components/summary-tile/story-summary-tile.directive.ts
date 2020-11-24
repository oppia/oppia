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
 * @fileoverview Component for a canonical story tile.
 */

require('domain/utilities/url-interpolation.service.ts');
require('domain/topic_viewer/topic-viewer-domain.constants.ajs.ts');
require('services/assets-backend-api.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('storySummaryTile', [
  'UrlInterpolationService', 'UrlService',
  function(UrlInterpolationService, UrlService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        classroomUrlFragment: '<',
        storySummary: '<',
        topicUrlFragment: '<'
      },
      template: require('./story-summary-tile.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'AssetsBackendApiService', 'WindowDimensionsService',
        'ENTITY_TYPE', 'STORY_VIEWER_URL_TEMPLATE',
        function(
            AssetsBackendApiService, WindowDimensionsService,
            ENTITY_TYPE, STORY_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          var circumference = (20 * 2 * Math.PI);
          var gapLength = 5;
          var EXPLORE_PAGE_PREFIX = '/explore/';

          ctrl.getStoryLink = function() {
            // This component is being used in the topic editor as well and
            // we want to disable the linking in this case.
            if (!ctrl.classroomUrlFragment || !ctrl.topicUrlFragment) {
              return '#';
            }
            return UrlInterpolationService.interpolateUrl(
              STORY_VIEWER_URL_TEMPLATE, {
                classroom_url_fragment: ctrl.classroomUrlFragment,
                story_url_fragment: ctrl.storySummary.getUrlFragment(),
                topic_url_fragment: ctrl.topicUrlFragment
              });
          };

          ctrl.isChapterCompleted = function(title) {
            return ctrl.storySummary.isNodeCompleted(title);
          };

          ctrl.isPreviousChapterCompleted = function(index) {
            if (index === 0) {
              return true;
            }
            var previousNodeTitle = (
              ctrl.storySummary.getNodeTitles()[index - 1]);
            return ctrl.storySummary.isNodeCompleted(previousNodeTitle);
          };

          ctrl.showAllChapters = function() {
            ctrl.initialCount = ctrl.chaptersDisplayed;
            ctrl.chaptersDisplayed = ctrl.nodeCount;
          };

          ctrl.hideExtraChapters = function() {
            ctrl.chaptersDisplayed = ctrl.initialCount;
          };

          ctrl.getStrokeDashArrayValues = function() {
            if (ctrl.nodeCount === 1) {
              return '';
            }
            var segmentLength = (
              (circumference - (ctrl.nodeCount * gapLength)) / ctrl.nodeCount);
            return segmentLength.toString() + ' ' + gapLength.toString();
          };

          // Returns the exploration page URL for the provided chapter title.
          ctrl.getChapterUrl = function(nodeTitle) {
            let node = this.storySummary.getPendingNodes().find(node => {
              return node.getTitle() === nodeTitle;
            });
            if (!node) {
              return '';
            }
            let urlParams = UrlService.addField(
              '', 'story_url_fragment', this.storySummary.getUrlFragment());
            urlParams = UrlService.addField(
              urlParams, 'topic_url_fragment', ctrl.topicUrlFragment);
            urlParams = UrlService.addField(
              urlParams, 'classroom_url_fragment', ctrl.classroomUrlFragment);
            urlParams = UrlService.addField(
              urlParams, 'node_id', node.getId());
            return (
              `${EXPLORE_PAGE_PREFIX}${node.getExplorationId()}${urlParams}`);
          };

          ctrl.getCompletedStrokeDashArrayValues = function() {
            var completedStrokeValues = '';
            var remainingCircumference = circumference;
            if (ctrl.completedStoriesCount === 0) {
              return '0 ' + circumference.toString();
            }
            if (ctrl.completedStoriesCount === 1 && ctrl.nodeCount === 1) {
              return '';
            }
            var segmentLength = (
              (circumference - (ctrl.nodeCount * gapLength)) / ctrl.nodeCount);
            for (var i = 1; i <= ctrl.completedStoriesCount - 1; i++) {
              completedStrokeValues += (
                segmentLength.toString() + ' ' + gapLength.toString() + ' ');
              remainingCircumference -= (segmentLength + gapLength);
            }
            completedStrokeValues += (
              segmentLength.toString() + ' ' +
              (remainingCircumference - segmentLength).toString());
            return completedStrokeValues;
          };

          ctrl.$onInit = function() {
            ctrl.nodeCount = ctrl.storySummary.getNodeTitles().length;
            ctrl.completedStoriesCount = 0;
            for (var idx in ctrl.storySummary.getNodeTitles()) {
              if (
                ctrl.storySummary.isNodeCompleted(
                  ctrl.storySummary.getNodeTitles()[idx])) {
                ctrl.completedStoriesCount++;
              }
            }
            ctrl.storyProgress = Math.floor(
              (ctrl.completedStoriesCount / ctrl.nodeCount) * 100);

            ctrl.chaptersDisplayed = 3;
            if (WindowDimensionsService.getWidth() <= 800) {
              ctrl.chaptersDisplayed = 2;
            }
            ctrl.showButton = false;
            if (ctrl.chaptersDisplayed !== ctrl.nodeCount) {
              ctrl.showButton = true;
            }

            if (ctrl.storySummary.getThumbnailFilename()) {
              ctrl.thumbnailUrl = (
                AssetsBackendApiService.getThumbnailUrlForPreview(
                  ENTITY_TYPE.STORY, ctrl.storySummary.getId(),
                  ctrl.storySummary.getThumbnailFilename()));
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
  selector: 'story-summary-tile'
})
export class StorySummaryTileDirective extends UpgradeComponent {
  @Input() classroomUrlFragment;
  @Input() storySummary;
  @Input() topicUrlFragment;
  constructor(elementRef: ElementRef, injector: Injector) {
    super('storySummaryTile', elementRef, injector);
  }
}
