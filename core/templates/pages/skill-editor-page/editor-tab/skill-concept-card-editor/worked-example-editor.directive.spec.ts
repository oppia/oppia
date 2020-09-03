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
 * @fileoverview Unit tests for the worked example editor directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Worked example editor directive', function() {
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  var $uibModal = null;
  var directive = null;
  var QuestionCreationService = null;
  var WorkedExampleObjectFactory = null;
  var SkillUpdateService = null;
  var $q = null;
  var SkillEditorStateService = null;
  var WindowDimensionsService = null;
  var SkillObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $scope = $rootScope.$new();
    directive = $injector.get('workedExampleEditorDirective')[0];
    QuestionCreationService = $injector.get('QuestionCreationService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    SkillUpdateService = $injector.get('SkillUpdateService');
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    WorkedExampleObjectFactory = $injector.get('WorkedExampleObjectFactory');

    var example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1'
      }
    };
    $scope.workedExample = WorkedExampleObjectFactory.createFromBackendDict(
      example1);
    $scope.isEditable = () => true;
    $scope.getIndex = () => 0;
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should initialize the variables', function() {
    expect($scope.questionEditorIsOpen).toEqual(false);
    expect($scope.explanationEditorIsOpen).toEqual(false);
  });

  it('should open and close question editor', function() {
    expect($scope.questionEditorIsOpen).toEqual(false);
    $scope.openQuestionEditor();
    expect($scope.questionEditorIsOpen).toEqual(true);
    $scope.cancelEditQuestion();
    expect($scope.questionEditorIsOpen).toEqual(false);
  });

  it('should open and close explanation editor', function() {
    expect($scope.explanationEditorIsOpen).toEqual(false);
    $scope.openExplanationEditor();
    expect($scope.explanationEditorIsOpen).toEqual(true);
    $scope.cancelEditExplanation();
    expect($scope.explanationEditorIsOpen).toEqual(false);
  });

  it('should save worked example', function() {
    var skillUpdateSpy = spyOn(SkillUpdateService, 'updateWorkedExample');
    $scope.questionEditorIsOpen = true;
    $scope.saveWorkedExample(true);
    expect($scope.questionEditorIsOpen).toEqual(false);

    $scope.explanationEditorIsOpen = true;
    $scope.saveWorkedExample(false);
    expect($scope.explanationEditorIsOpen).toEqual(false);

    expect(skillUpdateSpy).toHaveBeenCalled();
  });
});
