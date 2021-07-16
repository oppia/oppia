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
 * @fileoverview Unit tests for the skill editor main tab directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Skill, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { EventEmitter } from '@angular/core';
// ^^^ This block is to be removed.

fdescribe('Skill editor main tab directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $q = null;
  let $timeout = null;
  let directive = null;
  let UndoRedoService = null;
  let $uibModal = null;
  let SkillEditorRoutingService = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let skillUpdateService: SkillUpdateService = null;
  let skillObjectFactory: SkillObjectFactory = null;
  let windowDimensionsService: WindowDimensionsService = null;
  let focusManagerService = null;
  let urlInterpolationService: UrlInterpolationService;
  let mockEventEmitter = new EventEmitter();

  let mockUi = {
    placeholder: {
      height(){
        return;
      }
    },
    item: {
      height(){
        return;
      }
    }
  };

  let sampleSkill: Skill = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    focusManagerService = TestBed.get(FocusManagerService);
  });


  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    UndoRedoService = $injector.get('UndoRedoService');
    directive = $injector.get('skillConceptCardEditorDirective')[0];
    skillEditorStateService = $injector.get('SkillEditorStateService');
    skillObjectFactory = $injector.get('SkillObjectFactory');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    
    focusManagerService = $injector.get('FocusManagerService');
    skillUpdateService = $injector.get('SkillUpdateService');
    windowDimensionsService = $injector.get('WindowDimensionsService');
    urlInterpolationService = $injector.get('UrlInterpolationService');

    sampleSkill = skillObjectFactory.createInterstitialSkill();
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOnProperty(skillEditorStateService, 'onSkillChange')
      .and.returnValue(mockEventEmitter);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
  }));

  it('should set properties when initialized', function() {
    expect($scope.WORKED_EXAMPLES_SORTABLE_OPTIONS).toBe(undefined);

    ctrl.$onInit();
    mockEventEmitter.emit();
    $scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.start(null, mockUi);
    $scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.stop();

    expect($scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.axis).toBe('y');
    expect($scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.cursor).toBe('move');
    expect($scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.handle).toBe(
      '.oppia-worked-example-sort-handle');
    expect($scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.items).toBe(
      '.oppia-sortable-worked-example');
    expect($scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.revert).toBe(100);
    expect($scope.WORKED_EXAMPLES_SORTABLE_OPTIONS.tolerance).toBe('pointer');
  });

  it('should get static image url when calling ' +
    '\getStaticImageUrl\'', function() {
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('imagePath');
    let result = $scope.getStaticImageUrl('/imagePath');

    expect(result).toBe('imagePath');
  });

  it('should always return true when calling \'isEditable\'', () => {
    expect($scope.isEditable()).toBe(true);
  });

  it('should update skill on saving explanation ' +
    'when calling \'onSaveExplanation\'', () => {
    let updateSpy = spyOn(skillUpdateService, 'setConceptCardExplanation')
      .and.returnValue(null);

    ctrl.$onInit();
    $scope.onSaveExplanation({}); 

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should change current index when calling ' +
    '\changeActiveWorkedExampleIndex\'', function() {
    ctrl.$onInit();

    // Case: 1
    // If we try to update new index same as old index
    // it should set index value to null.
    $scope.activeWorkedExampleIndex = 2;
    $scope.changeActiveWorkedExampleIndex(2);
    expect($scope.activeWorkedExampleIndex).toBe(null);

    // Case: 2
    // It should set new index as current index.
    $scope.changeActiveWorkedExampleIndex(3);
    expect($scope.activeWorkedExampleIndex).toBe(3);
  });

  it('should open delete worked example modal when ' +
    'clicking on delete button', function() {
    let deferred = $q.defer();
    deferred.resolve();
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    let deleteWorkedExampleSpy = spyOn(
      skillUpdateService, 'deleteWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.deleteWorkedExample();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(deleteWorkedExampleSpy).toHaveBeenCalled();
  });

  it('should close delete worked example modal when ' +
    'clicking on cancel button', function() {
    let deferred = $q.defer();
    deferred.reject();
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    let deleteWorkedExampleSpy = spyOn(
      skillUpdateService, 'deleteWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.deleteWorkedExample();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(deleteWorkedExampleSpy).not.toHaveBeenCalled();
  });

  it('should open add worked example modal when ' +
    'clicking on add button', function() {
    let deferred = $q.defer();
    deferred.resolve({
      workedExampleQuestionHtml: 'questionHtml',
      workedExampleExplanationHtml: 'explanationHtml'
    });
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    let addWorkedExampleSpy = spyOn(
      skillUpdateService, 'addWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.openAddWorkedExampleModal();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(addWorkedExampleSpy).toHaveBeenCalled();
  });

  it('should close add worked example modal when ' +
    'clicking on cancel button', function() {
    let deferred = $q.defer();
    deferred.reject();
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    let addWorkedExampleSpy = spyOn(
      skillUpdateService, 'addWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.openAddWorkedExampleModal();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(addWorkedExampleSpy).not.toHaveBeenCalled();
  });

  it('should open show skill preview modal when ' +
    'clicking on preview button', function() {
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();

    ctrl.$onInit();
    $scope.showSkillPreview();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should toggle worked example list when calling ' +
    '\toggleWorkedExampleList\'', function() {
    $scope.workedExamplesListIsShown = true;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    $scope.toggleWorkedExampleList();
    expect($scope.workedExamplesListIsShown).toBe(false);

    $scope.toggleWorkedExampleList();
    expect($scope.workedExamplesListIsShown).toBe(true);
  });

  it('should toggle skill editor card when calling ' +
    '\toggleSkillEditorCard\'', function() {
    $scope.skillEditorCardIsShown = true;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    $scope.toggleSkillEditorCard();
    expect($scope.skillEditorCardIsShown).toBe(false);

    $scope.toggleSkillEditorCard();
    expect($scope.skillEditorCardIsShown).toBe(true);
  });

  it('should format given worked example summary html content' +
    'when calling \'getWorkedExampleSummary\'', () => {
    let result = $scope.getWorkedExampleSummary('<p>Worked Example</p>'); 

    expect(result).toBe('Worked Example');
  });
});