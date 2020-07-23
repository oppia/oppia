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
 * @fileoverview Unit tests for story editor page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/story-editor-page/story-editor-page.component.ts');

describe('Story editor page', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var $rootScope = null;
  var $uibModal = null;
  var PageTitleService = null;
  var StoryEditorStateService = null;
  var StoryEditorNavigationService = null;
  var EditableStoryBackendApiService = null;
  var StoryObjectFactory = null;
  var UndoRedoService = null;
  var UrlService = null;

  var mockedWindow = {
    open: () => {}
  };
  var MockStoryEditorNavigationService = {
    activeTab: 'story_editor',
    checkIfPresentInChapterEditor: () => true,
    getActiveTab: () => this.activeTab,
    navigateToChapterEditor: () => {
      this.activeTab = 'chapter_editor';
    },
    navigateToStoryEditor: () => {
      this.activeTab = 'story_editor';
    },
    navigateToStoryPreview: () => {
      this.activeTab = 'story_preview';
    }
  };
  var story = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockedWindow);
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    PageTitleService = $injector.get('PageTitleService');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    StoryEditorNavigationService = $injector.get(
      'StoryEditorNavigationService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    EditableStoryBackendApiService = $injector.get(
      'EditableStoryBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    UrlService = $injector.get('UrlService');
    story = StoryObjectFactory.createFromBackendDict({
      id: '2',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [{
          id: 'node_2',
          title: 'Title 2',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: 'asd4242',
          outline_is_finalized: false,
          description: 'Description',
          thumbnail_filename: 'img.png',
          thumbnail_bg_color: '#a33f40'
        }, {
          id: 'node_3',
          title: 'Title 3',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false,
          description: 'Description',
          thumbnail_filename: 'img.png',
          thumbnail_bg_color: '#a33f40'
        }],
        next_node_id: 'node_4'
      },
      language_code: 'en',
      version: 1,
      corresponding_topic_id: '2',
      thumbnail_bg_color: null,
      thumbnail_filename: null
    });
    var MockEditableStoryBackendApiService = {
      validateExplorations: () => Promise.resolve([])
    };
    spyOn(StoryEditorStateService, 'getStory').and.returnValue(story);

    $scope = $rootScope.$new();
    ctrl = $componentController('storyEditorPage', {
      $scope: $scope,
      StoryEditorNavigationService: MockStoryEditorNavigationService,
      EditableStoryBackendApiService: MockEditableStoryBackendApiService
    });
  }));

  it('should load story based on its id on url when component is initialized' +
    ' and set page title', function() {
    spyOn(StoryEditorStateService, 'loadStory').and.stub();
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setPageTitle').and.callThrough();

    ctrl.$onInit();
    $scope.$broadcast('storyInitialized');
    $scope.$broadcast('storyReinitialized');

    expect(StoryEditorStateService.loadStory).toHaveBeenCalledWith('story_1');
    expect(PageTitleService.setPageTitle).toHaveBeenCalledTimes(2);
  });

  it('should return to topic editor page when closing confirmation modal',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      ctrl.returnToTopicEditorPage();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

  it('should return to topic editor page when dismissing confirmation modal',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });

      ctrl.returnToTopicEditorPage();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

  it('should open topic editor page when there is no change',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
      spyOn(mockedWindow, 'open').and.callThrough();

      ctrl.returnToTopicEditorPage();
      expect(mockedWindow.open).toHaveBeenCalledWith(
        '/topic_editor/2', '_self');
    });

  it('should return the active tab', function() {
    MockStoryEditorNavigationService.navigateToStoryEditor();
    expect(ctrl.getActiveTab()).toEqual('story_editor');
  });

  it('should return warning count', function() {
    spyOn(StoryEditorStateService, 'loadStory').and.stub();
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setPageTitle').and.callThrough();
    MockStoryEditorNavigationService.navigateToStoryEditor();
    ctrl.$onInit();
    expect(ctrl.getTotalWarningsCount()).toEqual(0);
  });

  it('should toggle the display of warnings', function() {
    ctrl.toggleWarnings();
    expect(ctrl.warningsAreShown).toEqual(true);
    ctrl.toggleWarnings();
    expect(ctrl.warningsAreShown).toEqual(false);
    ctrl.toggleWarnings();
    expect(ctrl.warningsAreShown).toEqual(true);
  });

  it('should return if the main editor tab is select', function() {
    MockStoryEditorNavigationService.navigateToStoryEditor();
    expect(ctrl.isMainEditorTabSelected()).toEqual(true);
    MockStoryEditorNavigationService.navigateToStoryPreview();
    expect(ctrl.isMainEditorTabSelected()).toEqual(false);
  });

  it('should return the navbar helper text', function() {
    MockStoryEditorNavigationService.navigateToChapterEditor();
    expect(ctrl.getNavbarText()).toEqual('Chapter Editor');
    MockStoryEditorNavigationService.navigateToStoryPreview();
    expect(ctrl.getNavbarText()).toEqual('Story Preview');
    MockStoryEditorNavigationService.navigateToStoryEditor();
    expect(ctrl.getNavbarText()).toEqual('Story Editor');
  });
});
