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
 * @fileoverview Unit tests for topic editor page staleness detection service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { TopicBackendDict, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
import { WindowRef } from 'services/contextual/window-ref.service';
import { FaviconService } from 'services/favicon.service';
import { LocalStorageService } from 'services/local-storage.service';
import { StalenessDetectionService } from 'services/staleness-detection.service';
import { TopicEditorStalenessDetectionService } from './topic-editor-staleness-detection.service';
import { TopicEditorStateService } from './topic-editor-state.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      reload: () => {}
    }
  };
}

describe('Topic editor staleness detection service', () => {
  let topicEditorStalenessDetectionService:
    TopicEditorStalenessDetectionService;
  let topicDict: TopicBackendDict;
  let topicObjectFactory: TopicObjectFactory;
  let topicEditorStateService: TopicEditorStateService;
  let localStorageService: LocalStorageService;
  let ngbModal: NgbModal;
  let faviconService: FaviconService;
  let mockWindowRef: MockWindowRef;
  let undoRedoService: UndoRedoService;
  let stalenessDetectionService: StalenessDetectionService;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StalenessDetectionService,
        TopicEditorStateService,
        FaviconService,
        LocalStorageService,
        UndoRedoService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ]
    }).compileComponents();

    topicEditorStalenessDetectionService =
      TestBed.inject(TopicEditorStalenessDetectionService);
    topicObjectFactory = TestBed.inject(TopicObjectFactory);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    localStorageService = TestBed.inject(LocalStorageService);
    ngbModal = TestBed.inject(NgbModal);
    faviconService = TestBed.inject(FaviconService);
    undoRedoService = TestBed.inject(UndoRedoService);
    stalenessDetectionService = TestBed.inject(StalenessDetectionService);
  });

  beforeEach(() => {
    topicDict = {
      id: 'topic_id',
      name: 'topic_name',
      abbreviated_name: 'topic',
      description: 'topic description',
      language_code: 'en',
      uncategorized_skill_ids: [],
      next_subtopic_id: 2,
      version: 1,
      thumbnail_filename: '',
      thumbnail_bg_color: '',
      subtopics: [],
      canonical_story_references: [],
      additional_story_references: [],
      url_fragment: 'fragment',
      practice_tab_is_displayed: true,
      meta_tag_content: 'content',
      page_title_fragment_for_web: 'title_fragment'
    };
  });

  it('should show stale tab info modal and change the favicon', () => {
    let topic = topicObjectFactory.create(topicDict, {});
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    let topicEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'topic', 'topic_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(topicEditorBrowserTabsInfo);
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    spyOn(faviconService, 'setFavicon').and.callFake(() => {});
    spyOn(
      topicEditorStalenessDetectionService, 'showStaleTabInfoModal'
    ).and.callThrough();
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);

    topicEditorStalenessDetectionService.init();
    topicEditorStalenessDetectionService.staleTabEventEmitter.emit();

    expect(
      topicEditorStalenessDetectionService.showStaleTabInfoModal
    ).toHaveBeenCalled();
    expect(faviconService.setFavicon).toHaveBeenCalledWith(
      '/assets/images/favicon_alert/favicon_alert.ico');
    expect(ngbModal.open).toHaveBeenCalled();

    topicEditorStateService.onTopicInitialized.emit();

    expect(
      topicEditorStalenessDetectionService.showStaleTabInfoModal
    ).toHaveBeenCalled();
  });

  it('should open or close presence of unsaved changes info modal ' +
  'depending on the presence of unsaved changes on some other tab', () => {
    let topic = topicObjectFactory.create(topicDict, {});
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    let topicEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'topic', 'topic_id', 2, 2, true);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(topicEditorBrowserTabsInfo);
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    spyOn(
      topicEditorStalenessDetectionService, 'showPresenceOfUnsavedChangesModal'
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

    topicEditorStalenessDetectionService.init();
    topicEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(
      topicEditorStalenessDetectionService.showPresenceOfUnsavedChangesModal
    ).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();

    topicEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(ngbModalRef.dismiss).toHaveBeenCalled();
  });

  it('should not show the presence of unsaved changes modal on the page' +
  'which itself contains those unsaved changes', () => {
    class MockNgbModalRef {
      result = Promise.resolve();
      componentInstance = {};
      dismiss() {}
    }
    const ngbModalRef = new MockNgbModalRef() as NgbModalRef;
    spyOn(ngbModalRef, 'dismiss');
    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef);
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

    topicEditorStalenessDetectionService.init();
    topicEditorStalenessDetectionService
      .presenceOfUnsavedChangesEventEmitter.emit();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });
});
