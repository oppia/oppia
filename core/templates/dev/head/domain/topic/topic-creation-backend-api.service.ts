// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to notify about creation of topic and obtain
 * topic_id.
 */

angular.module('oppia').factory('TopicCreationBackendApiService', [
  '$http', '$q',
  function(
      $http, $q) {
    var _createTopic = function(
        successCallback, errorCallback, abbreviatedTopicName, topicName) {
      var postData = {
        name: topicName,
        abbreviated_name: abbreviatedTopicName
      };
      $http.post('/topic_editor_handler/create_new', postData)
        .then(function(response) {
          if (successCallback) {
            successCallback(response.data);
          }
        }, function(response) {
          if (errorCallback) {
            errorCallback(response.data);
          }
        });
    };

    return {
      createTopic: function(topicName, abbreviatedTopicName) {
        return $q(function(resolve, reject) {
          _createTopic(resolve, reject, abbreviatedTopicName, topicName);
        });
      }
    };
  }
]);
