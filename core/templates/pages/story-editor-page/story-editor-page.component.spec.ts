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

import { EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { EntityEditorBrowserTabsInfoDomainConstants } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import { StoryEditorPageComponent } from './story-editor-page.component';
import { PageTitleService } from '../../services/page-title.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { StoryEditorStateService } from './services/story-editor-state.service';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { UrlService } from 'services/contextual/url.service';
import { LocalStorageService } from 'services/local-storage.service';
import { StoryEditorStalenessDetectionService } from './services/story-editor-staleness-detection.service';
import { Story, StoryBackendDict } from '../../domain/story/StoryObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EditableStoryBackendApiService } from '../../domain/story/editable-story-backend-api.service';
import { StoryEditorNavigationService } from './services/story-editor-navigation.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

class MockStoryEditorNavigationService {
  activeTab: string = 'story_editor';
  checkIfPresentInChapterEditor = () => this.activeTab === 'chapter_editor';
  checkIfPresentInStoryPreviewTab = () => this.activeTab === 'story_preview';
  getActiveTab = () => this.activeTab;
  navigateToChapterEditor = () => {
    this.activeTab = 'chapter_editor';
  };

  navigateToStoryEditor = () => {
    this.activeTab = 'story_editor';
  };

  navigateToStoryPreviewTab = () => {
    this.activeTab = 'story_preview';
  };
}


class MockEditableStoryBackendApiService {
  newBackendStoryObject!: StoryBackendDict;
  failure: string | null = null;

  async fetchStoryAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve({
          story: this.newBackendStoryObject,
          topicName: 'Topic Name',
          storyIsPublished: false,
          skillSummaries: [{
            id: 'Skill 1',
            description: 'Skill Description',
            language_code: 'en',
            version: 1,
            misconception_count: 0,
            worked_examples_count: 0,
            skill_model_created_on: 0,
            skill_model_last_updated: 0,
          }],
          classroomUrlFragment: 'classroomUrlFragment',
          topicUrlFragment: 'topicUrlFragment'
        });
      } else {
        reject();
      }
    });
  }

  async updateStoryAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve(this.newBackendStoryObject);
      } else {
        reject();
      }
    });
  }

  async changeStoryPublicationStatusAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve({});
      } else {
        reject();
      }
    });
  }

  async doesStoryWithUrlFragmentExistAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        console.error('test');
        resolve(false);
      } else {
        reject();
      }
    });
  }
}

describe('Story Editor Page Component', () => {
  let component: StoryEditorPageComponent;
  let fixture: ComponentFixture<StoryEditorPageComponent>;
  let ngbModal: NgbModal;
  let pageTitleService: PageTitleService;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let storyEditorStateService: StoryEditorStateService;
  let storyObjectFactory: StoryObjectFactory;
  let undoRedoService: UndoRedoService;
  let localStorageService: LocalStorageService;
  let storyEditorStalenessDetectionService:
    StoryEditorStalenessDetectionService;
  let urlService: UrlService;
  let mockStoryEditorNavigationService: MockStoryEditorNavigationService;
  let story: Story;

  let mockedWindow = {
    open: () => {},
    addEventListener: () => {}
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StoryEditorPageComponent],
      providers: [
        PageTitleService,
        PreventPageUnloadEventService,
        StoryEditorStateService,
        StoryObjectFactory,
        UndoRedoService,
        LocalStorageService,
        StoryEditorStalenessDetectionService,
        UrlService,
        {
          provide: EditableStoryBackendApiService,
          useClass: MockEditableStoryBackendApiService
        },
        {
          provide: StoryEditorNavigationService,
          useClass: MockStoryEditorNavigationService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryEditorPageComponent);
    component = fixture.componentInstance;
    mockStoryEditorNavigationService = (
      new MockStoryEditorNavigationService());
    ngbModal = TestBed.inject(NgbModal);
    pageTitleService = TestBed.inject(PageTitleService);
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    storyObjectFactory = TestBed.inject(StoryObjectFactory);
    undoRedoService = TestBed.inject(UndoRedoService);
    urlService = TestBed.inject(UrlService);
    localStorageService = TestBed.inject(LocalStorageService);
    storyEditorStalenessDetectionService = TestBed.inject(
      StoryEditorStalenessDetectionService);
    story = storyObjectFactory.createFromBackendDict({
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
    } as unknown as StoryBackendDict);

    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    localStorageService.removeOpenedEntityEditorBrowserTabsInfo(
      EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS);
  });

  it('should load story based on its id on url when component is initialized' +
    ' and set page title', () => {
    let storyInitializedEventEmitter = new EventEmitter();
    let storyReinitializedEventEmitter = new EventEmitter();
    spyOn(storyEditorStateService, 'loadStory').and.callFake(() => {
      storyInitializedEventEmitter.emit();
      storyReinitializedEventEmitter.emit();
    });
    spyOnProperty(
      storyEditorStateService, 'onStoryInitialized').and.returnValue(
      storyInitializedEventEmitter);
    spyOnProperty(
      storyEditorStateService, 'onStoryReinitialized').and.returnValue(
      storyReinitializedEventEmitter);
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle').and.callThrough();
    mockStoryEditorNavigationService
      .checkIfPresentInChapterEditor = () => true;
    component.ngOnInit();

    expect(storyEditorStateService.loadStory).toHaveBeenCalledWith('story_1');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledTimes(2);

    component.ngOnDestroy();
  });

  it('should addListener by passing getChangeCount to ' +
  'PreventPageUnloadEventService', () => {
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle');
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    spyOn(preventPageUnloadEventService, 'addListener').and
      .callFake((callback) => callback());

    component.ngOnInit();

    expect(preventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });

  it('should return to topic editor page when closing confirmation modal',
    () => {
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve()
        }) as NgbModalRef;
      });

      component.returnToTopicEditorPage();

      expect(modalSpy).toHaveBeenCalled();
    });

  it('should return to topic editor page when dismissing confirmation modal',
    () => {
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.reject()
        }) as NgbModalRef;
      });

      component.returnToTopicEditorPage();

      expect(modalSpy).toHaveBeenCalled();
    });

  it('should open topic editor page when there is no change',
    () => {
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
      spyOn(mockedWindow, 'open').and.callThrough();

      component.returnToTopicEditorPage();
      expect(mockedWindow.open).toHaveBeenCalledWith(
        '/topic_editor/2', '_self');
    });

  it('should return the active tab', () => {
    mockStoryEditorNavigationService.activeTab = 'story_editor';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    mockStoryEditorNavigationService.navigateToStoryEditor();
    expect(component.getActiveTab()).toEqual('story_editor');
  });

  it('should return warning count', () => {
    spyOn(storyEditorStateService, 'loadStory').and.stub();
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle').and.callThrough();
    mockStoryEditorNavigationService.navigateToStoryEditor();
    component.ngOnInit();
    expect(component.getTotalWarningsCount()).toEqual(0);
  });

  it('should report if story fragment already exists', () => {
    let storyInitializedEventEmitter = new EventEmitter();
    let storyReinitializedEventEmitter = new EventEmitter();
    spyOn(storyEditorStateService, 'loadStory').and.callFake(() => {
      storyInitializedEventEmitter.emit();
      storyReinitializedEventEmitter.emit();
    });
    spyOnProperty(
      storyEditorStateService, 'onStoryInitialized').and.returnValue(
      storyInitializedEventEmitter);
    spyOnProperty(
      storyEditorStateService, 'onStoryReinitialized').and.returnValue(
      storyReinitializedEventEmitter);
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle').and.callThrough();
    spyOn(
      storyEditorStateService,
      'getStoryWithUrlFragmentExists').and.returnValue(true);
    spyOn(storyEditorStateService, 'getSkillSummaries').and.returnValue([{
      id: 'skill_id'
    }]);
    mockStoryEditorNavigationService.checkIfPresentInChapterEditor = () => true;
    component.ngOnInit();
    expect(component.validationIssues).toEqual(
      ['Story URL fragment already exists.']);
    component.ngOnDestroy();
  });

  it('should toggle the display of warnings', () => {
    component.isWarningsAreShown(true);
    expect(component.warningsAreShown).toEqual(true);
    component.isWarningsAreShown(false);
    expect(component.warningsAreShown).toEqual(false);
    component.isWarningsAreShown(true);
    expect(component.warningsAreShown).toEqual(true);
  });

  it('should return true if the main editor tab is select', () => {
    mockStoryEditorNavigationService.activeTab = 'story_editor';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    expect(component.isMainEditorTabSelected()).toEqual(true);

    mockStoryEditorNavigationService.activeTab = 'story_preview';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_preview';
    expect(component.isMainEditorTabSelected()).toEqual(false);
  });

  it('should check if url contains story preview', () => {
    spyOn(storyEditorStateService, 'loadStory').and.stub();
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle').and.callThrough();
    mockStoryEditorNavigationService.activeTab = 'story_preview';
    mockStoryEditorNavigationService.checkIfPresentInChapterEditor = (
      () => false);
    mockStoryEditorNavigationService.checkIfPresentInStoryPreviewTab = (
      () => true);
    mockStoryEditorNavigationService.getActiveTab = (
      () => 'story_preview');
    component.ngOnInit();
    expect(component.isMainEditorTabSelected()).toEqual(false);

    mockStoryEditorNavigationService.activeTab = 'story_editor';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
  });

  it('should navigate to story editor', () => {
    mockStoryEditorNavigationService.activeTab = 'story_editor';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    component.navigateToStoryEditor();
    expect(component.getActiveTab()).toEqual('story_editor');
  });

  it('should navigate to story preview tab', () => {
    mockStoryEditorNavigationService.activeTab = 'story_preview';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_preview';
    component.navigateToStoryPreviewTab();
    expect(component.getActiveTab()).toEqual('story_preview');
  });

  it('should return the navbar helper text', () => {
    mockStoryEditorNavigationService.activeTab = 'chapter_editor';
    mockStoryEditorNavigationService.getActiveTab = () => 'chapter_editor';
    expect(component.getNavbarText()).toEqual('Chapter Editor');

    mockStoryEditorNavigationService.activeTab = 'story_preview';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_preview';
    expect(component.getNavbarText()).toEqual('Story Preview');

    mockStoryEditorNavigationService.activeTab = 'story_editor';
    mockStoryEditorNavigationService.getActiveTab = () => 'story_editor';
    expect(component.getNavbarText()).toEqual('Story Editor');
  });

  it('should init page on undo redo change applied', () => {
    let mockUndoRedoChangeEventEmitter = new EventEmitter();
    spyOn(undoRedoService, 'getUndoRedoChangeEventEmitter')
      .and.returnValue(
        mockUndoRedoChangeEventEmitter);
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle');
    component.ngOnInit();
    mockUndoRedoChangeEventEmitter.emit();
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('should create story editor browser tabs info on ' +
  'local storage when a new tab opens', () => {
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle');
    component.ngOnInit();

    let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo).toBeNull();

    // Opening the first tab.
    storyEditorStateService.onStoryInitialized.emit();
    storyEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo).toBeDefined();
    expect(storyEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    // Opening the second tab.
    storyEditorStateService.onStoryInitialized.emit();
    storyEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(2);
  });

  it('should update story editor browser tabs info on local storage when ' +
  'some new changes are saved', () => {
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle');
    component.ngOnInit();

    let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo).toBeNull();

    // First time opening of the tab.
    storyEditorStateService.onStoryInitialized.emit();
    storyEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo.getLatestVersion()).toEqual(1);

    // Save some changes on the story and increasing its version.
    story._version = 2;
    storyEditorStateService.onStoryReinitialized.emit();
    storyEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    expect(storyEditorBrowserTabsInfo.getLatestVersion()).toEqual(2);
  });

  it('should decrement number of opened story editor tabs when ' +
  'a tab is closed', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle');
    component.ngOnInit();

    // Opening of the first tab.
    storyEditorStateService.onStoryInitialized.emit();
    // Opening of the second tab.
    storyEditorStateService.onStoryInitialized.emit();

    let storyEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_STORY_EDITOR_BROWSER_TABS, story.getId()));

    // Making some unsaved changes on the editor page.
    storyEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(true);
    localStorageService.updateEntityEditorBrowserTabsInfo(
      storyEditorBrowserTabsInfo, EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS);

    expect(
      storyEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeTrue();
    expect(storyEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(2);

    component.onClosingStoryEditorBrowserTab();
    storyEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
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
      storyEditorStalenessDetectionService.staleTabEventEmitter, 'emit'
    ).and.callThrough();
    spyOn(
      storyEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter, 'emit'
    ).and.callThrough();
    spyOn(localStorageService, 'registerNewStorageEventListener').and.callFake(
      (callback) => {
        document.addEventListener('storage', callback);
      });
    spyOn(urlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(pageTitleService, 'setDocumentTitle');
    component.ngOnInit();

    let storageEvent = new StorageEvent('storage', {
      key: EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_STORY_EDITOR_BROWSER_TABS
    });
    document.dispatchEvent(storageEvent);

    expect(
      storyEditorStalenessDetectionService.staleTabEventEmitter.emit
    ).toHaveBeenCalled();
    expect(
      storyEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter.emit
    ).toHaveBeenCalled();
  });
});
