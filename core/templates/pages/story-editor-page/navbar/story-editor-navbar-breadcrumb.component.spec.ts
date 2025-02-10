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
 * @fileoverview Unit tests for the navbar breadcrumb of the story editor.
 */

import {EventEmitter} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {Story} from 'domain/story/story.model';
import {StoryEditorStateService} from '../services/story-editor-state.service';
import {StoryEditorNavbarBreadcrumbComponent} from './story-editor-navbar-breadcrumb.component';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {SavePendingChangesModalComponent} from 'components/save-pending-changes/save-pending-changes-modal.component';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

class MockNgbModalRef {
  componentInstance!: {
    body: 'xyz';
  };
}

describe('StoryEditorNavbarBreadcrumbComponent', () => {
  let component: StoryEditorNavbarBreadcrumbComponent;
  let fixture: ComponentFixture<StoryEditorNavbarBreadcrumbComponent>;
  let storyEditorStateService: StoryEditorStateService;
  let story: Story;
  let ngbModal: NgbModal;
  let undoRedoService: UndoRedoService;
  let windowRef: WindowRef;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StoryEditorNavbarBreadcrumbComponent],
      providers: [StoryEditorStateService, WindowRef],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryEditorNavbarBreadcrumbComponent);
    component = fixture.componentInstance;
    storyEditorStateService = TestBed.get(StoryEditorStateService);
    ngbModal = TestBed.inject(NgbModal);
    undoRedoService = TestBed.get(UndoRedoService);
    windowRef = TestBed.inject(WindowRef) as jasmine.SpyObj<WindowRef>;

    story = Story.createFromBackendDict({
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_3',
        nodes: [
          {
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
            thumbnail_bg_color: '#a33f40',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
          {
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
            thumbnail_bg_color: '#a33f40',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
        ],
      },
      language_code: 'en',
      meta_tag_content: 'meta',
      url_fragment: 'url',
      version: 1,
      corresponding_topic_id: 'topic_id',
      thumbnail_bg_color: 'red',
      thumbnail_filename: 'image',
    });
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialise component when user open story editor', () => {
    let mockStoryInitializedEventEmitter = new EventEmitter();
    spyOnProperty(
      storyEditorStateService,
      'onStoryInitialized'
    ).and.returnValue(mockStoryInitializedEventEmitter);
    spyOn(storyEditorStateService, 'getTopicName').and.returnValue('Topic 1');
    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    component.ngOnInit();

    mockStoryInitializedEventEmitter.emit();

    expect(component.topicName).toBe('Topic 1');
    expect(component.story).toEqual(story);
  });

  it('should return to topic editor when user clicks topic name', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    spyOn(windowRef.nativeWindow, 'open');
    component.story = story;

    component.returnToTopicEditorPage();

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/topic_editor/topic_id',
      '_self'
    );
  });

  it(
    'should open modal to save changes when user clicks topic name' +
      ' with unsaved changes',
    () => {
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(),
      } as NgbModalRef);
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

      component.returnToTopicEditorPage();

      expect(ngbModal.open).toHaveBeenCalledWith(
        SavePendingChangesModalComponent,
        {backdrop: true}
      );
    }
  );

  it('should close save pending changes modal when user clicks cancel', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

    component.returnToTopicEditorPage();

    expect(ngbModal.open).toHaveBeenCalledWith(
      SavePendingChangesModalComponent,
      {backdrop: true}
    );
  });
});
