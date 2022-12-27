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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { TopicEditorStoriesListComponent } from './topic-editor-stories-list.component';

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

describe('topicEditorStoriesList', () => {
  let component: TopicEditorStoriesListComponent;
  let fixture: ComponentFixture<TopicEditorStoriesListComponent>;
  let storySummaries;
  let topicUpdateService;
  let undoRedoService;
  let ngbModal: NgbModal;

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicEditorStoriesListComponent);
    component = fixture.componentInstance;
    topicUpdateService = TestBed.inject(TopicUpdateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    ngbModal = TestBed.inject(NgbModal);

    storySummaries = [StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    }), StorySummary.createFromBackendDict({
      id: 'storyId2',
      title: 'Story Title2',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: []
    })];
  });

  it('should initialise component when list of stories is displayed', () => {
    component.ngOnInit();

    expect(component.STORY_TABLE_COLUMN_HEADINGS).toEqual([
      'title', 'node_count', 'publication_status']);
  });

  it('should set fromIndex when user starts moving a story in the list', () => {
    component.fromIndex = 0;

    component.onMoveStoryStart(2);

    expect(component.fromIndex).toBe(2);
  });

  it('should move story to new location when user stops dragging', () => {
    spyOn(topicUpdateService, 'rearrangeCanonicalStory');
    component.fromIndex = 1;
    component.storySummaries = storySummaries;

    component.onMoveStoryFinish(0);

    expect(component.toIndex).toBe(0);
    expect(topicUpdateService.rearrangeCanonicalStory).toHaveBeenCalled();
    expect(component.storySummaries[0].getId()).toBe('storyId2');
    expect(component.storySummaries[1].getId()).toBe('storyId');
  });

  it('should not rearrage when user does not change position of the ' +
  'story', () => {
    spyOn(topicUpdateService, 'rearrangeCanonicalStory');
    component.fromIndex = 0;
    component.storySummaries = storySummaries;

    component.onMoveStoryFinish(0);

    expect(component.toIndex).toBe(0);
    expect(topicUpdateService.rearrangeCanonicalStory).not.toHaveBeenCalled();
    expect(component.storySummaries[1].getId()).toBe('storyId2');
    expect(component.storySummaries[0].getId()).toBe('storyId');
  });

  it('should delete story when user deletes story', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: Promise.resolve()
      } as NgbModalRef
    );
    spyOn(topicUpdateService, 'removeCanonicalStory');
    component.storySummaries = storySummaries;

    expect(component.storySummaries.length).toBe(2);

    component.deleteCanonicalStory('storyId');

    expect(ngbModal.open).toHaveBeenCalled();
    expect(topicUpdateService.removeCanonicalStory).toHaveBeenCalled();
    expect(component.storySummaries.length).toBe(1);
    expect(component.storySummaries[0].getId()).toBe('storyId2');
  });

  it('should close modal when user click cancel button', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: Promise.reject()
      } as NgbModalRef
    );
    component.deleteCanonicalStory('storyId');

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should open story editor when user clicks a story', () => {
    spyOn($window, 'open');
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);

    component.openStoryEditor('storyId');

    expect($window.open).toHaveBeenCalled();
  });

  it('should open save changes modal when user tries to open story editor' +
  ' without saving changes', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      }) as NgbModalRef;
    });
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

    component.openStoryEditor('storyId');

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should close save changes modal when closes the saves changes' +
  ' modal', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.reject()
      }) as NgbModalRef;
    });
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

    component.openStoryEditor('storyId');

    expect(modalSpy).toHaveBeenCalled();
  });
});
