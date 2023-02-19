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
 * @fileoverview Unit tests for the Skill Editor Navbar Component.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillEditorStateService } from '../services/skill-editor-state.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { UrlService } from 'services/contextual/url.service';
import { ConceptCard } from 'domain/skill/concept-card.model';
import { AppConstants } from 'app.constants';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { SkillEditorNavabarComponent } from './skill-editor-navbar.component';
import { SkillEditorRoutingService } from '../services/skill-editor-routing.service';

class MockNgbModalRef {
  componentInstance!: {
    body: 'xyz';
  };
}

describe('Skill Editor Navbar Component', () => {
  let component: SkillEditorNavabarComponent;
  let fixture: ComponentFixture<SkillEditorNavabarComponent>;
  let ngbModal: NgbModal;
  let skillEditorRoutingService: SkillEditorRoutingService;
  let skillEditorStateService: SkillEditorStateService;
  let undoRedoService: UndoRedoService;
  let urlService: UrlService;
  let skillUpdateService: SkillUpdateService;
  let sampleSkill: Skill;
  let mockEventEmitter = new EventEmitter();
  let mockPrerequisiteSkillChangeEventEmitter = new EventEmitter();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [SkillEditorNavabarComponent],
      providers: [
        SkillEditorStateService,
        UndoRedoService,
        UrlService,
        SkillEditorStateService,
        SkillUpdateService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });



  beforeEach(() => {
    fixture = TestBed.createComponent(SkillEditorNavabarComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillEditorRoutingService = TestBed.inject(SkillEditorRoutingService);
    undoRedoService = TestBed.inject(UndoRedoService);
    urlService = TestBed.inject(UrlService);
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
  });

  it('should set properties when initialized', () => {
    expect(component.activeTab).toBeUndefined();

    component.ngOnInit();
    mockEventEmitter.emit();
    mockPrerequisiteSkillChangeEventEmitter.emit();
    undoRedoService._undoRedoChangeEventEmitter.emit();

    expect(component.activeTab).toBe('Editor');
  });

  it('should get current active tab name when ' +
    'calling \'getActiveTabName\'', () => {
    spyOn(skillEditorRoutingService, 'getActiveTabName')
      .and.returnValue('activeTab');

    let result = component.getActiveTabName();

    expect(result).toBe('activeTab');
  });

  it('should check whether the skill is still loading when ' +
    'calling \'isLoadingSkill\'', () => {
    spyOn(skillEditorStateService, 'isLoadingSkill')
      .and.returnValue(false);

    let result = component.isLoadingSkill();

    expect(result).toBe(false);
  });

  it('should check whether the skill is being saved when ' +
    'calling \'isSaveInProgress \'', () => {
    spyOn(skillEditorStateService, 'isSavingSkill')
      .and.returnValue(false);

    let result = component.isSaveInProgress();

    expect(result).toBe(false);
  });

  it('should get change list count when calling ' +
    '\'getChangeListCount\'', () => {
    spyOn(undoRedoService, 'getChangeCount')
      .and.returnValue(2);

    let result = component.getChangeListCount();

    expect(result).toBe(2);
  });

  it('should discard changes when calling ' +
    '\'discardChanges\'', () => {
    let discardSpy = spyOn(undoRedoService, 'clearChanges')
      .and.returnValue();
    let loadSkillSpy = spyOn(skillEditorStateService, 'loadSkill')
      .and.returnValue();
    let urlSpy = spyOn(urlService, 'getSkillIdFromUrl')
      .and.returnValue('');

    component.ngOnInit();
    component.discardChanges();

    expect(discardSpy).toHaveBeenCalled();
    expect(loadSkillSpy).toHaveBeenCalled();
    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get change list count when calling ' +
    '\'getChangeListCount\'', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(3);

    expect(component.getChangeListCount()).toBe(3);
  });

  it('should get number of warnings when calling ' +
    '\'getWarningsCount\'', () => {
    spyOn(skillEditorStateService, 'getSkillValidationIssues')
      .and.returnValue(['issue 1', 'issue 2', 'issue 3']);

    expect(component.getWarningsCount()).toBe(3);
  });

  it('should check whether the skill is saveable when ' +
    'calling \'isSkillSaveable\'', () => {
    spyOn(skillEditorStateService, 'isSavingSkill')
      .and.returnValue(false);

    let result = component.isSkillSaveable();

    expect(result).toBe(false);
  });

  it('should toggle navigation options when calling ' +
    '\'toggleNavigationOptions\'', () => {
    component.showNavigationOptions = true;

    component.toggleNavigationOptions();
    expect(component.showNavigationOptions).toBe(false);

    component.toggleNavigationOptions();
    expect(component.showNavigationOptions).toBe(true);
  });

  it('should navigate to main tab when ' +
    'calling \'selectMainTab\'', () => {
    let navigateToMainTabSpy = spyOn(
      skillEditorRoutingService, 'navigateToMainTab')
      .and.returnValue();

    component.selectMainTab();

    expect(navigateToMainTabSpy).toHaveBeenCalled();
  });

  it('should navigate to main tab when ' +
    'calling \'selectPreviewTab\'', () => {
    let navigateToPreviewTabSpy = spyOn(
      skillEditorRoutingService, 'navigateToPreviewTab')
      .and.returnValue();

    component.selectPreviewTab();

    expect(navigateToPreviewTabSpy).toHaveBeenCalled();
  });

  it('should toggle skill edit options when calling ' +
    '\'toggleSkillEditOptions\'', () => {
    component.showSkillEditOptions = true;

    component.toggleSkillEditOptions();
    expect(component.showSkillEditOptions).toBe(false);

    component.toggleSkillEditOptions();
    expect(component.showSkillEditOptions).toBe(true);
  });

  it('should save changes if save changes modal is opened and confirm ' +
    'button is clicked', fakeAsync(() => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.resolve('success')
      } as NgbModalRef);
    });

    let saveSkillSpy = spyOn(skillEditorStateService, 'saveSkill')
      .and.callFake((message, cb) => {
        cb();
        return true;
      });

    component.saveChanges();
    tick();

    expect(modalSpy).toHaveBeenCalled();
    expect(saveSkillSpy).toHaveBeenCalled();
  }));

  it('should not save changes if save changes modal is opened and cancel ' +
    'button is clicked', fakeAsync(() => {
    let ngbModalSpy = spyOn(ngbModal, 'open').and.callFake(
      (modal, modalOptions) => {
        return ({
          result: Promise.reject()
        } as NgbModalRef);
      });
    spyOn(skillEditorStateService, 'saveSkill');

    component.saveChanges();
    tick();

    expect(ngbModalSpy).toHaveBeenCalled();
  }));

  describe('on navigating to questions tab ', () => {
    it('should open undo changes modal if there are unsaved ' +
      'changes', fakeAsync(() => {
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
        .and.returnValue();

      component.selectQuestionsTab();
      tick();

      expect(ngbModalSpy).toHaveBeenCalled();
      expect(navigateToQuestionsTabSpy).not.toHaveBeenCalled();
    }));

    it('should close undo changes modal if somewhere outside is' +
    ' clicked', fakeAsync(() => {
    // Setting unsaved changes to be two.
      spyOn(undoRedoService, 'getChangeCount')
        .and.returnValue(2);
      const ngbModalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.reject()
        }) as NgbModalRef;
      });
      let navigateToQuestionsTabSpy = spyOn(
        skillEditorRoutingService, 'navigateToQuestionsTab')
        .and.returnValue();

      component.selectQuestionsTab();
      tick();

      expect(ngbModalSpy).toHaveBeenCalled();
      expect(navigateToQuestionsTabSpy).not.toHaveBeenCalled();
    }));

    it('should navigate to questions tab if there are no unsaved ' +
      'changes', () => {
      // Setting unsaved changes to be zero.
      spyOn(undoRedoService, 'getChangeCount')
        .and.returnValue(0);
      let navigateToQuestionsTabSpy = spyOn(
        skillEditorRoutingService, 'navigateToQuestionsTab')
        .and.returnValue();

      component.selectQuestionsTab();

      expect(navigateToQuestionsTabSpy).toHaveBeenCalled();
    });
  });
});
