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

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

require('pages/topic-editor-page/topic-editor-page.component.ts');

import { EventEmitter } from '@angular/core';
import { Subtopic } from 'domain/topic/subtopic.model';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { StoryReference } from 'domain/topic/story-reference-object.model';

describe('Topic editor page', function() {
  var ctrl = null;
  var $scope = null;
  var ContextService = null;
  var PageTitleService = null;
  var PreventPageUnloadEventService = null;
  var TopicEditorRoutingService = null;
  var UndoRedoService = null;
  var TopicEditorStateService = null;
  var UrlService = null;
  var TopicObjectFactory = null;
  var topic = null;

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    UndoRedoService = $injector.get('UndoRedoService');
    PageTitleService = $injector.get('PageTitleService');
    PreventPageUnloadEventService = $injector.get(
      'PreventPageUnloadEventService');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    UrlService = $injector.get('UrlService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');

    var subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    subtopic._thumbnailFilename = 'b.svg';
    var skillSummary = ShortSkillSummary.create(
      'skill1', 'Addition');
    subtopic._skillSummaries = [skillSummary];
    topic = TopicObjectFactory.createInterstitialTopic();
    topic._subtopics = [subtopic];
    topic._thumbnailFilename = 'a.svg';
    topic._metaTagContent = 'topic';
    var story1 = StoryReference.createFromStoryId('storyId1');
    var story2 = StoryReference.createFromStoryId('storyId2');
    topic._canonicalStoryReferences = [story1, story2];
    topic.setName('New Name');
    topic.setUrlFragment('topic-url-fragment');
    topic.setPageTitleFragmentForWeb('topic page title');
    topic.setSkillSummariesForDiagnosticTest([skillSummary]);
    TopicEditorStateService.setTopic(topic);
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    $scope = $rootScope.$new();
    ctrl = $componentController('topicEditorPage', {
      $scope: $scope
    });
  }));

  it('should load topic based on its id on url when component is initialized' +
    ' and set page title', function() {
    let topicInitializedEventEmitter = new EventEmitter();
    let topicReinitializedEventEmitter = new EventEmitter();
    let undoRedoChangeEventEmitter = new EventEmitter();
    let topicUpdateViewEmitter = new EventEmitter();
    spyOn(TopicEditorStateService, 'loadTopic').and.callFake(function() {
      topicInitializedEventEmitter.emit();
      topicReinitializedEventEmitter.emit();
      undoRedoChangeEventEmitter.emit();
      topicUpdateViewEmitter.emit();
    });
    spyOnProperty(
      TopicEditorStateService, 'onTopicInitialized').and.returnValue(
      topicInitializedEventEmitter);
    spyOnProperty(
      TopicEditorStateService, 'onTopicReinitialized').and.returnValue(
      topicReinitializedEventEmitter);
    spyOnProperty(TopicEditorRoutingService, 'updateViewEventEmitter')
      .and.returnValue(topicUpdateViewEmitter);
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();

    ctrl.$onInit();

    expect(TopicEditorStateService.loadTopic).toHaveBeenCalledWith('topic_1');
    expect(PageTitleService.setDocumentTitle).toHaveBeenCalledTimes(2);

    ctrl.$onDestroy();
  });

  it('should get active tab name', function() {
    ctrl.selectQuestionsTab();
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'questions');
    expect(ctrl.getActiveTabName()).toBe('questions');
    expect(ctrl.isInTopicEditorTabs()).toBe(true);
    expect(ctrl.isInPreviewTab()).toBe(false);
    expect(ctrl.isMainEditorTabSelected()).toBe(false);
    expect(ctrl.getNavbarText()).toBe('Question Editor');
  });

  it('should addListener by passing getChangeCount to ' +
  'PreventPageUnloadEventService', function() {
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(10);
    spyOn(PreventPageUnloadEventService, 'addListener').and
      .callFake((callback) => callback());

    ctrl.$onInit();

    expect(PreventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });

  it('should return the change count', function() {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(10);
    expect(ctrl.getChangeListLength()).toBe(10);
  });

  it('should get entity type from context service', function() {
    spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
    expect(ctrl.getEntityType()).toBe('exploration');
  });

  it('should open subtopic preview tab if active tab is subtopic editor',
    function() {
      spyOn(TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
        'subtopic_editor');
      const topicPreviewSpy = spyOn(
        TopicEditorRoutingService, 'navigateToSubtopicPreviewTab');
      ctrl.openTopicViewer();
      expect(topicPreviewSpy).toHaveBeenCalled();
    });

  it('should open topic preview if active tab is topic editor', function() {
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'topic_editor');
    const topicPreviewSpy = spyOn(
      TopicEditorRoutingService, 'navigateToTopicPreviewTab');
    ctrl.openTopicViewer();
    expect(topicPreviewSpy).toHaveBeenCalled();
  });

  it('should open subtopic preview tab if active tab is subtopic editor',
    function() {
      spyOn(TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
        'subtopic_editor');
      const topicPreviewSpy = spyOn(
        TopicEditorRoutingService, 'navigateToSubtopicPreviewTab');
      ctrl.openTopicViewer();
      expect(topicPreviewSpy).toHaveBeenCalled();
    });

  it('should navigate to topic editor tab in topic editor', function() {
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'topic_preview');
    const topicPreviewSpy = spyOn(
      TopicEditorRoutingService, 'navigateToMainTab');
    ctrl.selectMainTab();
    expect(topicPreviewSpy).toHaveBeenCalled();
  });

  it('should select navigate to the subtopic editor tab in subtopic editor',
    function() {
      spyOn(TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
        'subtopic_preview');
      const topicPreviewSpy = spyOn(
        TopicEditorRoutingService, 'navigateToSubtopicEditorWithId');
      ctrl.selectMainTab();
      expect(topicPreviewSpy).toHaveBeenCalled();
    });

  it('should validate the topic and return validation issues', function() {
    ctrl.topic = topic;
    spyOn(
      TopicEditorStateService, 'getTopicWithNameExists').and.returnValue(true);
    spyOn(
      TopicEditorStateService, 'getTopicWithUrlFragmentExists').and.returnValue(
      true);
    ctrl._validateTopic();
    expect(ctrl.validationIssues.length).toEqual(2);
    expect(ctrl.validationIssues[0]).toEqual(
      'A topic with this name already exists.');
    expect(ctrl.validationIssues[1]).toEqual(
      'Topic URL fragment already exists.');
    expect(ctrl.getWarningsCount()).toEqual(2);
    expect(ctrl.getTotalWarningsCount()).toEqual(2);
  });

  it('should return the navbar text', function() {
    ctrl.selectQuestionsTab();
    var routingSpy = spyOn(
      TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'questions');
    expect(ctrl.getNavbarText()).toBe('Question Editor');
    routingSpy.and.returnValue('subtopic_editor');
    expect(ctrl.getNavbarText()).toEqual('Subtopic Editor');
    routingSpy.and.returnValue('subtopic_preview');
    expect(ctrl.getNavbarText()).toEqual('Subtopic Preview');
    routingSpy.and.returnValue('topic_preview');
    expect(ctrl.getNavbarText()).toEqual('Topic Preview');
    routingSpy.and.returnValue('main');
    expect(ctrl.getNavbarText()).toEqual('Topic Editor');
  });

  it('should load topic based on its id on url when undo or redo action' +
  ' is performed', function() {
    let mockUndoRedoChangeEventEmitter = new EventEmitter();
    spyOn(UndoRedoService, 'getUndoRedoChangeEventEmitter')
      .and.returnValue(mockUndoRedoChangeEventEmitter);
    spyOn(PageTitleService, 'setDocumentTitle').and.callThrough();
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    ctrl.$onInit();
    mockUndoRedoChangeEventEmitter.emit();

    expect(PageTitleService.setDocumentTitle)
      .toHaveBeenCalledWith('New Name - Oppia');
    expect(ctrl.topic).toEqual(topic);

    ctrl.$onDestroy();
  });
});
