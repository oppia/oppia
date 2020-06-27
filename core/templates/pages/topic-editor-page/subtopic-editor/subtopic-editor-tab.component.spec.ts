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

describe('Subtopic editor tab', function() {
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
  var TopicObjectFactory = null;
  var SubtopicObjectFactory = null;
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
    SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    ImageUploadHelperService = $injector.get('ImageUploadHelperService');
    directive = $injector.get('subtopicEditorTabDirective')[0];

    var topic = TopicObjectFactory.createInterstitialTopic();
    var subtopic = SubtopicObjectFactory.createFromTitle(1, 'Subtopic1');
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

    ctrl = $componentController('subtopicEditorTab');
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

  it('should call TopicUpdateService to delete uncategorized skill',
    function() {
      var uncategorizedSkillSpy = (
        spyOn(TopicUpdateService, 'removeUncategorizedSkill'));
      var skillSummary = SkillSummaryObjectFactory.create(
        '1', 'Skill description');
      ctrl.deleteUncategorizedSkillFromTopic(skillSummary);
      expect(uncategorizedSkillSpy).toHaveBeenCalled();
    });

  it('should return if skill is deleted', function() {
    var skillSummary = SkillSummaryObjectFactory.create(
      '1', 'Skill description');
    expect(ctrl.isSkillDeleted(skillSummary)).toEqual(false);
  });

  it('should record skill summary to move and subtopic Id', function() {
    var skillSummary = SkillSummaryObjectFactory.create(
      '1', 'Skill description');
    ctrl.onMoveSkillStart(1, skillSummary);
    expect(ctrl.skillSummaryToMove).toEqual(skillSummary);
    expect(ctrl.oldSubtopicId).toEqual(1);
  });

  it('should call TopicUpdateService when skill is moved', function() {
    var moveSkillSpy = spyOn(TopicUpdateService, 'moveSkillToSubtopic');
    ctrl.onMoveSkillFinish(1);
    expect(moveSkillSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService when skill is removed from subtopic',
    function() {
      var removeSkillSpy = spyOn(TopicUpdateService, 'removeSkillFromSubtopic');
      ctrl.onMoveSkillFinish(null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService when skill is moved to same subtopic',
    function() {
      var removeSkillSpy = spyOn(TopicUpdateService, 'removeSkillFromSubtopic');
      ctrl.oldSubtopicId = null;
      ctrl.onMoveSkillFinish(null);
      expect(removeSkillSpy).not.toHaveBeenCalled();
    });

  it('should call SkillCreationService to create skill', function() {
    var skillSpy = spyOn(EntityCreationService, 'createSkill');
    ctrl.createSkill();
    expect(skillSpy).toHaveBeenCalled();
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
});
