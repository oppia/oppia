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
 * @fileoverview Unit tests for topic editor page component.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {Subtopic} from 'domain/topic/subtopic.model';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {StoryReference} from 'domain/topic/story-reference-object.model';
import {Topic} from 'domain/topic/topic-object.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {TopicEditorRoutingService} from './services/topic-editor-routing.service';
import {TopicEditorStateService} from './services/topic-editor-state.service';
import {TopicEditorPageComponent} from './topic-editor-page.component';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {PageTitleService} from 'services/page-title.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';

class MockContextService {
  getExplorationId() {
    return 'explorationId';
  }

  getEntityType() {
    return 'exploration';
  }

  getEntityId() {
    return 'dkfn32sxssasd';
  }
}

describe('Topic editor page', () => {
  let component: TopicEditorPageComponent;
  let fixture: ComponentFixture<TopicEditorPageComponent>;
  let pageTitleService: PageTitleService;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let undoRedoService: UndoRedoService;
  let topicEditorStateService: TopicEditorStateService;
  let urlService: UrlService;
  let topic;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TopicEditorPageComponent],
      providers: [
        PageTitleService,
        PreventPageUnloadEventService,
        TopicEditorRoutingService,
        UndoRedoService,
        TopicEditorStateService,
        UrlService,
        {
          provide: ContextService,
          useClass: MockContextService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicEditorPageComponent);
    component = fixture.componentInstance;

    undoRedoService = TestBed.inject(UndoRedoService);
    pageTitleService = TestBed.inject(PageTitleService);
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService
    );
    topicEditorRoutingService = TestBed.inject(TopicEditorRoutingService);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    urlService = TestBed.inject(UrlService);

    let subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    subtopic._thumbnailFilename = 'b.svg';
    let skillSummary = ShortSkillSummary.create('skill1', 'Addition');
    subtopic._skillSummaries = [skillSummary];
    topic = new Topic(
      'id',
      'Topic name loading',
      'Abbrev. name loading',
      'Url Fragment loading',
      'Topic description loading',
      'en',
      [],
      [],
      [],
      1,
      1,
      [],
      'str',
      '',
      {},
      false,
      '',
      '',
      []
    );
    topic._subtopics = [subtopic];
    topic._thumbnailFilename = 'a.svg';
    topic._metaTagContent = 'topic';
    let story1 = StoryReference.createFromStoryId('storyId1');
    let story2 = StoryReference.createFromStoryId('storyId2');
    topic._canonicalStoryReferences = [story1, story2];
    topic.setName('New Name');
    topic.setUrlFragment('topic-url-fragment');
    topic.setPageTitleFragmentForWeb('topic page title');
    topic.setSkillSummariesForDiagnosticTest([skillSummary]);

    topicEditorStateService.setTopic(topic);
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
  });

  it(
    'should load topic based on its id on url when component is initialized' +
      ' and set page title',
    () => {
      let topicInitializedEventEmitter = new EventEmitter();
      let topicReinitializedEventEmitter = new EventEmitter();
      let undoRedoChangeEventEmitter = new EventEmitter();
      let topicUpdateViewEmitter = new EventEmitter();

      spyOn(topicEditorStateService, 'loadTopic').and.callFake(() => {
        topicInitializedEventEmitter.emit();
        topicReinitializedEventEmitter.emit();
        undoRedoChangeEventEmitter.emit();
        topicUpdateViewEmitter.emit();
      });
      spyOnProperty(
        topicEditorStateService,
        'onTopicInitialized'
      ).and.returnValue(topicInitializedEventEmitter);
      spyOnProperty(
        topicEditorStateService,
        'onTopicReinitialized'
      ).and.returnValue(topicReinitializedEventEmitter);
      spyOnProperty(
        topicEditorRoutingService,
        'updateViewEventEmitter'
      ).and.returnValue(topicUpdateViewEmitter);
      spyOn(urlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
      spyOn(pageTitleService, 'setDocumentTitle').and.callThrough();

      component.ngOnInit();

      expect(topicEditorStateService.loadTopic).toHaveBeenCalledWith('topic_1');
      expect(pageTitleService.setDocumentTitle).toHaveBeenCalledTimes(2);

      component.ngOnDestroy();
    }
  );

  it('should get active tab name', () => {
    component.selectQuestionsTab();
    spyOn(topicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'questions'
    );
    expect(component.getActiveTabName()).toBe('questions');
    expect(component.isInTopicEditorTabs()).toBe(true);
    expect(component.isInPreviewTab()).toBe(false);
    expect(component.isMainEditorTabSelected()).toBe(false);
    expect(component.getNavbarText()).toBe('Question Editor');

    component.hideWarnings();
    expect(component.warningsAreShown).toBe(false);
  });

  it(
    'should addListener by passing getChangeCount to ' +
      'PreventPageUnloadEventService',
    () => {
      spyOn(urlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
      spyOn(pageTitleService, 'setDocumentTitle').and.callThrough();
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
      spyOn(preventPageUnloadEventService, 'addListener').and.callFake(
        callback => callback()
      );

      component.ngOnInit();

      expect(preventPageUnloadEventService.addListener).toHaveBeenCalledWith(
        jasmine.any(Function)
      );
    }
  );

  it('should return the change count', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    expect(component.getChangeListLength()).toBe(10);
  });

  it('should get entity type from context service', () => {
    expect(component.getEntityType()).toBe('exploration');
  });

  it('should open subtopic preview tab if active tab is subtopic editor', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'subtopic_editor'
    );
    const topicPreviewSpy = spyOn(
      topicEditorRoutingService,
      'navigateToSubtopicPreviewTab'
    );
    component.openTopicViewer();
    expect(topicPreviewSpy).toHaveBeenCalled();
  });

  it('should open topic preview if active tab is topic editor', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'topic_editor'
    );
    const topicPreviewSpy = spyOn(
      topicEditorRoutingService,
      'navigateToTopicPreviewTab'
    );
    component.openTopicViewer();
    expect(topicPreviewSpy).toHaveBeenCalled();
  });

  it('should open subtopic preview tab if active tab is subtopic editor', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'subtopic_editor'
    );
    const topicPreviewSpy = spyOn(
      topicEditorRoutingService,
      'navigateToSubtopicPreviewTab'
    );
    component.openTopicViewer();
    expect(topicPreviewSpy).toHaveBeenCalled();
  });

  it('should navigate to topic editor tab in topic editor', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'topic_preview'
    );
    const topicPreviewSpy = spyOn(
      topicEditorRoutingService,
      'navigateToMainTab'
    );
    component.selectMainTab();
    expect(topicPreviewSpy).toHaveBeenCalled();
  });

  it('should select navigate to the subtopic editor tab in subtopic editor', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'subtopic_preview'
    );
    const topicPreviewSpy = spyOn(
      topicEditorRoutingService,
      'navigateToSubtopicEditorWithId'
    );
    component.selectMainTab();
    expect(topicPreviewSpy).toHaveBeenCalled();
  });

  it('should validate the topic and return validation issues', () => {
    component.topic = topic;
    spyOn(topicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      true
    );
    spyOn(
      topicEditorStateService,
      'getTopicWithUrlFragmentExists'
    ).and.returnValue(true);
    component._validateTopic();
    expect(component.validationIssues.length).toEqual(2);
    expect(component.validationIssues[0]).toEqual(
      'A topic with this name already exists.'
    );
    expect(component.validationIssues[1]).toEqual(
      'Topic URL fragment already exists.'
    );
    expect(component.getWarningsCount()).toEqual(2);
    expect(component.getTotalWarningsCount()).toEqual(2);
  });

  it('should return the navbar text', () => {
    component.selectQuestionsTab();
    let routingSpy = spyOn(
      topicEditorRoutingService,
      'getActiveTabName'
    ).and.returnValue('questions');
    expect(component.getNavbarText()).toBe('Question Editor');
    routingSpy.and.returnValue('subtopic_editor');
    expect(component.getNavbarText()).toEqual('Subtopic Editor');
    routingSpy.and.returnValue('subtopic_preview');
    expect(component.getNavbarText()).toEqual('Subtopic Preview');
    routingSpy.and.returnValue('topic_preview');
    expect(component.getNavbarText()).toEqual('Topic Preview');
    routingSpy.and.returnValue('main');
    expect(component.getNavbarText()).toEqual('Topic Editor');
  });

  it(
    'should load topic based on its id on url when undo or redo action' +
      ' is performed',
    () => {
      let mockUndoRedoChangeEventEmitter = new EventEmitter();
      spyOn(undoRedoService, 'getUndoRedoChangeEventEmitter').and.returnValue(
        mockUndoRedoChangeEventEmitter
      );
      spyOn(pageTitleService, 'setDocumentTitle').and.callThrough();
      spyOn(urlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
      component.ngOnInit();
      mockUndoRedoChangeEventEmitter.emit();

      expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
        'New Name - Oppia'
      );
      expect(component.topic).toEqual(topic);

      component.ngOnDestroy();
    }
  );
});
