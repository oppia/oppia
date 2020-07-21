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

import { UpgradedServices } from 'services/UpgradedServices';

fdescribe('Subtopic editor tab', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  var ContextService = null;
  var ImageUploadHelperService = null;
  var directive = null;
  var TopicEditorStateService = null;
  var TopicUpdateService = null;
  var EntityCreationService = null;
  var SubtopicValidationService = null;
  var TopicEditorRoutingService = null;
  var WindowDimensionsService = null;
  var TopicObjectFactory = null;
  var SubtopicObjectFactory = null;
  var QuestionBackendApiService = null;
  var SkillSummaryObjectFactory = null;
  var SubtopicPageObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ContextService = $injector.get('ContextService');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    TopicUpdateService = $injector.get('TopicUpdateService');
    SubtopicValidationService = $injector.get('SubtopicValidationService');
    EntityCreationService = $injector.get('EntityCreationService');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    ImageUploadHelperService = $injector.get('ImageUploadHelperService');
    QuestionBackendApiService = $injector.get('QuestionBackendApiService');
    directive = $injector.get('subtopicEditorTabDirective')[0];

    var MockQuestionBackendApiService = {
      fetchTotalQuestionCountForSkillIds: () => Promise.resolve(2)
    };
    var topic = TopicObjectFactory.createInterstitialTopic();
    var subtopic = SubtopicObjectFactory.createFromTitle(1, 'Subtopic1');
    subtopic._skillIds = ['skill_1'];
    var subtopicPage = SubtopicPageObjectFactory.createDefault('asd2r42', '1');
    topic._id = 'sndsjfn42';

    topic.getSubtopicById = function() {
      return subtopic;
    };
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(TopicEditorStateService,
      'getSubtopicPage').and.returnValue(subtopicPage);
    spyOn(TopicEditorRoutingService, 'getSubtopicIdFromUrl')
      .and.returnValue('1');
    var MockWindowDimensionsService = {
      isWindowNarrow: () => false
    };
    ctrl = $componentController('subtopicEditorTab', {
      QuestionBackendApiService: MockQuestionBackendApiService,
      WindowDimensionsService: MockWindowDimensionsService
    });
    ctrl.$onInit();
  }));

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
    var skillSummary = SkillSummaryObjectFactory.create(
      '1', 'Skill description');
    expect(ctrl.isSkillDeleted(skillSummary)).toEqual(false);
  });

  it('should call SkillCreationService to create skill', function() {
    var skillSpy = spyOn(EntityCreationService, 'createSkill');
    ctrl.createSkill();
    expect(skillSpy).toHaveBeenCalled();
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
      var skillSummary = SkillSummaryObjectFactory.create(
        'skill_1', 'Description 1');
      ctrl.removeSkillFromTopic(0, skillSummary);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should set skill edit options index', function() {
    ctrl.showSkillEditOptions(10);
    expect(ctrl.selectedSkillEditOptionsIndex).toEqual(10);
    ctrl.showSkillEditOptions(20);
    expect(ctrl.selectedSkillEditOptionsIndex).toEqual(20);
  });

  it('should toggle skills list preview', function() {
    expect(ctrl.skillsListIsShown).toEqual(true);
    ctrl.togglePreviewSkillCard();
    expect(ctrl.skillsListIsShown).toEqual(false);
    ctrl.togglePreviewSkillCard();
    expect(ctrl.skillsListIsShown).toEqual(true);
    ctrl.togglePreviewSkillCard();
  });

  it('should toggle subtopic preview', function() {
    expect(ctrl.subtopicPreviewCardIsShown).toEqual(false);
    ctrl.toggleSubtopicPreview();
    expect(ctrl.subtopicPreviewCardIsShown).toEqual(true);
    ctrl.toggleSubtopicPreview();
    expect(ctrl.subtopicPreviewCardIsShown).toEqual(false);
    ctrl.toggleSubtopicPreview();
  });
});
