// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CreateNewChapterModalComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationIdValidationService } from 'domain/exploration/exploration-id-validation.service';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StoryUpdateService } from 'domain/story/story-update.service';
import { StoryContentsObjectFactory } from 'domain/story/StoryContentsObjectFactory';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { CreateNewChapterModalComponent } from './new-chapter-title-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Create New Chapter Modal Component', function() {
  let componentInstance: CreateNewChapterModalComponent;
  let fixture: ComponentFixture<CreateNewChapterModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let storyEditorStateService: StoryEditorStateService = null;
  let storyUpdateService: StoryUpdateService = null;
  let storyObjectFactory = null;
  let explorationIdValidationService: ExplorationIdValidationService = null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        CreateNewChapterModalComponent,
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        ExplorationSummaryBackendApiService,
        EditableStoryBackendApiService,
        AlertsService,
        ExplorationIdValidationService,
        StoryObjectFactory,
        StoryContentsObjectFactory,
        StoryEditorStateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewChapterModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    storyUpdateService = TestBed.inject(StoryUpdateService);
    storyObjectFactory = TestBed.inject(StoryObjectFactory);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    explorationIdValidationService = TestBed.inject(
      ExplorationIdValidationService);

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
    let story = storyObjectFactory.createFromBackendDict(
      sampleStoryBackendObject);
    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    componentInstance.ngOnInit();
  });

  it('should validate explorationId correctly', () => {
    componentInstance.explorationId = 'validId';
    expect(componentInstance.validateExplorationId()).toBeTrue();
    componentInstance.explorationId = 'oppia.org/validId';
    expect(componentInstance.validateExplorationId()).toBeFalse();
  });

  it('should update thumbnail filename when changing thumbnail file',
    () => {
      let storyUpdateSpy = spyOn(
        storyUpdateService, 'setStoryNodeThumbnailFilename');
      componentInstance.updateThumbnailFilename('abc');
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect(componentInstance.editableThumbnailFilename).toEqual('abc');
    }
  );

  it('should update thumbnail bg color when changing thumbnail color',
    () => {
      let storyUpdateSpy = spyOn(
        storyUpdateService, 'setStoryNodeThumbnailBgColor');
      componentInstance.updateThumbnailBgColor('abc');
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect(componentInstance.editableThumbnailBgColor).toEqual('abc');
    }
  );

  it('should delete the story node when closing the modal', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'deleteStoryNode');
    componentInstance.cancel();
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should update the title', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNodeTitle');
    componentInstance.updateTitle();
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should check if chapter is valid when it has title, exploration id and' +
    ' thumbnail file', () => {
    expect(componentInstance.isValid()).toEqual(false);
    componentInstance.title = 'title';
    componentInstance.explorationId = '1';
    expect(componentInstance.isValid()).toEqual(false);
    componentInstance.editableThumbnailFilename = '1';
    expect(componentInstance.isValid()).toEqual(true);
    componentInstance.explorationId = '';
    expect(componentInstance.isValid()).toEqual(false);
  });

  it('should warn that the exploration is not published when trying to save' +
    ' a chapter with an invalid exploration id', fakeAsync(() => {
    componentInstance.nodeTitles = ['title 1', 'title 2', 'title 3'];
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
    Promise.resolve(false);
    spyOn(explorationIdValidationService, 'isExpPublishedAsync')
      .and.resolveTo(false);
    tick();
    componentInstance.save();
    expect(componentInstance.invalidExpId).toEqual(true);
  }));

  it('should warn that the exploration already exists in the story when' +
    ' trying to save a chapter with an already used exploration id', () => {
    componentInstance.explorationId = 'exp_1';
    componentInstance.updateExplorationId();
    expect(componentInstance.invalidExpErrorString).toEqual(
      'The given exploration already exists in the story.');
    expect(componentInstance.invalidExpId).toEqual(true);
  });

  it('should close the modal when saving a chapter with a valid exploration id',
    fakeAsync(() => {
      spyOn(ngbActiveModal, 'close');
      componentInstance.nodeTitles = ['title 1', 'title 2', 'title 3'];
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
      Promise.resolve(true);
      spyOn(explorationIdValidationService, 'isExpPublishedAsync')
        .and.resolveTo(true);
      tick();
      componentInstance.save();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    }));

  it('should set story node exploration id when updating exploration id',
    () => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
      let storyUpdateSpy = spyOn(
        storyUpdateService, 'setStoryNodeExplorationId');
      componentInstance.updateExplorationId();
      expect(storyUpdateSpy).toHaveBeenCalled();
    });

  it('should not save when the chapter title is already used', () => {
    spyOn(ngbActiveModal, 'close');
    componentInstance.nodeTitles = ['title 1', 'title 2', 'title 3'];
    componentInstance.title = 'title 1';
    componentInstance.save();
    expect(componentInstance.errorMsg).toBe(
      'A chapter with this title already exists');
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should clear error message when changing exploration id', () => {
    spyOn(ngbActiveModal, 'close');
    componentInstance.nodeTitles = ['title 1', 'title 2', 'title 3'];
    componentInstance.title = 'title 1';
    componentInstance.save();
    expect(componentInstance.errorMsg).toBe(
      'A chapter with this title already exists');
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
    componentInstance.resetErrorMsg();
    expect(componentInstance.errorMsg).toBe(null);
    expect(componentInstance.invalidExpId).toBe(false);
    expect(componentInstance.invalidExpErrorString).toBe(
      'Please enter a valid exploration id.');
  });
});
