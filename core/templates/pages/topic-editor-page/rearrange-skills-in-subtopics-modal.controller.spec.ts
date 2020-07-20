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
    SkillSummaryObjectFactory = $injector.get('ShortSkillSummaryObjectFactory');
    TopicUpdateService = $injector.get('TopicUpdateService');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    $uibModalInstance = $injector.get('$uibModal');
    $scope = $rootScope.$new();
    var subtopic = SubtopicObjectFactory.createFromTitle(1, 'subtopic1');
    topic = TopicObjectFactory.createInterstitialTopic();
    topic._subtopics = [subtopic];
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    $controller('RearrangeSkillsInSubtopicsModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,

    });
  }));

  it('should initialize the variables', function() {
    $scope.init();
    expect($scope.topic).toEqual(topic);
  });

  it('get skill editor url', function() {
    expect($scope.getSkillEditorUrl('1')).toBe('/skill_editor/1');
  });


  it('should record skill summary to move and subtopic Id', function() {
    var skillSummary = SkillSummaryObjectFactory.create(
      '1', 'Skill description');
    $scope.onMoveSkillStart(1, skillSummary);
    expect($scope.skillSummaryToMove).toEqual(skillSummary);
    expect($scope.oldSubtopicId).toEqual(1);
  });

  it('should call TopicUpdateService when skill is moved', function() {
    var moveSkillSpy = spyOn(TopicUpdateService, 'moveSkillToSubtopic');
    $scope.onMoveSkillEnd(1);
    expect(moveSkillSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService when skill is removed from subtopic',
    function() {
      var removeSkillSpy = spyOn(TopicUpdateService, 'removeSkillFromSubtopic');
      $scope.onMoveSkillEnd(null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService when skill is moved to same subtopic',
    function() {
      var removeSkillSpy = spyOn(TopicUpdateService, 'removeSkillFromSubtopic');
      $scope.oldSubtopicId = null;
      $scope.onMoveSkillEnd(null);
      expect(removeSkillSpy).not.toHaveBeenCalled();
    });
});
