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
 * @fileoverview Unit tests for the subtopic editor tab component.
 */

import { EventEmitter } from '@angular/core';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Subtopic editor tab', function() {
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));

  var ctrl = null;
  var skillSummary = null;
  var TopicEditorStateService = null;
  var TopicUpdateService = null;
  var SubtopicValidationService = null;
  var TopicEditorRoutingService = null;
  var TopicObjectFactory = null;
  var MockWindowDimensionsService = {
    isWindowNarrow: () => false
  };
  var $location = null;

  var topicInitializedEventEmitter = null;
  var topicReinitializedEventEmitter = null;

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    TopicUpdateService = $injector.get('TopicUpdateService');
    SubtopicValidationService = $injector.get('SubtopicValidationService');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    $location = $injector.get('$location');

    var MockQuestionBackendApiService = {
      fetchTotalQuestionCountForSkillIdsAsync: async() => Promise.resolve(2)
    };
    var topic = TopicObjectFactory.createInterstitialTopic();
    var subtopic = Subtopic.createFromTitle(1, 'Subtopic1');
    subtopic._skillIds = ['skill_1'];
    subtopic.setUrlFragment('dummy-url');
    skillSummary = ShortSkillSummary.create(
      'skill_1', 'Description 1');
    topic._uncategorizedSkillSummaries = [skillSummary];
    var subtopicPage = SubtopicPage.createDefault('asd2r42', 1);
    topic._id = 'sndsjfn42';

    topicInitializedEventEmitter = new EventEmitter();
    topicReinitializedEventEmitter = new EventEmitter();

    spyOnProperty(TopicEditorStateService, 'onTopicInitialized').and.callFake(
      function() {
        return topicInitializedEventEmitter;
      });
    spyOnProperty(
      TopicEditorStateService, 'onTopicReinitialized').and.callFake(
      function() {
        return topicReinitializedEventEmitter;
      });

    topic.getSubtopicById = function(id) {
      return id === 99 ? null : subtopic;
    };
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(TopicEditorStateService, 'hasLoadedTopic').and.returnValue(true);
    spyOn(
      TopicEditorStateService,
      'getSubtopicPage').and.returnValue(subtopicPage);
    $location.path('/subtopic_editor/1');
    ctrl = $componentController('subtopicEditorTab', {
      QuestionBackendApiService: MockQuestionBackendApiService,
      WindowDimensionsService: MockWindowDimensionsService
    });
    ctrl.$onInit();
    ctrl.initEditor();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should initialize the variables', function() {
    expect(ctrl.editableTitle).toEqual('Subtopic1');
  });

  it('should call TopicUpdateService if subtopic title updates', function() {
    var titleSpy = spyOn(TopicUpdateService, 'setSubtopicTitle');
    ctrl.updateSubtopicTitle('New title');
    expect(titleSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService if subtopic title is not updated',
    function() {
      ctrl.updateSubtopicTitle('New title');
      var titleSpy = spyOn(TopicUpdateService, 'setSubtopicTitle');
      ctrl.updateSubtopicTitle('New title');
      expect(titleSpy).not.toHaveBeenCalled();
    });

  it('should call TopicUpdateService if subtopic url fragment is updated',
    function() {
      var urlFragmentSpy = spyOn(TopicUpdateService, 'setSubtopicUrlFragment');
      ctrl.updateSubtopicUrlFragment('new-url');
      expect(urlFragmentSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService when url fragment has not changed',
    function() {
      ctrl.updateSubtopicUrlFragment('subtopic-url');
      ctrl.initialSubtopicUrlFragment = 'subtopic-url';
      var urlFragmentSpy = spyOn(TopicUpdateService, 'setSubtopicUrlFragment');
      ctrl.updateSubtopicUrlFragment('subtopic-url');
      expect(urlFragmentSpy).not.toHaveBeenCalled();
    });

  it('should not call TopicUpdateService if subtopic url fragment is invalid',
    function() {
      var urlFragmentSpy = spyOn(TopicUpdateService, 'setSubtopicUrlFragment');
      ctrl.updateSubtopicUrlFragment('new url');
      expect(urlFragmentSpy).not.toHaveBeenCalled();
      ctrl.updateSubtopicUrlFragment('New-Url');
      expect(urlFragmentSpy).not.toHaveBeenCalled();
      ctrl.updateSubtopicUrlFragment('new-url-');
      expect(urlFragmentSpy).not.toHaveBeenCalled();
      ctrl.updateSubtopicUrlFragment('new123url');
      expect(urlFragmentSpy).not.toHaveBeenCalled();
    });

  it('should call TopicUpdateService if subtopic thumbnail updates',
    function() {
      var thubmnailSpy = (
        spyOn(TopicUpdateService, 'setSubtopicThumbnailFilename'));
      ctrl.updateSubtopicThumbnailFilename('img.svg');
      expect(thubmnailSpy).toHaveBeenCalled();
    });

  it('should call TopicUpdateService if subtopic thumbnail is not updated',
    function() {
      ctrl.updateSubtopicThumbnailFilename('img.svg');
      var thubmnailSpy = spyOn(TopicUpdateService, 'setSubtopicTitle');
      ctrl.updateSubtopicThumbnailFilename('img.svg');
      expect(thubmnailSpy).not.toHaveBeenCalled();
    });

  it('should call TopicUpdateService if subtopic thumbnail bg color updates',
    function() {
      var thubmnailBgSpy = (
        spyOn(TopicUpdateService, 'setSubtopicThumbnailBgColor'));
      ctrl.updateSubtopicThumbnailBgColor('#FFFFFF');
      expect(thubmnailBgSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService if subtopic ' +
      'thumbnail bg color is not updated',
  function() {
    ctrl.updateSubtopicThumbnailBgColor('#FFFFFF');
    var thubmnailBgSpy = spyOn(
      TopicUpdateService, 'setSubtopicThumbnailBgColor');
    ctrl.updateSubtopicThumbnailBgColor('#FFFFFF');
    expect(thubmnailBgSpy).not.toHaveBeenCalled();
  });

  it('should return skill editor URL', function() {
    var skillId = 'asd4242a';
    expect(ctrl.getSkillEditorUrl(skillId)).toEqual(
      '/skill_editor/' + skillId);
  });

  it('should show schema editor', function() {
    expect(ctrl.schemaEditorIsShown).toEqual(false);
    ctrl.showSchemaEditor();
    expect(ctrl.schemaEditorIsShown).toEqual(true);
  });

  it('should return if skill is deleted', function() {
    var skillSummary = ShortSkillSummary.create(
      '1', 'Skill description');
    expect(ctrl.isSkillDeleted(skillSummary)).toEqual(false);
  });

  it('should call TopicUpdateService when skill is rearranged',
    function() {
      var removeSkillSpy = spyOn(
        TopicUpdateService, 'rearrangeSkillInSubtopic');
      ctrl.onRearrangeMoveSkillFinish(1);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService if skill is rearranged to the ' +
      'original place', function() {
    ctrl.onRearrangeMoveSkillStart(10);
    var removeSkillSpy = spyOn(
      TopicUpdateService, 'rearrangeSkillInSubtopic');
    ctrl.onRearrangeMoveSkillFinish(10);
    expect(removeSkillSpy).not.toHaveBeenCalled();
  });

  it('should record the index of the skill to move', function() {
    ctrl.onRearrangeMoveSkillStart(10);
    expect(ctrl.fromIndex).toEqual(10);
  });

  it('should set the error message if subtopic title is invalid', function() {
    expect(ctrl.errorMsg).toEqual(null);
    spyOn(SubtopicValidationService, 'checkValidSubtopicName')
      .and.callFake(() => false);
    ctrl.updateSubtopicTitle('New Subtopic1');
    expect(ctrl.errorMsg).toEqual(
      'A subtopic with this title already exists');
  });

  it('should reset the error message', function() {
    spyOn(SubtopicValidationService, 'checkValidSubtopicName')
      .and.callFake(() => false);
    ctrl.updateSubtopicTitle('New Subtopic1');
    expect(ctrl.errorMsg).toEqual(
      'A subtopic with this title already exists');
    ctrl.resetErrorMsg();
    expect(ctrl.errorMsg).toEqual(null);
  });

  it('should call TopicUpdateService to update the SubtopicPageContent',
    function() {
      var updateSubtopicSpy = (
        spyOn(TopicUpdateService, 'setSubtopicPageContentsHtml'));
      ctrl.htmlData = 'new html data';
      ctrl.updateHtmlData();
      expect(updateSubtopicSpy).toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if skill is removed from subtopic',
    function() {
      var removeSkillSpy = (
        spyOn(TopicUpdateService, 'removeSkillFromSubtopic'));
      ctrl.removeSkillFromSubtopic(0, null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if skill is removed from topic',
    function() {
      var removeSkillSpy = (
        spyOn(TopicUpdateService, 'removeSkillFromSubtopic'));
      ctrl.removeSkillFromTopic(skillSummary);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should set skill edit options index', function() {
    ctrl.showSkillEditOptions(10);
    expect(ctrl.selectedSkillEditOptionsIndex).toEqual(10);
    ctrl.showSkillEditOptions(20);
    expect(ctrl.selectedSkillEditOptionsIndex).toEqual(20);
  });

  it('should toggle skills list preview only in mobile view', function() {
    MockWindowDimensionsService.isWindowNarrow = () => true;
    expect(ctrl.skillsListIsShown).toEqual(true);
    ctrl.togglePreviewSkillCard();
    expect(ctrl.skillsListIsShown).toEqual(false);
    ctrl.togglePreviewSkillCard();
    expect(ctrl.skillsListIsShown).toEqual(true);
    ctrl.togglePreviewSkillCard();

    MockWindowDimensionsService.isWindowNarrow = () => false;
    ctrl.skillsListIsShown = true;
    ctrl.togglePreviewSkillCard();
    expect(ctrl.skillsListIsShown).toEqual(true);
  });

  it('should toggle subtopic editor card only in mobile view', function() {
    MockWindowDimensionsService.isWindowNarrow = () => true;
    expect(ctrl.subtopicEditorCardIsShown).toEqual(true);
    ctrl.toggleSubtopicEditorCard();
    expect(ctrl.subtopicEditorCardIsShown).toEqual(false);
    ctrl.toggleSubtopicEditorCard();
    expect(ctrl.subtopicEditorCardIsShown).toEqual(true);
    ctrl.toggleSubtopicEditorCard();

    MockWindowDimensionsService.isWindowNarrow = () => false;
    ctrl.subtopicEditorCardIsShown = true;
    ctrl.toggleSubtopicEditorCard();
    expect(ctrl.subtopicEditorCardIsShown).toEqual(true);
  });

  it('should toggle subtopic preview', function() {
    expect(ctrl.subtopicPreviewCardIsShown).toEqual(false);
    ctrl.toggleSubtopicPreview();
    expect(ctrl.subtopicPreviewCardIsShown).toEqual(true);
    ctrl.toggleSubtopicPreview();
    expect(ctrl.subtopicPreviewCardIsShown).toEqual(false);
    ctrl.toggleSubtopicPreview();
  });

  it('should call TopicEditorRoutingService to navigate To Topic Editor',
    function() {
      var navigateSpy = spyOn(TopicEditorRoutingService, 'navigateToMainTab');
      ctrl.navigateToTopicEditor();
      expect(navigateSpy).toHaveBeenCalled();
    });

  it('should call initEditor when topic is initialized', function() {
    spyOn(ctrl, 'initEditor').and.callThrough();
    topicInitializedEventEmitter.emit();
    expect(ctrl.initEditor).toHaveBeenCalledTimes(1);
    topicReinitializedEventEmitter.emit();
    expect(ctrl.initEditor).toHaveBeenCalledTimes(2);
  });

  it('should hide the html data input on canceling', function() {
    ctrl.schemaEditorIsShown = true;
    ctrl.cancelHtmlDataChange();
    expect(ctrl.schemaEditorIsShown).toEqual(false);
  });

  it('should redirect to topic editor if subtopic id is invalid', function() {
    var navigateSpy = spyOn(TopicEditorRoutingService, 'navigateToMainTab');
    $location.path('/subtopic_editor/99');
    ctrl.initEditor();
    expect(navigateSpy).toHaveBeenCalled();
  });
});
