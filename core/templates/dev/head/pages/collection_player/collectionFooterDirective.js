// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for showing author/share footer
 * in exploration player.
 */

oppia.directive('collectionFooter', [function() {
  return {
    restrict: 'E',
    scope: {
      twitterText: '@'
    },
    templateUrl: 'components/collectionFooter',
    controller: [
      '$scope', '$http', '$log', 'CollectionObjectFactory',
      'UrlInterpolationService', 'ReadOnlyCollectionBackendApiService',
      'CollectionPlaythroughObjectFactory',
      function(
          $scope, $http, $log, CollectionObjectFactory,
          UrlInterpolationService, ReadOnlyCollectionBackendApiService,
          CollectionPlaythroughObjectFactory) {
        $scope.collectionId = GLOBALS.collectionId;

        $scope.collection = null;

        $scope.collectionPlaythrough = null;

        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

        $scope.contributorNames = ['hello_sample'];

        $scope.getTwitterText = function() {
          return $scope.twitterText;
        };

        $http.get('/collectionsummarieshandler/data', {
          params: {
            stringified_collection_ids: JSON.stringify([$scope.collectionId])
          }
        }).then(
          function(response) {
            console.log(response);
            $scope.collectionAuthor = response.data.username;
            console.log($scope.collectionAuthor);
          },
          function() {
            allertsService.addWarning(
              'There was an error while fetching the collection summary.');
          });

        
        // ReadOnlyCollectionBackendApiService
        //   .loadCollection($scope.collectionId).then(
        //     function(collectionBackendObject) {
        //       $scope.collection = CollectionObjectFactory.create(
        //       collectionBackendObject);
        //       $scope.collectionPlaythrough = (
        //         CollectionPlaythroughObjectFactory.create(
        //           collectionBackendObject.playthrough_dict));

        //       $scope.collectionNodes = $scope.collection.getCollectionNodes();

        //       for(var i = 0; i < $scope.collectionNodes.length; i++) {
        //         console.log($scope.collectionNodes[i].getExplorationSummaryObject());
        //         console.log('hello');
        //       }

        //      // console.log('hello world');
        //      // console.log($scope.collection);

        //      // for(var i in $scope.collection) {
        //      //  console.log(i);
        //      //  console.log('hello');
        //      //}
        //      // var summaryBackendObject = null;
        //      // if (summaries.length > 0) {
        //         // var contributorSummary = (
        //         //   summaries[0].human_readable_contributors_summary);
        //         // $scope.contributorNames = (
        //         //   Object.keys(contributorSummary).sort(
        //         //       function(contributorUsername1, contributorUsername2) {
        //         //         var commitsOfContributor1 = contributorSummary[
        //         //           contributorUsername1].num_commits;
        //         //         var commitsOfContributor2 = contributorSummary[
        //         //           contributorUsername2].num_commits;
        //         //         return commitsOfContributor2 - commitsOfContributor1;
        //         //       }));
        //       });
        }
    ]
  };
}]);
