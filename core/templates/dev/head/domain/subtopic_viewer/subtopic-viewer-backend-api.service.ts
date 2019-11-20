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
 * @fileoverview Service to get subtopic data.
 */

require('domain/utilities/url-interpolation.service.ts');
require('domain/subtopic_viewer/subtopic-viewer-domain.constants.ajs.ts');

angular.module('oppia').factory('SubtopicViewerBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'SUBTOPIC_DATA_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService, SUBTOPIC_DATA_URL_TEMPLATE) {
    var subtopicDataDict = null;
    var _fetchSubtopicData = function(
        topicName, subtopicId, successCallback, errorCallback) {
      var subtopicDataUrl = UrlInterpolationService.interpolateUrl(
        SUBTOPIC_DATA_URL_TEMPLATE, {
          topic_name: topicName,
          subtopic_id: subtopicId
        });

      $http.get(subtopicDataUrl).then(function(response) {
        subtopicDataDict = angular.copy(response.data);
        if (successCallback) {
          successCallback(subtopicDataDict);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchSubtopicData: function(topicName, subtopicId) {
        return $q(function(resolve, reject) {
          _fetchSubtopicData(topicName, subtopicId, resolve, reject);
        });
      }
    };
  }
]);
