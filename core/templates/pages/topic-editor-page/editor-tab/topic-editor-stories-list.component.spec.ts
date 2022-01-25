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
 * @fileoverview Unit tests for the stories list viewer.
 */

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StorySummary } from 'domain/story/story-summary.model';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

describe('topicEditorStoriesList', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $q = null;
  let $window = null;
  let storySummaries = null;
  let topicUpdateService = null;
  let undoRedoService = null;
  let ngbModal: NgbModal = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    topicUpdateService = $injector.get('TopicUpdateService');
    undoRedoService = $injector.get('UndoRedoService');
    $window = $injector.get('$window');
    ngbModal = $injector.get('NgbModal');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('topicEditorStoriesList', {
      $scope: $scope
    }, {
      getTopic: () => {}
    });

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
  }));

  it('should initialise component when list of stories is displayed', () => {
    ctrl.$onInit();

    expect($scope.STORY_TABLE_COLUMN_HEADINGS).toEqual([
      'title', 'node_count', 'publication_status']);
  });

  it('should set fromIndex when user starts moving a story in the list', () => {
    $scope.fromIndex = 0;

    $scope.onMoveStoryStart(2);

    expect($scope.fromIndex).toBe(2);
  });

  it('should move story to new location when user stops dragging', () => {
    spyOn(topicUpdateService, 'rearrangeCanonicalStory');
    $scope.fromIndex = 1;
    ctrl.storySummaries = storySummaries;

    $scope.onMoveStoryFinish(0);

    expect($scope.toIndex).toBe(0);
    expect(topicUpdateService.rearrangeCanonicalStory).toHaveBeenCalled();
    expect(ctrl.storySummaries[0].getId()).toBe('storyId2');
    expect(ctrl.storySummaries[1].getId()).toBe('storyId');
  });

  it('should not rearrage when user does not change position of the ' +
  'story', () => {
    spyOn(topicUpdateService, 'rearrangeCanonicalStory');
    $scope.fromIndex = 0;
    ctrl.storySummaries = storySummaries;

    $scope.onMoveStoryFinish(0);

    expect($scope.toIndex).toBe(0);
    expect(topicUpdateService.rearrangeCanonicalStory).not.toHaveBeenCalled();
    expect(ctrl.storySummaries[1].getId()).toBe('storyId2');
    expect(ctrl.storySummaries[0].getId()).toBe('storyId');
  });

  it('should delete story when user deletes story', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.resolve()
      } as NgbModalRef
    );
    spyOn(topicUpdateService, 'removeCanonicalStory');
    ctrl.storySummaries = storySummaries;

    expect(ctrl.storySummaries.length).toBe(2);

    $scope.deleteCanonicalStory('storyId');
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(topicUpdateService.removeCanonicalStory).toHaveBeenCalled();
    expect(ctrl.storySummaries.length).toBe(1);
    expect(ctrl.storySummaries[0].getId()).toBe('storyId2');
  });

  it('should close modal when user click cancel button', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.reject()
      } as NgbModalRef
    );
    $scope.deleteCanonicalStory('storyId');
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should open story editor when user clicks a story', () => {
    spyOn($window, 'open');
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);

    $scope.openStoryEditor('storyId');

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

    $scope.openStoryEditor('storyId');
    $scope.$apply();

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

    $scope.openStoryEditor('storyId');
    $scope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  });
});
