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
 * @fileoverview Controller for the learner's view of a story.
 */

oppia.animation('.oppia-story-animate-slide', function() {
  return {
    enter: function(element) {
      element.hide().slideDown();
    },
    leave: function(element) {
      element.slideUp();
    }
  };
});
oppia.constant('NODE_ID_PREFIX', 'node_');

oppia.controller('StoryViewer', [
  '$scope', '$anchorScroll', '$location', '$http', 'UrlService',
  'StoryViewerBackendApiService', 'StoryObjectFactory',
  'StoryPlaythroughObjectFactory', 'AlertsService',
  'UrlInterpolationService',
  function(
      $scope, $anchorScroll, $location, $http, UrlService,
      StoryViewerBackendApiService, StoryObjectFactory,
      StoryPlaythroughObjectFactory, AlertsService,
      UrlInterpolationService) {
    $scope.story = null;
    $scope.storyPlaythrough = null;
    $scope.storyId = UrlService.getStoryIdFromLearnerUrl();
    $scope.topicName = UrlService.getTopicNameFromLearnerUrl();
    $scope.pathIconParameters = [];
    $scope.explorationCardIsShown = false;
    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
    // The pathIconParameters is an array containing the co-ordinates,
    // background color and icon url for the icons generated on the path.
    $scope.pathIconParameters = [];
    $scope.activeHighlightedIconIndex = -1;
    $scope.MIN_HEIGHT_FOR_PATH_SVG_PX = 220;
    $scope.ODD_SVG_HEIGHT_OFFSET_PX = 150;
    $scope.EVEN_SVG_HEIGHT_OFFSET_PX = 280;
    $scope.ICON_Y_INITIAL_PX = 35;
    $scope.ICON_Y_INCREMENT_PX = 110;
    $scope.ICON_X_MIDDLE_PX = 225;
    $scope.ICON_X_LEFT_PX = 55;
    $scope.ICON_X_RIGHT_PX = 395;
    $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
    $scope.nextExplorationId = null;

    $scope.setIconHighlight = function(index) {
      $scope.activeHighlightedIconIndex = index;
    };

    $scope.unsetIconHighlight = function() {
      $scope.activeHighlightedIconIndex = -1;
    };

    $scope.togglePreviewCard = function() {
      $scope.explorationCardIsShown = !$scope.explorationCardIsShown;
    };

    $scope.getNodeForNodeId = function(nodeId) {
      var storyNode = $scope.story._storyContents.getNodeById(nodeId);
      if (!storyNode) {
        AlertsService.addWarning('There was an error loading the story.');
      }
      return storyNode;
    };

    $scope.updateExplorationPreview = function(nodeId) {
      $scope.explorationCardIsShown = true;
      $scope.currentNodeId = nodeId;
      $scope.summaryToPreview = $scope.getNodeForNodeId(
        nodeId).getExplorationSummaryObject();
    };

    // Calculates the SVG parameters required to draw the curved path.
    $scope.generatePathParameters = function() {
      // The pathSvgParameters represents the final string of SVG parameters
      // for the bezier curve to be generated. The default parameters represent
      // the first curve ie. lesson 1 to lesson 3.
      $scope.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
      var storyNodeCount = $scope.story._storyContents.getNodeCount();
      // The sParameterExtension represents the co-ordinates following the 'S'
      // (smooth curve to) command in SVG.
      var sParameterExtension = '';
      $scope.pathIconParameters = $scope.generatePathIconParameters();
      if (storyNodeCount === 1) {
        $scope.pathSvgParameters = '';
      } else if (storyNodeCount === 2) {
        $scope.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
      } else {
        // The x and y here represent the co-ordinates of the control points
        // for the bezier curve (path).
        var y = 500;
        for (var i = 1; i < Math.floor(storyNodeCount / 2); i++) {
          var x = (i % 2) ? 30 : 470;
          sParameterExtension += x + ' ' + y + ', ';
          y += 20;
          sParameterExtension += 250 + ' ' + y + ', ';
          y += 200;
        }
        if (sParameterExtension !== '') {
          $scope.pathSvgParameters += ' S ' + sParameterExtension;
        }
      }
      if (storyNodeCount % 2 === 0) {
        if (storyNodeCount === 2) {
          $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
        } else {
          $scope.svgHeight = y - $scope.EVEN_SVG_HEIGHT_OFFSET_PX;
        }
      } else {
        if (storyNodeCount === 1) {
          $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
        } else {
          $scope.svgHeight = y - $scope.ODD_SVG_HEIGHT_OFFSET_PX;
        }
      }
    };

    $scope.generatePathIconParameters = function() {
      var storyNodes = $scope.story._storyContents.getNodes();
      var iconParametersArray = [];
      iconParametersArray.push({
        thumbnailIconUrl:
          storyNodes[0].getExplorationSummaryObject(
          ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
        left: '225px',
        top: '35px',
        thumbnailBgColor:
          storyNodes[0].getExplorationSummaryObject().thumbnail_bg_color
      });

      // Here x and y represent the co-ordinates for the icons in the path.
      var x = $scope.ICON_X_MIDDLE_PX;
      var y = $scope.ICON_Y_INITIAL_PX;
      var countMiddleIcon = 1;

      for (var i = 1; i < $scope.story._storyContents.getNodeCount(); i++) {
        if (countMiddleIcon === 0 && x === $scope.ICON_X_MIDDLE_PX) {
          x = $scope.ICON_X_LEFT_PX;
          y += $scope.ICON_Y_INCREMENT_PX;
          countMiddleIcon = 1;
        } else if (countMiddleIcon === 1 && x === $scope.ICON_X_MIDDLE_PX) {
          x = $scope.ICON_X_RIGHT_PX;
          y += $scope.ICON_Y_INCREMENT_PX;
          countMiddleIcon = 0;
        } else {
          x = $scope.ICON_X_MIDDLE_PX;
          y += $scope.ICON_Y_INCREMENT_PX;
        }
        iconParametersArray.push({
          thumbnailIconUrl:
            storyNodes[i].getExplorationSummaryObject(
            ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
          left: x + 'px',
          top: y + 'px',
          thumbnailBgColor:
            storyNodes[i].getExplorationSummaryObject().thumbnail_bg_color
        });
      }
      return iconParametersArray;
    };

    $scope.getExplorationUrl = function(explorationId) {
      return ('/explore/' + explorationId);
    };

    // Load the story the learner wants to view.
    StoryViewerBackendApiService.fetchStoryData(
      $scope.storyId, $scope.topicName).then(
      function(storyBackendObject) {
        $scope.story = StoryObjectFactory.createFromBackendDict(
          storyBackendObject);

        $scope.storyPlaythrough = (
          StoryPlaythroughObjectFactory.createFromBackendObject(
            storyBackendObject.playthrough_dict));

        $scope.nextExplorationId =
          $scope.storyPlaythrough.getNextExplorationId();
      },
      function() {
        AlertsService.addWarning(
          'There was an error loading the story.');
      }
    );

    $scope.closeOnClickingOutside = function() {
      $scope.explorationCardIsShown = false;
    };

    $scope.onClickStopPropagation = function($evt) {
      $evt.stopPropagation();
    };

    $scope.$watch('story', function(newValue) {
      if (newValue !== null) {
        $scope.generatePathParameters();
      }
    }, true);

    // Touching anywhere outside the mobile preview should hide it.
    document.addEventListener('touchstart', function() {
      if ($scope.explorationCardIsShown === true) {
        $scope.explorationCardIsShown = false;
      }
    });
  }
]);
