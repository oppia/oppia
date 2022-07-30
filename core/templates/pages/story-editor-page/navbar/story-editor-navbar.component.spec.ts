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
 * @fileoverview Unit tests for the story editor navbar component.
 */

import { Story, StoryBackendDict, StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { StoryEditorNavbarComponent } from './story-editor-navbar.component';
import { StoryEditorUnpublishModalComponent } from '../modal-templates/story-editor-unpublish-modal.component';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { StoryEditorNavigationService } from '../services/story-editor-navigation.service';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';

class MockNgbModalRef {
  componentInstance!: {
    bindedMessage: null;
  };
}

describe('Story editor navbar component', () => {
  let component: StoryEditorNavbarComponent;
  let fixture: ComponentFixture<StoryEditorNavbarComponent>;
  let story: Story;
  let alertsService: AlertsService;
  let storyObjectFactory: StoryObjectFactory;
  let storyEditorStateService: StoryEditorStateService;
  let undoRedoService: UndoRedoService;
  let editableStoryBackendApiService: EditableStoryBackendApiService;
  let ngbModal: NgbModal;
  let storyBackendDict: StoryBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [
        StoryEditorNavbarComponent,
        StoryEditorUnpublishModalComponent
      ],
      providers: [
        StoryObjectFactory,
        StoryEditorStateService,
        StoryEditorNavigationService,
        UndoRedoService,
        EditableStoryBackendApiService,
        AlertsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [StoryEditorUnpublishModalComponent]
      }
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryEditorNavbarComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    undoRedoService = TestBed.inject(UndoRedoService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    storyObjectFactory = TestBed.inject(StoryObjectFactory);
    ngbModal = TestBed.inject(NgbModal);
    editableStoryBackendApiService = TestBed.inject(
      EditableStoryBackendApiService);
    storyBackendDict = {
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_3',
        nodes: [{
          title: 'title_1',
          description: 'description_1',
          id: 'node_1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: 'exp_1',
          outline_is_finalized: false,
          thumbnail_filename: 'img.png',
          thumbnail_bg_color: '#a33f40'
        }, {
          title: 'title_2',
          description: 'description_2',
          id: 'node_2',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: 'exp_2',
          outline_is_finalized: false,
          thumbnail_filename: 'img2.png',
          thumbnail_bg_color: '#a33f40'
        }],
      },
      language_code: 'en',
      meta_tag_content: 'meta',
      url_fragment: 'url',
      version: 1,
      corresponding_topic_id: 'topic_id',
      thumbnail_bg_color: 'red',
      thumbnail_filename: 'image'
    };

    spyOn(storyEditorStateService, 'getSkillSummaries').and.returnValue(
      [{
        id: 'abc',
        description: 'description',
        language_code: 'en',
        version: 1,
        misconception_count: 1,
        worked_examples_count: 1,
        skill_model_created_on: 1,
        skill_model_last_updated: 1,
      }]);

    spyOn(storyEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(storyEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(storyEditorStateService, 'getTopicName').and.returnValue('addition');
    spyOn(editableStoryBackendApiService, 'changeStoryPublicationStatusAsync')
      .and.returnValue(Promise.resolve());
    spyOn(editableStoryBackendApiService, 'validateExplorationsAsync')
      .and.returnValue(Promise.resolve([]));
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('on initialization ', () => {
    it('should show validation error when story ' +
      'title name is empty', () => {
      // Setting story title to be empty.
      storyBackendDict.title = '';
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryInitializedEventEmitter = new EventEmitter();

      spyOnProperty(storyEditorStateService, 'onStoryInitialized')
        .and.returnValue(mockStoryInitializedEventEmitter);
      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);

      mockStoryInitializedEventEmitter.emit();
      fixture.detectChanges();

      expect(component.validationIssues).toContain(
        'Story title should not be empty');
    });


    it('should show validation error when url ' +
      'fragment is empty', () => {
      // Setting url fragment to be empty.
      storyBackendDict.url_fragment = '';
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryInitializedEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      spyOnProperty(storyEditorStateService, 'onStoryInitialized')
        .and.returnValue(mockStoryInitializedEventEmitter);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);

      mockStoryInitializedEventEmitter.emit();
      fixture.detectChanges();

      expect(component.validationIssues).toContain(
        'Url Fragment should not be empty.');
    });

    it('should show validation error when we ' +
      'try to add url fragment if it already exists', () => {
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryReinitializedEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      spyOnProperty(storyEditorStateService, 'onStoryInitialized')
        .and.returnValue(mockStoryReinitializedEventEmitter);
      spyOn(storyEditorStateService, 'getStoryWithUrlFragmentExists')
        .and.returnValue(true);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);

      mockStoryReinitializedEventEmitter.emit();
      fixture.detectChanges();

      expect(component.validationIssues).toContain(
        'Story URL fragment already exists.');
    });

    it('should show validation error when chapters in story ' +
      'does not have any linked exploration', fakeAsync(() => {
      // Setting exploration ID to be empty.
      storyBackendDict.story_contents.nodes[0].exploration_id = null;
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryReinitializedEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      spyOnProperty(storyEditorStateService, 'onStoryInitialized')
        .and.returnValue(mockStoryReinitializedEventEmitter);
      spyOn(storyEditorStateService, 'getStoryWithUrlFragmentExists')
        .and.returnValue(true);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.explorationValidationIssues.length).toBe(0);

      mockStoryReinitializedEventEmitter.emit();
      tick();
      fixture.detectChanges();

      expect(component.explorationValidationIssues).toContain(
        'Some chapters don\'t have exploration IDs provided.');
    }));

    it('should validate story without any validation errors ' +
      'on initialization', () => {
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryInitializedEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      spyOnProperty(storyEditorStateService, 'onStoryInitialized')
        .and.returnValue(mockStoryInitializedEventEmitter);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);

      mockStoryInitializedEventEmitter.emit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);
    });

    it('should validate story without any validation errors ' +
      'on reinitalization', () => {
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryReinitializedEventEmitter = new EventEmitter();

      spyOnProperty(storyEditorStateService, 'onStoryReinitialized')
        .and.returnValue(mockStoryReinitializedEventEmitter);
      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);

      mockStoryReinitializedEventEmitter.emit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);
    });

    it('should validate story without any validation errors ' +
      'when undo operation is performed', () => {
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockUndoRedoChangeEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      spyOn(undoRedoService, 'getUndoRedoChangeEventEmitter').and.returnValue(
        mockUndoRedoChangeEventEmitter);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);

      mockUndoRedoChangeEventEmitter.emit();
      fixture.detectChanges();

      expect(component.validationIssues.length).toBe(0);
    });
  });

  it('should unpublish story', fakeAsync(() => {
    story = storyObjectFactory.createFromBackendDict(storyBackendDict);
    let mockStoryInitializedEventEmitter = new EventEmitter();

    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    spyOnProperty(storyEditorStateService, 'onStoryInitialized')
      .and.returnValue(mockStoryInitializedEventEmitter);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.resolve('success')
      } as NgbModalRef);
    });

    component.ngOnInit();
    mockStoryInitializedEventEmitter.emit();
    fixture.detectChanges();

    expect(component.storyIsPublished).toBeFalse();

    storyEditorStateService.setStory(story);
    fixture.detectChanges();
    // This check will make sure that story is
    // loaded correctly before publishing it.
    expect(storyEditorStateService.hasLoadedStory()).toBe(true);

    // Publishing story will acts as pre-check here.
    component.publishStory();
    tick(1000);
    fixture.detectChanges();
    expect(component.storyIsPublished).toBe(true);

    component.unpublishStory();
    tick(1000);
    fixture.detectChanges();
    expect(modalSpy).toHaveBeenCalled();
    expect(component.storyIsPublished).toBe(false);
  }));

  it('should toggle warning text', () => {
    component.warningsAreShown = true;

    component.toggleWarningText();
    fixture.detectChanges();

    expect(component.warningsAreShown).toBe(false);
  });

  it('should toggle navigation options', () => {
    component.showNavigationOptions = true;

    component.toggleNavigationOptions();
    fixture.detectChanges();

    expect(component.showNavigationOptions).toBe(false);
  });

  it('should toggle edit options', () => {
    component.showStoryEditOptions = true;

    component.toggleStoryEditOptions();
    fixture.detectChanges();

    expect(component.showStoryEditOptions).toBe(false);
  });

  it('should navigate to main tab in story editor page', () => {
    expect(component.activeTab).toBeUndefined();

    component.selectMainTab();

    expect(component.activeTab).toBe('Editor');
  });

  it('should navigate to preview tab in story editor page', () => {
    expect(component.activeTab).toBeUndefined();

    component.selectPreviewTab();

    expect(component.activeTab).toBe('Preview');
  });

  it('should discard changes', () => {
    story = storyObjectFactory.createFromBackendDict(storyBackendDict);
    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);

    component.story = story;
    let clearChangesSpy = spyOn(
      undoRedoService, 'clearChanges').and.callThrough();

    component.discardChanges();

    expect(clearChangesSpy).toHaveBeenCalled();
  });

  describe('open a confirmation modal for saving changes ', () => {
    it('should save story successfully on' +
      'clicking save draft button', fakeAsync(() => {
      const commitMessage = 'commitMessage';

      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryInitializedEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      const saveChangesSpy = spyOn(
        storyEditorStateService, 'saveStory')
        .and.callFake((commitMessage, successCallback, errorCallback) => {
          if (commitMessage !== null) {
            successCallback();
          } else {
            errorCallback('Expected a commit message but received none.');
          }
          return true;
        });
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: MockNgbModalRef,
            result: Promise.resolve(commitMessage)
          } as NgbModalRef);
      });

      component.ngOnInit();
      mockStoryInitializedEventEmitter.emit();
      storyEditorStateService.setStory(story);
      fixture.detectChanges();

      expect(modalSpy).not.toHaveBeenCalled();
      expect(saveChangesSpy).not.toHaveBeenCalled();

      component.saveChanges();
      tick();
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
      expect(saveChangesSpy).toHaveBeenCalled();
    }));

    it('should show error message if the story was not saved' +
      'on clicking save draft button', fakeAsync(() => {
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      const commitMessage = null;
      let mockStoryInitializedEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      spyOnProperty(storyEditorStateService, 'onStoryInitialized')
        .and.returnValue(mockStoryInitializedEventEmitter);
      const alertsSpy = spyOn(
        alertsService, 'addInfoMessage').and.returnValue();
      const saveChangesSpy = spyOn(
        storyEditorStateService, 'saveStory')
        .and.callFake((commitMessage, successCallback, errorCallback) => {
          if (commitMessage !== null) {
            successCallback();
          } else {
            errorCallback('Expected a commit message but received none.');
          }
          return true;
        });
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: MockNgbModalRef,
            result: Promise.resolve(commitMessage)
          } as NgbModalRef);
      });

      component.ngOnInit();
      mockStoryInitializedEventEmitter.emit();
      storyEditorStateService.setStory(story);
      fixture.detectChanges();

      expect(modalSpy).not.toHaveBeenCalled();
      expect(saveChangesSpy).not.toHaveBeenCalled();

      component.commitMessage = '';
      component.saveChanges();
      tick();
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
      expect(saveChangesSpy).toHaveBeenCalled();
      expect(alertsSpy).toHaveBeenCalledWith(
        'Expected a commit message but received none.', 5000);
    }));

    it('should not save story on clicking cancel button', fakeAsync(() => {
      story = storyObjectFactory.createFromBackendDict(storyBackendDict);
      let mockStoryInitializedEventEmitter = new EventEmitter();

      spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
      spyOnProperty(storyEditorStateService, 'onStoryInitialized')
        .and.returnValue(mockStoryInitializedEventEmitter);
      const saveChangesSpy = spyOn(
        storyEditorStateService, 'saveStory')
        .and.callFake((commitMessage, successCallback, errorCallback) => {
          if (commitMessage !== null) {
            successCallback();
          } else {
            errorCallback('Expected a commit message but received none.');
          }
          return true;
        });
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: MockNgbModalRef,
            result: Promise.reject()
          } as NgbModalRef);
      });

      component.ngOnInit();
      mockStoryInitializedEventEmitter.emit();
      storyEditorStateService.setStory(story);
      fixture.detectChanges();

      expect(modalSpy).not.toHaveBeenCalled();
      expect(saveChangesSpy).not.toHaveBeenCalled();

      component.saveChanges();
      tick();
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
      expect(saveChangesSpy).not.toHaveBeenCalled();
    }));
  });

  it('should return change list length', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    expect(component.getChangeListLength()).toEqual(10);
  });
});
