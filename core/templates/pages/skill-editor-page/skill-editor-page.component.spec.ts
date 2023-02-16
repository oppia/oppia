// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/compiler';
import { EventEmitter } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { EntityEditorBrowserTabsInfoDomainConstants } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info-domain.constants';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ConceptCard } from 'domain/skill/concept-card.model';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { Skill, SkillBackendDict, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { UrlService } from 'services/contextual/url.service';
import { LocalStorageService } from 'services/local-storage.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { SkillEditorRoutingService } from './services/skill-editor-routing.service';
import { SkillEditorStalenessDetectionService } from './services/skill-editor-staleness-detection.service';
import { SkillEditorStateService } from './services/skill-editor-state.service';
import { SkillEditorPageComponent } from './skill-editor-page.component';
import { WindowRef } from 'services/contextual/window-ref.service';

class MockNgbModalRef {
  componentInstance!: {
    body: 'xyz';
  };
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/path/name',
      reload: () => {},
      hash: '123'
    },
    onresize: () => {
    },
    dispatchEvent: (ev: Event) => true,
    addEventListener(
        event: string,
        callback: (arg0: { returnValue: null }) => void) {
      callback({returnValue: null});
    },
    scrollTo: () => {}
  };
}

describe('Skill editor page', () => {
  let component: SkillEditorPageComponent;
  let fixture: ComponentFixture<SkillEditorPageComponent>;
  let localStorageService: LocalStorageService;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let skillEditorRoutingService: SkillEditorRoutingService;
  let skillEditorStalenessDetectionService:
   SkillEditorStalenessDetectionService;
  let skillEditorStateService: SkillEditorStateService;
  let undoRedoService: UndoRedoService;
  let ngbModal: NgbModal;
  let urlService: UrlService;
  let skillObjectFactory: SkillObjectFactory;
  let skill: Skill;
  let windowRef: WindowRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [SkillEditorPageComponent],
      providers: [
        PreventPageUnloadEventService,
        UndoRedoService,
        UrlService,
        SkillEditorStateService,
        SkillUpdateService,
        SkillEditorStalenessDetectionService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillEditorPageComponent);
    component = fixture.componentInstance;
    localStorageService = TestBed.inject(LocalStorageService);
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService);
    skillEditorRoutingService = TestBed.inject(SkillEditorRoutingService);
    ngbModal = TestBed.inject(NgbModal);
    skillEditorStalenessDetectionService = (
      TestBed.inject(SkillEditorStalenessDetectionService));
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    urlService = TestBed.inject(UrlService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    windowRef = TestBed.inject(WindowRef);
  });

  beforeEach(() => {
    let skillContentsDict = {
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
    let skillDict: SkillBackendDict = {
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
    skill = skillObjectFactory.createFromBackendDict(skillDict);
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skill);
    localStorageService.removeOpenedEntityEditorBrowserTabsInfo(
      EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_SKILL_EDITOR_BROWSER_TABS);
  });

  it('should load skill based on its id in url when component is initialized',
    fakeAsync(() => {
      let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
        'skill', 'skill_id', 2, 1, false);
      spyOn(
        localStorageService, 'getEntityEditorBrowserTabsInfo'
      ).and.returnValue(BrowserTabsInfo);
      spyOn(skillEditorStateService, 'loadSkill').and.stub();
      spyOn(urlService, 'getSkillIdFromUrl').and.returnValue('skill_1');

      tick();

      component.ngOnInit();
      expect(skillEditorStateService.loadSkill).toHaveBeenCalledWith('skill_1');
    }));

  it('should addListener by passing getChangeCount to ' +
  'PreventPageUnloadEventService', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    spyOn(skillEditorStateService, 'loadSkill').and.stub();
    spyOn(urlService, 'getSkillIdFromUrl').and.returnValue('skill_1');
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    spyOn(preventPageUnloadEventService, 'addListener').and
      .callFake((callback: () => false) => callback());

    component.ngOnInit();

    expect(preventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });

  it('should get active tab name from skill editor routing service',
    () => {
      let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
        'skill', 'skill_id', 2, 1, false);
      spyOn(
        localStorageService, 'getEntityEditorBrowserTabsInfo'
      ).and.returnValue(BrowserTabsInfo);
      spyOn(skillEditorRoutingService, 'getActiveTabName').and.returnValue(
        'questions');
      expect(component.getActiveTabName()).toBe('questions');
    });

  it('should go to main tab when selecting main tab', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    let routingSpy = spyOn(
      skillEditorRoutingService, 'navigateToMainTab');
    component.selectMainTab();
    expect(routingSpy).toHaveBeenCalled();
  });

  it('should go to preview tab when selecting preview tab', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    let routingSpy = spyOn(
      skillEditorRoutingService, 'navigateToPreviewTab');
    component.selectPreviewTab();
    expect(routingSpy).toHaveBeenCalled();
  });

  it('should open save changes modal with ngbModal when unsaved changes are' +
    ' present', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake(
      () => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve()
        }) as NgbModalRef;
      });

    component.selectQuestionsTab();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should close save changes modal when somewhere outside is clicked',
    () => {
      let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
        'skill', 'skill_id', 2, 1, false);
      spyOn(
        localStorageService, 'getEntityEditorBrowserTabsInfo'
      ).and.returnValue(BrowserTabsInfo);
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake(
        () => {
          return ({
            componentInstance: MockNgbModalRef,
            result: Promise.reject()
          }) as NgbModalRef;
        });

      component.selectQuestionsTab();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should navigate to questions tab when unsaved changes are not present',
    () => {
      let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
        'skill', 'skill_id', 2, 1, false);
      spyOn(
        localStorageService, 'getEntityEditorBrowserTabsInfo'
      ).and.returnValue(BrowserTabsInfo);
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
      let routingSpy = spyOn(
        skillEditorRoutingService, 'navigateToQuestionsTab').and.callThrough();
      component.selectQuestionsTab();
      expect(routingSpy).toHaveBeenCalled();
    });

  it('should return warnings count for the skill', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    const conceptCard = new ConceptCard(
      SubtitledHtml.createDefault(
        'review material', AppConstants.COMPONENT_NAME_EXPLANATION),
      [], RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          COMPONENT_NAME_EXPLANATION: {}
        }
      })
    );
    component.skill = new Skill(
      'id1', 'description', [], [], conceptCard, 'en', 1, 0, 'id1', false, []
    );
    expect(component.getWarningsCount()).toEqual(1);
  });

  it('should create or update skill editor browser tabs info on ' +
  'local storage when a new tab opens', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    spyOn(skillEditorStateService, 'loadSkill').and.stub();
    spyOn(urlService, 'getSkillIdFromUrl').and.returnValue('skill_1');
    component.ngOnInit();

    let skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()
      ) as EntityEditorBrowserTabsInfo);

    expect(skillEditorBrowserTabsInfo).toBe(skillEditorBrowserTabsInfo);

    // Opening the first tab.
    skillEditorStateService.onSkillChange.emit();
    skillEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()
      ) as EntityEditorBrowserTabsInfo);

    expect(skillEditorBrowserTabsInfo).toBeDefined();
    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    // Opening the second tab.
    component.ngOnInit();
    skillEditorStateService.onSkillChange.emit();
    skillEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()
      ) as EntityEditorBrowserTabsInfo);

    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);
    expect(skillEditorBrowserTabsInfo.getLatestVersion()).toEqual(3);

    // Save some changes on the skill which will increment its version.
    spyOn(skill, 'getVersion').and.returnValue(4);
    skillEditorStateService.onSkillChange.emit();
    skillEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()
      ) as EntityEditorBrowserTabsInfo);

    expect(skillEditorBrowserTabsInfo.getLatestVersion()).toEqual(4);
  });

  it('should create or update skill editor browser tabs info if browser' +
  'tabs info is null', () => {
    spyOn(localStorageService, 'getEntityEditorBrowserTabsInfo')
      .and.returnValue(null);

    component.skillIsInitialized = false;
    component.createOrUpdateSkillEditorBrowserTabsInfo();

    expect(component.skillIsInitialized).toBeTrue();
  });

  it('should decrement number of opened skill editor tabs when ' +
  'a tab is closed', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    spyOn(preventPageUnloadEventService, 'addListener');
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    spyOn(skillEditorStateService, 'loadSkill').and.stub();
    spyOn(urlService, 'getSkillIdFromUrl').and.returnValue('skill_1');

    // Opening of the first tab.
    component.ngOnInit();
    skillEditorStateService.onSkillChange.emit();
    // Opening of the second tab.
    component.ngOnInit();
    skillEditorStateService.onSkillChange.emit();

    let skillEditorBrowserTabsInfo: EntityEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()
      ) as EntityEditorBrowserTabsInfo);

    // Making some unsaved changes on the editor page.
    skillEditorBrowserTabsInfo.setSomeTabHasUnsavedChanges(true);
    localStorageService.updateEntityEditorBrowserTabsInfo(
      skillEditorBrowserTabsInfo, EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_SKILL_EDITOR_BROWSER_TABS);

    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeTrue();
    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(1);

    component.onClosingSkillEditorBrowserTab();
    skillEditorBrowserTabsInfo = (
      localStorageService.getEntityEditorBrowserTabsInfo(
        EntityEditorBrowserTabsInfoDomainConstants
          .OPENED_SKILL_EDITOR_BROWSER_TABS, skill.getId()
      ) as EntityEditorBrowserTabsInfo);

    expect(skillEditorBrowserTabsInfo.getNumberOfOpenedTabs()).toEqual(0);

    // Since the tab containing unsaved changes is closed, the value of
    // unsaved changes status will become false.
    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();
  });

  it('should emit the stale tab and presence of unsaved changes events ' +
  'when the \'storage\' event is triggered', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    let staleTabEventEmitter = new EventEmitter();
    let presenceOfUnsavedChangesEventEmitter = new EventEmitter();
    let storageEvent = new StorageEvent('storage', {
      key: EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_SKILL_EDITOR_BROWSER_TABS
    });

    spyOn(
      skillEditorStalenessDetectionService, 'staleTabEventEmitter'
    ).and.returnValue(staleTabEventEmitter);
    spyOn(
      skillEditorStalenessDetectionService,
      'presenceOfUnsavedChangesEventEmitter'
    ).and.returnValue(presenceOfUnsavedChangesEventEmitter);
    spyOn(skillEditorStateService, 'loadSkill').and.stub();
    spyOn(urlService, 'getSkillIdFromUrl').and.returnValue('skill_1');

    component.ngOnInit();

    staleTabEventEmitter.emit();
    presenceOfUnsavedChangesEventEmitter.emit();
    windowRef.nativeWindow.dispatchEvent(storageEvent);

    expect(component.skillIsInitialized).toBeFalse();
  });

  it('should emit events if the duplicate tab opened is stale or' +
  'there are some unsaved changes present', () => {
    let BrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(BrowserTabsInfo);
    spyOn(skillEditorStalenessDetectionService.staleTabEventEmitter, 'emit');
    spyOn(
      skillEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter, 'emit');
    let storageEvent = new StorageEvent('storage', {
      key: EntityEditorBrowserTabsInfoDomainConstants
        .OPENED_SKILL_EDITOR_BROWSER_TABS
    });
    component.onCreateOrUpdateSkillEditorBrowserTabsInfo(storageEvent);

    expect(
      skillEditorStalenessDetectionService.staleTabEventEmitter.emit
    ).toHaveBeenCalled();
    expect(
      skillEditorStalenessDetectionService
        .presenceOfUnsavedChangesEventEmitter.emit
    ).toHaveBeenCalled();
  });
});
