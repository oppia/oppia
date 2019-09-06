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
 * @fileoverview Service to maintain the state of a single story shared
 * throughout the story editor. This service provides functionality for
 * retrieving the story, saving it, and listening for changes.
 */

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/story/EditableStoryBackendApiService.ts');
require('domain/story/StoryObjectFactory.ts');
require('services/AlertsService.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

angular.module('oppia').factory('StoryEditorStateService', [
  '$rootScope', 'AlertsService', 'EditableStoryBackendApiService',
  'StoryObjectFactory', 'UndoRedoService',
  'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
  function(
      $rootScope, AlertsService, EditableStoryBackendApiService,
      StoryObjectFactory, UndoRedoService,
      EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED) {
    var _story = StoryObjectFactory.createInterstitialStory();
    var _storyIsInitialized = false;
    var _storyIsLoading = false;
    var _storyIsBeingSaved = false;
    var _topicName = null;
    var _storyIsPublished = false;

    var _setStory = function(story) {
      _story.copyFromStory(story);
      if (_storyIsInitialized) {
        $rootScope.$broadcast(EVENT_STORY_REINITIALIZED);
      } else {
        $rootScope.$broadcast(EVENT_STORY_INITIALIZED);
        _storyIsInitialized = true;
      }
    };

    var _setTopicName = function(topicName) {
      _topicName = topicName;
    };

    var _setStoryPublicationStatus = function(storyIsPublished) {
      _storyIsPublished = storyIsPublished;
    };

    var _updateStory = function(newBackendStoryObject) {
      _setStory(
        StoryObjectFactory.createFromBackendDict(newBackendStoryObject));
    };

    return {
      /**
       * Loads, or reloads, the story stored by this service given a
       * specified story ID. See setStory() for more information on
       * additional behavior of this function.
       */
      loadStory: function(storyId) {
        _storyIsLoading = true;
        EditableStoryBackendApiService.fetchStory(storyId).then(
          function(newBackendStoryObject) {
            _setTopicName(newBackendStoryObject.topicName);
            _updateStory(newBackendStoryObject.story);
            _setStoryPublicationStatus(
              newBackendStoryObject.storyIsPublished);
            _storyIsLoading = false;
          },
          function(error) {
            AlertsService.addWarning(
              error || 'There was an error when loading the story.');
            _storyIsLoading = false;
          });
      },

      /**
       * Returns whether this service is currently attempting to load the
       * story maintained by this service.
       */
      isLoadingStory: function() {
        return _storyIsLoading;
      },

      /**
       * Returns whether a story has yet been loaded using either
       * loadStory() or setStory().
       */
      hasLoadedStory: function() {
        return _storyIsInitialized;
      },

      /**
       * Returns the current story to be shared among the story
       * editor. Please note any changes to this story will be propogated
       * to all bindings to it. This story object will be retained for the
       * lifetime of the editor. This function never returns null, though it may
       * return an empty story object if the story has not yet been
       * loaded for this editor instance.
       */
      getStory: function() {
        return _story;
      },

      /**
       * Sets the story stored within this service, propogating changes to
       * all bindings to the story returned by getStory(). The first
       * time this is called it will fire a global event based on the
       * EVENT_STORY_INITIALIZED constant. All subsequent
       * calls will similarly fire a EVENT_STORY_REINITIALIZED event.
       */
      setStory: function(story) {
        _setStory(story);
      },

      getTopicName: function() {
        return _topicName;
      },

      isStoryPublished: function() {
        return _storyIsPublished;
      },

      /**
       * Attempts to save the current story given a commit message. This
       * function cannot be called until after a story has been initialized
       * in this service. Returns false if a save is not performed due to no
       * changes pending, or true if otherwise. This function, upon success,
       * will clear the UndoRedoService of pending changes. This function also
       * shares behavior with setStory(), when it succeeds.
       */
      saveStory: function(commitMessage, successCallback) {
        if (!_storyIsInitialized) {
          AlertsService.fatalWarning(
            'Cannot save a story before one is loaded.');
        }

        // Don't attempt to save the story if there are no changes pending.
        if (!UndoRedoService.hasChanges()) {
          return false;
        }
        _storyIsBeingSaved = true;
        EditableStoryBackendApiService.updateStory(
          _story.getId(), _story.getVersion(),
          commitMessage, UndoRedoService.getCommittableChangeList()).then(
          function(storyBackendObject) {
            _updateStory(storyBackendObject);
            UndoRedoService.clearChanges();
            _storyIsBeingSaved = false;
            if (successCallback) {
              successCallback();
            }
          }, function(error) {
            AlertsService.addWarning(
              error || 'There was an error when saving the story.');
            _storyIsBeingSaved = false;
          });
        return true;
      },

      changeStoryPublicationStatus: function(
          newStoryStatusIsPublic, successCallback) {
        if (!_storyIsInitialized) {
          AlertsService.fatalWarning(
            'Cannot publish a story before one is loaded.');
        }

        EditableStoryBackendApiService.changeStoryPublicationStatus(
          _story.getId(), newStoryStatusIsPublic).then(
          function(storyBackendObject) {
            _setStoryPublicationStatus(newStoryStatusIsPublic);
            if (successCallback) {
              successCallback();
            }
          }, function(error) {
            AlertsService.addWarning(
              error ||
              'There was an error when publishing/unpublishing the story.');
          });
        return true;
      },

      /**
       * Returns whether this service is currently attempting to save the
       * story maintained by this service.
       */
      isSavingStory: function() {
        return _storyIsBeingSaved;
      }
    };
  }
]);
