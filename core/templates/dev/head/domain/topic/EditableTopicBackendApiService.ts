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

oppia.constant(
  'TOPIC_EDITOR_QUESTION_URL_TEMPLATE',
  '/topic_editor_question_handler/<topic_id>?cursor=<cursor>');

oppia.factory('EditableTopicBackendApiService', [
  '$http', '$q', 'UrlInterpolationService',
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', 'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  'TOPIC_EDITOR_QUESTION_URL_TEMPLATE', 'TOPIC_EDITOR_STORY_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService,
      EDITABLE_TOPIC_DATA_URL_TEMPLATE, SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE,
      TOPIC_EDITOR_QUESTION_URL_TEMPLATE, TOPIC_EDITOR_STORY_URL_TEMPLATE) {
    var _fetchTopic = function(
        topicId, successCallback, errorCallback) {
      var topicDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
          topic_id: topicId
        });

      $http.get(topicDataUrl).then(function(response) {
        if (successCallback) {
          // The response is passed as a dict with 2 fields and not as 2
          // parameters, because the successCallback is called as the resolve
          // callback function in $q in fetchTopic(), and according to its
          // documentation (https://docs.angularjs.org/api/ng/service/$q),
          // resolve or reject can have only a single parameter.
          successCallback({
            topicDict: angular.copy(response.data.topic_dict),
            skillIdToDescriptionDict: angular.copy(
              response.data.skill_id_to_description_dict)
          });
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

    var _fetchQuestions = function(
        topicId, cursor, successCallback, errorCallback) {
      var questionsDataUrl = UrlInterpolationService.interpolateUrl(
        TOPIC_EDITOR_QUESTION_URL_TEMPLATE, {
          topic_id: topicId,
          cursor: cursor ? cursor : ''
        });

      $http.get(questionsDataUrl).then(function(response) {
        var questionSummaries = angular.copy(
          response.data.question_summary_dicts);
        var nextCursor = response.data.next_start_cursor;
        if (successCallback) {
          successCallback({
            questionSummaries: questionSummaries,
            nextCursor: nextCursor
          });
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _fetchSubtopicPage = function(
        topicId, subtopicId, successCallback, errorCallback) {
      var subtopicPageDataUrl = UrlInterpolationService.interpolateUrl(
        SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE, {
          topic_id: topicId,
          subtopic_id: subtopicId.toString()
        });

      $http.get(subtopicPageDataUrl).then(function(response) {
        var topic = angular.copy(response.data.subtopic_page);
        if (successCallback) {
          successCallback(topic);
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
        if (successCallback) {
          // Here also, a dict with 2 fields are passed instead of just 2
          // parameters, due to the same reason as written for _fetchTopic().
          successCallback({
            topicDict: angular.copy(response.data.topic_dict),
            skillIdToDescriptionDict: angular.copy(
              response.data.skill_id_to_description_dict)
          });
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

      fetchQuestions: function(topicId, cursor) {
        return $q(function(resolve, reject) {
          _fetchQuestions(topicId, cursor, resolve, reject);
        });
      },

      fetchSubtopicPage: function(topicId, subtopicId) {
        return $q(function(resolve, reject) {
          _fetchSubtopicPage(topicId, subtopicId, resolve, reject);
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
