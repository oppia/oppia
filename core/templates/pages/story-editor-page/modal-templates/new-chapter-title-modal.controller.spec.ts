// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CreateNewChapterModalController.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { Story } from 'domain/story/story.model';
import { CuratedExplorationValidationService } from 'domain/exploration/curated-exploration-validation.service';
import { NewChapterTitleModalComponent } from './new-chapter-title-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditableStoryBackendApiService } from '../../../domain/story/editable-story-backend-api.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { StoryUpdateService } from '../../../domain/story/story-update.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PlatformFeatureService } from '../../../services/platform-feature.service';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false
    }
  };
}

describe('Create New Chapter Modal Component', () => {
  let fixture: ComponentFixture<NewChapterTitleModalComponent>;
  let component: NewChapterTitleModalComponent;
  let storyEditorStateService: StoryEditorStateService;
  let storyUpdateService: StoryUpdateService;
  let curatedExplorationValidationService;
  let nodeTitles = ['title 1', 'title 2', 'title 3'];
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let editableStoryBackendApiService:
    EditableStoryBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        NewChapterTitleModalComponent
      ],
      providers: [
        StoryEditorStateService,
        StoryUpdateService,
        CuratedExplorationValidationService,
        EditableStoryBackendApiService,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewChapterTitleModalComponent);
    component = fixture.componentInstance;
    curatedExplorationValidationService = (
      TestBed.inject(CuratedExplorationValidationService));
    editableStoryBackendApiService = (
      TestBed.inject(EditableStoryBackendApiService));
    storyUpdateService = TestBed.inject(StoryUpdateService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    curatedExplorationValidationService = TestBed.inject(
      CuratedExplorationValidationService);
    component.nodeTitles = nodeTitles;

    let sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }, {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    let story = Story.createFromBackendDict(
      sampleStoryBackendObject);
    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);

    component.ngOnInit();
  });

  it('should add story node with data', () => {
    let storyUpdateSpyThumbnailBgColor = spyOn(
      storyUpdateService, 'setStoryNodeThumbnailBgColor');
    let storyUpdateSpyThumbnailFilename = spyOn(
      storyUpdateService, 'setStoryNodeThumbnailFilename');
    let storyUpdateSpyStatus = spyOn(
      storyUpdateService, 'setStoryNodeStatus');
    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = true;

    component.addStoryNodeWithData();

    expect(storyUpdateSpyThumbnailBgColor).toHaveBeenCalled();
    expect(storyUpdateSpyThumbnailFilename).toHaveBeenCalled();
    expect(storyUpdateSpyStatus).toHaveBeenCalled();
  });

  it('should initialize component properties after controller is initialized',
    () => {
      expect(component.nodeTitles).toEqual(nodeTitles);
      expect(component.errorMsg).toBe(null);
      expect(component.categoryIsDefault).toBe(true);
    });

  it('should validate explorationId correctly',
    () => {
      component.explorationId = 'validId';
      expect(component.validateExplorationId()).toBeTrue();
      component.explorationId = 'oppia.org/validId';
      expect(component.validateExplorationId()).toBeFalse();
    });

  it('should update thumbnail filename when changing thumbnail file',
    () => {
      component.updateThumbnailFilename('abc');
      expect(component.editableThumbnailFilename).toEqual('abc');
    });

  it('should update thumbnail bg color when changing thumbnail color',
    () => {
      component.updateThumbnailBgColor('abc');
      component.cancel();
      expect(component.editableThumbnailBgColor).toEqual('abc');
    });

  it('should check if chapter is valid when it has title, exploration id and' +
    ' thumbnail file', () => {
    expect(component.isValid()).toEqual(false);
    component.title = 'title';
    component.explorationId = '1';
    expect(component.isValid()).toEqual(false);
    component.editableThumbnailFilename = '1';
    expect(component.isValid()).toEqual(true);
    component.explorationId = '';
    expect(component.isValid()).toEqual(false);
  });

  it('should show warning message when exploration cannot be curated',
    fakeAsync(() => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
      spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
        .and.resolveTo(true);
      spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
        .and.resolveTo(true);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithRestrictedInteractions').and.resolveTo([]);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithInvalidMultipleChoices').and.resolveTo([]);
      spyOn(
        editableStoryBackendApiService, 'validateExplorationsAsync'
      ).and.resolveTo([
        'Explorations in a story are not expected to contain ' +
        'training data for any answer group. State Introduction of ' +
        'exploration with ID 1 contains training data in one of ' +
        'its answer groups.'
      ]);
      component.saveAsync();
      flushMicrotasks();

      expect(component.invalidExpId).toEqual(true);
      expect(component.invalidExpErrorStrings).toEqual([
        'Explorations in a story are not expected to contain ' +
        'training data for any answer group. State Introduction of ' +
        'exploration with ID 1 contains training data in one of ' +
        'its answer groups.'
      ]);
    }));

  it('should warn that the exploration is not published when trying to save' +
    ' a chapter with an invalid exploration id', fakeAsync(() => {
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(false);
    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    component.saveAsync();
    flushMicrotasks();

    expect(component.invalidExpId).toEqual(true);
  }));

  it('should warn that the exploration already exists in the story when' +
    ' trying to save a chapter with an already used exploration id',
  () => {
    component.explorationId = 'exp_1';
    component.updateExplorationId();
    expect(component.invalidExpErrorStrings).toEqual([
      'The given exploration already exists in the story.'
    ]);
    expect(component.invalidExpId).toEqual(true);
  });

  it('should set story node exploration id when updating exploration id',
    () => {
      let storyUpdateSpy = spyOn(
        storyUpdateService, 'setStoryNodeExplorationId');
      component.updateExplorationId();
      expect(storyUpdateSpy).toHaveBeenCalled();
    });

  it('should not save when the chapter title is already used', () => {
    component.title = nodeTitles[0];
    component.saveAsync();
    expect(component.errorMsg).toBe('A chapter with this title already exists');
  });

  it('should prevent exploration from being added if it doesn\'t exist ' +
    'or isn\'t published yet', fakeAsync(() => {
    component.title = 'dummy_title';
    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.returnValue(false);
    const categorySpy = spyOn(
      curatedExplorationValidationService, 'isDefaultCategoryAsync');
    component.saveAsync();
    flushMicrotasks();
    expect(component.invalidExpId).toEqual(true);
    expect(categorySpy).not.toHaveBeenCalled();
  }));

  it('should prevent exploration from being added if its category ' +
  'is not default', fakeAsync(() => {
    component.title = 'dummy_title';

    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
      .and.resolveTo(false);

    component.saveAsync();
    flushMicrotasks();

    expect(component.categoryIsDefault).toBe(false);
  }));

  it('should prevent exploration from being added if it contains restricted ' +
  'interaction types', fakeAsync(() => {
    component.title = 'dummy_title';
    const invalidStates = ['some_invalid_state'];

    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
      .and.resolveTo(true);
    spyOn(
      curatedExplorationValidationService,
      'getStatesWithRestrictedInteractions').and.resolveTo(invalidStates);

    component.saveAsync();
    flushMicrotasks();

    expect(component.statesWithRestrictedInteractions).toBe(invalidStates);
  }));

  it('should prevent exploration from being added if it contains an invalid ' +
  'multiple choice input', fakeAsync(() => {
    component.title = 'dummy_title';
    const invalidStates = ['some_invalid_state'];

    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
      .and.resolveTo(true);
    spyOn(
      curatedExplorationValidationService,
      'getStatesWithRestrictedInteractions').and.resolveTo([]);
    spyOn(
      curatedExplorationValidationService,
      'getStatesWithInvalidMultipleChoices').and.resolveTo(invalidStates);

    component.saveAsync();
    flushMicrotasks();

    expect(component.statesWithTooFewMultipleChoiceOptions).toBe(invalidStates);
  }));

  it('should attempt to save exploration when all validation checks pass',
    fakeAsync(() => {
      component.title = 'dummy_title';
      spyOn(
        editableStoryBackendApiService, 'validateExplorationsAsync'
      ).and.resolveTo([]);
      spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
        .and.resolveTo(true);
      spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
        .and.resolveTo(true);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithRestrictedInteractions').and.resolveTo([]);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithInvalidMultipleChoices').and.resolveTo([]);
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');
      component.saveAsync();
      flushMicrotasks();

      expect(updateExplorationIdSpy).toHaveBeenCalled();
    }));

  it('should clear error message when changing exploration id', () => {
    component.title = nodeTitles[0];
    component.saveAsync();
    expect(component.errorMsg).toBe('A chapter with this title already exists');

    component.resetErrorMsg();
    expect(component.errorMsg).toBe(null);
    expect(component.invalidExpId).toBe(false);
    expect(component.invalidExpErrorStrings).toEqual([
      'Please enter a valid exploration id.'
    ]);
  });
});
