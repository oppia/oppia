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
 * @fileoverview Unit tests for the Create new skill modal controller.
 */

import { UpgradedServices } from 'services/UpgradedServices';


describe('Create new skill modal', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var $scope = null;
  var $uibModalInstance = null;
  var skillDifficulties = null;
  var RubricObjectFactory = null;
  var COMPONENT_NAME_EXPLANATION = null;
  var SubtitledHtmlObjectFactory = null;
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    skillDifficulties = $injector.get('SKILL_DIFFICULTIES');
    COMPONENT_NAME_EXPLANATION = $injector.get('COMPONENT_NAME_EXPLANATION');
    RubricObjectFactory = $injector.get('RubricObjectFactory');
    SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');
    $scope = $rootScope.$new();
    $controller('CreateNewSkillModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    });
  }));

  it('should init the variables', function() {
    var rubrics = [
      RubricObjectFactory.create(skillDifficulties[0], []),
      RubricObjectFactory.create(skillDifficulties[1], ['']),
      RubricObjectFactory.create(skillDifficulties[2], [])];

    expect($scope.newSkillDescription).toEqual('');
    expect($scope.errorMsg).toEqual('');
    expect($scope.conceptCardExplanationEditorIsShown).toEqual(false);
    expect($scope.bindableDict.displayedConceptCardExplanation).toEqual('');
    expect($scope.HTML_SCHEMA).toEqual({type: 'html'});
    expect($scope.MAX_CHARS_IN_SKILL_DESCRIPTION).toEqual(100);
    expect($scope.newExplanationObject).toEqual(null);
    expect($scope.rubrics).toEqual(rubrics);
  });

  it('should open the concept card editor', function() {
    expect($scope.conceptCardExplanationEditorIsShown).toEqual(false);
    $scope.openConceptCardExplanationEditor();
    expect($scope.conceptCardExplanationEditorIsShown).toEqual(true);
  });

  it('should reset the error message', function() {
    expect($scope.errorMsg).toEqual('');
    $scope.errorMsg = 'Please enter a valid description';
    expect($scope.errorMsg).toEqual('Please enter a valid description');
    $scope.resetErrorMsg();
    expect($scope.errorMsg).toEqual('');
  });

  it('should update the rubrics explanation when skill description updates',
    function() {
      $scope.newSkillDescription = 'Addition';
      $scope.updateSkillDescription();
      expect($scope.rubrics[1].getExplanations()).toEqual(['Addition']);
    });

  it('should dismiss modal', function() {
    $scope.cancel();
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should set the error message if skill description is invalid',
    function() {
      var errorString = (
        'Please use a non-empty description consisting of ' +
        'alphanumeric characters, spaces and/or hyphens.');

      $scope.newSkillDescription = '';
      $scope.createNewSkill();
      expect($scope.errorMsg).toEqual(errorString);
      $scope.resetErrorMsg();

      $scope.newSkillDescription = 'valid';
      $scope.createNewSkill();
      expect($scope.errorMsg).toEqual('');
      $scope.resetErrorMsg();

      $scope.newSkillDescription = 'invalidvalid>>';
      $scope.createNewSkill();
      expect($scope.errorMsg).toEqual(errorString);
    });

  it('should close the modal with skill input values ', function() {
    var rubrics = [
      RubricObjectFactory.create(skillDifficulties[0], []),
      RubricObjectFactory.create(skillDifficulties[1], ['Large addition']),
      RubricObjectFactory.create(skillDifficulties[2], [])];
    var explanationObject = SubtitledHtmlObjectFactory.createDefault(
      $scope.bindableDict.displayedConceptCardExplanation,
      COMPONENT_NAME_EXPLANATION);
    var newExplanationObject = explanationObject.toBackendDict();

    $scope.newSkillDescription = 'Large addition';
    $scope.updateSkillDescription();
    $scope.createNewSkill();
    expect($uibModalInstance.close).toHaveBeenCalledWith({
      description: 'Large addition',
      rubrics: rubrics,
      explanation: newExplanationObject
    });
  });
});
