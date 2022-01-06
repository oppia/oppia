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
 * @fileoverview Unit tests for the story editor directive.
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}
describe('Story editor Directive having two story nodes', function() {
  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();
  var $uibModal = null;
  let ngbModal: NgbModal = null;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var directive = null;
  var story = null;
  var WindowDimensionsService = null;
  var UndoRedoService = null;
  var StoryEditorNavigationService = null;
  var StoryUpdateService = null;
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;
  var WindowRef = null;
  let fetchSpy = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    ngbModal = $injector.get('NgbModal');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    StoryEditorNavigationService = $injector.get(
      'StoryEditorNavigationService');
    UndoRedoService = $injector.get('UndoRedoService');
    WindowRef = $injector.get('WindowRef');
    StoryUpdateService = $injector.get('StoryUpdateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    $q = $injector.get('$q');


    var sampleStoryBackendObject = {
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
    story = StoryObjectFactory.createFromBackendDict(sampleStoryBackendObject);
    directive = $injector.get('storyEditorDirective')[0];

    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    fetchSpy = spyOn(StoryEditorStateService, 'getStory')
      .and.returnValue(story);
    spyOn(StoryEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(StoryEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(StoryEditorStateService, 'getTopicName').and.returnValue('addition');
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      $uibModal
    });
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should init the controller', function() {
    expect($scope.storyPreviewCardIsShown).toEqual(false);
    expect($scope.mainStoryCardIsShown).toEqual(true);
    expect($scope.getTopicName()).toEqual('addition');
  });

  it('should toggle story preview card', function() {
    $scope.storyPreviewCardIsShown = false;
    $scope.togglePreview();
    expect($scope.mainStoryCardIsShown).toEqual(true);
  });

  it('should toggle chapter edit options', function() {
    $scope.toggleChapterEditOptions(10);
    expect($scope.selectedChapterIndex).toEqual(10);
    $scope.toggleChapterEditOptions(10);
    expect($scope.selectedChapterIndex).toEqual(-1);
  });

  it('should toggle chapter lists', function() {
    $scope.chaptersListIsShown = false;
    $scope.toggleChapterLists();
    expect($scope.chaptersListIsShown).toEqual(true);

    $scope.toggleChapterLists();
    expect($scope.chaptersListIsShown).toEqual(false);
  });

  it('should toggle main story card', function() {
    $scope.mainStoryCardIsShown = false;
    $scope.toggleStoryEditorCard();
    expect($scope.mainStoryCardIsShown).toEqual(true);

    $scope.toggleStoryEditorCard();
    expect($scope.mainStoryCardIsShown).toEqual(false);
  });

  it('should open and close notes editor', function() {
    $scope.notesEditorIsShown = false;
    $scope.openNotesEditor();
    expect($scope.notesEditorIsShown).toEqual(true);

    $scope.closeNotesEditor();
    expect($scope.notesEditorIsShown).toEqual(false);
  });

  it('should return when the node is the initial node', function() {
    expect($scope.isInitialNode('node_1')).toEqual(false);
    expect($scope.isInitialNode('node_2')).toEqual(true);
  });

  it('should note the index of the node being dragged', function() {
    $scope.onMoveChapterStart(3, null);
    expect($scope.dragStartIndex).toEqual(3);
  });

  it('should call StoryUpdate service to rearrange nodes', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'rearrangeNodeInStory');
    $scope.rearrangeNodeInStory(10);
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should not rearrange nodes if starting node is same ' +
    'as the end node', function() {
    let storyUpdateSpy = spyOn(StoryUpdateService, 'rearrangeNodeInStory');

    $scope.dragStartIndex = 10;
    $scope.rearrangeNodeInStory(10);

    expect(storyUpdateSpy).not.toHaveBeenCalled();
  });

  it('should set initial node id when re arranging node in ' +
    'story and start index is set to 0', function() {
    let storyUpdateSpy = spyOn(StoryUpdateService, 'setInitialNodeId')
      .and.returnValue(null);

    $scope.story = story;
    $scope.dragStartIndex = 0;
    $scope.rearrangeNodeInStory(1);

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should set initial node id when re arranging node in ' +
    'story and last index is set to 0', function() {
    let storyUpdateSpy = spyOn(StoryUpdateService, 'setInitialNodeId')
      .and.returnValue(null);

    $scope.story = story;
    $scope.dragStartIndex = 1;
    $scope.rearrangeNodeInStory(0);

    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate to update story title', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setStoryTitle');
    $scope.updateStoryTitle('title99');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate to update story thumbnail filename', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setThumbnailFilename');
    $scope.updateStoryThumbnailFilename('abcd');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate to update story thumbnail bg color', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setThumbnailBgColor');
    $scope.updateStoryThumbnailBgColor('abcd');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should return the classroom and topic url fragment', function() {
    expect($scope.getClassroomUrlFragment()).toEqual('math');
    expect($scope.getTopicUrlFragment()).toEqual('fractions');
  });

  it('should not open confirm or cancel modal if the initial node is' +
      ' being deleted',
  function() {
    var modalSpy = spyOn($uibModal, 'open');
    $scope.deleteNode('node_2');
    expect(modalSpy).not.toHaveBeenCalled();
  });

  it('should open confirm or cancel modal when a node is being deleted',
    function() {
      var deferred = $q.defer();
      deferred.resolve();
      var modalSpy = spyOn($uibModal, 'open').and.returnValue(
        {result: deferred.promise});
      var storyUpdateSpy = spyOn(StoryUpdateService, 'deleteStoryNode');
      $scope.deleteNode('node_1');
      $rootScope.$apply();
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdateService to add destination node id',
    function() {
      var modalSpy = spyOn($uibModal, 'open').and.callThrough();
      $scope.createNode();
      $rootScope.$apply();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdateService to add destination node id',
    function() {
      var deferred = $q.defer();
      deferred.resolve();
      var storySpy = spyOn(StoryUpdateService, 'addDestinationNodeIdToNode');
      var modalSpy = spyOn($uibModal, 'open').and.returnValue(
        {result: deferred.promise});
      $scope.createNode();
      $rootScope.$apply();
      expect(modalSpy).toHaveBeenCalled();
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdateService to update story notes', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setStoryNotes');
    $scope.updateNotes('Updated the story notes');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdateService to update story notes', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setStoryMetaTagContent');
    $scope.updateStoryMetaTagContent('storyone');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call not update url fragment if it is unchanged', function() {
    $scope.storyUrlFragmentExists = true;
    $scope.updateStoryUrlFragment('story_title');
    expect($scope.storyUrlFragmentExists).toEqual(false);
  });

  it('should update the existence of story url fragment', function() {
    var storyUpdateSpy = spyOn(
      StoryEditorStateService,
      'updateExistenceOfStoryUrlFragment').and.callFake(
      (urlFragment, callback) => callback());
    $scope.updateStoryUrlFragment('story_second');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should set story url fragment', function() {
    var storyUpdateSpy = spyOn(
      StoryUpdateService, 'setStoryUrlFragment');
    $scope.updateStoryUrlFragment('');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryEditorNavigationService to navigate to chapters',
    function() {
      var navigationSpy = spyOn(
        StoryEditorNavigationService, 'navigateToChapterEditorWithId');
      $scope.navigateToChapterWithId('chapter_1', 0);
      expect(navigationSpy).toHaveBeenCalled();
    });

  it('should make story description status', function() {
    $scope.editableDescriptionIsEmpty = true;
    $scope.storyDescriptionChanged = false;
    $scope.updateStoryDescriptionStatus('New description');
    $scope.editableDescriptionIsEmpty = false;
    $scope.storyDescriptionChanged = true;
  });

  it('should update the story description', function() {
    var storyUpdateSpy = spyOn(
      StoryUpdateService, 'setStoryDescription');
    $scope.updateStoryDescription('New skill description');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should show modal if there are unsaved changes on leaving', function() {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(10);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      }) as NgbModalRef;
    });
    $scope.returnToTopicEditorPage();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should show modal if there are unsaved changes and click reject',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(10);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.reject()
        }) as NgbModalRef;
      });

      $scope.returnToTopicEditorPage();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call Windowref to open a tab', function() {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
    spyOnProperty(WindowRef, 'nativeWindow').and.returnValue({
      open: jasmine.createSpy('open', () => {})
    });
    $scope.returnToTopicEditorPage();
    expect(WindowRef.nativeWindow.open).toHaveBeenCalled();
  });

  it('should fetch story when story is initialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(StoryEditorStateService, 'onStoryInitialized')
      .and.returnValue(mockEventEmitter);

    ctrl.$onInit();
    $rootScope.$apply();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch story when story is reinitialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(StoryEditorStateService, 'onStoryReinitialized')
      .and.returnValue(mockEventEmitter);

    ctrl.$onInit();
    $rootScope.$apply();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch story node when story editor is opened', () => {
    $scope.getDestinationNodeIds = () => [];
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(StoryEditorStateService, 'onViewStoryNodeEditor')
      .and.returnValue(mockEventEmitter);

    ctrl.$onInit();
    $rootScope.$apply();
    mockEventEmitter.emit();

    expect(fetchSpy).toHaveBeenCalled();
  });
});

describe('Story editor Directive having one story node', function() {
  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();
  var $uibModal = null;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var directive = null;
  var story = null;
  var WindowDimensionsService = null;

  var StoryEditorStateService = null;
  var StoryObjectFactory = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $injector.get('NgbModal');
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    $q = $injector.get('$q');


    var sampleStoryBackendObject = {
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
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    story = StoryObjectFactory.createFromBackendDict(sampleStoryBackendObject);
    directive = $injector.get('storyEditorDirective')[0];

    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(StoryEditorStateService, 'getStory')
      .and.returnValue(story);
    spyOn(StoryEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(StoryEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(StoryEditorStateService, 'getTopicName').and.returnValue('addition');
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      $uibModal
    });
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should call StoryUpdateService to add destination node id',
    function() {
      var deferred = $q.defer();
      deferred.resolve();
      var modalSpy = spyOn($uibModal, 'open').and.returnValue(
        {result: deferred.promise});

      $scope.createNode();
      $rootScope.$apply();

      expect(modalSpy).toHaveBeenCalled();
    });
});
