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

// @ts-nocheck

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {StoryUpdateService} from 'domain/story/story-update.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {StoryEditorNavigationService} from '../services/story-editor-navigation.service';
import {StoryEditorComponent} from './story-editor.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {StoryEditorStateService} from '../services/story-editor-state.service';
import {Story} from 'domain/story/story.model';
import {NewChapterTitleModalComponent} from '../modal-templates/new-chapter-title-modal.component';
import {DeleteChapterModalComponent} from '../modal-templates/delete-chapter-modal.component';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {StoryNode} from 'domain/story/story-node.model';
import {PlatformFeatureService} from '../../../services/platform-feature.service';
import {UrlFragmentEditorComponent} from '../../../components/url-fragment-editor/url-fragment-editor.component';
import {
  ModuleModel,
  StoryContents,
} from 'domain/story/story-contents-object.model';
import {EditModuleModalComponent} from '../modal-templates/edit-module-modal.component';
import {StoryDomainConstants} from 'domain/story/story-domain.constants';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false,
    },
    StoryEditorModules: {
      isEnabled: false,
    },
  };
}

describe('Story Editor Component having three story nodes', () => {
  let component: StoryEditorComponent;
  let fixture: ComponentFixture<StoryEditorComponent>;
  let ngbModal: NgbModal;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let story: Story;
  let windowDimensionsService: WindowDimensionsService;
  let undoRedoService: UndoRedoService;
  let storyEditorNavigationService: StoryEditorNavigationService;
  let storyUpdateService: StoryUpdateService;
  let storyEditorStateService: StoryEditorStateService;
  let windowRef: WindowRef;
  let fetchSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StoryEditorComponent,
        NewChapterTitleModalComponent,
        DeleteChapterModalComponent,
        EditModuleModalComponent,
        MockTranslatePipe,
        UrlFragmentEditorComponent,
      ],
      providers: [
        WindowDimensionsService,
        UndoRedoService,
        StoryEditorNavigationService,
        StoryUpdateService,
        StoryEditorStateService,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    storyEditorNavigationService = TestBed.inject(StoryEditorNavigationService);
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
      thumbnail_filename: 'fileName',
      thumbnail_bg_color: 'blue',
      url_fragment: 'story_title',
      meta_tag_content: 'meta',
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
            outline_is_finalized: false,
            thumbnail_filename: null,
            thumbnail_bg_color: null,
            status: 'Published',
            planned_publication_date_msecs: 30,
            last_modified_msecs: 20,
            first_publication_date_msecs: 10,
            unpublishing_reason: 'Bad Content',
          },
          {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true,
            thumbnail_filename: null,
            thumbnail_bg_color: null,
            status: 'Ready To Publish',
            planned_publication_date_msecs: 30,
            last_modified_msecs: 20,
            first_publication_date_msecs: 10,
            unpublishing_reason: null,
          },
          {
            id: 'node_3',
            title: 'Title 3',
            description: 'Description 3',
            prerequisite_skill_ids: ['skill_4'],
            acquired_skill_ids: ['skill_5'],
            destination_node_ids: ['node_2'],
            outline: 'Outline 3',
            exploration_id: 'exp_3',
            outline_is_finalized: true,
            thumbnail_filename: null,
            thumbnail_bg_color: null,
            status: 'Draft',
            planned_publication_date_msecs: 30,
            last_modified_msecs: 20,
            first_publication_date_msecs: 10,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_3',
      },
      language_code: 'en',
    };
    story = Story.createFromBackendDict(sampleStoryBackendObject);

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    fetchSpy = spyOn(storyEditorStateService, 'getStory').and.returnValue(
      story
    );
    spyOn(storyEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math'
    );
    spyOn(storyEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions'
    );
    spyOn(storyEditorStateService, 'getTopicName').and.returnValue('addition');
    mockPlatformFeatureService.status.StoryEditorModules = {
      isEnabled: false,
    };
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should get status of Serial Chapter Launch Feature flag', () => {
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(false);

    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      true;
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(true);
  });

  it('should correctly initialize chapterIsPublishable', () => {
    expect(component.chapterIsPublishable[0]).toEqual(true);
    expect(component.chapterIsPublishable[1]).toEqual(true);
    expect(component.chapterIsPublishable[2]).toEqual(false);
  });

  it('should get medium dateStyle locale date string', () => {
    const options = {
      dateStyle: 'medium',
    } as Intl.DateTimeFormatOptions;
    expect(component.getMediumStyleLocaleDateString(1692144000000)).toEqual(
      new Date(1692144000000).toLocaleDateString(undefined, options)
    );
  });

  it('should disable drag and drop', () => {
    let node = StoryNode.createFromBackendDict({
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
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    });
    expect(component.isDragAndDropDisabled(node)).toBe(true);

    node.setStatus('Draft');
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1200);
    expect(component.isDragAndDropDisabled(node)).toBe(false);
  });

  it('should change list order', fakeAsync(() => {
    spyOn(storyUpdateService, 'rearrangeNodeInStory').and.stub();
    component.linearNodesList = [
      StoryNode.createFromBackendDict({
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
        thumbnail_bg_color: '#a33f40',
        status: 'Published',
        planned_publication_date_msecs: 100,
        last_modified_msecs: 100,
        first_publication_date_msecs: 200,
        unpublishing_reason: null,
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
        thumbnail_bg_color: '#a33f40',
        status: 'Ready To Publish',
        planned_publication_date_msecs: 100,
        last_modified_msecs: 100,
        first_publication_date_msecs: 200,
        unpublishing_reason: null,
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
        thumbnail_bg_color: '#a33f40',
        status: 'Draft',
        planned_publication_date_msecs: 100,
        last_modified_msecs: 100,
        first_publication_date_msecs: 200,
        unpublishing_reason: null,
      }),
    ];

    const event1: CdkDragDrop<string[]> = {
      previousIndex: 1,
      currentIndex: 0,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      item: null!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      container: null!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      previousContainer: null!,
      isPointerOverContainer: false,
      distance: {x: 0, y: 0},
    };
    const event2: CdkDragDrop<string[]> = {
      previousIndex: 1,
      currentIndex: 2,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      item: null!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      container: null!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      previousContainer: null!,
      isPointerOverContainer: false,
      distance: {x: 0, y: 0},
    };
    const event3: CdkDragDrop<string[]> = {
      previousIndex: 0,
      currentIndex: 1,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      item: null!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      container: null!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      previousContainer: null!,
      isPointerOverContainer: false,
      distance: {x: 0, y: 0},
    };

    expect(component.publishedChaptersDropErrorIsShown).toEqual(false);
    component.drop(event1);
    expect(component.publishedChaptersDropErrorIsShown).toEqual(true);
    tick(5000);

    expect(storyUpdateService.rearrangeNodeInStory).toHaveBeenCalledTimes(0);
    expect(component.publishedChaptersDropErrorIsShown).toEqual(false);

    component.drop(event2);
    tick();

    expect(storyUpdateService.rearrangeNodeInStory).toHaveBeenCalledTimes(1);

    component.drop(event3);
    tick();

    expect(storyUpdateService.rearrangeNodeInStory).toHaveBeenCalledTimes(2);
  }));

  it('should move a chapter up in list', () => {
    let rearrangeNodeSpy = spyOn(component, 'rearrangeNodeInList');

    component.moveNodeUpInStory(2);

    expect(component.selectedChapterIndex).toEqual(-1);
    expect(rearrangeNodeSpy).toHaveBeenCalled();
  });

  it('should move a chapter down in list', () => {
    let rearrangeNodeSpy = spyOn(component, 'rearrangeNodeInList');

    component.moveNodeDownInStory(1);

    expect(component.selectedChapterIndex).toEqual(-1);
    expect(rearrangeNodeSpy).toHaveBeenCalled();
  });

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

  it(
    'should not open confirm or cancel modal if the initial node is' +
      ' being deleted',
    () => {
      let modalSpy = spyOn(ngbModal, 'open');

      component.deleteNode('node_2');

      expect(modalSpy).not.toHaveBeenCalled();
    }
  );

  it('should open confirm or cancel modal when a node is being deleted', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(),
    } as NgbModalRef);
    let storyUpdateSpy = spyOn(
      storyUpdateService,
      'deleteStoryNode'
    ).and.stub();

    component.deleteNode('node_1');
    tick();

    expect(storyUpdateSpy).toHaveBeenCalled();
    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should call storyUpdateService to add destination node id', () => {
    const modalRef = jasmine.createSpyObj('NgbModalRef', [
      'componentInstance',
      'result',
    ]);
    modalRef.componentInstance = {};
    modalRef.result = Promise.resolve();
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return modalRef;
    });

    component.createNode();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call storyUpdateService to add destination node id', fakeAsync(() => {
    let sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      thumbnail_filename: 'fileName',
      thumbnail_bg_color: 'blue',
      url_fragment: 'url',
      meta_tag_content: 'meta',
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
            status: 'Draft',
            planned_publication_date_msecs: null,
            last_modified_msecs: null,
            first_publication_date_msecs: null,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_1',
      },
      language_code: 'en',
    };
    spyOn(component, '_initEditor').and.stub();
    component.story = Story.createFromBackendDict(sampleStoryBackendObject);
    const modalRef = jasmine.createSpyObj('NgbModalRef', [
      'componentInstance',
      'result',
    ]);
    modalRef.componentInstance = {};
    modalRef.result = Promise.resolve();
    let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return modalRef;
    });

    component.createNode();
    tick();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should call storyUpdateService to add destination node id', fakeAsync(() => {
    class MockComponentInstance {
      compoenentInstance!: {
        nodeTitles: null;
      };
    }
    let storySpy = spyOn(storyUpdateService, 'addDestinationNodeIdToNode');
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockComponentInstance,
      result: Promise.resolve(),
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

  it(
    'should not call the getStoryWithUrlFragmentExists if url fragment' +
      'is not correct',
    () => {
      let storyUrlFragmentSpy = spyOn(
        storyUpdateService,
        'setStoryUrlFragment'
      );
      spyOn(
        storyEditorStateService,
        'updateExistenceOfStoryUrlFragment'
      ).and.callFake(
        (
          newUrlFragment: string,
          successCallback: () => void,
          errorCallback: () => void
        ) => errorCallback()
      );
      component.updateStoryUrlFragment('story-url fragment');
      expect(storyUrlFragmentSpy).not.toHaveBeenCalled();
    }
  );

  it('should update the existence of story url fragment', () => {
    let storyUpdateSpy = spyOn(
      storyEditorStateService,
      'updateExistenceOfStoryUrlFragment'
    ).and.callFake((urlFragment: string, callback: () => void) => callback());

    component.updateStoryUrlFragment('story_second');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should set story url fragment', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryUrlFragment');

    component.updateStoryUrlFragment('');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call storyEditorNavigationService to navigate to chapters', () => {
    let navigationSpy = spyOn(
      storyEditorNavigationService,
      'navigateToChapterEditorWithId'
    );

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
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryDescription');

    component.updateStoryDescription('New skill description');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should show modal if there are unsaved changes on leaving', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    const modalRef = jasmine.createSpyObj('NgbModalRef', [
      'componentInstance',
      'result',
    ]);
    modalRef.componentInstance = {};
    modalRef.result = Promise.resolve();
    const modalSpy = spyOn(ngbModal, 'open').and.callFake(() => modalRef);

    component.returnToTopicEditorPage();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should show modal if there are unsaved changes and click reject', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    const modalRef = jasmine.createSpyObj('NgbModalRef', [
      'componentInstance',
      'result',
    ]);
    modalRef.componentInstance = {};
    modalRef.result = Promise.reject();
    const modalSpy = spyOn(ngbModal, 'open').and.callFake(() => modalRef);

    component.returnToTopicEditorPage();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call windowref to open a tab', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      open: jasmine.createSpy('open', () => {}),
    });

    component.returnToTopicEditorPage();

    expect(windowRef.nativeWindow.open).toHaveBeenCalled();
  });

  it('should fetch story when story is initialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(
      storyEditorStateService,
      'onStoryInitialized'
    ).and.returnValue(mockEventEmitter);
    let updatePublishUptoChapterSelectionSpy = spyOn(
      component,
      'updatePublishUptoChapterSelection'
    );

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
    expect(updatePublishUptoChapterSelectionSpy).toHaveBeenCalled();
  });

  it('should fetch story when story is reinitialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(
      storyEditorStateService,
      'onStoryReinitialized'
    ).and.returnValue(mockEventEmitter);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch story node when story editor is opened', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(
      storyEditorStateService,
      'onViewStoryNodeEditor'
    ).and.returnValue(mockEventEmitter);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should update publish upto dropdown chapter selection', () => {
    let selectChapterSpy = spyOn(
      storyEditorStateService,
      'setSelectedChapterIndexInPublishUptoDropdown'
    );
    let chaptersAreBeingPublishedSpy = spyOn(
      storyEditorStateService,
      'setChaptersAreBeingPublished'
    );
    let newChapterPublicationIsDisabledSpy = spyOn(
      storyEditorStateService,
      'setNewChapterPublicationIsDisabled'
    );

    component.updatePublishUptoChapterSelection(1);
    expect(selectChapterSpy).toHaveBeenCalledWith(1);
    expect(chaptersAreBeingPublishedSpy).toHaveBeenCalledWith(true);
    expect(newChapterPublicationIsDisabledSpy).toHaveBeenCalledWith(false);

    component.story.getStoryContents().getNodes()[1].setStatus('Published');
    component.story.getStoryContents().getNodes()[2].setStatus('Published');

    component.updatePublishUptoChapterSelection(2);
    expect(selectChapterSpy).toHaveBeenCalledWith(2);
    expect(newChapterPublicationIsDisabledSpy).toHaveBeenCalledWith(true);

    component.updatePublishUptoChapterSelection(1);
    expect(chaptersAreBeingPublishedSpy).toHaveBeenCalledWith(false);

    component.updatePublishUptoChapterSelection(-1);
    expect(selectChapterSpy).toHaveBeenCalled();
    expect(chaptersAreBeingPublishedSpy).toHaveBeenCalledWith(false);
    expect(newChapterPublicationIsDisabledSpy).toHaveBeenCalledWith(false);

    component.linearNodesList = [];
    component.updatePublishUptoChapterSelection(-1);
    expect(selectChapterSpy).toHaveBeenCalled();
    expect(chaptersAreBeingPublishedSpy).toHaveBeenCalledWith(true);
    expect(newChapterPublicationIsDisabledSpy).toHaveBeenCalledWith(true);
  });

  it('should update editableUrlFragment and call updateStoryUrlFragment', () => {
    spyOn(component, 'updateStoryUrlFragment');
    const newUrlFragment = 'new-story-url';
    component.onStoryEditorUrlFragmentChange(newUrlFragment);
    expect(component.editableUrlFragment).toBe(newUrlFragment);
    expect(component.updateStoryUrlFragment).toHaveBeenCalledWith(
      newUrlFragment
    );
  });

  it('should open edit module modal and update title and description', fakeAsync(() => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', 'Old description', [
        'node_2',
        'node_3',
      ])
    );
    const modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        moduleTitle: '',
        moduleDescription: '',
      },
      result: Promise.resolve({
        title: 'Module 1 updated',
        description: 'New description',
      }),
    } as NgbModalRef);
    const updateModulePropertySpy = spyOn(
      storyUpdateService,
      'updateModuleProperty'
    );

    component.editModule('module_1');
    tick();

    expect(modalSpy).toHaveBeenCalledWith(EditModuleModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-edit-module-modal',
    });
    expect(updateModulePropertySpy).toHaveBeenCalledTimes(2);
  }));

  it('should throw error when onEditModuleClick is called for a node with no module', () => {
    const modalSpy = spyOn(ngbModal, 'open');

    expect(() =>
      component.onEditModuleClick('node_without_module')
    ).toThrowError();
    expect(modalSpy).not.toHaveBeenCalled();
  });

  it('should return early from editModule when module index is invalid', () => {
    const modalSpy = spyOn(ngbModal, 'open');

    component.editModule('non_existent_module');
    expect(modalSpy).not.toHaveBeenCalled();
  });

  it('should merge current module into previous module on removeModuleBoundary', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_1', 'node_2'])
    );
    component.storyContents.addModule(
      ModuleModel.createNew('module_2', 'Module 2', '', ['node_3'])
    );
    const moveNodeToModuleSpy = spyOn(storyUpdateService, 'moveNodeToModule');
    const deleteModuleSpy = spyOn(storyUpdateService, 'deleteModule');

    component.removeModuleBoundary('module_2');

    expect(moveNodeToModuleSpy).toHaveBeenCalledWith(
      component.story,
      'node_3',
      'module_1'
    );
    expect(deleteModuleSpy).toHaveBeenCalledWith(component.story, 'module_2');
  });

  it('should merge second module into first when removing boundary from first module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_1', 'node_2'])
    );
    component.storyContents.addModule(
      ModuleModel.createNew('module_2', 'Module 2', '', ['node_3'])
    );
    const moveNodeToModuleSpy = spyOn(storyUpdateService, 'moveNodeToModule');
    const deleteModuleSpy = spyOn(storyUpdateService, 'deleteModule');

    component.removeModuleBoundary('module_1');

    expect(moveNodeToModuleSpy).toHaveBeenCalledWith(
      component.story,
      'node_3',
      'module_1'
    );
    expect(deleteModuleSpy).toHaveBeenCalledWith(component.story, 'module_2');
  });

  it('should place split chapter in new module only', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', [
        'node_1',
        'node_2',
        'node_3',
      ])
    );

    component.splitIntoModule(2);

    expect(component.storyContents.getModules().length).toBe(2);
    expect(component.getModuleIdForNode('node_3')).not.toBe('module_1');
  });

  it('should generate a unique module ID when the timestamp-based ID collides', () => {
    const dateNowSpy = spyOn(Date, 'now');
    dateNowSpy.and.returnValues(1234567890, 1234567890, 1234567891);
    component.storyContents.addModule(
      ModuleModel.createNew('module_1234567890', 'Module 1', '', [
        'node_1',
        'node_2',
        'node_3',
      ])
    );
    component.linearNodesList = story.getStoryContents().getNodes();
    const createModuleSpy = spyOn(
      storyUpdateService,
      'createModule'
    ).and.callThrough();

    component.splitIntoModule(2);

    expect(createModuleSpy).toHaveBeenCalledWith(
      component.story,
      'module_1234567891',
      jasmine.any(String),
      '',
      ['node_3']
    );
  });

  it('should move multiple nodes to a new module when splitting at a middle index', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', [
        'node_1',
        'node_2',
        'node_3',
      ])
    );
    component.linearNodesList = story.getStoryContents().getNodes();
    const moveNodeToModuleSpy = spyOn(storyUpdateService, 'moveNodeToModule');

    component.splitIntoModule(1);

    expect(moveNodeToModuleSpy).toHaveBeenCalledWith(
      component.story,
      'node_2',
      jasmine.any(String)
    );
    expect(moveNodeToModuleSpy).toHaveBeenCalledWith(
      component.story,
      'node_3',
      jasmine.any(String)
    );
  });

  it('should throw error for module helpers when node has no module', () => {
    expect(() => component.getModuleForNode('node_1')).toThrowError();
    expect(() => component.getModuleSequenceNumber('node_1')).toThrowError();
  });

  it('should not update module when edit module modal is dismissed', fakeAsync(() => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', 'Old description', [
        'node_2',
      ])
    );
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        moduleTitle: '',
        moduleDescription: '',
      },
      result: Promise.reject(),
    } as NgbModalRef);
    const updateModulePropertySpy = spyOn(
      storyUpdateService,
      'updateModuleProperty'
    );

    component.editModule('module_1');
    tick();

    expect(updateModulePropertySpy).not.toHaveBeenCalled();
  }));

  it('should check if story editor modules feature flag is enabled', () => {
    expect(component.isStoryEditorModulesFeatureFlagEnabled()).toBe(false);

    mockPlatformFeatureService.status.StoryEditorModules = {
      isEnabled: true,
    };
    expect(component.isStoryEditorModulesFeatureFlagEnabled()).toBe(true);
  });

  it('should backfill a default module when module data is missing', () => {
    mockPlatformFeatureService.status.StoryEditorModules = {
      isEnabled: true,
    };

    component.storyContents = story.getStoryContents();
    expect(component.storyContents.getModules().length).toBe(0);

    component._initEditor();

    expect(component.storyContents.getModules().length).toBe(1);
    expect(component.storyContents.getModules()[0].getTitle()).toBe(
      'All Chapters'
    );
    expect(component.storyContents.getModules()[0].getNodeIds()).toEqual([
      'node_1',
      'node_2',
      'node_3',
    ]);
  });

  it('should normalize stale module node ids and include missing nodes', () => {
    mockPlatformFeatureService.status.StoryEditorModules = {
      isEnabled: true,
    };

    component.storyContents = story.getStoryContents();
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', [
        'node_2',
        'ghost_node',
      ])
    );
    component.storyContents.addModule(
      ModuleModel.createNew('module_2', 'Module 2', '', ['node_3'])
    );

    component._initEditor();

    expect(component.storyContents.getModules()[0].getNodeIds()).toEqual([
      'node_2',
      'node_1',
    ]);
    expect(component.storyContents.getModules()[1].getNodeIds()).toEqual([
      'node_3',
    ]);
  });

  it('should return true when node index is zero for isSameModule', () => {
    expect(component.isSameModule(0)).toBe(true);
  });

  it('should return true when previous and current nodes are in the same module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_1', 'node_2'])
    );
    component.storyContents.addModule(
      ModuleModel.createNew('module_2', 'Module 2', '', ['node_3'])
    );
    component.linearNodesList = story.getStoryContents().getNodes();

    expect(component.isSameModule(1)).toBe(true);
  });

  it('should return false when previous and current nodes are in different modules', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_1'])
    );
    component.storyContents.addModule(
      ModuleModel.createNew('module_2', 'Module 2', '', ['node_2', 'node_3'])
    );
    component.linearNodesList = story.getStoryContents().getNodes();

    expect(component.isSameModule(1)).toBe(false);
  });

  it('should call StoryUpdate to update story description when changed', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryDescription');

    component.updateStoryDescription('New story description');

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should not call StoryUpdate when story description is unchanged', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryDescription');

    component.updateStoryDescription(component.story.getDescription());

    expect(storyUpdateSpy).not.toHaveBeenCalled();
  });

  it('should not call setStoryTitle when the title is unchanged', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryTitle');

    component.updateStoryTitle(component.story.getTitle());

    expect(storyUpdateSpy).not.toHaveBeenCalled();
  });

  it('should not call setThumbnailFilename when filename is unchanged', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setThumbnailFilename');

    const thumbnailFilename = component.story.getThumbnailFilename();
    if (thumbnailFilename !== null) {
      component.updateStoryThumbnailFilename(thumbnailFilename);
    }

    expect(storyUpdateSpy).not.toHaveBeenCalled();
  });

  it('should not call setThumbnailBgColor when color is unchanged', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setThumbnailBgColor');

    const thumbnailBgColor = component.story.getThumbnailBgColor();
    if (thumbnailBgColor !== null) {
      component.updateStoryThumbnailBgColor(thumbnailBgColor);
    }

    expect(storyUpdateSpy).not.toHaveBeenCalled();
  });

  it('should not call setStoryMetaTagContent when content is unchanged', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryMetaTagContent');

    component.updateStoryMetaTagContent(component.story.getMetaTagContent());

    expect(storyUpdateSpy).not.toHaveBeenCalled();
  });

  it('should not call setStoryNotes when notes are unchanged', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNotes');

    component.updateNotes(component.story.getNotes());

    expect(storyUpdateSpy).not.toHaveBeenCalled();
  });

  it('should throw error from getModuleForNode when module index is invalid', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );
    spyOn(component.storyContents, 'getModuleIndex').and.returnValue(-1);

    expect(() => component.getModuleForNode('node_2')).toThrowError();
  });

  it('should return the module for a valid node from getModuleForNode', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );

    const result = component.getModuleForNode('node_2');

    expect(result.getId()).toBe('module_1');
    expect(result.getTitle()).toBe('Module 1');
  });

  it('should throw error from getModuleSequenceNumber when module index is invalid', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );
    spyOn(component.storyContents, 'getModuleIndex').and.returnValue(-1);

    expect(() => component.getModuleSequenceNumber('node_2')).toThrowError();
  });

  it('should return early from splitIntoModule when conditions are not met', () => {
    const createModuleSpy = spyOn(storyUpdateService, 'createModule');

    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', [
        'node_1',
        'node_2',
        'node_3',
      ])
    );
    component.linearNodesList = story.getStoryContents().getNodes();
    component.splitIntoModule(0);
    expect(createModuleSpy).not.toHaveBeenCalled();
  });

  it('should return early from removeModuleBoundary when conditions are not met', () => {
    const deleteModuleSpy = spyOn(storyUpdateService, 'deleteModule');

    component.storyContents = story.getStoryContents();
    spyOn(component.storyContents, 'getModuleIndex').and.returnValue(-1);
    component.removeModuleBoundary('module_1');
    expect(deleteModuleSpy).not.toHaveBeenCalled();
  });

  it('should return early when removing boundary from the only module', () => {
    component.storyContents = StoryContents.createFromBackendDict({
      initial_node_id: 'node_1',
      nodes: [
        {
          id: 'node_1',
          title: 'Title 1',
          description: 'Description 1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename',
          status: 'Published',
          planned_publication_date_msecs: 10,
          last_modified_msecs: 10,
          first_publication_date_msecs: 20,
          unpublishing_reason: null,
        },
      ],
      next_node_id: 'node_2',
      modules: [
        {
          id: 'module_only',
          title: 'Only Module',
          description: '',
          node_ids: ['node_1'],
        },
      ],
    });
    component.linearNodesList = component.storyContents.getLinearNodesList();
    const deleteModuleSpy = spyOn(storyUpdateService, 'deleteModule');

    component.removeModuleBoundary('module_only');

    expect(deleteModuleSpy).not.toHaveBeenCalled();
  });

  it('should edit module with only title change', fakeAsync(() => {
    component.storyContents.addModule(
      ModuleModel.createNew(
        'module_1',
        'Original Title',
        'Original description',
        ['node_2']
      )
    );
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        moduleTitle: '',
        moduleDescription: '',
      },
      result: Promise.resolve({
        title: 'Updated Title',
        description: 'Original description',
      }),
    } as NgbModalRef);
    const updateModulePropertySpy = spyOn(
      storyUpdateService,
      'updateModuleProperty'
    );

    component.editModule('module_1');
    tick();

    expect(updateModulePropertySpy).toHaveBeenCalledTimes(1);
  }));

  it('should set the node to edit with the given id', () => {
    component.setNodeToEdit('node_1');

    expect(component.idOfNodeToEdit).toBe('node_1');
  });

  it('should return the module id for a node', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );

    expect(component.getModuleIdForNode('node_2')).toBe('module_1');
    expect(() => component.getModuleIdForNode('node_1')).toThrowError();
  });

  it('should call setInitialNodeId when rearranging from index 0', () => {
    const setInitialNodeIdSpy = spyOn(
      storyUpdateService,
      'setInitialNodeId'
    ).and.stub();
    const rearrangeNodeSpy = spyOn(
      storyUpdateService,
      'rearrangeNodeInStory'
    ).and.stub();
    component.linearNodesList = story.getStoryContents().getNodes();

    component.rearrangeNodeInList(0, 1);

    expect(setInitialNodeIdSpy).toHaveBeenCalled();
    expect(rearrangeNodeSpy).toHaveBeenCalledWith(component.story, 0, 1);
  });

  it('should not update initial node when rearranging from non-zero index', () => {
    const setInitialNodeIdSpy = spyOn(
      storyUpdateService,
      'setInitialNodeId'
    ).and.stub();
    component.linearNodesList = story.getStoryContents().getNodes();

    component.rearrangeNodeInList(1, 2);

    expect(setInitialNodeIdSpy).not.toHaveBeenCalled();
  });

  it('should get sequence number for a node in a module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );

    expect(component.getModuleSequenceNumber('node_2')).toBe(1);
  });

  it('should update module description but not title in edit module modal', fakeAsync(() => {
    component.storyContents.addModule(
      ModuleModel.createNew(
        'module_1',
        'Module title',
        'Original description',
        ['node_2']
      )
    );
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        moduleTitle: '',
        moduleDescription: '',
      },
      result: Promise.resolve({
        title: 'Module title',
        description: 'Updated description',
      }),
    } as NgbModalRef);
    const updateModulePropertySpy = spyOn(
      storyUpdateService,
      'updateModuleProperty'
    );

    component.editModule('module_1');
    tick();

    expect(updateModulePropertySpy).toHaveBeenCalledTimes(1);
  }));

  it('should return early from splitIntoModule when split index is first node in module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', [
        'node_1',
        'node_2',
        'node_3',
      ])
    );
    component.linearNodesList = story.getStoryContents().getNodes();
    const createModuleSpy = spyOn(storyUpdateService, 'createModule');

    component.splitIntoModule(0);

    expect(createModuleSpy).not.toHaveBeenCalled();
  });

  it('should handle modal dismiss when deleting a non-initial node', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    const storyUpdateSpy = spyOn(
      storyUpdateService,
      'deleteStoryNode'
    ).and.stub();
    // eslint-disable-next-line dot-notation
    const infoMessageSpy = spyOn(component['alertsService'], 'addInfoMessage');

    component.deleteNode('node_1');
    tick();

    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(infoMessageSpy).not.toHaveBeenCalled();
  }));

  it('should handle modal dismiss when creating a chapter', fakeAsync(() => {
    class MockComponentInstance {
      compoenentInstance!: {
        nodeTitles: null;
      };
    }
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockComponentInstance,
      result: Promise.reject(),
    } as NgbModalRef);

    component.createNode();
    tick();
  }));

  it('should set chapters list shown when window is not narrow on init', () => {
    (windowDimensionsService.isWindowNarrow as jasmine.Spy).and.returnValue(
      false
    );

    component.ngOnInit();

    expect(component.chaptersListIsShown).toBe(true);
  });

  it('should not toggle chapters list when window is not narrow', () => {
    (windowDimensionsService.isWindowNarrow as jasmine.Spy).and.returnValue(
      false
    );
    component.chaptersListIsShown = true;

    component.toggleChapterLists();

    expect(component.chaptersListIsShown).toBe(true);
  });

  it('should not toggle story editor card when window is not narrow', () => {
    (windowDimensionsService.isWindowNarrow as jasmine.Spy).and.returnValue(
      false
    );
    component.mainStoryCardIsShown = true;

    component.toggleStoryEditorCard();

    expect(component.mainStoryCardIsShown).toBe(true);
  });

  it('should handle updatePublishUptoChapterSelection with first node not published', () => {
    spyOn(storyEditorStateService, 'setChaptersAreBeingPublished');
    spyOn(storyEditorStateService, 'setNewChapterPublicationIsDisabled');
    component.story.getStoryContents().getNodes()[0].setStatus('Draft');
    component._initEditor();

    component.updatePublishUptoChapterSelection(-1);

    expect(
      storyEditorStateService.setChaptersAreBeingPublished
    ).toHaveBeenCalledWith(true);
    expect(
      storyEditorStateService.setNewChapterPublicationIsDisabled
    ).toHaveBeenCalledWith(true);
  });

  it('should handle _initEditor when storyContents has no nodes', () => {
    const storyWithNoNodes = Story.createFromBackendDict({
      id: 'sample_story_id',
      title: 'Story title',
      description: '',
      notes: '',
      version: 1,
      corresponding_topic_id: 'topic_id',
      url_fragment: 'story_title',
      thumbnail_filename: '',
      thumbnail_bg_color: '',
      meta_tag_content: '',
      story_contents: {
        initial_node_id: 'node_1',
        nodes: [],
        next_node_id: 'node_1',
      },
      language_code: 'en',
    });
    fetchSpy.and.returnValue(storyWithNoNodes);

    expect(() => {
      component._initEditor();
    }).not.toThrowError();
  });

  it('should handle _initEditor when first node is Ready To Publish', () => {
    component.story
      .getStoryContents()
      .getNodes()[0]
      .setStatus('Ready To Publish');
    component.story.getStoryContents().getNodes()[1].setStatus('Draft');
    component.story.getStoryContents().getNodes()[2].setStatus('Draft');

    component._initEditor();

    expect(component.chapterIsPublishable[0]).toBe(true);
    expect(component.chapterIsPublishable[1]).toBe(false);
    expect(component.chapterIsPublishable[2]).toBe(false);
  });

  it('should disable new chapter publication when first chapter is not publishable', () => {
    component.story.getStoryContents().getNodes()[0].setStatus('Draft');
    component._initEditor();
    spyOn(storyEditorStateService, 'setNewChapterPublicationIsDisabled');

    component.updatePublishUptoChapterSelection(0);

    expect(
      storyEditorStateService.setNewChapterPublicationIsDisabled
    ).toHaveBeenCalledWith(true);
  });

  it('should throw error from getModuleColorForNode when node has no module', () => {
    expect(() => component.getModuleColorForNode('node_1')).toThrowError();
  });

  it('should throw error from getModuleColorForNode when module index is invalid', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );
    spyOn(component.storyContents, 'getModuleIndex').and.returnValue(-1);

    expect(() => component.getModuleColorForNode('node_2')).toThrowError();
  });

  it('should return a color from the palette in getModuleColorForNode', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );

    const color = component.getModuleColorForNode('node_2');
    expect(color).toBe(StoryDomainConstants.MODULE_COLOR_PALETTE[0]);
  });

  it('should call editModule via onEditModuleClick when node has a module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );
    spyOn(component, 'editModule');

    component.onEditModuleClick('node_2');

    expect(component.editModule).toHaveBeenCalledWith('module_1');
  });

  it('should call removeModuleBoundary via onRemoveModuleClick when node has a module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_2'])
    );
    spyOn(component, 'removeModuleBoundary');

    component.onRemoveModuleClick('node_2');

    expect(component.removeModuleBoundary).toHaveBeenCalledWith('module_1');
  });

  it('should return true from isFirstModule when node belongs to the first module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_1', 'node_2'])
    );

    expect(component.isFirstModule('node_1')).toBe(true);
  });

  it('should return false from isFirstModule when node belongs to a later module', () => {
    component.storyContents.addModule(
      ModuleModel.createNew('module_1', 'Module 1', '', ['node_1'])
    );
    component.storyContents.addModule(
      ModuleModel.createNew('module_2', 'Module 2', '', ['node_2'])
    );

    expect(component.isFirstModule('node_2')).toBe(false);
  });
});
