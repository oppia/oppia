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

// TODO(#7222): Remove the following block of unnnecessary imports once
// story-editor-state.service.ts is upgraded to Angular 8.
import { StoryContentsObjectFactory } from
  'domain/story/StoryContentsObjectFactory';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';
import { Subscription } from 'rxjs';

require('domain/story/story-update.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');

describe('Story editor state service', function() {
  var StoryEditorStateService = null;
  var storyObjectFactory = null;
  var StoryUpdateService = null;
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

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'StoryContentsObjectFactory', new StoryContentsObjectFactory());
    $provide.value(
      'StoryObjectFactory', new StoryObjectFactory(
        new StoryContentsObjectFactory()));
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
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
    StoryEditorStateService = $injector.get(
      'StoryEditorStateService');
    storyObjectFactory = $injector.get('StoryObjectFactory');
    StoryUpdateService = $injector.get('StoryUpdateService');
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
    testSubscriptions = new Subscription();
    testSubscriptions.add(StoryEditorStateService.onStoryInitialized.subscribe(
      storyInitializedSpy));
    testSubscriptions.add(
      StoryEditorStateService.onStoryReinitialized.subscribe(
        storyReinitializedSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should request to load the story from the backend', function() {
    spyOn(
      fakeEditableStoryBackendApiService, 'fetchStory').and.callThrough();

    StoryEditorStateService.loadStory('storyId_0');
    expect(fakeEditableStoryBackendApiService.fetchStory).toHaveBeenCalled();
  });

  it(
    'should fire an init event and set the topic name after loading the ' +
    'first story', function() {
      StoryEditorStateService.loadStory('storyId_0');
      $rootScope.$apply();
      expect(StoryEditorStateService.getTopicName()).toEqual('Topic Name');
      expect(storyInitializedSpy).toHaveBeenCalled();
    }
  );

  it('should fire an update event after loading more stories', function() {
    // Load initial story.
    StoryEditorStateService.loadStory('storyId_0');
    $rootScope.$apply();

    // Load a second story.
    StoryEditorStateService.loadStory('storyId_1');
    $rootScope.$apply();
    expect(storyReinitializedSpy).toHaveBeenCalled();
  });

  it('should track whether it is currently loading the story', function() {
    expect(StoryEditorStateService.isLoadingStory()).toBe(false);

    StoryEditorStateService.loadStory('storyId_0');
    expect(StoryEditorStateService.isLoadingStory()).toBe(true);

    $rootScope.$apply();
    expect(StoryEditorStateService.isLoadingStory()).toBe(false);
  });

  it('should indicate a story is no longer loading after an error',
    function() {
      expect(StoryEditorStateService.isLoadingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      StoryEditorStateService.loadStory('storyId_0');
      expect(StoryEditorStateService.isLoadingStory()).toBe(true);

      $rootScope.$apply();
      expect(StoryEditorStateService.isLoadingStory()).toBe(false);
    }
  );

  it('should report that a story has loaded through loadStory()',
    function() {
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      StoryEditorStateService.loadStory('storyId_0');
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      $rootScope.$apply();
      expect(StoryEditorStateService.hasLoadedStory()).toBe(true);
    }
  );

  it('should report that a story has loaded through setStory()',
    function() {
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      var newStory = storyObjectFactory.createFromBackendDict(
        secondBackendStoryObject);
      StoryEditorStateService.setStory(newStory);
      expect(StoryEditorStateService.hasLoadedStory()).toBe(true);
    }
  );

  it('should initially return an interstitial story', function() {
    var story = StoryEditorStateService.getStory();
    expect(story.getId()).toEqual(null);
    expect(story.getTitle()).toEqual('Story title loading');
    expect(story.getDescription()).toEqual('Story description loading');
    expect(story.getNotes()).toEqual('Story notes loading');
    expect(story.getStoryContents()).toEqual(null);
  });

  it('should be able to set a new story with an in-place copy',
    function() {
      var previousStory = StoryEditorStateService.getStory();
      var expectedStory = storyObjectFactory.createFromBackendDict(
        secondBackendStoryObject);
      expect(previousStory).not.toEqual(expectedStory);

      StoryEditorStateService.setStory(expectedStory);

      var actualStory = StoryEditorStateService.getStory();
      expect(actualStory).toEqual(expectedStory);

      expect(actualStory).toBe(previousStory);
      expect(actualStory).not.toBe(expectedStory);
    }
  );

  it('should fail to save the story without first loading one',
    function() {
      expect(function() {
        StoryEditorStateService.saveStory('Commit message');
      }).toThrowError('Cannot save a story before one is loaded.');
    }
  );

  it('should not save the story if there are no pending changes',
    function() {
      StoryEditorStateService.loadStory('storyId_0');
      $rootScope.$apply();

      expect(StoryEditorStateService.saveStory(
        'Commit message')).toBe(false);
    }
  );

  it('should be able to save the story and pending changes', function() {
    spyOn(
      fakeEditableStoryBackendApiService,
      'updateStory').and.callThrough();

    StoryEditorStateService.loadStory('storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(
      StoryEditorStateService.saveStory('Commit message')
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

  it('should be able to publish the story', function() {
    spyOn(
      fakeEditableStoryBackendApiService,
      'changeStoryPublicationStatus').and.callThrough();

    StoryEditorStateService.loadStory('topicId_1', 'storyId_0');
    $rootScope.$apply();

    expect(StoryEditorStateService.isStoryPublished()).toBe(false);
    expect(
      StoryEditorStateService.changeStoryPublicationStatus(true)
    ).toBe(true);
    $rootScope.$apply();

    var expectedId = 'storyId_0';
    var publishStorySpy = (
      fakeEditableStoryBackendApiService.changeStoryPublicationStatus);
    expect(publishStorySpy).toHaveBeenCalledWith(
      expectedId, true);
    expect(StoryEditorStateService.isStoryPublished()).toBe(true);
  });

  it('should fire an update event after saving the story', function() {
    StoryEditorStateService.loadStory('storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    StoryEditorStateService.saveStory('Commit message');
    $rootScope.$apply();
    expect(storyReinitializedSpy).toHaveBeenCalled();
  });

  it('should track whether it is currently saving the story', function() {
    StoryEditorStateService.loadStory('storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(StoryEditorStateService.isSavingStory()).toBe(false);
    StoryEditorStateService.saveStory('Commit message');
    expect(StoryEditorStateService.isSavingStory()).toBe(true);

    $rootScope.$apply();
    expect(StoryEditorStateService.isSavingStory()).toBe(false);
  });

  it('should indicate a story is no longer saving after an error',
    function() {
      StoryEditorStateService.loadStory('storyId_0');
      StoryUpdateService.setStoryTitle(
        StoryEditorStateService.getStory(), 'New title');
      $rootScope.$apply();

      expect(StoryEditorStateService.isSavingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      StoryEditorStateService.saveStory('Commit message');
      expect(StoryEditorStateService.isSavingStory()).toBe(true);

      $rootScope.$apply();
      expect(StoryEditorStateService.isSavingStory()).toBe(false);
    }
  );
});
