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
 * @fileoverview Unit tests for the stories list viewer.
 */

import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  waitForAsync,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {StorySummary} from 'domain/story/story-summary.model';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {TopicEditorStoriesListComponent} from './topic-editor-stories-list.component';
import {Topic} from 'domain/topic/topic-object.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PlatformFeatureService} from '../../../services/platform-feature.service';

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false,
    },
  };
}

describe('topicEditorStoriesList', () => {
  let component: TopicEditorStoriesListComponent;
  let fixture: ComponentFixture<TopicEditorStoriesListComponent>;
  let storySummaries: StorySummary[];
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let topicUpdateService: TopicUpdateService;
  let undoRedoService: UndoRedoService;
  let ngbModal: NgbModal;
  let modalRef: {
    componentInstance: Record<string, string>;
    result: Promise<void>;
  };
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicEditorStoriesListComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicEditorStoriesListComponent);
    component = fixture.componentInstance;
    windowRef = TestBed.inject(WindowRef);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    ngbModal = TestBed.inject(NgbModal);
    modalRef = {
      componentInstance: {},
      result: Promise.resolve(),
    };

    storySummaries = [
      StorySummary.createFromBackendDict({
        id: 'storyId',
        title: 'Story Title',
        node_titles: ['node1', 'node2', 'node3'],
        thumbnail_filename: 'thumbnail.jpg',
        thumbnail_bg_color: '#FF9933',
        description: 'This is the story description',
        story_is_published: true,
        completed_node_titles: ['node1'],
        url_fragment: 'story1',
        all_node_dicts: [],
        total_chapters_count: 3,
        published_chapters_count: 2,
        overdue_chapters_count: 0,
        upcoming_chapters_count: 0,
      }),
      StorySummary.createFromBackendDict({
        id: 'storyId2',
        title: 'Story Title2',
        node_titles: ['node1', 'node2', 'node3'],
        thumbnail_filename: 'thumbnail.jpg',
        thumbnail_bg_color: '#FF9933',
        description: 'This is the story description',
        story_is_published: true,
        completed_node_titles: ['node1'],
        url_fragment: 'story1',
        all_node_dicts: [],
        total_chapters_count: 3,
        published_chapters_count: 3,
        overdue_chapters_count: 3,
        upcoming_chapters_count: 0,
      }),
    ];
  });

  it('should get status of Serial Chapter Launch Feature flag', () => {
    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      false;
    expect(component.isSerialChapterLaunchFeatureEnabled()).toEqual(false);

    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      true;
    expect(component.isSerialChapterLaunchFeatureEnabled()).toEqual(true);
  });

  it('should change list order properly', () => {
    spyOn(topicUpdateService, 'rearrangeCanonicalStory').and.stub();

    component.storySummaries = [
      StorySummary.createFromBackendDict({
        id: 'id1',
        title: '',
        node_titles: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: '',
        story_is_published: false,
        completed_node_titles: [],
        url_fragment: '',
        all_node_dicts: [],
      }),
      StorySummary.createFromBackendDict({
        id: 'id2',
        title: '',
        node_titles: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: '',
        story_is_published: false,
        completed_node_titles: [],
        url_fragment: '',
        all_node_dicts: [],
      }),
      StorySummary.createFromBackendDict({
        id: 'id3',
        title: '',
        node_titles: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: '',
        story_is_published: false,
        completed_node_titles: [],
        url_fragment: '',
        all_node_dicts: [],
      }),
    ];
    component.topic = new Topic(
      '',
      '',
      '',
      '',
      '',
      'en',
      [],
      [],
      [],
      1,
      1,
      [],
      '',
      '',
      {},
      false,
      '',
      '',
      []
    );
    const dropEvent: CdkDragDrop<StorySummary[]> = {
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
    component.drop(dropEvent);

    expect(topicUpdateService.rearrangeCanonicalStory).toHaveBeenCalled();
  });

  it('should initialise component when list of stories is displayed', () => {
    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      false;
    component.ngOnInit();
    expect(component.STORY_TABLE_COLUMN_HEADINGS).toEqual([
      'title',
      'node_count',
      'publication_status',
    ]);

    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      true;
    component.ngOnInit();
    expect(component.STORY_TABLE_COLUMN_HEADINGS).toEqual([
      'title',
      'publication_status',
      'node_count',
      'notifications',
    ]);
  });

  it('should delete story when user deletes story', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue(modalRef);
    spyOn(topicUpdateService, 'removeCanonicalStory');
    component.storySummaries = storySummaries;

    expect(component.storySummaries.length).toBe(2);

    component.deleteCanonicalStory('storyId');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(topicUpdateService.removeCanonicalStory).toHaveBeenCalled();
    expect(component.storySummaries.length).toBe(1);
    expect(component.storySummaries[0].getId()).toBe('storyId2');
  }));

  it('should close modal when user click cancel button', () => {
    modalRef.result = Promise.reject();
    spyOn(ngbModal, 'open').and.returnValue(modalRef);
    component.deleteCanonicalStory('storyId');

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should open story editor when user clicks a story', () => {
    spyOn(windowRef.nativeWindow, 'open');
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);

    component.openStoryEditor('storyId');

    expect(windowRef.nativeWindow.open).toHaveBeenCalled();
  });

  it(
    'should open save changes modal when user tries to open story editor' +
      ' without saving changes',
    () => {
      modalRef.componentInstance = {body: 'xyz'};
      const modalSpy = spyOn(ngbModal, 'open').and.returnValue(modalRef);
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

      component.openStoryEditor('storyId');

      expect(modalSpy).toHaveBeenCalled();
    }
  );

  it(
    'should close save changes modal when closes the saves changes' + ' modal',
    () => {
      modalRef.componentInstance = {body: 'xyz'};
      modalRef.result = Promise.reject();
      const modalSpy = spyOn(ngbModal, 'open').and.returnValue(modalRef);
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

      component.openStoryEditor('storyId');

      expect(modalSpy).toHaveBeenCalled();
    }
  );

  it('should return if some chapters are not published', () => {
    expect(component.areChaptersAwaitingPublication(storySummaries[0])).toBe(
      true
    );
    expect(component.areChaptersAwaitingPublication(storySummaries[1])).toBe(
      false
    );
  });

  it('should return if chapter notifications are empty', () => {
    expect(component.isChapterNotificationsEmpty(storySummaries[0])).toBe(true);
    expect(component.isChapterNotificationsEmpty(storySummaries[1])).toBe(
      false
    );
  });
});
