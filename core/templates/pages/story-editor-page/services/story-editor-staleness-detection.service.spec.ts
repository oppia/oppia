// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for story editor staleness detection service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {EntityEditorBrowserTabsInfo} from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import {Story} from 'domain/story/story.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {FaviconService} from 'services/favicon.service';
import {LocalStorageService} from 'services/local-storage.service';
import {StalenessDetectionService} from 'services/staleness-detection.service';
import {StoryEditorStalenessDetectionService} from './story-editor-staleness-detection.service';
import {StoryEditorStateService} from './story-editor-state.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      reload: () => {},
    },
  };
}

describe('Story editor staleness detection service', () => {
  let storyEditorStalenessDetectionService: StoryEditorStalenessDetectionService;
  let storyEditorStateService: StoryEditorStateService;
  let localStorageService: LocalStorageService;
  let ngbModal: NgbModal;
  let faviconService: FaviconService;
  let mockWindowRef: MockWindowRef;
  let undoRedoService: UndoRedoService;
  let stalenessDetectionService: StalenessDetectionService;
  let sampleStory: Story;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StalenessDetectionService,
        StoryEditorStateService,
        FaviconService,
        LocalStorageService,
        UndoRedoService,
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
    }).compileComponents();

    storyEditorStalenessDetectionService = TestBed.inject(
      StoryEditorStalenessDetectionService
    );
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    localStorageService = TestBed.inject(LocalStorageService);
    ngbModal = TestBed.inject(NgbModal);
    faviconService = TestBed.inject(FaviconService);
    undoRedoService = TestBed.inject(UndoRedoService);
    stalenessDetectionService = TestBed.inject(StalenessDetectionService);

    let sampleStoryBackendObject = {
      id: 'story_id',
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
            exploration_id: 'exp_id',
            outline_is_finalized: false,
            thumbnail_filename: 'fileName',
            thumbnail_bg_color: 'blue',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
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
            thumbnail_filename: 'fileName',
            thumbnail_bg_color: 'blue',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_3',
      },
      language_code: 'en',
      thumbnail_filename: 'fileName',
      thumbnail_bg_color: 'blue',
      url_fragment: 'url',
      meta_tag_content: 'meta',
    };

    sampleStory = Story.createFromBackendDict(sampleStoryBackendObject);
  });

  it('should show stale tab info modal and change the favicon', () => {
    spyOn(storyEditorStateService, 'getStory').and.returnValue(sampleStory);
    let storyEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'story',
      'story_id',
      2,
      1,
      false
    );
    spyOn(
      localStorageService,
      'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(storyEditorBrowserTabsInfo);
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    spyOn(faviconService, 'setFavicon').and.callFake(() => {});
    spyOn(
      storyEditorStalenessDetectionService,
      'showStaleTabInfoModal'
    ).and.callThrough();
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);

    storyEditorStalenessDetectionService.init();
    storyEditorStalenessDetectionService.staleTabEventEmitter.emit();

    expect(
      storyEditorStalenessDetectionService.showStaleTabInfoModal
    ).toHaveBeenCalled();
    expect(faviconService.setFavicon).toHaveBeenCalledWith(
      '/assets/images/favicon_alert/favicon_alert.ico'
    );
    expect(ngbModal.open).toHaveBeenCalled();

    storyEditorStateService.onStoryInitialized.emit();

    expect(
      storyEditorStalenessDetectionService.showStaleTabInfoModal
    ).toHaveBeenCalled();
  });

  it(
    'should open or close presence of unsaved changes info modal ' +
      'depending on the presence of unsaved changes on some other tab',
    () => {
      spyOn(storyEditorStateService, 'getStory').and.returnValue(sampleStory);
      let storyEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
        'story',
        'story_id',
        2,
        2,
        true
      );
      spyOn(
        localStorageService,
        'getEntityEditorBrowserTabsInfo'
      ).and.returnValue(storyEditorBrowserTabsInfo);
      spyOn(mockWindowRef.nativeWindow.location, 'reload');
      spyOn(
        storyEditorStalenessDetectionService,
        'showPresenceOfUnsavedChangesModal'
      ).and.callThrough();
      class MockNgbModalRef {
        result = Promise.resolve();
        componentInstance = {};
        dismiss() {}
      }
      const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
      spyOn(ngbModalRef, 'dismiss');
      spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
      spyOn(
        stalenessDetectionService,
        'doesSomeOtherEntityEditorPageHaveUnsavedChanges'
      ).and.returnValues(true, false);

      storyEditorStalenessDetectionService.init();
      storyEditorStalenessDetectionService.presenceOfUnsavedChangesEventEmitter.emit();

      expect(
        storyEditorStalenessDetectionService.showPresenceOfUnsavedChangesModal
      ).toHaveBeenCalled();
      expect(ngbModal.open).toHaveBeenCalled();

      storyEditorStalenessDetectionService.presenceOfUnsavedChangesEventEmitter.emit();

      expect(ngbModalRef.dismiss).toHaveBeenCalled();
    }
  );

  it(
    'should not show the presence of unsaved changes modal on the page' +
      'which itself contains those unsaved changes',
    () => {
      class MockNgbModalRef {
        result = Promise.resolve();
        componentInstance = {};
        dismiss() {}
      }
      const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
      spyOn(ngbModalRef, 'dismiss');
      spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

      storyEditorStalenessDetectionService.init();
      storyEditorStalenessDetectionService.presenceOfUnsavedChangesEventEmitter.emit();

      expect(ngbModal.open).not.toHaveBeenCalled();
    }
  );
});
