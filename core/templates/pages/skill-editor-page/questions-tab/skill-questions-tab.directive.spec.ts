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
 * @fileoverview Unit tests for the Skill question tab directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillEditorStateService } from '../services/skill-editor-state.service';
import { EventEmitter } from '@angular/core';
import { Skill } from 'domain/skill/SkillObjectFactory';


describe('Skill question tab directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let initEventEmitter = new EventEmitter();
  const sampleSkill = new Skill(
    null, 'Skill description loading',
    [], [], null, 'en', 1, 0, null, false, []);

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
    directive = $injector.get('questionsTabDirective')[0];
    skillEditorStateService = $injector.get('SkillEditorStateService');

    spyOnProperty(skillEditorStateService, 'onSkillChange')
      .and.returnValue(initEventEmitter);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should fetch skill when initialized', function() {
    const fetchSkillSpy = spyOn(
      skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(skillEditorStateService, 'getGroupedSkillSummaries');
    initEventEmitter.emit();
    $scope.$apply();

    expect(fetchSkillSpy).toHaveBeenCalled();
    expect(
      skillEditorStateService.getGroupedSkillSummaries).toHaveBeenCalled();
  });

  it('should not initialize when skill is not available', function() {
    const fetchSkillSpy = spyOn(
      skillEditorStateService, 'getSkill').and.returnValue(undefined);
    spyOn(skillEditorStateService, 'getGroupedSkillSummaries');

    ctrl.$onInit();
    $scope.$apply();

    expect(fetchSkillSpy).toHaveBeenCalled();
    expect(
      skillEditorStateService.getGroupedSkillSummaries).not.toHaveBeenCalled();
  });

  it('should initialize when skill is available', function() {
    const fetchSkillSpy = spyOn(
      skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(skillEditorStateService, 'getGroupedSkillSummaries');

    ctrl.$onInit();
    $scope.$apply();

    expect(fetchSkillSpy).toHaveBeenCalled();
    expect(
      skillEditorStateService.getGroupedSkillSummaries).toHaveBeenCalled();
  });
});
