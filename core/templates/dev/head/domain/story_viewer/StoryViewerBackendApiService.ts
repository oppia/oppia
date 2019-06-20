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
 * @fileoverview Service to get story data.
 */

require('domain/utilities/UrlInterpolationService.ts');

oppia.constant(
  'STORY_DATA_URL_TEMPLATE', '/story_data_handler/<story_id>');

oppia.factory('StoryViewerBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'STORY_DATA_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService, STORY_DATA_URL_TEMPLATE) {
    var storyDataDict = null;
    var _fetchStoryData = function(storyId, successCallback, errorCallback) {
      var storyDataUrl = UrlInterpolationService.interpolateUrl(
        STORY_DATA_URL_TEMPLATE, {
          story_id: storyId
        });

      $http.get(storyDataUrl).then(function(response) {
        storyDataDict = angular.copy(response.data);
        if (successCallback) {
          successCallback(storyDataDict);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchStoryData: function(storyId) {
        return $q(function(resolve, reject) {
          _fetchStoryData(storyId, resolve, reject);
        });
      }
    };
  }
]);
