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
 * @fileoverview Unit tests for the question misconception editor component.
 */

import { EventEmitter } from '@angular/core';

// TODO(#7222): Remove the following block of unnnecessary imports once
// question-misconception-editor.component.ts is upgraded to Angular 8.
import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';

// ^^^ This block is to be removed.

require('directives/angular-html-bind.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

describe('Question misconception editor component', function() {
  var $componentController = null;
  var $uibModal = null;
  var $q = null;
  var $rootScope = null;
  var ctrl = null;
  var misconceptionObjectFactory = null;
  var mockMisconceptionObject = null;
  var ses = null;

  var mockExternalSaveEventEmitter = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'MisconceptionObjectFactory', new MisconceptionObjectFactory());
    $provide.value(
      'StateEditorService', new StateEditorService(
        new SolutionValidityService()));
    mockExternalSaveEventEmitter = new EventEmitter();
    $provide.value('ExternalSaveService', {
      onExternalSave: mockExternalSaveEventEmitter
    });
  }));

  beforeEach(angular.mock.inject(
    function(_$componentController_, _$q_, _$rootScope_, $injector) {
      $componentController = _$componentController_;
      $uibModal = $injector.get('$uibModal');
      $q = _$q_;
      $rootScope = _$rootScope_;
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
      ses = $injector.get('StateEditorService');
    }));

  beforeEach(function() {
    var onSaveTaggedMisconceptionSpy = jasmine.createSpy(
      'onSaveTaggedMisconception');
    var onSaveAnswerGroupFeedbackSpy = jasmine.createSpy(
      'onSaveAnswerGroupFeedback');
    var outcome = new OutcomeObjectFactory();
    var rules = new RuleObjectFactory();
    mockMisconceptionObject = {
      abc: [
        misconceptionObjectFactory.create(
          '1', 'misc1', 'notes1', 'feedback1', true),
        misconceptionObjectFactory.create(
          '2', 'misc2', 'notes2', 'feedback1', true)
      ]
    };
    spyOn(ses, 'getMisconceptionsBySkill').and.callFake(function() {
      return mockMisconceptionObject;
    });
    ctrl = $componentController('questionMisconceptionEditor', null, {
      getOnSaveAnswerGroupFeedbackFn: () => onSaveAnswerGroupFeedbackSpy,
      getOnSaveTaggedMisconception: () => onSaveTaggedMisconceptionSpy,
      getTaggedSkillMisconceptionId: () => null,
      isEditable: true,
      outcome: outcome,
      rules: rules
    });
    ctrl.$onInit();
  });

  it(
    'should initialize correctly when tagged misconception is provided',
    function() {
      spyOn(ctrl, 'getTaggedSkillMisconceptionId').and.callFake(() => 'abc-1');
      ctrl.$onInit();
      expect(ctrl.misconceptionName).toEqual('misc1');
      expect(ctrl.selectedMisconception).toEqual(
        mockMisconceptionObject.abc[0]);
      expect(ctrl.selectedMisconceptionSkillId).toEqual('abc');
    });

  it('should use feedback by default', function() {
    expect(ctrl.feedbackIsUsed).toBeTrue();
    expect(ctrl.misconceptionsBySkill).toEqual(mockMisconceptionObject);
  });

  it('should enable edit mode correctly', function() {
    expect(ctrl.misconceptionEditorIsOpen).toBeNull();
    ctrl.editMisconception();
    expect(ctrl.misconceptionEditorIsOpen).toBeTrue();
  });

  it('should report containing misconceptions correctly', function() {
    expect(ctrl.containsMisconceptions()).toBeTrue();
    ctrl.misconceptionsBySkill = [];
    expect(ctrl.containsMisconceptions()).toBeFalse();
  });

  it(
    'should throw an error if tagged misconception id is invalid', function() {
      ctrl.getTaggedSkillMisconceptionId = () => 'invalidId';
      expect(() => ctrl.$onInit()).toThrowError(
        'Expected skillMisconceptionId to be <skillId>-<misconceptionId>.');
    });

  it('should tag a misconception correctly', function() {
    var mockResultObject = {
      misconception: mockMisconceptionObject.abc[1],
      misconceptionSkillId: 'abc',
      feedbackIsUsed: false
    };
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve(mockResultObject)
    });
    expect(ctrl.misconceptionName).toBeNull();
    expect(ctrl.selectedMisconception).toBeNull();
    expect(ctrl.selectedMisconceptionSkillId).toBeNull();
    expect(ctrl.feedbackIsUsed).toBeTrue();
    ctrl.getTaggedSkillMisconceptionId = () => 'abc-1';
    ctrl.$onInit();
    expect(ctrl.misconceptionName).toEqual('misc1');
    expect(ctrl.selectedMisconception).toEqual(mockMisconceptionObject.abc[0]);
    expect(ctrl.selectedMisconceptionSkillId).toEqual('abc');
    expect(ctrl.feedbackIsUsed).toBeTrue();
    ctrl.tagAnswerGroupWithMisconception();
    $rootScope.$digest();
    expect(ctrl.misconceptionName).toEqual('misc2');
    expect(ctrl.selectedMisconception).toEqual(mockMisconceptionObject.abc[1]);
    expect(ctrl.selectedMisconceptionSkillId).toEqual('abc');
    expect(ctrl.feedbackIsUsed).toBeFalse();
    expect(ctrl.misconceptionEditorIsOpen).toBeFalse();
  });

  it('should not tag a misconception if the modal was dismissed', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    expect(ctrl.misconceptionName).toBeNull();
    expect(ctrl.selectedMisconception).toBeNull();
    expect(ctrl.selectedMisconceptionSkillId).toBeNull();
    expect(ctrl.feedbackIsUsed).toBeTrue();
    ctrl.getTaggedSkillMisconceptionId = () => 'abc-1';
    ctrl.$onInit();
    expect(ctrl.misconceptionName).toEqual('misc1');
    expect(ctrl.selectedMisconception).toEqual(mockMisconceptionObject.abc[0]);
    expect(ctrl.selectedMisconceptionSkillId).toEqual('abc');
    expect(ctrl.feedbackIsUsed).toBeTrue();
    ctrl.tagAnswerGroupWithMisconception();
    $rootScope.$digest();
    expect(ctrl.misconceptionName).toEqual('misc1');
    expect(ctrl.selectedMisconception).toEqual(mockMisconceptionObject.abc[0]);
    expect(ctrl.selectedMisconceptionSkillId).toEqual('abc');
    expect(ctrl.feedbackIsUsed).toBeTrue();
  });

  it('should update tagged misconception name correctly', function() {
    ctrl.outcome.feedback = {
      setHtml: () => null
    };
    ctrl.editMisconception();
    expect(ctrl.misconceptionEditorIsOpen).toBeTrue();
    expect(ctrl.misconceptionName).toBeNull();
    ctrl.feedbackIsUsed = true;
    ctrl.selectedMisconception = mockMisconceptionObject.abc[0];
    ctrl.selectedMisconceptionSkillId = 'abc';
    ctrl.updateMisconception();
    expect(ctrl.misconceptionEditorIsOpen).toBeFalse();
    expect(ctrl.misconceptionName).toEqual('misc1');
  });
});
