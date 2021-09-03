// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for Solution Editor Component.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('SolutionEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;

  let EditabilityService = null;
  let ExplorationHtmlFormatterService = null;
  let StateSolutionService = null;
  let StateInteractionIdService = null;
  let StateCustomizationArgsService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    EditabilityService = $injector.get('EditabilityService');
    StateSolutionService = $injector.get('StateSolutionService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    EditabilityService = $injector.get('EditabilityService');
    ExplorationHtmlFormatterService = $injector.get(
      'ExplorationHtmlFormatterService');
    StateCustomizationArgsService = $injector.get(
      'StateCustomizationArgsService');

    ctrl = $componentController('solutionEditor', {
      $scope: $scope
    });

    StateSolutionService.savedMemento = {
      correctAnswer: 'Ans'
    };
    StateInteractionIdService.savedMemento = 'TextInput';
    StateCustomizationArgsService.savedMemento = 'Args';
  }));

  it('should set component properties on initialization', () => {
    spyOn(EditabilityService, 'isEditable').and.returnValue(true);

    ctrl.$onInit();

    expect(ctrl.isEditable).toBe(true);
    expect(ctrl.EXPLANATION_FORM_SCHEMA).toEqual({
      type: 'html',
      ui_config: {}
    });
  });

  it('should get answer HTML', () => {
    spyOn(ExplorationHtmlFormatterService, 'getAnswerHtml').and.returnValue({
      answer: 'Answer'
    });

    expect(ctrl.getAnswerHtml()).toEqual({
      answer: 'Answer'
    });
  });
});
