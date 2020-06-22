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
 * @fileoverview Unit tests for QuestionPlayerConceptCardModalController.
 */


// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Question Player Concept Card Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var SkillObjectFactory = null;

  var skillIds = ['skill1', 'skill2'];
  var skills = null;
  var skillsObject = null;
  var mockWindow = {
    location: {
      replace: jasmine.createSpy('replace')
    }
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
    $provide.value('UrlService', {
      getPathname: () => 'pathname'
    });
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    var skillDifficulties = $injector.get('SKILL_DIFFICULTIES');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };
    var rubricDict = {
      difficulty: skillDifficulties[0],
      explanations: ['explanation']
    };
    var skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {}
      }
    };
    skills = [{
      id: 'skill1',
      description: 'test description 1',
      misconceptions: [misconceptionDict1],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: ['skill_1']
    }, {
      id: 'skill2',
      description: 'test description 2',
      misconceptions: [misconceptionDict1],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: ['skill_1']
    }];

    skillsObject = skills.map(skill => (
      SkillObjectFactory.createFromBackendDict(skill)));

    $scope = $rootScope.$new();
    $controller('QuestionPlayerConceptCardModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      skillIds: skillIds,
      skills: skillsObject
    });
  }));

  it('should check properties set after controller is initialized', function() {
    expect($scope.skillIds).toEqual(skillIds);
    expect($scope.skills).toEqual(skillsObject);
    expect($scope.index).toBe(0);
    expect($scope.modalHeader).toEqual(skillsObject[0]);
    expect($scope.isInTestMode).toBe(true);
  });

  it('should go to next concept card', function() {
    expect($scope.isLastConceptCard()).toBe(false);
    $scope.goToNextConceptCard();
    expect($scope.index).toBe(1);
    expect($scope.modalHeader).toEqual(skillsObject[1]);
    expect($scope.isLastConceptCard()).toBe(true);

    $scope.goToNextConceptCard();
    expect($scope.index).toBe(2);
    expect($scope.modalHeader).toBe(undefined);
  });

  it('should retry test', function() {
    $scope.retryTest();
    expect(mockWindow.location.replace).toHaveBeenCalledWith('pathname');
  });
});
