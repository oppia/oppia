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
 * @fileoverview Unit tests for the Skill Editor Navbar Directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillEditorStateService } from '../services/skill-editor-state.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { EventEmitter } from '@angular/core';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { UrlService } from 'services/contextual/url.service';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { AppConstants } from 'app.constants';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SkillUpdateService } from 'domain/skill/skill-update.service';

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

describe('Skill Editor Navbar Directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let $uibModal = null;
  let $q = null;
  let ngbModal: NgbModal = null;
  let skillEditorRoutingService = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let undoRedoService: UndoRedoService = null;
  let urlService: UrlService = null;
  let skillUpdateService: SkillUpdateService = null;

  let sampleSkill: Skill = null;
  let mockEventEmitter = new EventEmitter();
  let mockPrerequisiteSkillChangeEventEmitter = new EventEmitter();


  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    ngbModal = $injector.get('NgbModal');
    $q = $injector.get('$q');
    ngbModal = $injector.get('NgbModal');
    directive = $injector.get('skillEditorNavbarDirective')[0];
    skillEditorStateService = $injector.get('SkillEditorStateService');
    skillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    undoRedoService = $injector.get('UndoRedoService');
    urlService = $injector.get('UrlService');
    skillUpdateService = TestBed.inject(SkillUpdateService);

    const conceptCard = new ConceptCard(
      SubtitledHtml.createDefault(
        'review material', AppConstants.COMPONENT_NAME_EXPLANATION),
      [],
      RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          COMPONENT_NAME_EXPLANATION: {}
        }
      })
    );
    sampleSkill = new Skill(
      'id1', 'description', [], [], conceptCard, 'en', 1, 0, 'id1', false, []
    );

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOnProperty(skillEditorStateService, 'onSkillChange')
      .and.returnValue(mockEventEmitter);
    spyOnProperty(skillUpdateService, 'onPrerequisiteSkillChange').and.
      returnValue(mockPrerequisiteSkillChangeEventEmitter);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
  }));

  it('should set properties when initialized', function() {
    expect($scope.activeTab).toBe(undefined);
    spyOn($scope, '$applyAsync').and.callThrough();

    ctrl.$onInit();
    mockEventEmitter.emit();
    mockPrerequisiteSkillChangeEventEmitter.emit();
    undoRedoService._undoRedoChangeEventEmitter.emit();

    expect($scope.activeTab).toBe('Editor');
    expect($scope.$applyAsync).toHaveBeenCalled();
  });

  it('should get current active tab name when ' +
    'calling \'getActiveTabName\'', function() {
    spyOn(skillEditorRoutingService, 'getActiveTabName')
      .and.returnValue('activeTab');

    let result = $scope.getActiveTabName();

    expect(result).toBe('activeTab');
  });

  it('should check whether the skill is still loading when ' +
    'calling \'isLoadingSkill\'', function() {
    spyOn(skillEditorStateService, 'isLoadingSkill')
      .and.returnValue(false);

    let result = $scope.isLoadingSkill();

    expect(result).toBe(false);
  });

  it('should check whether the skill is being saved when ' +
    'calling \'isSaveInProgress \'', function() {
    spyOn(skillEditorStateService, 'isSavingSkill')
      .and.returnValue(false);

    let result = $scope.isSaveInProgress();

    expect(result).toBe(false);
  });

  it('should get change list count when calling ' +
    '\'getChangeListCount\'', function() {
    spyOn(undoRedoService, 'getChangeCount')
      .and.returnValue(2);

    let result = $scope.getChangeListCount();

    expect(result).toBe(2);
  });

  it('should discard changes when calling ' +
    '\'discardChanges\'', function() {
    let discardSpy = spyOn(undoRedoService, 'clearChanges')
      .and.returnValue(null);
    let loadSkillSpy = spyOn(skillEditorStateService, 'loadSkill')
      .and.returnValue(null);
    let urlSpy = spyOn(urlService, 'getSkillIdFromUrl')
      .and.returnValue('');

    ctrl.$onInit();
    $scope.discardChanges();

    expect(discardSpy).toHaveBeenCalled();
    expect(loadSkillSpy).toHaveBeenCalled();
    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get change list count when calling ' +
    '\'getChangeListCount\'', function() {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(3);

    expect($scope.getChangeListCount()).toBe(3);
  });

  it('should get number of warnings when calling ' +
    '\'getWarningsCount\'', function() {
    spyOn(skillEditorStateService, 'getSkillValidationIssues')
      .and.returnValue(['issue 1', 'issue 2', 'issue 3']);

    expect($scope.getWarningsCount()).toBe(3);
  });

  it('should check whether the skill is saveable when ' +
    'calling \'isSkillSaveable\'', function() {
    spyOn(skillEditorStateService, 'isSavingSkill')
      .and.returnValue(false);

    let result = $scope.isSkillSaveable();

    expect(result).toBe(false);
  });

  it('should toggle navigation options when calling ' +
    '\'toggleNavigationOptions\'', function() {
    $scope.showNavigationOptions = true;

    $scope.toggleNavigationOptions();
    expect($scope.showNavigationOptions).toBe(false);

    $scope.toggleNavigationOptions();
    expect($scope.showNavigationOptions).toBe(true);
  });

  it('should navigate to main tab when ' +
    'calling \'selectMainTab\'', function() {
    let navigateToMainTabSpy = spyOn(
      skillEditorRoutingService, 'navigateToMainTab')
      .and.returnValue(null);

    $scope.selectMainTab();

    expect(navigateToMainTabSpy).toHaveBeenCalled();
  });

  it('should navigate to main tab when ' +
    'calling \'selectPreviewTab\'', function() {
    let navigateToPreviewTabSpy = spyOn(
      skillEditorRoutingService, 'navigateToPreviewTab')
      .and.returnValue(null);

    $scope.selectPreviewTab();

    expect(navigateToPreviewTabSpy).toHaveBeenCalled();
  });

  it('should toggle skill edit options when calling ' +
    '\'toggleSkillEditOptions\'', function() {
    $scope.showSkillEditOptions = true;

    $scope.toggleSkillEditOptions();
    expect($scope.showSkillEditOptions).toBe(false);

    $scope.toggleSkillEditOptions();
    expect($scope.showSkillEditOptions).toBe(true);
  });

  it('should save changes if save changes modal is opened and confirm ' +
    'button is clicked', fakeAsync(function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve('commitMessage')
    });
    let saveSkillSpy = spyOn(skillEditorStateService, 'saveSkill')
      .and.callFake((message, cb) => {
        cb();
        return true;
      });

    $scope.saveChanges();
    tick();
    $scope.$apply();

    expect(saveSkillSpy).toHaveBeenCalled();
  }));

  it('should not save changes if save changes modal is opened and cancel ' +
    'button is clicked', fakeAsync(function() {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.reject()
      } as NgbModalRef
    );
    let saveSkillSpy = spyOn(skillEditorStateService, 'saveSkill')
      .and.returnValue(null);

    $scope.saveChanges();
    tick();
    $scope.$apply();

    expect(saveSkillSpy).not.toHaveBeenCalled();
  }));

  describe('on navigating to questions tab ', function() {
    it('should open undo changes modal if there are unsaved ' +
      'changes', fakeAsync(function() {
      // Setting unsaved changes to be two.
      spyOn(undoRedoService, 'getChangeCount')
        .and.returnValue(2);
      const ngbModalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve()
        }) as NgbModalRef;
      });
      let navigateToQuestionsTabSpy = spyOn(
        skillEditorRoutingService, 'navigateToQuestionsTab')
        .and.returnValue(null);

      $scope.selectQuestionsTab();
      tick();
      $scope.$apply();

      expect(ngbModalSpy).toHaveBeenCalled();
      expect(navigateToQuestionsTabSpy).not.toHaveBeenCalled();
    }));

    it('should navigate to questions tab if there are no unsaved ' +
      'changes', function() {
      // Setting unsaved changes to be zero.
      spyOn(undoRedoService, 'getChangeCount')
        .and.returnValue(0);
      let navigateToQuestionsTabSpy = spyOn(
        skillEditorRoutingService, 'navigateToQuestionsTab')
        .and.returnValue(null);

      $scope.selectQuestionsTab();

      expect(navigateToQuestionsTabSpy).toHaveBeenCalled();
    });
  });
});
