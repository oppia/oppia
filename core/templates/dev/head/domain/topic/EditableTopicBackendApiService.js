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
 * @fileoverview Service to send changes to a topic to the backend.
 */
oppia.constant(
  'TOPIC_EDITOR_STORY_URL_TEMPLATE', '/topic_editor_story_handler/<topic_id>');

oppia.factory('EditableTopicBackendApiService', [
  '$http', '$q', 'EDITABLE_TOPIC_DATA_URL_TEMPLATE',
  'UrlInterpolationService', 'TOPIC_EDITOR_STORY_URL_TEMPLATE',
  function($http, $q, EDITABLE_TOPIC_DATA_URL_TEMPLATE,
      UrlInterpolationService, TOPIC_EDITOR_STORY_URL_TEMPLATE) {
    var _fetchTopic = function(
        topicId, successCallback, errorCallback) {
      var topicDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
          topic_id: topicId
        });

      $http.get(topicDataUrl).then(function(response) {
        var topic = angular.copy(response.data.topic);
        if (successCallback) {
          successCallback(topic);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _fetchStories = function(
        topicId, successCallback, errorCallback) {
      var storiesDataUrl = UrlInterpolationService.interpolateUrl(
        TOPIC_EDITOR_STORY_URL_TEMPLATE, {
          topic_id: topicId
        });

      $http.get(storiesDataUrl).then(function(response) {
        var canonicalStorySummaries = angular.copy(
          response.data.canonical_story_summary_dicts);
        if (successCallback) {
          successCallback(canonicalStorySummaries);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _deleteTopic = function(
        topicId, successCallback, errorCallback) {
      var topicDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
          topic_id: topicId
        });
      $http['delete'](topicDataUrl).then(function(response) {
        if (successCallback) {
          successCallback(response.status);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _updateTopic = function(
        topicId, topicVersion, commitMessage, changeList,
        successCallback, errorCallback) {
      var editableTopicDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
          topic_id: topicId
        });

      var putData = {
        version: topicVersion,
        commit_message: commitMessage,
        topic_and_subtopic_page_change_dicts: changeList
      };
      $http.put(editableTopicDataUrl, putData).then(function(response) {
        // The returned data is an updated topic dict.
        var topic = angular.copy(response.data.topic);

        if (successCallback) {
          successCallback(topic);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchTopic: function(topicId) {
        return $q(function(resolve, reject) {
          _fetchTopic(topicId, resolve, reject);
        });
      },

      fetchStories: function(topicId) {
        return $q(function(resolve, reject) {
          _fetchStories(topicId, resolve, reject);
        });
      },

      /**
       * Updates a topic in the backend with the provided topic ID.
       * The changes only apply to the topic of the given version and the
       * request to update the topic will fail if the provided topic
       * version is older than the current version stored in the backend. Both
       * the changes and the message to associate with those changes are used
       * to commit a change to the topic. The new topic is passed to
       * the success callback, if one is provided to the returned promise
       * object. Errors are passed to the error callback, if one is provided.
       */
      updateTopic: function(
          topicId, topicVersion, commitMessage, changeList) {
        return $q(function(resolve, reject) {
          _updateTopic(
            topicId, topicVersion, commitMessage, changeList,
            resolve, reject);
        });
      },

      deleteTopic: function(topicId) {
        return $q(function(resolve, reject) {
          _deleteTopic(topicId, resolve, reject);
        });
      }
    };
  }
]);
