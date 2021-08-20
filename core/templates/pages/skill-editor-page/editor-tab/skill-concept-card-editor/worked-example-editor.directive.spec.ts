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
 * @fileoverview Unit tests for the Worked example editor directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WorkedExample, WorkedExampleBackendDict, WorkedExampleObjectFactory } from 'domain/skill/WorkedExampleObjectFactory';
import { SkillUpdateService } from 'domain/skill/skill-update.service';

describe('Worked example editor directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let workedExampleObjectFactory: WorkedExampleObjectFactory = null;
  let skillUpdateService: SkillUpdateService = null;

  let example1: WorkedExampleBackendDict = null;
  let workedExample1: WorkedExample = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    directive = $injector.get('workedExampleEditorDirective')[0];
    workedExampleObjectFactory = $injector.get('WorkedExampleObjectFactory');
    skillUpdateService = $injector.get('SkillUpdateService');

    example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1',
      },
    };

    workedExample1 = workedExampleObjectFactory.createFromBackendDict(example1);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    $scope.isEditable = function() {
      return true;
    };
    $scope.getIndex = function() {
      return 2;
    };
    $scope.workedExample = workedExample1;
    ctrl.$onInit();
  }));

  it('should set properties when initialized', function() {
    expect($scope.questionEditorIsOpen).toBe(false);
    expect($scope.explanationEditorIsOpen).toBe(false);
    expect($scope.WORKED_EXAMPLE_FORM_SCHEMA).toEqual({
      type: 'html',
      ui_config: {}
    });
  });

  it('should open question editor when calling ' +
    '\'openQuestionEditor\'', function() {
    expect($scope.questionEditorIsOpen).toBe(false);

    $scope.openQuestionEditor();

    expect($scope.questionEditorIsOpen).toBe(true);
  });

  it('should open explanation editor when calling ' +
    '\'openExplanationEditor\'', function() {
    expect($scope.explanationEditorIsOpen).toBe(false);

    $scope.openExplanationEditor();

    expect($scope.explanationEditorIsOpen).toBe(true);
  });

  it('should close question editor when calling ' +
    '\'cancelEditQuestion\'', function() {
    expect($scope.questionEditorIsOpen).toBe(false);

    $scope.openQuestionEditor();

    expect($scope.questionEditorIsOpen).toBe(true);

    $scope.cancelEditQuestion();

    expect($scope.questionEditorIsOpen).toBe(false);
  });

  it('should close explanation editor when calling ' +
    '\'cancelEditExplanation\'', function() {
    expect($scope.explanationEditorIsOpen).toBe(false);

    $scope.openExplanationEditor();

    expect($scope.explanationEditorIsOpen).toBe(true);

    $scope.cancelEditExplanation();

    expect($scope.explanationEditorIsOpen).toBe(false);
  });

  it('should save worked example when calling ' +
    '\'saveWorkedExample\' and in question editor', function() {
    let skillUpdateSpy = spyOn(skillUpdateService, 'updateWorkedExample')
      .and.returnValue(null);

    $scope.saveWorkedExample(true);

    expect(skillUpdateSpy).toHaveBeenCalled();
  });

  it('should save worked example when calling ' +
    '\'saveWorkedExample\' and not in question editor', function() {
    let skillUpdateSpy = spyOn(skillUpdateService, 'updateWorkedExample')
      .and.returnValue(null);

    $scope.saveWorkedExample(false);

    expect(skillUpdateSpy).toHaveBeenCalled();
  });
});
