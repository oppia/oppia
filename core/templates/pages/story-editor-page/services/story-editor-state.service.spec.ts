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

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Subscription } from 'rxjs';
import { Story } from 'domain/story/story.model';
import { StoryBackendDict } from 'domain/story/story.model';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { AlertsService } from 'services/alerts.service';
import { StoryUpdateService } from 'domain/story/story-update.service';

class MockEditableStoryBackendApiService {
  newBackendStoryObject!: StoryBackendDict;
  failure: string | null = null;

  async fetchStoryAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve({
          story: this.newBackendStoryObject,
          topicName: 'Topic Name',
          storyIsPublished: false,
          skillSummaries: [{
            id: 'Skill 1',
            description: 'Skill Description',
            language_code: 'en',
            version: 1,
            misconception_count: 0,
            worked_examples_count: 0,
            skill_model_created_on: 0,
            skill_model_last_updated: 0,
          }],
          classroomUrlFragment: 'classroomUrlFragment',
          topicUrlFragment: 'topicUrlFragment'
        });
      } else {
        reject();
      }
    });
  }

  async updateStoryAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve(this.newBackendStoryObject);
      } else {
        reject();
      }
    });
  }

  async changeStoryPublicationStatusAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve({});
      } else {
        reject();
      }
    });
  }

  async doesStoryWithUrlFragmentExistAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        console.error('test');
        resolve(false);
      } else {
        reject();
      }
    });
  }
}

describe('Story editor state service', () => {
  var alertsService: AlertsService;
  var storyEditorStateService: StoryEditorStateService;
  var storyUpdateService: StoryUpdateService;
  var fakeEditableStoryBackendApiService: MockEditableStoryBackendApiService;
  var secondBackendStoryObject: StoryBackendDict;
  var testSubscriptions: Subscription;

  importAllAngularServices();

  const storyInitializedSpy = jasmine.createSpy('storyInitialized');
  const storyReinitializedSpy = jasmine.createSpy('storyReinitialized');

  beforeEach(() => {
    fakeEditableStoryBackendApiService = (
      new MockEditableStoryBackendApiService());

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
      version: 1,
      corresponding_topic_id: 'topic_id',
      thumbnail_filename: 'img.svg',
      thumbnail_bg_color: '',
      url_fragment: 'url_fragment1',
      meta_tag_content: 'meta_content1'
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
      version: 1,
      corresponding_topic_id: 'topic_id',
      thumbnail_filename: 'img.svg',
      thumbnail_bg_color: '',
      url_fragment: 'url_fragment2',
      meta_tag_content: 'meta_content2'
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: EditableStoryBackendApiService,
          useValue: fakeEditableStoryBackendApiService
        },
        StoryUpdateService
      ]
    }).compileComponents();

    alertsService = TestBed.inject(AlertsService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    storyUpdateService = TestBed.inject(StoryUpdateService);
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
      fakeEditableStoryBackendApiService, 'fetchStoryAsync').and.callThrough();

    storyEditorStateService.loadStory('storyId_0');
    expect(
      fakeEditableStoryBackendApiService.fetchStoryAsync).toHaveBeenCalled();
  });

  it(
    'should fire an init event and set the topic name after loading the ' +
    'first story', fakeAsync(() => {
      storyEditorStateService.loadStory('storyId_0');
      tick(1000);
      expect(storyEditorStateService.getTopicName()).toEqual('Topic Name');
      expect(storyInitializedSpy).toHaveBeenCalled();
    }));

  it('should fire an update event after loading more stories', fakeAsync(() => {
    // Load initial story.
    storyEditorStateService.loadStory('storyId_0');
    tick(1000);

    // Load a second story.
    storyEditorStateService.loadStory('storyId_1');
    tick(1000);
    expect(storyReinitializedSpy).toHaveBeenCalled();
  }));

  it('should track whether it is currently loading the story', fakeAsync(() => {
    expect(storyEditorStateService.isLoadingStory()).toBe(false);

    storyEditorStateService.loadStory('storyId_0');
    expect(storyEditorStateService.isLoadingStory()).toBe(true);

    tick(1000);
    expect(storyEditorStateService.isLoadingStory()).toBe(false);
  }));

  it('should indicate a story is no longer loading after an error',
    fakeAsync(() => {
      expect(storyEditorStateService.isLoadingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      storyEditorStateService.loadStory('storyId_0');
      expect(storyEditorStateService.isLoadingStory()).toBe(true);

      tick(1000);
      expect(storyEditorStateService.isLoadingStory()).toBe(false);
    }));

  it('should report that a story has loaded through loadStory()',
    fakeAsync(() => {
      expect(storyEditorStateService.hasLoadedStory()).toBe(false);

      storyEditorStateService.loadStory('storyId_0');
      expect(storyEditorStateService.hasLoadedStory()).toBe(false);

      tick(1000);
      expect(storyEditorStateService.hasLoadedStory()).toBe(true);
    }));

  it('should report that a story has loaded through setStory()', () => {
    expect(storyEditorStateService.hasLoadedStory()).toBe(false);

    var newStory = Story.createFromBackendDict(
      secondBackendStoryObject);
    storyEditorStateService.setStory(newStory);
    expect(storyEditorStateService.hasLoadedStory()).toBe(true);
  });

  it('should be able to set a new story with an in-place copy',
    fakeAsync(() => {
      storyEditorStateService.loadStory('storyId_0');
      tick(1000);

      var previousStory = storyEditorStateService.getStory();
      var expectedStory = Story.createFromBackendDict(
        secondBackendStoryObject);
      expect(previousStory).not.toEqual(expectedStory);

      storyEditorStateService.setStory(expectedStory);

      var actualStory = storyEditorStateService.getStory();
      expect(actualStory).toEqual(expectedStory);

      expect(actualStory).toBe(previousStory);
      expect(actualStory).not.toBe(expectedStory);
    }));

  it('should fail to save the story without first loading one', () => {
    expect(() => {
      const successCallback = jasmine.createSpy('successCallback');
      const errorCallback = jasmine.createSpy('errorCallback');

      storyEditorStateService.saveStory(
        'Commit message', successCallback, errorCallback);
    }).toThrowError();
  });

  it('should not save the story if there are no pending changes',
    fakeAsync(() => {
      const successCallback = jasmine.createSpy('successCallback');
      const errorCallback = jasmine.createSpy('errorCallback');

      storyEditorStateService.loadStory('storyId_0');
      tick(1000);

      expect(storyEditorStateService.saveStory(
        'Commit message', successCallback, errorCallback)).toBe(false);
    }));

  it('should be able to save the story and pending changes', fakeAsync(() => {
    spyOn(
      fakeEditableStoryBackendApiService,
      'updateStoryAsync').and.callThrough();
    var successCallback = jasmine.createSpy('successCallback');
    var errorCallback = jasmine.createSpy('errorCallback');

    storyEditorStateService.loadStory('storyId_0');
    tick(1000);
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    tick(1000);

    expect(storyEditorStateService.saveStory(
      'Commit message', successCallback, errorCallback)).toBe(true);
    tick(1000);

    var expectedId = 'storyId_0';
    var expectedVersion = 1;
    var expectedCommitMessage = 'Commit message';
    var expectedObject = {
      property_name: 'title',
      new_value: 'New title',
      old_value: 'Story title',
      cmd: 'update_story_property'
    };
    var updateStorySpy = (
      fakeEditableStoryBackendApiService.updateStoryAsync);
    expect(updateStorySpy).toHaveBeenCalledWith(
      expectedId, expectedVersion,
      expectedCommitMessage, [expectedObject]);
    expect(successCallback).toHaveBeenCalled();
  }));

  it('should be able to save the chapter', fakeAsync(() => {
    let successCallback = jasmine.createSpy('successCallback');
    let errorCallback = jasmine.createSpy('errorCallback');
    let saveStorySpy = spyOn(storyEditorStateService, 'saveStory');

    storyEditorStateService.saveChapter(successCallback, errorCallback);
    expect(saveStorySpy).toHaveBeenCalledWith(
      'Changed Chapter Status', successCallback, errorCallback);
  }));

  it('should be able to publish the story', fakeAsync(() => {
    spyOn(
      fakeEditableStoryBackendApiService,
      'changeStoryPublicationStatusAsync').and.callThrough();
    var successCallback = jasmine.createSpy('successCallback');

    storyEditorStateService.loadStory('storyId_0');
    tick(1000);

    expect(storyEditorStateService.isStoryPublished()).toBe(false);
    expect(
      storyEditorStateService.changeStoryPublicationStatus(
        true, successCallback)).toBe(true);
    tick(1000);

    var expectedId = 'storyId_0';
    var publishStorySpy = (
      fakeEditableStoryBackendApiService.changeStoryPublicationStatusAsync);
    expect(publishStorySpy).toHaveBeenCalledWith(
      expectedId, true);
    expect(storyEditorStateService.isStoryPublished()).toBe(true);
    expect(successCallback).toHaveBeenCalled();
  }));

  it('should warn user when story is not published', fakeAsync(() => {
    const successCallback = jasmine.createSpy('successCallback');
    spyOn(
      fakeEditableStoryBackendApiService,
      'changeStoryPublicationStatusAsync').and.callThrough();
    spyOn(alertsService, 'addWarning');

    storyEditorStateService.loadStory('storyId_0');
    tick(1000);
    fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

    expect(storyEditorStateService.isStoryPublished()).toBe(false);
    expect(
      storyEditorStateService.changeStoryPublicationStatus(
        true, successCallback)).toBe(true);
    tick(1000);

    var expectedId = 'storyId_0';
    var publishStorySpy = (
      fakeEditableStoryBackendApiService.changeStoryPublicationStatusAsync);
    expect(publishStorySpy).toHaveBeenCalledWith(
      expectedId, true);
    expect(storyEditorStateService.isStoryPublished()).toBe(false);
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error when publishing/unpublishing the story.'
    );
  }));

  it('should warn user when user attepts to publish story before it loads',
    fakeAsync(() => {
      storyEditorStateService.loadStory('storyId_0');
      tick(1000);

      const successCallback = jasmine.createSpy('successCallback');
      spyOn(alertsService, 'fatalWarning');
      storyEditorStateService._storyIsInitialized = false;

      storyEditorStateService.changeStoryPublicationStatus(
        true, successCallback);

      expect(alertsService.fatalWarning)
        .toHaveBeenCalledWith('Cannot publish a story before one is loaded.');
    }));

  it('should fire an update event after saving the story', fakeAsync(() => {
    const successCallback = jasmine.createSpy('successCallback');
    const errorCallback = jasmine.createSpy('errorCallback');
    storyEditorStateService.loadStory('storyId_0');
    tick(1000);
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    tick(1000);

    storyEditorStateService.saveStory(
      'Commit message', successCallback, errorCallback);
    tick(1000);
    expect(storyReinitializedSpy).toHaveBeenCalled();
  }));

  it('should track whether it is currently saving the story', fakeAsync(() => {
    const successCallback = jasmine.createSpy('successCallback');
    const errorCallback = jasmine.createSpy('errorCallback');
    storyEditorStateService.loadStory('storyId_0');
    tick(1000);
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    tick(1000);

    expect(storyEditorStateService.isSavingStory()).toBe(false);
    storyEditorStateService.saveStory(
      'Commit message', successCallback, errorCallback);
    expect(storyEditorStateService.isSavingStory()).toBe(true);

    tick(1000);
    expect(storyEditorStateService.isSavingStory()).toBe(false);
    expect(storyEditorStateService.isChangingChapterStatus()).toBeFalse();
  }));

  it('should warn user when story fails to save', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    var successCallback = jasmine.createSpy('successCallback');
    var errorCallback = jasmine.createSpy('errorCallback');
    storyEditorStateService.loadStory('storyId_0');
    tick(1000);
    storyUpdateService.setStoryTitle(
      storyEditorStateService.getStory(), 'New title');
    tick(1000);
    fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

    storyEditorStateService.saveStory(
      'Commit message', successCallback, errorCallback);
    tick(1000);

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('There was an error when saving the story.');
    expect(errorCallback)
      .toHaveBeenCalledWith('There was an error when saving the story.');
  }));

  it('should indicate a story is no longer saving after an error',
    fakeAsync(() => {
      const successCallback = jasmine.createSpy('successCallback');
      const errorCallback = jasmine.createSpy('errorCallback');
      storyEditorStateService.loadStory('storyId_0');
      tick(1000);
      storyUpdateService.setStoryTitle(
        storyEditorStateService.getStory(), 'New title');
      tick(1000);

      expect(storyEditorStateService.isSavingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      storyEditorStateService.saveStory(
        'Commit message', successCallback, errorCallback);
      expect(storyEditorStateService.isSavingStory()).toBe(true);

      tick(1000);
      expect(storyEditorStateService.isSavingStory()).toBe(false);
      expect(storyEditorStateService.isChangingChapterStatus()).toBeFalse();
    }));

  it('should update stories URL when user updates the storie\'s URL',
    fakeAsync(() => {
      var newStory = Story.createFromBackendDict(
        secondBackendStoryObject);
      storyEditorStateService.setStory(newStory);

      fakeEditableStoryBackendApiService.failure = '';
      storyEditorStateService._storyWithUrlFragmentExists = true;

      storyEditorStateService.updateExistenceOfStoryUrlFragment(
        'test_url', () =>{});
      tick(1000);

      expect(storyEditorStateService.getStoryWithUrlFragmentExists())
        .toBe(false);
    }));

  it('should warn user when user updates the storie\'s URL to an URL' +
  ' that already exits', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    var newStory = Story.createFromBackendDict(
      secondBackendStoryObject);
    storyEditorStateService.setStory(newStory);

    fakeEditableStoryBackendApiService.failure = 'Story URL exists';
    storyEditorStateService._storyWithUrlFragmentExists = false;

    storyEditorStateService.updateExistenceOfStoryUrlFragment(
      'test_url', () =>{});
    tick(1000);

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error when checking if the story url fragment ' +
      'exists for another story.');
  }));

  it('should return classroom url fragment when called', fakeAsync(() => {
    storyEditorStateService.loadStory('storyId_0');
    tick(1000);

    expect(storyEditorStateService.getClassroomUrlFragment())
      .toBe('classroomUrlFragment');
  }));

  it('should return topic url fragment when called', fakeAsync(() => {
    storyEditorStateService.loadStory('storyId_0');
    tick(1000);

    expect(storyEditorStateService.getTopicUrlFragment())
      .toBe('topicUrlFragment');
  }));

  it('should return event emitters when called', () => {
    expect(storyEditorStateService.onStoryInitialized).toBe(
      storyEditorStateService._storyInitializedEventEmitter);
    expect(storyEditorStateService.onStoryReinitialized).toBe(
      storyEditorStateService._storyReinitializedEventEmitter);
    expect(storyEditorStateService.onViewStoryNodeEditor).toBe(
      storyEditorStateService._viewStoryNodeEditorEventEmitter);
    expect(storyEditorStateService.onRecalculateAvailableNodes).toBe(
      storyEditorStateService._recalculateAvailableNodesEventEmitter);
  });

  it('should set _expIdsChanged to true when setExpIdsChanged is ' +
  'called', () => {
    expect(storyEditorStateService.areAnyExpIdsChanged()).toBeFalse();

    storyEditorStateService.setExpIdsChanged();

    expect(storyEditorStateService.areAnyExpIdsChanged()).toBeTrue();
  });

  it('should set _expIdsChanged to false when resetExpIdsChanged is ' +
  'called', () => {
    storyEditorStateService.setExpIdsChanged();

    expect(storyEditorStateService.areAnyExpIdsChanged()).toBeTrue();

    storyEditorStateService.resetExpIdsChanged();

    expect(storyEditorStateService.areAnyExpIdsChanged()).toBeFalse();
  });

  it('should set current node as publishable', () => {
    storyEditorStateService._currentNodeIsPublishable = false;
    storyEditorStateService.setCurrentNodeAsPublishable(true);
    expect(storyEditorStateService._currentNodeIsPublishable).toBe(true);
  });

  it('should return if current node is publishable', () => {
    storyEditorStateService._currentNodeIsPublishable = false;
    expect(storyEditorStateService.isCurrentNodePublishable()).toBe(false);
    storyEditorStateService._currentNodeIsPublishable = true;
    expect(storyEditorStateService.isCurrentNodePublishable()).toBe(true);
  });

  it('should set the selected chapter index in the publish upto chapter ' +
    'dropdown', () => {
    storyEditorStateService.setSelectedChapterIndexInPublishUptoDropdown(1);
    expect(
      storyEditorStateService._selectedChapterIndexInPublishUptoDropdown).
      toBe(1);
  });

  it('should get the selected chapter index in the publish upto chapter ' +
    'dropdown', () => {
    storyEditorStateService._selectedChapterIndexInPublishUptoDropdown = 2;
    expect(
      storyEditorStateService.
        getSelectedChapterIndexInPublishUptoDropdown()).toBe(2);
  });

  it('should set if the chapters are being published', () => {
    storyEditorStateService.setChaptersAreBeingPublished(true);
    expect(
      storyEditorStateService._chaptersAreBeingPublished).
      toBe(true);
    storyEditorStateService.setChaptersAreBeingPublished(false);
    expect(
      storyEditorStateService._chaptersAreBeingPublished).
      toBe(false);
  });

  it('should get if the chapters are being published', () => {
    storyEditorStateService._chaptersAreBeingPublished = true;
    expect(
      storyEditorStateService.areChaptersBeingPublished()).
      toBe(true);
    storyEditorStateService._chaptersAreBeingPublished = false;
    expect(
      storyEditorStateService.areChaptersBeingPublished()).
      toBe(false);
  });

  it('should set if new chapter publication is disabled', () => {
    storyEditorStateService.setNewChapterPublicationIsDisabled(true);
    expect(
      storyEditorStateService._newChapterPublicationIsDisabled).
      toBe(true);
    storyEditorStateService.setNewChapterPublicationIsDisabled(false);
    expect(
      storyEditorStateService._newChapterPublicationIsDisabled).
      toBe(false);
  });

  it('should get if new chapter publication is disabled', () => {
    storyEditorStateService._newChapterPublicationIsDisabled = true;
    expect(
      storyEditorStateService.getNewChapterPublicationIsDisabled()).
      toBe(true);
    storyEditorStateService._newChapterPublicationIsDisabled = false;
    expect(
      storyEditorStateService.getNewChapterPublicationIsDisabled()).
      toBe(false);
  });

  it('should return skill summaries when called', fakeAsync(() => {
    storyEditorStateService.loadStory('storyId_0');
    tick(1000);

    expect(storyEditorStateService.getSkillSummaries()).toEqual([{
      id: 'Skill 1',
      description: 'Skill Description',
      language_code: 'en',
      version: 1,
      misconception_count: 0,
      worked_examples_count: 0,
      skill_model_created_on: 0,
      skill_model_last_updated: 0,
    }]);
  }));
});
