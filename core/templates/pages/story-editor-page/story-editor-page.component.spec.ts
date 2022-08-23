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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { EntityEditorBrowserTabsInfoDomainConstants } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';

require('pages/story-editor-page/story-editor-page.component.ts');

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

describe('Story editor page', function() {
  var ctrl = null;
  var $scope = null;
  var $rootScope = null;
  let ngbModal: NgbModal = null;
  var PageTitleService = null;
  var PreventPageUnloadEventService = null;
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;
  var UndoRedoService = null;
  var LocalStorageService = null;
  var StoryEditorStalenessDetectionService = null;
  var UrlService = null;

  var mockedWindow = {
    open: () => {},
    addEventListener: () => {}
  };
  var MockStoryEditorNavigationService = {
    activeTab: 'story_editor',
    checkIfPresentInChapterEditor: () => this.activeTab === 'chapter_editor',
    checkIfPresentInStoryPreviewTab: () => this.activeTab === 'story_preview',
    getActiveTab: () => this.activeTab,
    navigateToChapterEditor: () => {
      this.activeTab = 'chapter_editor';
    },
    navigateToStoryEditor: () => {
      this.activeTab = 'story_editor';
    },
    navigateToStoryPreviewTab: () => {
      this.activeTab = 'story_preview';
    }
  };
  var story = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockedWindow);

    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    ngbModal = $injector.get('NgbModal');
    PageTitleService = $injector.get('PageTitleService');
    PreventPageUnloadEventService = $injector.get(
      'PreventPageUnloadEventService');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');
    UrlService = $injector.get('UrlService');
    LocalStorageService = $injector.get('LocalStorageService');
    StoryEditorStalenessDetectionService = $injector.get(
      'StoryEditorStalenessDetectionService');
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
      thumbnail_filename: null,
      url_fragment: 'story-url-fragment'
    });
    var MockEditableStoryBackendApiService = {
      validateExplorationsAsync: async() => Promise.resolve([])
    };
    spyOn(StoryEditorStateService, 'getStory').and.returnValue(story);
    LocalStorageService.removeOpenedEntityEditorBrowserTabsInfo(
      EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS);

    $scope = $rootScope.$new();
    ctrl = $componentController('storyEditorPage', {
      $scope: $scope,
      StoryEditorNavigationService: MockStoryEditorNavigationService,
      EditableStoryBackendApiService: MockEditableStoryBackendApiService
    });
  }));

  it('should load story based on its id on url when component is initialized' +
    ' and set page title', function() {
    let storyInitializedEventEmitter = new EventEmitter();
    let storyReinitializedEventEmitter = new EventEmitter();
    spyOn(StoryEditorStateService, 'loadStory').and.callFake(function() {
      storyInitializedEventEmitter.emit();
      storyReinitializedEventEmitter.emit();
    });
    spyOnProperty(
      StoryEditorStateService, 'onStoryInitialized').and.returnValue(
      storyInitializedEventEmitter);
    spyOnProperty(
      StoryEditorStateService, 'onStoryReinitialized').and.returnValue(
      storyReinitializedEventEmitter);
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();
    MockStoryEditorNavigationService.checkIfPresentInChapterEditor = () => true;
    ctrl.$onInit();

    expect(StoryEditorStateService.loadStory).toHaveBeenCalledWith('story_1');
    expect(PageTitleService.setDocumentTitle).toHaveBeenCalledTimes(2);

    ctrl.$onDestroy();
  });

  it('should addListener by passing getChangeCount to ' +
  'PreventPageUnloadEventService', function() {
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle');
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(10);
    spyOn(PreventPageUnloadEventService, 'addListener').and
      .callFake((callback) => callback());

    ctrl.$onInit();

    expect(PreventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });

  it('should return to topic editor page when closing confirmation modal',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve()
        }) as NgbModalRef;
      });

      ctrl.returnToTopicEditorPage();
      $scope.$apply();

      expect(modalSpy).toHaveBeenCalled();
    });

  it('should return to topic editor page when dismissing confirmation modal',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.reject()
        }) as NgbModalRef;
      });

      ctrl.returnToTopicEditorPage();
      $scope.$apply();

      expect(modalSpy).toHaveBeenCalled();
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
    MockStoryEditorNavigationService.activeTab = 'story_editor';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    MockStoryEditorNavigationService.navigateToStoryEditor();
    expect(ctrl.getActiveTab()).toEqual('story_editor');
  });

  it('should return warning count', function() {
    spyOn(StoryEditorStateService, 'loadStory').and.stub();
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();
    MockStoryEditorNavigationService.navigateToStoryEditor();
    ctrl.$onInit();
    expect(ctrl.getTotalWarningsCount()).toEqual(0);
  });

  it('should report if story fragment already exists', () => {
    let storyInitializedEventEmitter = new EventEmitter();
    let storyReinitializedEventEmitter = new EventEmitter();
    spyOn(StoryEditorStateService, 'loadStory').and.callFake(function() {
      storyInitializedEventEmitter.emit();
      storyReinitializedEventEmitter.emit();
    });
    spyOnProperty(
      StoryEditorStateService, 'onStoryInitialized').and.returnValue(
      storyInitializedEventEmitter);
    spyOnProperty(
      StoryEditorStateService, 'onStoryReinitialized').and.returnValue(
      storyReinitializedEventEmitter);
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();
    spyOn(
      StoryEditorStateService,
      'getStoryWithUrlFragmentExists').and.returnValue(true);
    spyOn(StoryEditorStateService, 'getSkillSummaries').and.returnValue([{
      id: 'skill_id'
    }]);
    MockStoryEditorNavigationService.checkIfPresentInChapterEditor = () => true;
    ctrl.$onInit();
    expect(ctrl.validationIssues).toEqual(
      ['Story URL fragment already exists.']);
    ctrl.$onDestroy();
  });

  it('should toggle the display of warnings', function() {
    ctrl.toggleWarnings();
    expect(ctrl.warningsAreShown).toEqual(true);
    ctrl.toggleWarnings();
    expect(ctrl.warningsAreShown).toEqual(false);
    ctrl.toggleWarnings();
    expect(ctrl.warningsAreShown).toEqual(true);
  });

  it('should return true if the main editor tab is select', function() {
    MockStoryEditorNavigationService.activeTab = 'story_editor';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    expect(ctrl.isMainEditorTabSelected()).toEqual(true);

    MockStoryEditorNavigationService.activeTab = 'story_preview';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_preview';
    expect(ctrl.isMainEditorTabSelected()).toEqual(false);
  });

  it('should check if url contains story preview', function() {
    spyOn(StoryEditorStateService, 'loadStory').and.stub();
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();
    MockStoryEditorNavigationService.activeTab = 'story_preview';
    MockStoryEditorNavigationService.checkIfPresentInChapterEditor = (
      () => false);
    MockStoryEditorNavigationService.checkIfPresentInStoryPreviewTab = (
      () => true);
    MockStoryEditorNavigationService.getActiveTab = (
      () => 'story_preview');
    ctrl.$onInit();
    expect(ctrl.isMainEditorTabSelected()).toEqual(false);

    MockStoryEditorNavigationService.activeTab = 'story_editor';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
  });

  it('should navigate to story editor', function() {
    MockStoryEditorNavigationService.activeTab = 'story_editor';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    ctrl.navigateToStoryEditor();
    expect(ctrl.getActiveTab()).toEqual('story_editor');
  });

  it('should navigate to story preview tab', function() {
    MockStoryEditorNavigationService.activeTab = 'story_preview';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_preview';
    ctrl.navigateToStoryPreviewTab();
    expect(ctrl.getActiveTab()).toEqual('story_preview');
  });

  it('should return the navbar helper text', function() {
    MockStoryEditorNavigationService.activeTab = 'chapter_editor';
    MockStoryEditorNavigationService.getActiveTab = () => 'chapter_editor';
    expect(ctrl.getNavbarText()).toEqual('Chapter Editor');

    MockStoryEditorNavigationService.activeTab = 'story_preview';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_preview';
    expect(ctrl.getNavbarText()).toEqual('Story Preview');

    MockStoryEditorNavigationService.activeTab = 'story_editor';
    MockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    expect(ctrl.getNavbarText()).toEqual('Story Editor');
  });

  it('should init page on undo redo change applied', () => {
    let mockUndoRedoChangeEventEmitter = new EventEmitter();
    spyOn(UndoRedoService, 'getUndoRedoChangeEventEmitter')
      .and.returnValue(
        mockUndoRedoChangeEventEmitter);
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle');
    ctrl.$onInit();
    mockUndoRedoChangeEventEmitter.emit();
    expect(PageTitleService.setDocumentTitle).toHaveBeenCalled();
    ctrl.$onDestroy();
  });

  it('should create story editor browser tabs info on ' +
  'local storage when a new tab opens', () => {
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle');
    ctrl.$onInit();

    let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo).toBeNull();

    // Opening the first tab.
    StoryEditorStateService.onStoryInitialized.emit();
    storyEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo).toBeDefined();
    expect(storyEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    // Opening the second tab.
    StoryEditorStateService.onStoryInitialized.emit();
    storyEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(2);
  });

  it('should update story editor browser tabs info on local storage when ' +
  'some new changes are saved', () => {
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle');
    ctrl.$onInit();

    let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo).toBeNull();

    // First time opening of the tab.
    StoryEditorStateService.onStoryInitialized.emit();
    storyEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo.getLatestVersion()).toEqual(1);

    // Save some changes on the story and increasing its version.
    story._version = 2;
    StoryEditorStateService.onStoryReinitialized.emit();
    storyEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo.getLatestVersion()).toEqual(2);
  });

  it('should decrement number of opened story editor tabs when ' +
  'a tab is closed', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle');
    ctrl.$onInit();

    // Opening of the first tab.
    StoryEditorStateService.onStoryInitialized.emit();
    // Opening of the second tab.
    StoryEditorStateService.onStoryInitialized.emit();

    let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    // Making some unsaved changes on the editor page.
    storyEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(true);
    LocalStorageService.updateEntityEditorBrowserTabsInfo(
      storyEditorBrowserTabsInfo, EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS);

    expect(
      storyEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeTrue();
    expect(storyEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(2);

    ctrl.onClosingStoryEditorBrowserTab();
    storyEditorBrowserTabsInfo = (
      LocalStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    // Since the tab containing unsaved changes is closed, the value of
    // unsaved changes status will become false.
    expect(
      storyEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();
  });

  it('should emit the stale tab and presence of unsaved changes events ' +
  'when the \'storage\' event is triggered', () => {
    spyOn(
      StoryEditorStalenessDetectionService.staleTabEventEmitter, 'emit'
    ).and.callThrough();
    spyOn(
      StoryEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter, 'emit'
    ).and.callThrough();
    spyOn(LocalStorageService, 'registerNewStorageEventListener').and.callFake(
      (callback) => {
        document.addEventListener('storage', callback);
      });
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setDocumentTitle');
    ctrl.$onInit();

    let storageEvent = new StorageEvent('storage', {
      key: EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS
    });
    document.dispatchEvent(storageEvent);

    expect(
      StoryEditorStalenessDetectionService.staleTabEventEmitter.emit
    ).toHaveBeenCalled();
    expect(
      StoryEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter.emit
    ).toHaveBeenCalled();
  });
});
