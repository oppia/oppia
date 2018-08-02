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
 * @fileoverview Controllers for the subtopic viewer page.
 */

oppia.controller('SubtopicViewer', [
  '$scope', '$http', 'SubtopicViewerBackendApiService',
  'UrlInterpolationService', 'UrlService', 'SubtopicPageObjectFactory',
  function(
      $scope, $http, SubtopicViewerBackendApiService,
      UrlInterpolationService, UrlService, SubtopicPageObjectFactory) {
    var _initSubtopicPage = function() {
      var topicIdAndSubtopicId = UrlService.getTopicIdAndSubtopicIdFromUrl();
      topicId = topicIdAndSubtopicId.topicId;
      subtopicId = topicIdAndSubtopicId.subtopicId;
      SubtopicViewerBackendApiService.fetchSubtopicData(topicId, subtopicId).then(
        function(response) {
          $scope.subtopicPage = SubtopicPageObjectFactory.createFromBackendDict({
            id: subtopicId,
            topic_id: topicId,
            html_data: response.subtopic_html_data,
            language_code: response.language_code
          });
        }
      );
    };

    _initSubtopicPage();
  }
]);
