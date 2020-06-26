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
 * @fileoverview Unit tests for CreateNewSkillModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Create New Skill Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var RubricObjectFactory = null;
  var SkillCreationService = null;
  var SubtitledHtmlObjectFactory = null;

  var rubrics = [];

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    RubricObjectFactory = $injector.get('RubricObjectFactory');
    SkillCreationService = $injector.get('SkillCreationService');
    SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    rubrics = [{
      difficulty: 'Easy',
      explanations: ['This is a first explanation']
    }, {
      difficulty: 'Medium',
      explanations: [
        'This is a first explanation', 'This is a second explanation']
    }].map(function(rubric) {
      return RubricObjectFactory.createFromBackendDict(rubric);
    });

    spyOn(SkillCreationService, 'getSkillDescriptionStatus').and.returnValue(
      'changed');

    $scope = $rootScope.$new();
    $controller('CreateNewSkillModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      rubrics: rubrics
    });
  }));

  it('should init the variables', function() {
    expect($scope.newSkillDescription).toBe('');
    expect($scope.rubrics).toEqual(rubrics);
    expect($scope.errorMsg).toBe('');
    expect($scope.bindableDict).toEqual({
      displayedConceptCardExplanation: ''
    });
  });

  it('should watch for new skill description changes', function() {
    spyOn(SkillCreationService, 'markChangeInSkillDescription')
      .and.callThrough();
    $scope.newSkillDescription = 'This is a new skill';
    $scope.$apply();

    expect($scope.rubrics[1].getExplanations()).toEqual([
      '<p>This is a new skill</p>',
      'This is a second explanation']);

    $scope.newSkillDescription = '';
    $scope.$apply();

    expect($scope.rubrics[1].getExplanations()).toEqual([
      '<p></p>',
      'This is a second explanation']);
    expect(SkillCreationService.markChangeInSkillDescription)
      .toHaveBeenCalled();
  });

  it('should save explanation', function() {
    var subtitledHtmlObject = SubtitledHtmlObjectFactory.createDefault(
      'This is a html', 'This is a content');
    $scope.onSaveExplanation(subtitledHtmlObject);

    expect($scope.bindableDict.displayedConceptCardExplanation).toBe(
      'This is a html');
  });

  it('should save rubric', function() {
    var difficulty = 'Easy';
    var explanations = ['New explanation'];

    $scope.onSaveRubric(difficulty, explanations);

    expect($scope.rubrics[0].getExplanations()).toEqual(explanations);
  });

  it('should save a new skill', function() {
    $scope.newSkillDescription = '';
    $scope.$apply();

    $scope.createNewSkill();

    expect($scope.errorMsg).toBe(
      'Please use a non-empty description consisting of ' +
      'alphanumeric characters, spaces and/or hyphens.');
    expect($uibModalInstance.close).not.toHaveBeenCalled();

    $scope.resetErrorMsg();
    expect($scope.errorMsg).toBe('');
  });

  it('should save a new skill', function() {
    var subtitledHtmlObject = SubtitledHtmlObjectFactory.createDefault(
      'This is a html', 'This is a content');
    $scope.onSaveExplanation(subtitledHtmlObject);

    $scope.newSkillDescription = 'This is a new skill';
    $scope.$apply();

    rubrics[1].setExplanations([
      '<p>This is a new skill</p>',
      'This is a second explanation'
    ]);

    $scope.createNewSkill();
    expect($scope.errorMsg).toBe('');
    expect($uibModalInstance.close).toHaveBeenCalledWith({
      description: 'This is a new skill',
      rubrics: rubrics,
      explanation: {
        html: 'This is a html',
        content_id: 'This is a content'
      }
    });
  });
});
