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
 * @fileoverview Unit tests for the skill editor main tab Component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { EventEmitter } from '@angular/core';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { AppConstants } from 'app.constants';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
// ^^^ This block is to be removed.

class MockNgbModalRef {
  componentInstance = {};
}

describe('Skill editor main tab Component', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $q = null;
  let $uibModal = null;
  let ngbModal: NgbModal;
  let skillEditorStateService: SkillEditorStateService = null;
  let skillUpdateService: SkillUpdateService = null;
  let windowDimensionsService: WindowDimensionsService = null;
  let urlInterpolationService: UrlInterpolationService;
  let mockEventEmitter = new EventEmitter();

  let mockUi = {
    placeholder: {
      height() {
        return;
      }
    },
    item: {
      height() {
        return;
      }
    }
  };

  let sampleSkill: Skill = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });


  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    ngbModal = TestBed.inject(NgbModal);
    $q = $injector.get('$q');
    skillEditorStateService = $injector.get('SkillEditorStateService');
    skillUpdateService = $injector.get('SkillUpdateService');
    windowDimensionsService = $injector.get('WindowDimensionsService');
    urlInterpolationService = $injector.get('UrlInterpolationService');
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

    ctrl = $componentController('skillConceptCardEditor', {
      $rootScope: $scope,
      $scope: $scope,
      NgbModal: ngbModal,
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
    'clicking on delete button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: $q.resolve()
    } as NgbModalRef);
    let deleteWorkedExampleSpy = spyOn(
      skillUpdateService, 'deleteWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.deleteWorkedExample();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(deleteWorkedExampleSpy).toHaveBeenCalled();
  }));

  it('should close delete worked example modal when ' +
    'clicking on cancel button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.reject()
    } as NgbModalRef);
    let deleteWorkedExampleSpy = spyOn(
      skillUpdateService, 'deleteWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.deleteWorkedExample();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(deleteWorkedExampleSpy).not.toHaveBeenCalled();
  }));

  it('should open add worked example modal when ' +
    'clicking on add button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: $q.resolve({
        workedExampleQuestionHtml: 'questionHtml',
        workedExampleExplanationHtml: 'explanationHtml'
      })
    } as NgbModalRef);
    let addWorkedExampleSpy = spyOn(
      skillUpdateService, 'addWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.openAddWorkedExampleModal();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(addWorkedExampleSpy).toHaveBeenCalled();
  }));

  it('should close add worked example modal when ' +
    'clicking on cancel button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.reject()
    } as NgbModalRef);
    let addWorkedExampleSpy = spyOn(
      skillUpdateService, 'addWorkedExample').and.returnValue(null);

    ctrl.$onInit();
    $scope.openAddWorkedExampleModal();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(addWorkedExampleSpy).not.toHaveBeenCalled();
  }));

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
