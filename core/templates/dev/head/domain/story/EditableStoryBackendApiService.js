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
 * @fileoverview Service to send changes to a story to the backend.
 */
oppia.constant(
  'EDITABLE_STORY_DATA_URL_TEMPLATE',
  '/story_editor_handler/data/<topic_id>/<story_id>');

oppia.factory('EditableStoryBackendApiService', [
  '$http', '$q', 'UrlInterpolationService',
  'EDITABLE_STORY_DATA_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService,
      EDITABLE_STORY_DATA_URL_TEMPLATE) {
    var _fetchStory = function(
        topicId, storyId, successCallback, errorCallback) {
      var storyDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_STORY_DATA_URL_TEMPLATE, {
          topic_id: topicId,
          story_id: storyId
        });

      $http.get(storyDataUrl).then(function(response) {
        var story = angular.copy(response.data.story);
        var topicName = angular.copy(response.data.topic_name);
        if (successCallback) {
          successCallback({
            story: story,
            topicName: topicName
          });
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _updateStory = function(
        topicId, storyId, storyVersion, commitMessage, changeList,
        successCallback, errorCallback) {
      var editableStoryDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_STORY_DATA_URL_TEMPLATE, {
          topic_id: topicId,
          story_id: storyId
        });

      var putData = {
        version: storyVersion,
        commit_message: commitMessage,
        change_dicts: changeList
      };
      $http.put(editableStoryDataUrl, putData).then(function(response) {
        // The returned data is an updated story dict.
        var story = angular.copy(response.data.story);

        if (successCallback) {
          successCallback(story);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _deleteStory = function(
        topicId, storyId, successCallback, errorCallback) {
      var storyDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_STORY_DATA_URL_TEMPLATE, {
          topic_id: topicId,
          story_id: storyId
        });
      $http['delete'](storyDataUrl).then(function(response) {
        if (successCallback) {
          successCallback(response.status);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchStory: function(topicId, storyId) {
        return $q(function(resolve, reject) {
          _fetchStory(topicId, storyId, resolve, reject);
        });
      },

      /**
       * Updates a story in the backend with the provided story ID.
       * The changes only apply to the story of the given version and the
       * request to update the story will fail if the provided story
       * version is older than the current version stored in the backend. Both
       * the changes and the message to associate with those changes are used
       * to commit a change to the story. The new story is passed to
       * the success callback, if one is provided to the returned promise
       * object. Errors are passed to the error callback, if one is provided.
       */
      updateStory: function(
          topicId, storyId, storyVersion, commitMessage, changeList) {
        return $q(function(resolve, reject) {
          _updateStory(
            topicId, storyId, storyVersion, commitMessage, changeList,
            resolve, reject);
        });
      },

      deleteStory: function(topicId, storyId) {
        return $q(function(resolve, reject) {
          _deleteStory(topicId, storyId, resolve, reject);
        });
      }
    };
  }
]);
