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
 * @fileoverview Unit tests for the skill editor main tab directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Skill editor main tab directive', function() {
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  var directive = null;
  var QuestionCreationService = null;
  var SkillEditorStateService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    directive = $injector.get('skillEditorMainTabDirective')[0];
    QuestionCreationService = $injector.get('QuestionCreationService');
    SkillEditorStateService = $injector.get('SkillEditorStateService');

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should initialize the variables', function() {
    expect($scope.selectedTopic).toEqual(null);
    expect($scope.topicName).toEqual(null);
    expect($scope.subtopicName).toEqual(null);
  });

  it('should call the Question Creation service', function() {
    var questionSpy = spyOn(QuestionCreationService, 'createQuestion');
    $scope.createQuestion();
    expect(questionSpy).toHaveBeenCalled();
  });

  it('should return if skill has been loaded', function() {
    expect($scope.hasLoadedSkill()).toBe(false);
    spyOn(SkillEditorStateService, 'hasLoadedSkill').and.returnValue(true);
    expect($scope.hasLoadedSkill()).toBe(true);
  });

  it('should return topic name', function() {
    expect($scope.topicName).toEqual(null);
    $scope.topicName = 'Topic1';
    expect($scope.getTopicName()).toEqual('Topic1');
  });

  it('should return subtopic name', function() {
    expect($scope.subtopicName).toEqual(null);
    $scope.subtopicName = 'Subtopic1';
    expect($scope.getSubtopicName()).toEqual('Subtopic1');
  });
});
