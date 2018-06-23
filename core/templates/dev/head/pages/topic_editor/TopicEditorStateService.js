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
 * @fileoverview Service to maintain the state of a single topic shared
 * throughout the topic editor. This service provides functionality for
 * retrieving the topic, saving it, and listening for changes.
 */

oppia.constant('EVENT_TOPIC_INITIALIZED', 'topicInitialized');
oppia.constant('EVENT_TOPIC_REINITIALIZED', 'topicReinitialized');
oppia.constant(
  'EVENT_STORY_SUMMARIES_INITIALIZED', 'storySummariesInitialized');

oppia.factory('TopicEditorStateService', [
  '$rootScope', 'AlertsService', 'TopicObjectFactory',
  'TopicRightsObjectFactory', 'TopicRightsBackendApiService',
  'UndoRedoService', 'EditableTopicBackendApiService',
  'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
  'EVENT_STORY_SUMMARIES_INITIALIZED',
  function(
      $rootScope, AlertsService, TopicObjectFactory,
      TopicRightsObjectFactory, TopicRightsBackendApiService,
      UndoRedoService, EditableTopicBackendApiService,
      EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED,
      EVENT_STORY_SUMMARIES_INITIALIZED) {
    var _topic = TopicObjectFactory.createInterstitialTopic();
    var _topicRights = TopicRightsObjectFactory.createInterstitialRights();
    var _topicIsInitialized = false;
    var _topicIsLoading = false;
    var _topicIsBeingSaved = false;
    var _canonicalStorySummaries = [];

    var _setTopic = function(topic) {
      _topic.copyFromTopic(topic);
      if (_topicIsInitialized) {
        $rootScope.$broadcast(EVENT_TOPIC_REINITIALIZED);
      } else {
        $rootScope.$broadcast(EVENT_TOPIC_INITIALIZED);
        _topicIsInitialized = true;
      }
    };
    var _updateTopic = function(newBackendTopicObject) {
      _setTopic(TopicObjectFactory.create(newBackendTopicObject));
    };
    var _setTopicRights = function(topicRights) {
      _topicRights.copyFromTopicRights(topicRights);
    };
    var _updateTopicRights = function(newBackendTopicRightsObject) {
      _setTopicRights(TopicRightsObjectFactory.createFromBackendDict(
        newBackendTopicRightsObject));
    };
    var _setCanonicalStorySummaries = function(canonicalStorySummaries) {
      _canonicalStorySummaries = angular.copy(canonicalStorySummaries);
      $rootScope.$broadcast(EVENT_STORY_SUMMARIES_INITIALIZED);
    };

    return {
      /**
       * Loads, or reloads, the topic stored by this service given a
       * specified topic ID. See setTopic() for more information on
       * additional behavior of this function.
       */
      loadTopic: function(topicId) {
        _topicIsLoading = true;
        EditableTopicBackendApiService.fetchTopic(
          topicId).then(
          function(newBackendTopicObject) {
            _updateTopic(newBackendTopicObject);
            EditableTopicBackendApiService.fetchStories(topicId).then(
              function(canonicalStorySummaries) {
                _setCanonicalStorySummaries(canonicalStorySummaries);
              });
          },
          function(error) {
            AlertsService.addWarning(
              error || 'There was an error when loading the topic.');
            _topicIsLoading = false;
          });
        TopicRightsBackendApiService.fetchTopicRights(
          topicId).then(function(newBackendTopicRightsObject) {
          _updateTopicRights(newBackendTopicRightsObject);
          _topicIsLoading = false;
        }, function(error) {
          AlertsService.addWarning(
            error ||
            'There was an error when loading the topic rights.');
          _topicIsLoading = false;
        });
      },

      /**
       * Returns whether this service is currently attempting to load the
       * topic maintained by this service.
       */
      isLoadingTopic: function() {
        return _topicIsLoading;
      },

      /**
       * Returns whether a topic has yet been loaded using either
       * loadTopic() or setTopic().
       */
      hasLoadedTopic: function() {
        return _topicIsInitialized;
      },

      /**
       * Returns the current topic to be shared among the topic
       * editor. Please note any changes to this topic will be propogated
       * to all bindings to it. This topic object will be retained for the
       * lifetime of the editor. This function never returns null, though it may
       * return an empty topic object if the topic has not yet been
       * loaded for this editor instance.
       */
      getTopic: function() {
        return _topic;
      },

      getCanonicalStorySummaries: function() {
        return _canonicalStorySummaries;
      },

      /**
       * Returns the current topic rights to be shared among the topic
       * editor. Please note any changes to this topic rights will be
       * propogated to all bindings to it. This topic rights object will
       * be retained for the lifetime of the editor. This function never returns
       * null, though it may return an empty topic rights object if the
       * topic rights has not yet been loaded for this editor instance.
       */
      getTopicRights: function() {
        return _topicRights;
      },


      /**
       * Sets the topic stored within this service, propogating changes to
       * all bindings to the topic returned by getTopic(). The first
       * time this is called it will fire a global event based on the
       * EVENT_TOPIC_INITIALIZED constant. All subsequent
       * calls will similarly fire a EVENT_TOPIC_REINITIALIZED event.
       */
      setTopic: function(topic) {
        _setTopic(topic);
      },

      /**
       * Sets the topic rights stored within this service, propogating
       * changes to all bindings to the topic returned by
       * getTopicRights().
       */
      setTopicRights: function(topicRights) {
        _setTopicRights(topicRights);
      },


      /**
       * Attempts to save the current topic given a commit message. This
       * function cannot be called until after a topic has been initialized
       * in this service. Returns false if a save is not performed due to no
       * changes pending, or true if otherwise. This function, upon success,
       * will clear the UndoRedoService of pending changes. This function also
       * shares behavior with setTopic(), when it succeeds.
       */
      saveTopic: function(commitMessage, successCallback) {
        if (!_topicIsInitialized) {
          AlertsService.fatalWarning(
            'Cannot save a topic before one is loaded.');
        }

        // Don't attempt to save the topic if there are no changes pending.
        if (!UndoRedoService.hasChanges()) {
          return false;
        }
        _topicIsBeingSaved = true;
        EditableTopicBackendApiService.updateTopic(
          _topic.getId(), _topic.getVersion(),
          commitMessage, UndoRedoService.getCommittableChangeList()).then(
          function(topicBackendObject) {
            _updateTopic(topicBackendObject);
            UndoRedoService.clearChanges();
            _topicIsBeingSaved = false;
            if (successCallback) {
              successCallback();
            }
          }, function(error) {
            AlertsService.addWarning(
              error || 'There was an error when saving the topic.');
            _topicIsBeingSaved = false;
          });
        return true;
      },

      /**
       * Returns whether this service is currently attempting to save the
       * topic maintained by this service.
       */
      isSavingTopic: function() {
        return _topicIsBeingSaved;
      }
    };
  }
]);
