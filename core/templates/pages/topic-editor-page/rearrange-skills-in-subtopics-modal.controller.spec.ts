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
 * @fileoverview Unit tests for RearrangeSkillsInSubtopicsModalController.
 */


import { UpgradedServices } from 'services/UpgradedServices';

describe('Rearrange Skills In Subtopic Modal Controller', function() {
  var $scope = null;
  var ctrl = null;
  var topic = null;
  var $uibModalInstance = null;
  var TopicEditorStateService = null;
  var SkillSummaryObjectFactory = null;
  var TopicUpdateService;
  var SubtopicObjectFactory;
  var TopicObjectFactory;
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');
    TopicUpdateService = $injector.get('TopicUpdateService');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    $uibModalInstance = $injector.get('$uibModal');
    $scope = $rootScope.$new();
    var subtopic = SubtopicObjectFactory.createFromTitle(1, 'subtopic1');
    topic = TopicObjectFactory.createInterstitialTopic();
    topic._subtopics = [subtopic];
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    ctrl = $controller('RearrangeSkillsInSubtopicsModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,

    });
  }));

  it('should initialize the variables', function() {
    ctrl.init();
    expect(ctrl.topic).toEqual(topic);
  });

  it('get skill editor url', function() {
    expect(ctrl.getSkillEditorUrl('1')).toBe('/skill_editor/1');
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
    ctrl.onMoveSkillEnd(1);
    expect(moveSkillSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService when skill is removed from subtopic',
    function() {
      var removeSkillSpy = spyOn(TopicUpdateService, 'removeSkillFromSubtopic');
      ctrl.onMoveSkillEnd(null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService when skill is moved to same subtopic',
    function() {
      var removeSkillSpy = spyOn(TopicUpdateService, 'removeSkillFromSubtopic');
      ctrl.oldSubtopicId = null;
      ctrl.onMoveSkillEnd(null);
      expect(removeSkillSpy).not.toHaveBeenCalled();
    });

  it('should not call TopicUpdateService if subtopic name validation fails',
    function() {
      ctrl.editableName = 'subtopic1';
      var subtopicTitleSpy = spyOn(TopicUpdateService, 'setSubtopicTitle');
      ctrl.updateSubtopicTitle(1);
      expect(subtopicTitleSpy).not.toHaveBeenCalled();
    });

  it('should call TopicUpdateService to update subtopic title', function() {
    var subtopicTitleSpy = spyOn(TopicUpdateService, 'setSubtopicTitle');
    ctrl.updateSubtopicTitle(1);
    expect(subtopicTitleSpy).toHaveBeenCalled();
  });

  it('should call set and reset the selected subtopic index', function() {
    ctrl.editNameOfSubtopicWithId(1);
    expect(ctrl.selectedSubtopicId).toEqual(1);
    ctrl.editNameOfSubtopicWithId(10);
    expect(ctrl.selectedSubtopicId).toEqual(10);
    ctrl.editNameOfSubtopicWithId(0);
    expect(ctrl.editableName).toEqual('');
    expect(ctrl.selectedSubtopicId).toEqual(0);
  });
});
