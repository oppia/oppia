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
 * @fileoverview Unit tests for StoryEditorStateService.
 */

import { TestBed } from '@angular/core/testing';

import { Subscription } from 'rxjs';

import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service.ts';
import { TranslatorProviderForTests } from 'tests/test.extras';

require('domain/story/story-update.service.ts');

describe('Story editor state service', () => {
  var storyEditorStateService = null;
  var storyObjectFactory = null;
  var storyUpdateService = null;
  var fakeEditableStoryBackendApiService = null;
  var secondBackendStoryObject = null;
  var $rootScope = null;
  var $q = null;
  var testSubscriptions: Subscription;

  const storyInitializedSpy = jasmine.createSpy('storyInitialized');
  const storyReinitializedSpy = jasmine.createSpy('storyReinitialized');

  var FakeEditableStoryBackendApiService = function() {
    var self = {
      newBackendStoryObject: null,
      failure: null,
      fetchStory: null,
      updateStory: null,
      changeStoryPublicationStatus: null
    };

    var _fetchStory = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve({
            story: self.newBackendStoryObject,
            topicName: 'Topic Name',
            storyIsPublished: false,
            skillSummaries: [{
              id: 'Skill 1',
              description: 'Skill Description'
            }]
          });
        } else {
          reject();
        }
      });
    };

    var _updateStory = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendStoryObject);
        } else {
          reject();
        }
      });
    };

    var _changeStoryPublicationStatus = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve();
        } else {
          reject();
        }
      });
    };

    self.newBackendStoryObject = {};
    self.failure = null;
    self.fetchStory = _fetchStory;
    self.updateStory = _updateStory;
    self.changeStoryPublicationStatus = _changeStoryPublicationStatus;
    return self;
  };

  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableStoryBackendApiService = (
      FakeEditableStoryBackendApiService());
    $provide.value(
      'EditableStoryBackendApiService',
      [fakeEditableStoryBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    storyUpdateService = $injector.get('StoryUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    fakeEditableStoryBackendApiService.newBackendStoryObject = {
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_2',
        nodes: []
      },
      language_code: 'en',
      story_contents_schema_version: '1',
      version: '1',
      corresponding_topic_id: 'topic_id'
    };

    secondBackendStoryObject = {
      id: 'storyId_1',
      title: 'Story title  2',
      description: 'Story Description 2',
      notes: '<p>Notes 2/p>',
      story_contents: {
        initial_node_id: 'node_2',
        next_node_id: 'node_1',
        nodes: []
      },
      language_code: 'en',
      story_contents_schema_version: '1',
      version: '1',
      corresponding_topic_id: 'topic_id'
    };
  }));

  beforeEach(() => {
    storyEditorStateService = TestBed.get(StoryEditorStateService);
    storyObjectFactory = TestBed.get(StoryObjectFactory);
  });

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(storyEditorStateService.onStoryInitialized.subscribe(
      storyInitializedSpy));
    testSubscriptions.add(
      storyEditorStateService.onStoryReinitialized.subscribe(
        storyReinitializedSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should request to load the story from the backend', () => {
    spyOn(
      fakeEditableStoryBackendApiService, 'fetchStory').and.callThrough();

    storyEditorStateService.loadStory('storyId_0');
    expect(fakeEditableStoryBackendApiService.fetchStory).toHaveBeenCalled();
  });

  it(
    'should fire an init event and set the topic name after loading the ' +
    'first story', () => {
      storyEditorStateService.loadStory('storyId_0');
      $rootScope.$apply();
      expect(storyEditorStateService.getTopicName()).toEqual('Topic Name');
      expect(storyInitializedSpy).toHaveBeenCalled();
    }
  );

  it('should fire an update event after loading more stories', () => {
    // Load initial story.
    storyEditorStateService.loadStory('storyId_0');
    $rootScope.$apply();

    // Load a second story.
    storyEditorStateService.loadStory('storyId_1');
    $rootScope.$apply();
    expect(storyReinitializedSpy).toHaveBeenCalled();
  });

  it('should track whether it is currently loading the story', () => {
    expect(storyEditorStateService.isLoadingStory()).toBe(false);

    storyEditorStateService.loadStory('storyId_0');
    expect(storyEditorStateService.isLoadingStory()).toBe(true);

    $rootScope.$apply();
    expect(storyEditorStateService.isLoadingStory()).toBe(false);
  });

  it('should indicate a story is no longer loading after an error', () => {
    expect(storyEditorStateService.isLoadingStory()).toBe(false);
    fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

    storyEditorStateService.loadStory('storyId_0');
    expect(storyEditorStateService.isLoadingStory()).toBe(true);

    $rootScope.$apply();
    expect(storyEditorStateService.isLoadingStory()).toBe(false);
  });

  it('should report that a story has loaded through loadStory()', () => {
    expect(storyEditorStateService.hasLoadedStory()).toBe(false);

    storyEditorStateService.loadStory('storyId_0');
    expect(storyEditorStateService.hasLoadedStory()).toBe(false);

    $rootScope.$apply();
    expect(storyEditorStateService.hasLoadedStory()).toBe(true);
  });

  it('should report that a story has loaded through setStory()', () => {
    expect(storyEditorStateService.hasLoadedStory()).toBe(false);

    var newStory = storyObjectFactory.createFromBackendDict(
      secondBackendStoryObject);
    storyEditorStateService.setStory(newStory);
    expect(storyEditorStateService.hasLoadedStory()).toBe(true);
  });

  it('should initially return an interstitial story', () => {
    var story = storyEditorStateService.getStory();
    expect(story.getId()).toEqual(null);
    expect(story.getTitle()).toEqual('Story title loading');
    expect(story.getDescription()).toEqual('Story description loading');
    expect(story.getNotes()).toEqual('Story notes loading');
    expect(story.getStoryContents()).toEqual(null);
  });

  it('should be able to set a new story with an in-place copy', () => {
    var previousStory = storyEditorStateService.getStory();
    var expectedStory = storyObjectFactory.createFromBackendDict(
      secondBackendStoryObject);
    expect(previousStory).not.toEqual(expectedStory);

    storyEditorStateService.setStory(expectedStory);

    var actualStory = storyEditorStateService.getStory();
    expect(actualStory).toEqual(expectedStory);

    expect(actualStory).toBe(previousStory);
    expect(actualStory).not.toBe(expectedStory);
  });

  it('should fail to save the story without first loading one', () => {
    expect(() => {
      storyEditorStateService.saveStory('Commit message');
    }).toThrowError('Cannot save a story before one is loaded.');
  });

  it('should not save the story if there are no pending changes', () => {
    storyEditorStateService.loadStory('storyId_0');
    $rootScope.$apply();

    expect(storyEditorStateService.saveStory('Commit message')).toBe(false);
  });

  it('should be able to save the story and pending changes', () => {
    spyOn(
      fakeEditableStoryBackendApiService,
      'updateStory').and.callThrough();

    storyEditorStateService.loadStory('storyId_0');
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(
      storyEditorStateService.saveStory('Commit message')
    ).toBe(true);
    $rootScope.$apply();

    var expectedId = 'storyId_0';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateStorySpy = (
      fakeEditableStoryBackendApiService.updateStory);
    expect(updateStorySpy).toHaveBeenCalledWith(
      expectedId, expectedVersion,
      expectedCommitMessage, jasmine.any(Object));
  });

  it('should be able to publish the story', () => {
    spyOn(
      fakeEditableStoryBackendApiService,
      'changeStoryPublicationStatus').and.callThrough();

    storyEditorStateService.loadStory('topicId_1', 'storyId_0');
    $rootScope.$apply();

    expect(storyEditorStateService.isStoryPublished()).toBe(false);
    expect(
      storyEditorStateService.changeStoryPublicationStatus(true)
    ).toBe(true);
    $rootScope.$apply();

    var expectedId = 'storyId_0';
    var publishStorySpy = (
      fakeEditableStoryBackendApiService.changeStoryPublicationStatus);
    expect(publishStorySpy).toHaveBeenCalledWith(
      expectedId, true);
    expect(storyEditorStateService.isStoryPublished()).toBe(true);
  });

  it('should fire an update event after saving the story', () => {
    storyEditorStateService.loadStory('storyId_0');
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    storyEditorStateService.saveStory('Commit message');
    $rootScope.$apply();
    expect(storyReinitializedSpy).toHaveBeenCalled();
  });

  it('should track whether it is currently saving the story', () => {
    storyEditorStateService.loadStory('storyId_0');
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(storyEditorStateService.isSavingStory()).toBe(false);
    storyEditorStateService.saveStory('Commit message');
    expect(storyEditorStateService.isSavingStory()).toBe(true);

    $rootScope.$apply();
    expect(storyEditorStateService.isSavingStory()).toBe(false);
  });

  it('should indicate a story is no longer saving after an error', () => {
    storyEditorStateService.loadStory('storyId_0');
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(storyEditorStateService.isSavingStory()).toBe(false);
    fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

    storyEditorStateService.saveStory('Commit message');
    expect(storyEditorStateService.isSavingStory()).toBe(true);

    $rootScope.$apply();
    expect(storyEditorStateService.isSavingStory()).toBe(false);
  });
});
