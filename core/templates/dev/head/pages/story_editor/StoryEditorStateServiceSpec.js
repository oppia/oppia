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

describe('Story editor state service', function() {
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;
  var StoryUpdateService = null;
  var fakeEditableStoryBackendApiService = null;

  var FakeEditableStoryBackendApiService = function() {
    var self = {};

    var _fetchOrUpdateStory = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendStoryObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendStoryObject = {};
    self.failure = null;
    self.fetchStory = _fetchOrUpdateStory;
    self.updateStory = _fetchOrUpdateStory;
    return self;
  };

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(module('oppia', function($provide) {
    fakeEditableStoryBackendApiService = (
      new FakeEditableStoryBackendApiService());
    $provide.value(
      'EditableStoryBackendApiService',
      [fakeEditableStoryBackendApiService][0]);
  }));

  beforeEach(inject(function($injector) {
    StoryEditorStateService = $injector.get(
      'StoryEditorStateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryUpdateService = $injector.get('StoryUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

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
      schema_version: '1',
      version: '1'
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
      schema_version: '1',
      version: '1'
    };
  }));

  it('should request to load the story from the backend', function() {
    spyOn(
      fakeEditableStoryBackendApiService, 'fetchStory').and.callThrough();

    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    expect(fakeEditableStoryBackendApiService.fetchStory).toHaveBeenCalled();
  });

  it('should fire an init event after loading the first story',
    function() {
      spyOn($rootScope, '$broadcast').and.callThrough();

      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      $rootScope.$apply();

      expect($rootScope.$broadcast).toHaveBeenCalledWith('storyInitialized');
    }
  );

  it('should fire an update event after loading more stories', function() {
    // Load initial story.
    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();

    // Load a second story.
    StoryEditorStateService.loadStory('topicId', 'storyId_1');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith('storyReinitialized');
  });

  it('should track whether it is currently loading the story', function() {
    expect(StoryEditorStateService.isLoadingStory()).toBe(false);

    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    expect(StoryEditorStateService.isLoadingStory()).toBe(true);

    $rootScope.$apply();
    expect(StoryEditorStateService.isLoadingStory()).toBe(false);
  });

  it('should indicate a story is no longer loading after an error',
    function() {
      expect(StoryEditorStateService.isLoadingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      expect(StoryEditorStateService.isLoadingStory()).toBe(true);

      $rootScope.$apply();
      expect(StoryEditorStateService.isLoadingStory()).toBe(false);
    }
  );

  it('it should report that a story has loaded through loadStory()',
    function() {
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      $rootScope.$apply();
      expect(StoryEditorStateService.hasLoadedStory()).toBe(true);
    }
  );

  it('it should report that a story has loaded through setStory()',
    function() {
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      var newStory = StoryObjectFactory.createFromBackendDict(
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
      var expectedStory = StoryObjectFactory.createFromBackendDict(
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
        StoryEditorStateService.saveStory('topicId', 'Commit message');
      }).toThrow();
    }
  );

  it('should not save the story if there are no pending changes',
    function() {
      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      $rootScope.$apply();

      spyOn($rootScope, '$broadcast').and.callThrough();
      expect(StoryEditorStateService.saveStory('topicId',
        'Commit message')).toBe(false);
      expect($rootScope.$broadcast).not.toHaveBeenCalled();
    }
  );

  it('should be able to save the story and pending changes', function() {
    spyOn(
      fakeEditableStoryBackendApiService,
      'updateStory').and.callThrough();

    StoryEditorStateService.loadStory('topicId_1', 'storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(
      StoryEditorStateService.saveStory('topicId_1', 'Commit message')
    ).toBe(true);
    $rootScope.$apply();

    var expectedId = 'storyId_0';
    var expectedTopicId = 'topicId_1';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateStorySpy = (
      fakeEditableStoryBackendApiService.updateStory);
    expect(updateStorySpy).toHaveBeenCalledWith(
      expectedTopicId, expectedId, expectedVersion,
      expectedCommitMessage, jasmine.any(Object));
  });

  it('should fire an update event after saving the story', function() {
    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();
    StoryEditorStateService.saveStory('topicId', 'Commit message');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'storyReinitialized');
  });

  it('should track whether it is currently saving the story', function() {
    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(StoryEditorStateService.isSavingStory()).toBe(false);
    StoryEditorStateService.saveStory('topicId', 'Commit message');
    expect(StoryEditorStateService.isSavingStory()).toBe(true);

    $rootScope.$apply();
    expect(StoryEditorStateService.isSavingStory()).toBe(false);
  });

  it('should indicate a story is no longer saving after an error',
    function() {
      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      StoryUpdateService.setStoryTitle(
        StoryEditorStateService.getStory(), 'New title');
      $rootScope.$apply();

      expect(StoryEditorStateService.isSavingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      StoryEditorStateService.saveStory('topicId', 'Commit message');
      expect(StoryEditorStateService.isSavingStory()).toBe(true);

      $rootScope.$apply();
      expect(StoryEditorStateService.isSavingStory()).toBe(false);
    }
  );
});
