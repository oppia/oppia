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
 * @fileoverview Unit tests for SkillMisconceptionsEditorComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { of, Subscription } from 'rxjs';
import { ConceptCard } from 'domain/skill/concept-card.model';
import { Misconception, MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { DeleteMisconceptionModalComponent } from 'pages/skill-editor-page/modal-templates/delete-misconception-modal.component';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { SkillMisconceptionsEditorComponent } from './skill-misconceptions-editor.component';

describe('Skill Misconceptions Editor Component', () => {
  let component: SkillMisconceptionsEditorComponent;
  let fixture: ComponentFixture<SkillMisconceptionsEditorComponent>;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let ngbModal: NgbModal;
  let skillEditorStateService: SkillEditorStateService;
  let skillUpdateService: SkillUpdateService;
  let windowDimensionsService: WindowDimensionsService;

  let mockOnSkillChangeEmitter = new EventEmitter();
  let sampleMisconception: Misconception;
  let sampleSkill: Skill;
  let testSubscriptions: Subscription;
  const skillChangeSpy = jasmine.createSpy('saveOutcomeDestDetails');
  let resizeEvent = new Event('resize');
  let mockEventEmitter = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        SkillMisconceptionsEditorComponent
      ],
      providers: [
        ChangeDetectorRef,
        SkillEditorStateService,
        SkillUpdateService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent)
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillMisconceptionsEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillUpdateService = TestBed.inject(SkillUpdateService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);

    sampleSkill = new Skill(
      'id1', 'description', [], [], {} as ConceptCard, 'en',
      1, 0, 'id1', false, []);
    sampleMisconception = misconceptionObjectFactory.create(
      1, 'misconceptionName', 'notes', 'feedback', false);
    sampleSkill._misconceptions = [sampleMisconception];

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
  });

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(skillEditorStateService.onSkillChange.subscribe(
      skillChangeSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should set properties when initialized', () => {
    // Misconception list is shown only when window is not narrow.
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOnProperty(skillEditorStateService, 'onSkillChange').and.returnValue(
      mockOnSkillChangeEmitter);

    expect(component.skill).toBe(undefined);
    expect(component.misconceptions).toBeUndefined();
    expect(component.misconceptionsListIsShown).toBeFalse();

    component.ngOnInit();
    mockOnSkillChangeEmitter.emit();

    expect(component.skill).toEqual(sampleSkill);
    expect(component.misconceptions).toEqual(sampleSkill.getMisconceptions());
    expect(component.misconceptionsListIsShown).toEqual(true);
  });

  it('should trigger change event when misconception is updated', () => {
    component.ngOnInit();
    spyOn(component.getMisconceptionsChange, 'emit').and.callThrough();

    component.onMisconceptionChange();

    expect(component.getMisconceptionsChange.emit).toHaveBeenCalled();
  });

  it('should toggle misconceptionList when toggle ' +
    'button is clicked', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    component.misconceptionsListIsShown = false;

    component.toggleMisconceptionLists();
    expect(component.misconceptionsListIsShown).toBe(true);

    component.toggleMisconceptionLists();
    expect(component.misconceptionsListIsShown).toBe(false);
  });

  it('should open add misconception modal when clicking on add ' +
    'button', fakeAsync(() => {
    component.skill = sampleSkill;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        misconception: sampleMisconception
      })
    } as NgbModalRef);
    spyOn(skillUpdateService, 'addMisconception').and.callThrough();

    component.openAddMisconceptionModal();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(skillUpdateService.addMisconception).toHaveBeenCalledWith(
      sampleSkill, sampleMisconception);
  }));

  it('should close add misconception modal when clicking on close ' +
    'button', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(skillUpdateService, 'addMisconception').and.callThrough();

    component.openAddMisconceptionModal();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(skillUpdateService.addMisconception).not.toHaveBeenCalled();
  }));

  it('should open delete misconception modal when clicking on delete ' +
    'button', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        index: 'index'
      },
      result: Promise.resolve({
        result: {
          id: 'id'
        }
      })
    } as NgbModalRef);
    spyOn(skillUpdateService, 'deleteMisconception').and.returnValue();

    component.ngOnInit();
    component.openDeleteMisconceptionModal(1, '1');
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      DeleteMisconceptionModalComponent, {backdrop: 'static'});
    expect(skillUpdateService.deleteMisconception).toHaveBeenCalled();
  }));

  it('should close delete misconception modal when clicking on ' +
    'close button', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        index: 'index'
      },
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(skillUpdateService, 'deleteMisconception').and.callThrough();

    component.ngOnInit();
    component.openDeleteMisconceptionModal(1, '1');
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      DeleteMisconceptionModalComponent, {backdrop: 'static'});
    expect(skillUpdateService.deleteMisconception).not.toHaveBeenCalled();
  }));

  it('should return misconception name given input as misconception ' +
    'when calling \'getMisconceptionSummary \'', () => {
    let name = component.getMisconceptionSummary(sampleMisconception);

    expect(name).toBe('misconceptionName');
  });

  it('should change active misconception index', () => {
    component.activeMisconceptionIndex = 1;

    component.changeActiveMisconceptionIndex(2);

    expect(component.activeMisconceptionIndex).toBe(2);
  });

  it('should set active misconception index to null if ' +
    'oldIndex is newIndex', () => {
    component.activeMisconceptionIndex = 1;

    component.changeActiveMisconceptionIndex(1);

    expect(component.activeMisconceptionIndex).toBe(null);
  });

  it('should toggle skill editor card on clicking', () => {
    component.skillEditorCardIsShown = true;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    component.toggleSkillEditorCard();

    expect(component.skillEditorCardIsShown).toBeFalse();

    component.toggleSkillEditorCard();

    expect(component.skillEditorCardIsShown).toBeTrue();
  });

  it('should show Misconceptions list when the window is narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockEventEmitter);
    component.windowIsNarrow = false;

    expect(component.misconceptionsListIsShown).toBe(false);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.misconceptionsListIsShown).toBe(false);
    expect(component.windowIsNarrow).toBe(true);
  });

  it('should show Misconceptions list when the window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    component.windowIsNarrow = true;

    expect(component.misconceptionsListIsShown).toBe(false);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.misconceptionsListIsShown).toBe(true);
    expect(component.windowIsNarrow).toBe(false);
  });

  it('should not toggle Misconceptions list when window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.misconceptionsListIsShown = true;

    component.toggleMisconceptionLists();

    expect(component.misconceptionsListIsShown).toBe(true);
  });

  it('should not toggle skill card editor when window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.skillEditorCardIsShown = true;

    component.toggleMisconceptionLists();

    expect(component.skillEditorCardIsShown).toBe(true);
  });
});
