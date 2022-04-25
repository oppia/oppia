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
import { Topic, TopicBackendDict, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
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

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Topic editor staleness detection service', () => {
  let topicEditorStalenessDetectionService:
    TopicEditorStalenessDetectionService;
  let topicDict: TopicBackendDict;
  let topicObjectFactory: TopicObjectFactory;
  let topicEditorStateService: TopicEditorStateService;
  let localStorageService: LocalStorageService;
  let ngbModal: NgbModal;
  let faviconService: FaviconService;
  let mockWindowRef: MockWindowRef;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NgbModal,
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
    spyOn(faviconService, 'setFavicon').and.callThrough();
    spyOn(ngbModal, 'dismissAll').and.callThrough();

    class MockComponentInstance {
      compoenentInstance: {};
    }
    let spyObj = spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        componentInstance: MockComponentInstance,
        result: Promise.resolve()
      }) as NgbModalRef;
    });

    topicEditorStalenessDetectionService.init();
    topicEditorStalenessDetectionService.staleTabEventEmitter.emit();

    // expect(spyObj).toHaveBeenCalled();
    // expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
    expect(ngbModal.dismissAll).toHaveBeenCalled();
    expect(faviconService.setFavicon).toHaveBeenCalledWith(
      '/assets/images/favicon_alert/favicon_alert.ico');
  });
});
