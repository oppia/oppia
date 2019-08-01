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
 * @fileoverview Directive for the ImageClickInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require(
  'interactions/ImageClickInput/directives/ImageClickInputRulesService.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/AssetsBackendApiService.ts');
require('services/ContextService.ts');
require('services/HtmlEscaperService.ts');

angular.module('oppia').directive('oppiaInteractiveImageClickInput', [
  'AssetsBackendApiService', 'ContextService',
  'HtmlEscaperService', 'ImageClickInputRulesService', 'ImagePreloaderService',
  'UrlInterpolationService', 'EVENT_NEW_CARD_AVAILABLE',
  'EXPLORATION_EDITOR_TAB_CONTEXT', 'LOADING_INDICATOR_URL',
  function(
      AssetsBackendApiService, ContextService,
      HtmlEscaperService, ImageClickInputRulesService, ImagePreloaderService,
      UrlInterpolationService, EVENT_NEW_CARD_AVAILABLE,
      EXPLORATION_EDITOR_TAB_CONTEXT, LOADING_INDICATOR_URL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getLastAnswer: '&lastAnswer'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/ImageClickInput/directives/' +
        'image_click_input_interaction_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$element', '$attrs', '$scope', 'CurrentInteractionService',
        function($element, $attrs, $scope, CurrentInteractionService) {
          var ctrl = this;
          var imageAndRegions = HtmlEscaperService.escapedJsonToObj(
            $attrs.imageAndRegionsWithValue);
          ctrl.highlightRegionsOnHover =
            ($attrs.highlightRegionsOnHoverWithValue === 'true');
          ctrl.filepath = imageAndRegions.imagePath;
          ctrl.imageUrl = '';
          ctrl.loadingIndicatorUrl = UrlInterpolationService
            .getStaticImageUrl(LOADING_INDICATOR_URL);
          ctrl.isLoadingIndicatorShown = false;
          ctrl.isTryAgainShown = false;

          if (ImagePreloaderService.inExplorationPlayer()) {
            ctrl.isLoadingIndicatorShown = true;
            ctrl.dimensions = (
              ImagePreloaderService.getDimensionsOfImage(ctrl.filepath));
            // For aligning the gif to the center of it's container
            var loadingIndicatorSize = (
              (ctrl.dimensions.height < 124) ? 24 : 120);
            ctrl.imageContainerStyle = {
              height: ctrl.dimensions.height + 'px'
            };
            ctrl.loadingIndicatorStyle = {
              height: loadingIndicatorSize + 'px',
              width: loadingIndicatorSize + 'px'
            };

            ctrl.loadImage = function() {
              ImagePreloaderService.getImageUrl(ctrl.filepath)
                .then(function(objectUrl) {
                  ctrl.isTryAgainShown = false;
                  ctrl.isLoadingIndicatorShown = false;
                  ctrl.imageUrl = objectUrl;
                }, function() {
                  ctrl.isTryAgainShown = true;
                  ctrl.isLoadingIndicatorShown = false;
                });
            };
            ctrl.loadImage();
          } else {
            // This is the case when user is in exploration editor or in
            // preview mode. We don't have loading indicator or try again for
            // showing images in the exploration editor or in preview mode. So
            // we directly assign the url to the imageUrl.
            AssetsBackendApiService.getImageUrlForPreviewAsync(
              ContextService.getExplorationId(), ctrl.filepath).then(
              function(url) {
                ctrl.imageUrl = url;
              }
            );
          }

          ctrl.mouseX = 0;
          ctrl.mouseY = 0;
          ctrl.interactionIsActive = (ctrl.getLastAnswer() === null);
          if (!ctrl.interactionIsActive) {
            ctrl.lastAnswer = ctrl.getLastAnswer();
          }

          ctrl.currentlyHoveredRegions = [];
          ctrl.allRegions = imageAndRegions.labeledRegions;
          ctrl.updateCurrentlyHoveredRegions = function() {
            for (var i = 0; i < imageAndRegions.labeledRegions.length; i++) {
              var labeledRegion = imageAndRegions.labeledRegions[i];
              var regionArea = labeledRegion.region.area;
              if (regionArea[0][0] <= ctrl.mouseX &&
                  ctrl.mouseX <= regionArea[1][0] &&
                  regionArea[0][1] <= ctrl.mouseY &&
                  ctrl.mouseY <= regionArea[1][1]) {
                ctrl.currentlyHoveredRegions.push(labeledRegion.label);
              }
            }
          };
          if (!ctrl.interactionIsActive) {
            /* The following lines highlight the learner's last answer for this
              card. This need only be done at the beginning as if he submits
              an answer, based on EVENT_NEW_CARD_AVAILABLE, the image is made
              inactive, so his last selection would be higlighted.*/
            ctrl.mouseX = ctrl.getLastAnswer().clickPosition[0];
            ctrl.mouseY = ctrl.getLastAnswer().clickPosition[1];
            ctrl.updateCurrentlyHoveredRegions();
          }
          ctrl.getRegionDimensions = function(index) {
            var image = $($element).find('.oppia-image-click-img');
            var labeledRegion = imageAndRegions.labeledRegions[index];
            var regionArea = labeledRegion.region.area;
            var leftDelta = image.offset().left - image.parent().offset().left;
            var topDelta = image.offset().top - image.parent().offset().top;
            return {
              left: regionArea[0][0] * image.width() + leftDelta,
              top: regionArea[0][1] * image.height() + topDelta,
              width: (regionArea[1][0] - regionArea[0][0]) * image.width(),
              height: (regionArea[1][1] - regionArea[0][1]) * image.height()
            };
          };
          ctrl.getRegionDisplay = function(label) {
            if (ctrl.currentlyHoveredRegions.indexOf(label) === -1) {
              return 'none';
            } else {
              return 'inline';
            }
          };
          ctrl.getDotDisplay = function() {
            if (ContextService.getEditorTabContext() ===
                EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR) {
              return 'none';
            }
            return 'inline';
          };
          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            ctrl.interactionIsActive = false;
            ctrl.lastAnswer = {
              clickPosition: [ctrl.mouseX, ctrl.mouseY]
            };
          });
          ctrl.getDotLocation = function() {
            var image = $($element).find('.oppia-image-click-img');
            var dotLocation = {
              left: null,
              top: null
            };
            if (ctrl.lastAnswer) {
              dotLocation.left =
                ctrl.lastAnswer.clickPosition[0] * image.width() +
                image.offset().left -
                image.parent().offset().left - 5;
              dotLocation.top =
                ctrl.lastAnswer.clickPosition[1] * image.height() +
                image.offset().top -
                image.parent().offset().top - 5;
            }
            return dotLocation;
          };
          ctrl.onMousemoveImage = function(event) {
            if (!ctrl.interactionIsActive) {
              return;
            }
            var image = $($element).find('.oppia-image-click-img');
            ctrl.mouseX =
              (event.pageX - image.offset().left) / image.width();
            ctrl.mouseY =
              (event.pageY - image.offset().top) / image.height();
            ctrl.currentlyHoveredRegions = [];
            ctrl.updateCurrentlyHoveredRegions();
          };
          ctrl.onClickImage = function() {
            var answer = {
              clickPosition: [ctrl.mouseX, ctrl.mouseY],
              clickedRegions: ctrl.currentlyHoveredRegions
            };
            CurrentInteractionService.onSubmit(
              answer, ImageClickInputRulesService);
          };

          CurrentInteractionService.registerCurrentInteraction(null, null);
        }
      ]
    };
  }
]);
