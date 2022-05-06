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
 * @fileoverview Unit tests for skill editor page component.
 */

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { EntityEditorBrowserTabsInfoDomainConstants } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { Skill, SkillBackendDict, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';

// TODO(#7222): Remove the following block of unnnecessary imports once
// Skill editor page is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

require('pages/skill-editor-page/skill-editor-page.component.ts');

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

describe('Skill editor page', function() {
  var ctrl = null;
  var LocalStorageService = null;
  var PreventPageUnloadEventService = null;
  var SkillEditorRoutingService = null;
  var SkillEditorStalenessDetectionService = null;
  var SkillEditorStateService = null;
  var UndoRedoService = null;
  let ngbModal: NgbModal = null;
  var UrlService = null;
  var $rootScope = null;
  var mockOnSkillChangeEmitter = new EventEmitter();
  var skillObjectFactory: SkillObjectFactory;

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
    $provide.value('WindowRef', {
      nativeWindow: {
        location: {
          reload: () => {}
        },
        addEventListener: () => {}
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    LocalStorageService = $injector.get('LocalStorageService');
    PreventPageUnloadEventService = $injector.get(
      'PreventPageUnloadEventService');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    ngbModal = $injector.get('NgbModal');
    SkillEditorStalenessDetectionService = (
      $injector.get('SkillEditorStalenessDetectionService'));
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    UndoRedoService = $injector.get('UndoRedoService');
    UrlService = $injector.get('UrlService');
    $rootScope = $injector.get('$rootScope');
    ctrl = $componentController('skillEditorPage');
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
  }));

  beforeEach(() => {
    var skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_q_1: {},
          worked_example_e_1: {},
          worked_example_q_2: {},
          worked_example_e_2: {},
        },
      },
    };
    var skillDict: SkillBackendDict = {
      id: 'skill_1',
      description: 'Description',
      misconceptions: [{
        id: 2,
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback',
        must_be_addressed: true,
      }],
      rubrics: [{
        difficulty: 'Easy',
        explanations: ['explanation'],
      }, {
        difficulty: 'Medium',
        explanations: ['explanation'],
      }, {
        difficulty: 'Hard',
        explanations: ['explanation'],
      }],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: true,
      superseding_skill_id: '2',
      next_misconception_id: 3,
    };
    var skill = skillObjectFactory.createFromBackendDict(skillDict);
    spyOn(SkillEditorStateService, 'getSkill').and.returnValue(skill);
  });

  it('should load skill based on its id in url when component is initialized',
    function() {
      spyOn(SkillEditorStateService, 'loadSkill').and.stub();
      spyOn(UrlService, 'getSkillIdFromUrl').and.returnValue('skill_1');

      ctrl.$onInit();
      expect(SkillEditorStateService.loadSkill).toHaveBeenCalledWith('skill_1');
    });

  it('should trigger a digest loop when onSkillChange is emitted', () => {
    spyOnProperty(SkillEditorStateService, 'onSkillChange').and.returnValue(
      mockOnSkillChangeEmitter);
    spyOn(SkillEditorStateService, 'loadSkill').and.stub();
    spyOn(UrlService, 'getSkillIdFromUrl').and.returnValue('skill_1');
    spyOn($rootScope, '$applyAsync').and.callThrough();

    ctrl.$onInit();
    mockOnSkillChangeEmitter.emit();
    expect($rootScope.$applyAsync).toHaveBeenCalled();
  });

  it('should addListener by passing getChangeCount to ' +
  'PreventPageUnloadEventService', function() {
    spyOn(SkillEditorStateService, 'loadSkill').and.stub();
    spyOn(UrlService, 'getSkillIdFromUrl').and.returnValue('skill_1');
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(10);
    spyOn(PreventPageUnloadEventService, 'addListener').and
      .callFake((callback) => callback());

    ctrl.$onInit();

    expect(PreventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });

  it('should get active tab name from skill editor routing service',
    function() {
      spyOn(SkillEditorRoutingService, 'getActiveTabName').and.returnValue(
        'questions');
      expect(ctrl.getActiveTabName()).toBe('questions');
    });

  it('should go to main tab when selecting main tab', function() {
    var routingSpy = spyOn(
      SkillEditorRoutingService, 'navigateToMainTab');
    ctrl.selectMainTab();
    expect(routingSpy).toHaveBeenCalled();
  });

  it('should go to preview tab when selecting preview tab', function() {
    var routingSpy = spyOn(
      SkillEditorRoutingService, 'navigateToPreviewTab');
    ctrl.selectPreviewTab();
    expect(routingSpy).toHaveBeenCalled();
  });

  it('should open save changes modal with ngbModal when unsaved changes are' +
    ' present', function() {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      }) as NgbModalRef;
    });

    ctrl.selectQuestionsTab();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should navigate to questions tab when unsaved changes are not present',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
      var routingSpy = spyOn(
        SkillEditorRoutingService, 'navigateToQuestionsTab').and.callThrough();
      ctrl.selectQuestionsTab();
      expect(routingSpy).toHaveBeenCalled();
    });

  it('should return warnings count for the skill', function() {
    const conceptCard = new ConceptCard(
      SubtitledHtml.createDefault(
        'review material', AppConstants.COMPONENT_NAME_EXPLANATION),
      [], RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          COMPONENT_NAME_EXPLANATION: {}
        }
      })
    );
    ctrl.skill = new Skill(
      'id1', 'description', [], [], conceptCard, 'en', 1, 0, 'id1', false, []
    );
    expect(ctrl.getWarningsCount()).toEqual(1);
  });

  it('should create or update skill editor browser tabs info on ' +
  'local storage when a new tab opens', () => {
    let skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_1', 1, 1, false);
    spyOn(EntityEditorBrowserTabsInfo, 'create').and.callThrough();
    spyOn(skillEditorBrowserTabsInfo, 'setLatestVersion').and.callThrough();
    spyOn(
      LocalStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValues(skillEditorBrowserTabsInfo, null);
    spyOn(SkillEditorStateService, 'loadSkill').and.stub();
    spyOn(UrlService, 'getSkillIdFromUrl').and.returnValue('skill_1');
    ctrl.$onInit();

    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    SkillEditorStateService.onSkillInitialized.emit();

    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(2);
    expect(skillEditorBrowserTabsInfo.setLatestVersion).toHaveBeenCalled();

    SkillEditorStateService.onSkillInitialized.emit();

    expect(EntityEditorBrowserTabsInfo.create).toHaveBeenCalled();
  });

  it('should update skill editor browser tabs info on local storage when ' +
  'some new changes are saved', () => {
    let skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_1', 1, 1, true);
    spyOn(skillEditorBrowserTabsInfo, 'setLatestVersion').and.callThrough();
    spyOn(
      LocalStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(skillEditorBrowserTabsInfo);
    spyOn(
      LocalStorageService, 'updateEntityEditorBrowserTabsInfo'
    ).and.callFake(() => {});
    spyOn(SkillEditorStateService, 'loadSkill').and.stub();
    spyOn(UrlService, 'getSkillIdFromUrl').and.returnValue('skill_1');
    ctrl.$onInit();

    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toEqual(true);

    SkillEditorStateService.onSkillReinitialized.emit();

    expect(skillEditorBrowserTabsInfo.setLatestVersion).toHaveBeenCalled();
    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toEqual(false);
  });

  it('should decrement number of opened skill editor tabs when ' +
  'a tab is closed', () => {
    let skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_1', 1, 1, true);
    spyOn(
      LocalStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(skillEditorBrowserTabsInfo);
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);

    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeTrue();
    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    ctrl.onClosingSkillEditorBrowserTab();

    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();
    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(0);
  });

  it('should emit the stale tab and presence of unsaved changes events ' +
  'when the \'storage\' event is triggered', () => {
    spyOn(
      SkillEditorStalenessDetectionService.staleTabEventEmitter, 'emit'
    ).and.callThrough();
    spyOn(
      SkillEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter, 'emit'
    ).and.callThrough();

    let storageEvent = new StorageEvent('storage', {
      key: EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_SKILL_EDITOR_BROWSER_TABS
    });

    ctrl.onCreateOrUpdateSkillEditorBrowserTabsInfo(storageEvent);

    expect(
      SkillEditorStalenessDetectionService.staleTabEventEmitter.emit
    ).toHaveBeenCalled();
    expect(
      SkillEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter.emit
    ).toHaveBeenCalled();
  });
});
