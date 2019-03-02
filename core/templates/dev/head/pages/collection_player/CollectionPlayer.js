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
 * @fileoverview Controller for the learner's view of a collection.
 */

oppia.constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');

oppia.animation('.oppia-collection-animate-slide', function() {
  return {
    enter: function(element) {
      element.hide().slideDown();
    },
    leave: function(element) {
      element.slideUp();
    }
  };
});

oppia.controller('CollectionPlayer', [
  '$anchorScroll', '$http', '$location', '$scope',
  'AlertsService', 'CollectionObjectFactory',
  'CollectionPlaythroughObjectFactory', 'GuestCollectionProgressService',
  'ReadOnlyCollectionBackendApiService', 'UrlInterpolationService',
  'WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS',
  function(
      $anchorScroll, $http, $location, $scope,
      AlertsService, CollectionObjectFactory,
      CollectionPlaythroughObjectFactory, GuestCollectionProgressService,
      ReadOnlyCollectionBackendApiService, UrlInterpolationService,
      WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS) {
    $scope.collection = null;
    $scope.collectionPlaythrough = null;
    $scope.collectionId = GLOBALS.collectionId;
    $scope.isLoggedIn = GLOBALS.isLoggedIn;
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
    $scope.whitelistedCollectionIdsForGuestProgress = (
      WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS);
    $anchorScroll.yOffset = -80;

    $scope.setIconHighlight = function(index) {
      $scope.activeHighlightedIconIndex = index;
    };

    $scope.unsetIconHighlight = function() {
      $scope.activeHighlightedIconIndex = -1;
    };

    $scope.togglePreviewCard = function() {
      $scope.explorationCardIsShown = !$scope.explorationCardIsShown;
    };

    $scope.getCollectionNodeForExplorationId = function(explorationId) {
      var collectionNode = (
        $scope.collection.getCollectionNodeByExplorationId(explorationId));
      if (!collectionNode) {
        AlertsService.addWarning('There was an error loading the collection.');
      }
      return collectionNode;
    };

    $scope.getNextRecommendedCollectionNodes = function() {
      return $scope.getCollectionNodeForExplorationId(
        $scope.collectionPlaythrough.getNextExplorationId());
    };

    $scope.getCompletedExplorationNodes = function() {
      return $scope.getCollectionNodeForExplorationId(
        $scope.collectionPlaythrough.getCompletedExplorationIds());
    };

    $scope.getNonRecommendedCollectionNodeCount = function() {
      return $scope.collection.getCollectionNodeCount() - (
        $scope.collectionPlaythrough.getNextRecommendedCollectionNodeCount() +
        $scope.collectionPlaythrough.getCompletedExplorationNodeCount());
    };

    $scope.updateExplorationPreview = function(explorationId) {
      $scope.explorationCardIsShown = true;
      $scope.currentExplorationId = explorationId;
      $scope.summaryToPreview = $scope.getCollectionNodeForExplorationId(
        explorationId).getExplorationSummaryObject();
    };

    // Calculates the SVG parameters required to draw the curved path.
    $scope.generatePathParameters = function() {
      // The pathSvgParameters represents the final string of SVG parameters
      // for the bezier curve to be generated. The default parameters represent
      // the first curve ie. lesson 1 to lesson 3.
      $scope.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
      var collectionNodeCount = $scope.collection.getCollectionNodeCount();
      // The sParameterExtension represents the co-ordinates following the 'S'
      // (smooth curve to) command in SVG.
      var sParameterExtension = '';
      $scope.pathIconParameters = $scope.generatePathIconParameters();
      if (collectionNodeCount === 1) {
        $scope.pathSvgParameters = '';
      } else if (collectionNodeCount === 2) {
        $scope.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
      } else {
        // The x and y here represent the co-ordinates of the control points
        // for the bezier curve (path).
        var y = 500;
        for (var i = 1; i < Math.floor(collectionNodeCount / 2); i++) {
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
      if (collectionNodeCount % 2 === 0) {
        if (collectionNodeCount === 2) {
          $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
        } else {
          $scope.svgHeight = y - $scope.EVEN_SVG_HEIGHT_OFFSET_PX;
        }
      } else {
        if (collectionNodeCount === 1) {
          $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
        } else {
          $scope.svgHeight = y - $scope.ODD_SVG_HEIGHT_OFFSET_PX;
        }
      }
    };

    $scope.generatePathIconParameters = function() {
      var collectionNodes = $scope.collection.getCollectionNodes();
      var iconParametersArray = [];
      iconParametersArray.push({
        thumbnailIconUrl:
          collectionNodes[0].getExplorationSummaryObject(
          ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
        left: '225px',
        top: '35px',
        thumbnailBgColor:
          collectionNodes[0].getExplorationSummaryObject().thumbnail_bg_color
      });

      // Here x and y represent the co-ordinates for the icons in the path.
      var x = $scope.ICON_X_MIDDLE_PX;
      var y = $scope.ICON_Y_INITIAL_PX;
      var countMiddleIcon = 1;

      for (var i = 1; i < $scope.collection.getCollectionNodeCount(); i++) {
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
            collectionNodes[i].getExplorationSummaryObject(
            ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
          left: x + 'px',
          top: y + 'px',
          thumbnailBgColor:
            collectionNodes[i].getExplorationSummaryObject().thumbnail_bg_color
        });
      }
      return iconParametersArray;
    };

    $scope.isCompletedExploration = function(explorationId) {
      var completedExplorationIds = (
        $scope.collectionPlaythrough.getCompletedExplorationIds());
      return completedExplorationIds.indexOf(explorationId) > -1;
    };

    $scope.getExplorationUrl = function(explorationId) {
      return (
        '/explore/' + explorationId + '?collection_id=' + $scope.collectionId);
    };

    $http.get('/collectionsummarieshandler/data', {
      params: {
        stringified_collection_ids: JSON.stringify([$scope.collectionId])
      }
    }).then(
      function(response) {
        $scope.collectionSummary = response.data.summaries[0];
      },
      function() {
        AlertsService.addWarning(
          'There was an error while fetching the collection summary.');
      }
    );

    // Load the collection the learner wants to view.
    ReadOnlyCollectionBackendApiService.loadCollection(
      $scope.collectionId).then(
      function(collectionBackendObject) {
        $scope.collection = CollectionObjectFactory.create(
          collectionBackendObject);

        // Load the user's current progress in the collection. If the user is a
        // guest, then either the defaults from the server will be used or the
        // user's local progress, if any has been made and the collection is
        // whitelisted.
        var collectionAllowsGuestProgress = (
          $scope.whitelistedCollectionIdsForGuestProgress.indexOf(
            $scope.collectionId) !== -1);
        if (!$scope.isLoggedIn && collectionAllowsGuestProgress &&
            GuestCollectionProgressService.hasCompletedSomeExploration(
              $scope.collectionId)) {
          var completedExplorationIds = (
            GuestCollectionProgressService.getCompletedExplorationIds(
              $scope.collection));
          var nextExplorationId = (
            GuestCollectionProgressService.getNextExplorationId(
              $scope.collection, completedExplorationIds));
          $scope.collectionPlaythrough = (
            CollectionPlaythroughObjectFactory.create(
              nextExplorationId, completedExplorationIds));
        } else {
          $scope.collectionPlaythrough = (
            CollectionPlaythroughObjectFactory.createFromBackendObject(
              collectionBackendObject.playthrough_dict));
        }

        $scope.nextExplorationId =
          $scope.collectionPlaythrough.getNextExplorationId();
      },
      function() {
        // TODO(bhenning): Handle not being able to load the collection.
        // NOTE TO DEVELOPERS: Check the backend console for an indication as to
        // why this error occurred; sometimes the errors are noisy, so they are
        // not shown to the user.
        AlertsService.addWarning(
          'There was an error loading the collection.');
      }
    );

    $scope.$watch('collection', function(newValue) {
      if (newValue !== null) {
        $scope.generatePathParameters();
      }
    }, true);

    $scope.scrollToLocation = function(id) {
      $location.hash(id);
      $anchorScroll();
    };

    $scope.closeOnClickingOutside = function() {
      $scope.explorationCardIsShown = false;
    };

    $scope.onClickStopPropagation = function($evt) {
      $evt.stopPropagation();
    };

    // Touching anywhere outside the mobile preview should hide it.
    document.addEventListener('touchstart', function() {
      if ($scope.explorationCardIsShown === true) {
        $scope.explorationCardIsShown = false;
      }
    });
  }
]);
