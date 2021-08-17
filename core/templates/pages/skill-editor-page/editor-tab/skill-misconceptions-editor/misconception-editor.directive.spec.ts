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
 * @fileoverview Unit tests for the Misconception Editor Directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';

describe('Misconception Editor Directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let skillUpdateService: SkillUpdateService = null;
  let misconceptionObjectFactory: MisconceptionObjectFactory = null;

  let sampleSkill = null;
  let sampleMisconception = null;

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

    directive = $injector.get('misconceptionEditorDirective')[0];
    skillEditorStateService = $injector.get('SkillEditorStateService');
    skillUpdateService = $injector.get('SkillUpdateService');
    misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

    sampleSkill = new Skill(
      'id1', 'description', [], [], {} as ConceptCard, 'en',
      1, 0, 'id1', false, []);
    sampleMisconception = misconceptionObjectFactory.create(
      'misconceptionId', 'name', 'notes', 'feedback', false);

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    $scope.misconception = sampleMisconception;
    $scope.isEditable = function() {
      return true;
    };
    ctrl.$onInit();
  }));

  it('should set properties when initialized', function() {
    expect($scope.nameEditorIsOpen).toEqual(false);
    expect($scope.notesEditorIsOpen).toEqual(false);
    expect($scope.feedbackEditorIsOpen).toEqual(false);
    expect($scope.skill).toEqual(sampleSkill);
  });

  it('should open name editor when clicking on edit button', function() {
    expect($scope.nameEditorIsOpen).toBe(false);

    $scope.openNameEditor();

    expect($scope.nameEditorIsOpen).toBe(true);
  });

  it('should open notes editor when clicking on edit button', function() {
    expect($scope.notesEditorIsOpen).toBe(false);

    $scope.openNotesEditor();

    expect($scope.notesEditorIsOpen).toBe(true);
  });

  it('should open feedback editor when clicking on edit button', function() {
    expect($scope.feedbackEditorIsOpen).toBe(false);

    $scope.openFeedbackEditor();

    expect($scope.feedbackEditorIsOpen).toBe(true);
  });

  it('should save name when clicking on save button', function() {
    let updateNameSpy = spyOn(
      skillUpdateService, 'updateMisconceptionName').and.returnValue(null);

    $scope.openNameEditor();
    // Setting new name.
    $scope.container.misconceptionName = 'newName';
    $scope.saveName();

    expect(updateNameSpy).toHaveBeenCalled();
  });

  it('should save notes when clicking on save button', function() {
    let updateNotesSpy = spyOn(
      skillUpdateService, 'updateMisconceptionNotes').and.returnValue(null);

    $scope.openNotesEditor();
    // Setting new notes content.
    $scope.container.misconceptionNotes = 'newNotes';
    $scope.saveNotes();

    expect(updateNotesSpy).toHaveBeenCalled();
  });

  it('should save feedback when clicking on save button', function() {
    let updateFeedbackSpy = spyOn(
      skillUpdateService, 'updateMisconceptionFeedback').and.returnValue(null);

    $scope.openFeedbackEditor();
    // Setting new feedback content.
    $scope.container.misconceptionFeedback = 'newFeedback';
    $scope.saveFeedback();

    expect(updateFeedbackSpy).toHaveBeenCalledWith(
      sampleSkill, 'misconceptionId', 'feedback', 'newFeedback');
  });

  it('should close name editor when clicking on cancel button', function() {
    expect($scope.nameEditorIsOpen).toBe(false);

    $scope.openNameEditor();
    expect($scope.nameEditorIsOpen).toBe(true);

    $scope.cancelEditName();
    expect($scope.nameEditorIsOpen).toBe(false);
  });

  it('should close notes editor when clicking on cancel button', function() {
    expect($scope.notesEditorIsOpen).toBe(false);
    $scope.openNotesEditor();

    expect($scope.notesEditorIsOpen).toBe(true);
    $scope.cancelEditNotes();

    expect($scope.notesEditorIsOpen).toBe(false);
  });

  it('should close feedback editor when clicking on cancel button', function() {
    expect($scope.feedbackEditorIsOpen).toBe(false);
    $scope.openFeedbackEditor();

    expect($scope.feedbackEditorIsOpen).toBe(true);
    $scope.cancelEditFeedback();

    expect($scope.feedbackEditorIsOpen).toBe(false);
  });

  it('should address the misconception\'s updates', function() {
    let updatesSpy = spyOn(
      skillUpdateService, 'updateMisconceptionMustBeAddressed')
      .and.returnValue(null);

    $scope.updateMustBeAddressed();

    expect(updatesSpy).toHaveBeenCalledWith(
      sampleSkill, 'misconceptionId', true, false);
  });
});
