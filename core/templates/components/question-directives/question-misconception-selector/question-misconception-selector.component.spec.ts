// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the question misconception selector component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// question-misconception-selector.component.ts is upgraded to Angular 8.
import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';

require('directives/angular-html-bind.directive.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

describe('Question misconception selector component', function() {
  var $componentController = null;
  var ctrl = null;
  var misconceptionObjectFactory = null;
  var mockMisconceptionObject = null;
  var ses = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'MisconceptionObjectFactory', new MisconceptionObjectFactory());
    $provide.value(
      'StateEditorService', new StateEditorService(
        new SolutionValidityService()));
  }));

  beforeEach(angular.mock.inject(
    function(_$componentController_, _$q_, _$rootScope_, $injector) {
      $componentController = _$componentController_;
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
      ses = $injector.get('StateEditorService');
    }));

  beforeEach(function() {
    mockMisconceptionObject = {
      abc: [
        misconceptionObjectFactory.create(
          '1', 'misc1', 'notes1', 'feedback1', true)
      ],
      def: [
        misconceptionObjectFactory.create(
          '2', 'misc2', 'notes2', 'feedback1', true)
      ]
    };
    spyOn(ses, 'getMisconceptionsBySkill').and.callFake(function() {
      return mockMisconceptionObject;
    });
    ctrl = $componentController('questionMisconceptionSelector', null, {
      misconceptionFeedbackIsUsed: true,
      selectedMisconception: mockMisconceptionObject.abc[0],
      selectedMisconceptionSkillId: 'abc'
    });
    ctrl.$onInit();
  });

  it('should initialize correctly', function() {
    expect(ctrl.misconceptionsBySkill).toEqual(mockMisconceptionObject);
  });

  it('should toggle feedback usage boolean correctly', function() {
    expect(ctrl.misconceptionFeedbackIsUsed).toBeTrue();
    ctrl.toggleMisconceptionFeedbackUsage();
    expect(ctrl.misconceptionFeedbackIsUsed).toBeFalse();
  });

  it('should set selected misconception correctly', function() {
    expect(ctrl.selectedMisconception).toEqual(mockMisconceptionObject.abc[0]);
    expect(ctrl.selectedMisconceptionSkillId).toEqual('abc');
    ctrl.selectMisconception(mockMisconceptionObject.def[0], 'def');
    expect(ctrl.selectedMisconception).toEqual(mockMisconceptionObject.def[0]);
    expect(ctrl.selectedMisconceptionSkillId).toEqual('def');
  });
});
