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
 * @fileoverview Service to change the rights of topic in the backend.
 */

oppia.factory('TopicRightsBackendApiService', [
  '$http', '$log', '$q', 'UrlInterpolationService',
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE', 'TOPIC_RIGHTS_URL_TEMPLATE',
  function($http, $log, $q, UrlInterpolationService,
    TOPIC_MANAGER_RIGHTS_URL_TEMPLATE, TOPIC_RIGHTS_URL_TEMPLATE) {
    // Maps previously loaded topic rights to their IDs.
    var topicRightsCache = {};

    var _fetchTopicRights = function(topicId, successCallback,
        errorCallback) {
      var topicRightsUrl = UrlInterpolationService.interpolateUrl(
        TOPIC_RIGHTS_URL_TEMPLATE, {
          topic_id: topicId
        });

      $http.get(topicRightsUrl).then(function(response) {
        if (successCallback) {
          successCallback(response.data.topic_rights);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _setTopicStatus = function(
        topicId, publishStatus, successCallback, errorCallback) {
      var changeTopicStatusUrl = UrlInterpolationService.interpolateUrl(
        '/rightshandler/change_topic_status/<topic_id>', {
          topic_id: topicId
        });

      var putParams = {
        publish_status: publishStatus
      };

      $http.put(changeTopicStatusUrl, putParams).then(function(response) {
        topicRightsCache[topicId] = response.data;
        if (successCallback) {
          successCallback(response.data);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _isCached = function(topicId) {
      return topicId in topicRightsCache;
    };

    return {
      /**
       * Gets a topic's rights, given its ID.
       */
      fetchTopicRights: function(topicId) {
        return $q(function(resolve, reject) {
          _fetchTopicRights(topicId, resolve, reject);
        });
      },

      /**
       * Behaves exactly as fetchTopicRights (including callback
       * behavior and returning a promise object), except this function will
       * attempt to see whether the given topic rights has been
       * cached. If it has not yet been cached, it will fetch the topic
       * rights from the backend. If it successfully retrieves the topic
       * rights from the backend, it will store it in the cache to avoid
       * requests from the backend in further function calls.
       */
      loadTopicRights: function(topicId) {
        return $q(function(resolve, reject) {
          if (_isCached(topicId)) {
            if (resolve) {
              resolve(topicRightsCache[topicId]);
            }
          } else {
            _fetchTopicRights(topicId, function(topicRights) {
              // Save the fetched topic rights to avoid future fetches.
              topicRightsCache[topicId] = topicRights;
              if (resolve) {
                resolve(topicRightsCache[topicId]);
              }
            }, reject);
          }
        });
      },

      /**
       * Returns whether the given topic rights is stored within the
       * local data cache or if it needs to be retrieved from the backend
       * upon a laod.
       */
      isCached: function(topicId) {
        return _isCached(topicId);
      },

      /**
       * Replaces the current topic rights in the cache given by the
       * specified topic ID with a new topic rights object.
       */
      cacheTopicRights: function(topicId, topicRights) {
        topicRightsCache[topicId] = angular.copy(topicRights);
      },

      /**
       * Publishes a topic.
       */
      publishTopic: function(topicId) {
        return $q(function(resolve, reject) {
          _setTopicStatus(topicId, true, resolve, reject);
        });
      },

      /**
       * Unpublishes a topic.
       */
      unpublishTopic: function(topicId) {
        return $q(function(resolve, reject) {
          _setTopicStatus(topicId, false, resolve, reject);
        });
      }
    };
  }
]);
