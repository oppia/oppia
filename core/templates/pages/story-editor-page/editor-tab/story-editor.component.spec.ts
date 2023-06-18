// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the story editor component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { StoryUpdateService } from 'domain/story/story-update.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { StoryEditorNavigationService } from '../services/story-editor-navigation.service';
import { StoryEditorComponent } from './story-editor.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { Story } from 'domain/story/story.model';
import { NewChapterTitleModalComponent } from '../modal-templates/new-chapter-title-modal.component';
import { DeleteChapterModalComponent } from '../modal-templates/delete-chapter-modal.component';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { StoryNode } from 'domain/story/story-node.model';

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Story Editor Component having two story nodes', () => {
  let component: StoryEditorComponent;
  let fixture: ComponentFixture<StoryEditorComponent>;
  let ngbModal: NgbModal;
  let story: Story;
  let windowDimensionsService: WindowDimensionsService;
  let undoRedoService: UndoRedoService;
  let storyEditorNavigationService: StoryEditorNavigationService;
  let storyUpdateService: StoryUpdateService;
  let storyEditorStateService: StoryEditorStateService;
  let windowRef: WindowRef;
  let fetchSpy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StoryEditorComponent,
        NewChapterTitleModalComponent,
        DeleteChapterModalComponent
      ],
      providers: [
        WindowDimensionsService,
        UndoRedoService,
        StoryEditorNavigationService,
        StoryUpdateService,
        StoryEditorStateService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      StoryEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    storyEditorNavigationService = TestBed.inject(
      StoryEditorNavigationService);
    undoRedoService = TestBed.inject(UndoRedoService);
    windowRef = TestBed.inject(WindowRef);
    storyUpdateService = TestBed.inject(StoryUpdateService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);


    let sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      url_fragment: 'story_title',
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
    story = Story.createFromBackendDict(sampleStoryBackendObject);

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    fetchSpy = spyOn(storyEditorStateService, 'getStory')
      .and.returnValue(story);
    spyOn(storyEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(storyEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(storyEditorStateService, 'getTopicName').and.returnValue('addition');
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should change list oder', fakeAsync(() => {
    spyOn(storyUpdateService, 'rearrangeNodeInStory').and.stub();
    component.linearNodesList = [StoryNode.createFromBackendDict({
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40'
    }),
    StoryNode.createFromBackendDict({
      id: 'node_2',
      thumbnail_filename: 'image.png',
      title: 'Title 2',
      description: 'Description 2',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40'
    }),
    StoryNode.createFromBackendDict({
      id: 'node_3',
      thumbnail_filename: 'image.png',
      title: 'Title 3',
      description: 'Description 3',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40'
    })];

    const event1 = {
      previousIndex: 0,
      currentIndex: 1,
    } as CdkDragDrop<string[]>;
    const event2 = {
      previousIndex: 1,
      currentIndex: 0,
    } as CdkDragDrop<string[]>;

    component.drop(event1);
    tick();
    component.drop(event2);
    tick();

    expect(storyUpdateService.rearrangeNodeInStory).toHaveBeenCalledTimes(2);
  }));

  it('should display topicname on main story card', () => {
    expect(component.storyPreviewCardIsShown).toEqual(false);
    expect(component.mainStoryCardIsShown).toEqual(true);
    expect(component.getTopicName()).toEqual('addition');
  });

  it('should toggle story preview card', () => {
    component.storyPreviewCardIsShown = false;

    component.togglePreview();

    expect(component.mainStoryCardIsShown).toEqual(true);
  });

  it('should toggle chapter edit options', () => {
    component.toggleChapterEditOptions(10);

    expect(component.selectedChapterIndex).toEqual(10);

    component.toggleChapterEditOptions(10);

    expect(component.selectedChapterIndex).toEqual(-1);
  });

  it('should toggle chapter lists', () => {
    component.chaptersListIsShown = false;

    component.toggleChapterLists();

    expect(component.chaptersListIsShown).toEqual(true);

    component.toggleChapterLists();
    expect(component.chaptersListIsShown).toEqual(false);
  });

  it('should toggle main story card', () => {
    component.mainStoryCardIsShown = false;

    component.toggleStoryEditorCard();

    expect(component.mainStoryCardIsShown).toEqual(true);

    component.toggleStoryEditorCard();

    expect(component.mainStoryCardIsShown).toEqual(false);
  });

  it('should open and close notes editor', () => {
    component.notesEditorIsShown = false;

    component.openNotesEditor();

    expect(component.notesEditorIsShown).toEqual(true);

    component.closeNotesEditor();

    expect(component.notesEditorIsShown).toEqual(false);
  });

  it('should return when the node is the initial node', () => {
    expect(component.isInitialNode('node_1')).toEqual(false);
    expect(component.isInitialNode('node_2')).toEqual(true);
  });

  it('should call StoryUpdate to update story title', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryTitle');

    component.updateStoryTitle('title99');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate to update story thumbnail filename', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setThumbnailFilename');

    component.updateStoryThumbnailFilename('abcd');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate to update story thumbnail bg color', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setThumbnailBgColor');

    component.updateStoryThumbnailBgColor('abcd');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should return the classroom and topic url fragment', () => {
    expect(component.getClassroomUrlFragment()).toEqual('math');
    expect(component.getTopicUrlFragment()).toEqual('fractions');
  });

  it('should not open confirm or cancel modal if the initial node is' +
      ' being deleted',
  () => {
    let modalSpy = spyOn(ngbModal, 'open');

    component.deleteNode('node_2');

    expect(modalSpy).not.toHaveBeenCalled();
  });

  it('should open confirm or cancel modal when a node is being deleted',
    fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve()
      } as NgbModalRef);
      let storyUpdateSpy = spyOn(
        storyUpdateService, 'deleteStoryNode').and.stub();

      component.deleteNode('node_1');
      tick();

      expect(storyUpdateSpy).toHaveBeenCalled();
      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should call storyUpdateService to add destination node id',
    () => {
      class MockComponentInstance {
        compoenentInstance!: {
          nodeTitles: null;
        };
      }

      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockComponentInstance,
          result: Promise.resolve()
        }) as NgbModalRef;
      });

      component.createNode();

      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call storyUpdateService to add destination node id',
    fakeAsync(() => {
      class MockComponentInstance {
        compoenentInstance!: {
          nodeTitles: null;
        };
      }
      let sampleStoryBackendObject = {
        id: 'sample_story_id',
        title: 'Story title',
        description: 'Story description',
        notes: 'Story notes',
        version: 1,
        corresponding_topic_id: 'topic_id',
        story_contents: {
          initial_node_id: 'node_1',
          nodes: [
            {
              id: 'node_1',
              title: 'Title 1',
              description: 'Description 1',
              prerequisite_skill_ids: ['skill_1'],
              acquired_skill_ids: ['skill_2'],
              destination_node_ids: [],
              outline: 'Outline',
              exploration_id: 'exp_id',
              outline_is_finalized: false,
              thumbnail_filename: 'fileName',
              thumbnail_bg_color: 'blue',
            }],
          next_node_id: 'node_1'
        },
        language_code: 'en',
        thumbnail_filename: 'fileName',
        thumbnail_bg_color: 'blue',
        url_fragment: 'url',
        meta_tag_content: 'meta'
      };
      spyOn(component, '_initEditor').and.stub();
      component.story = Story.createFromBackendDict(
        sampleStoryBackendObject);
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockComponentInstance,
          result: Promise.resolve()
        }) as NgbModalRef;
      });

      component.createNode();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should call storyUpdateService to add destination node id',
    fakeAsync(() => {
      class MockComponentInstance {
        compoenentInstance!: {
          nodeTitles: null;
        };
      }
      let storySpy = spyOn(storyUpdateService, 'addDestinationNodeIdToNode');
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockComponentInstance,
        result: Promise.resolve()
      } as NgbModalRef);

      component.createNode();
      tick();

      expect(modalSpy).toHaveBeenCalled();
      expect(storySpy).toHaveBeenCalled();
    }));

  it('should call storyUpdateService to update story notes', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNotes');

    component.updateNotes('Updated the story notes');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call storyUpdateService to update story notes', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryMetaTagContent');

    component.updateStoryMetaTagContent('storyone');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call not update url fragment if it is unchanged', () => {
    component.storyUrlFragmentExists = true;

    component.updateStoryUrlFragment('story_title');

    expect(component.storyUrlFragmentExists).toEqual(false);
  });

  it('should update the existence of story url fragment', () => {
    let storyUpdateSpy = spyOn(
      storyEditorStateService,
      'updateExistenceOfStoryUrlFragment').and.callFake(
      (urlFragment, callback) => callback());

    component.updateStoryUrlFragment('story_second');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should set story url fragment', () => {
    let storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryUrlFragment');

    component.updateStoryUrlFragment('');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call storyEditorNavigationService to navigate to chapters',
    () => {
      let navigationSpy = spyOn(
        storyEditorNavigationService, 'navigateToChapterEditorWithId');

      component.navigateToChapterWithId('chapter_1', 0);

      expect(navigationSpy).toHaveBeenCalled();
    });

  it('should make story description status', () => {
    component.editableDescriptionIsEmpty = true;
    component.storyDescriptionChanged = false;
    component.updateStoryDescriptionStatus('New description');
    component.editableDescriptionIsEmpty = false;
    component.storyDescriptionChanged = true;
  });

  it('should update the story description', () => {
    let storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryDescription');

    component.updateStoryDescription('New skill description');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should show modal if there are unsaved changes on leaving', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      }) as NgbModalRef;
    });

    component.returnToTopicEditorPage();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should show modal if there are unsaved changes and click reject',
    () => {
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.reject()
        }) as NgbModalRef;
      });

      component.returnToTopicEditorPage();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call windowref to open a tab', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      open: jasmine.createSpy('open', () => {})
    });

    component.returnToTopicEditorPage();

    expect(windowRef.nativeWindow.open).toHaveBeenCalled();
  });

  it('should fetch story when story is initialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(storyEditorStateService, 'onStoryInitialized')
      .and.returnValue(mockEventEmitter);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch story when story is reinitialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(storyEditorStateService, 'onStoryReinitialized')
      .and.returnValue(mockEventEmitter);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch story node when story editor is opened', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(storyEditorStateService, 'onViewStoryNodeEditor')
      .and.returnValue(mockEventEmitter);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });
});
