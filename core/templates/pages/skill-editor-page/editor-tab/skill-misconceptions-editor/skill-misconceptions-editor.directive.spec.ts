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
 * @fileoverview Unit tests for the Skill Misconceptions Editor Directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { Misconception, MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DeleteMisconceptionModalComponent } from 'pages/skill-editor-page/modal-templates/delete-misconception-modal.component';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';

describe('Skill Misconception Editor Directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let skillUpdateService: SkillUpdateService = null;
  let misconceptionObjectFactory: MisconceptionObjectFactory = null;
  let windowDimensionsService: WindowDimensionsService = null;
  let ngbModal: NgbModal;
  let $uibModal = null;
  let $q = null;

  let sampleSkill: Skill = null;
  let sampleMisconception: Misconception = null;
  let mockOnSkillChangeEmitter = new EventEmitter();
  let testSubscriptions: Subscription = null;
  const skillChangeSpy = jasmine.createSpy('saveOutcomeDestDetails');

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
    directive = $injector.get('skillMisconceptionsEditorDirective')[0];

    skillEditorStateService = $injector.get('SkillEditorStateService');
    skillUpdateService = $injector.get('SkillUpdateService');
    misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
    windowDimensionsService = $injector.get('WindowDimensionsService');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    ngbModal = TestBed.inject(NgbModal);

    sampleSkill = new Skill(
      'id1', 'description', [], [], {} as ConceptCard, 'en',
      1, 0, 'id1', false, []);
    sampleMisconception = misconceptionObjectFactory.create(
      'misconceptionId', 'misconceptionName', 'notes', 'feedback', false);
    sampleSkill._misconceptions = [sampleMisconception];

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope,
      NgbModal: ngbModal,
      $uibModal: $uibModal,
      WindowDimensionsService: windowDimensionsService
    });
  }));

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(skillEditorStateService.onSkillChange.subscribe(
      skillChangeSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should set properties when initialized', function() {
    // Misconception list is shown only when window is not narrow.
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOnProperty(skillEditorStateService, 'onSkillChange').and.returnValue(
      mockOnSkillChangeEmitter);

    expect($scope.skill).toBe(undefined);
    expect($scope.misconceptions).toBe(undefined);
    expect($scope.misconceptionsListIsShown).toBe(undefined);

    ctrl.$onInit();
    mockOnSkillChangeEmitter.emit();

    expect($scope.skill).toEqual(sampleSkill);
    expect($scope.misconceptions).toEqual(sampleSkill.getMisconceptions());
    expect($scope.misconceptionsListIsShown).toEqual(true);
  });

  it('should toggle misconceptionList when toggle ' +
    'button is clicked', function() {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    $scope.misconceptionsListIsShown = false;

    $scope.toggleMisconceptionLists();
    expect($scope.misconceptionsListIsShown).toBe(true);

    $scope.toggleMisconceptionLists();
    expect($scope.misconceptionsListIsShown).toBe(false);
  });

  it('should open add misconception modal when clicking on add ' +
    'button', fakeAsync(function() {
    $scope.skill = sampleSkill;
    let deferred = $q.defer();
    deferred.resolve({
      misconception: sampleMisconception
    });
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    let addMisconceptionSpy = spyOn(
      skillUpdateService, 'addMisconception').and.returnValue(null);

    $scope.openAddMisconceptionModal();
    tick();
    $scope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(addMisconceptionSpy).toHaveBeenCalledWith(
      sampleSkill, sampleMisconception);
  }));

  it('should close add misconception modal when clicking on close ' +
    'button', function() {
    let deferred = $q.defer();
    deferred.reject();
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    let addMisconceptionSpy = spyOn(
      skillUpdateService, 'addMisconception').and.returnValue(null);

    $scope.openAddMisconceptionModal();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(addMisconceptionSpy).not.toHaveBeenCalled();
  });

  it('should open delete misconception modal when clicking on delete ' +
    'button', fakeAsync(function() {
    let modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: {
          index: 'index'
        },
        result: Promise.resolve({result: {
          id: 'id'
        }})
      }) as NgbModalRef;
    });
    let deleteMisconceptionSpy = spyOn(
      skillUpdateService, 'deleteMisconception').and.returnValue(null);

    ctrl.$onInit();
    $scope.openDeleteMisconceptionModal();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalledWith(
      DeleteMisconceptionModalComponent, {backdrop: 'static'});
    expect(deleteMisconceptionSpy).toHaveBeenCalled();
  }));

  it('should close delete misconception modal when clicking on ' +
    'close button', fakeAsync(function() {
    let modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: {
          index: 'index'
        },
        result: Promise.reject()
      }) as NgbModalRef;
    });
    let deleteMisconceptionSpy = spyOn(
      skillUpdateService, 'deleteMisconception').and.returnValue(null);

    ctrl.$onInit();
    $scope.openDeleteMisconceptionModal();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalledWith(
      DeleteMisconceptionModalComponent, {backdrop: 'static'});
    expect(deleteMisconceptionSpy).not.toHaveBeenCalled();
  }));

  it('should always return true when calling \'isEditable\'', () => {
    expect($scope.isEditable()).toBe(true);
  });

  it('should return misconception name given input as misconception ' +
    'when calling \'getMisconceptionSummary \'', () => {
    let name = $scope.getMisconceptionSummary(sampleMisconception);
    expect(name).toBe('misconceptionName');
  });

  it('should change active misconception index', () => {
    $scope.activeMisconceptionIndex = 'oldIndex';
    $scope.changeActiveMisconceptionIndex('newIndex');

    expect($scope.activeMisconceptionIndex).toBe('newIndex');
  });

  it('should set active misconception index to null if ' +
    'oldIndex is newIndex', () => {
    $scope.activeMisconceptionIndex = 'oldIndex';
    $scope.changeActiveMisconceptionIndex('oldIndex');

    expect($scope.activeMisconceptionIndex).toBe(null);
  });
});
