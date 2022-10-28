// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for unresolvedAnswersOverview.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EditabilityService } from 'services/editability.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { ImprovementsService } from 'services/improvements.service';
import { StateTopAnswersStatsService } from 'services/state-top-answers-stats.service';
import { UnresolvedAnswersOverviewComponent } from './unresolved-answers-overview.component';
import { ExternalSaveService } from 'services/external-save.service';

describe('Unresolved Answers Overview Component', () => {
  let component: UnresolvedAnswersOverviewComponent;
  let fixture: ComponentFixture<UnresolvedAnswersOverviewComponent>;
  let ngbModal: NgbModal;
  let editabilityService: EditabilityService;
  let explorationStatesService: ExplorationStatesService;
  let improvementsService: ImprovementsService;
  let stateInteractionIdService: StateInteractionIdService;
  let stateEditorService: StateEditorService;
  let stateTopAnswersStatsService: StateTopAnswersStatsService;

  let mockExternalSaveEventEmitter = new EventEmitter();

  let stateName = 'State1';

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve()
      };
    }
  }

  class MockExternalSaveService {
    onExternalSave = mockExternalSaveEventEmitter;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        UnresolvedAnswersOverviewComponent
      ],
      providers: [
        EditabilityService,
        ExplorationStatesService,
        ImprovementsService,
        StateInteractionIdService,
        StateEditorService,
        StateTopAnswersStatsService,
        {
          provide: ExternalSaveService,
          useClass: MockExternalSaveService
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(UnresolvedAnswersOverviewComponent);
    component = fixture.componentInstance;

    editabilityService = TestBed.inject(EditabilityService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    improvementsService = TestBed.inject(ImprovementsService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateTopAnswersStatsService = TestBed.inject(StateTopAnswersStatsService);
    ngbModal = TestBed.inject(NgbModal);

    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(stateName);
    spyOn(explorationStatesService, 'getState').and.returnValue(null);

    component.ngOnInit();
  });

  it('should initialize component properties after controller is initialized',
    () => {
      expect(component.unresolvedAnswersOverviewIsShown).toBe(false);
      expect(component.SHOW_TRAINABLE_UNRESOLVED_ANSWERS).toBe(false);
    });

  it('should check unresolved answers overview are shown when it has' +
    ' state stats', () => {
    spyOn(stateTopAnswersStatsService, 'hasStateStats').and.returnValue(true);
    spyOn(
      improvementsService,
      'isStateForcedToResolveOutstandingUnaddressedAnswers')
      .and.returnValue(true);

    expect(component.isUnresolvedAnswersOverviewShown()).toBe(true);
  });

  it('should check unresolved answers overview are not shown when it' +
    ' has no state stats', () => {
    spyOn(stateTopAnswersStatsService, 'hasStateStats').and.returnValue(false);
    spyOn(
      improvementsService,
      'isStateForcedToResolveOutstandingUnaddressedAnswers');

    expect(component.isUnresolvedAnswersOverviewShown()).toBe(false);
    expect(
      improvementsService.isStateForcedToResolveOutstandingUnaddressedAnswers)
      .not.toHaveBeenCalled();
  });

  it('should check unresolved answers overview are not shown when' +
    ' the state is not forced to resolved unaddressed answers', () => {
    spyOn(stateTopAnswersStatsService, 'hasStateStats').and.returnValue(true);
    spyOn(
      improvementsService,
      'isStateForcedToResolveOutstandingUnaddressedAnswers')
      .and.returnValue(false);

    expect(component.isUnresolvedAnswersOverviewShown()).toBe(false);
  });

  it('should check whenever the current interaction is trainable or not',
    () => {
      stateInteractionIdService.init(stateName, 'CodeRepl');
      expect(component.getCurrentInteractionId()).toBe('CodeRepl');
      expect(component.isCurrentInteractionTrainable()).toBe(true);

      stateInteractionIdService.init(stateName, 'Continue');
      expect(component.getCurrentInteractionId()).toBe('Continue');
      expect(component.isCurrentInteractionTrainable()).toBe(false);
    });

  it('should check whenever the current interaction is linear or not',
    () => {
      stateInteractionIdService.init(stateName, 'Continue');
      expect(component.getCurrentInteractionId()).toBe('Continue');
      expect(component.isCurrentInteractionLinear()).toBe(true);

      stateInteractionIdService.init(stateName, 'PencilCodeEditor');
      expect(component.getCurrentInteractionId()).toBe('PencilCodeEditor');
      expect(component.isCurrentInteractionLinear()).toBe(false);
    });

  it('should check editability when outside tutorial mode', () => {
    let editabilitySpy = spyOn(
      editabilityService, 'isEditableOutsideTutorialMode');

    editabilitySpy.and.returnValue(true);
    expect(component.isEditableOutsideTutorialMode()).toBe(true);

    editabilitySpy.and.returnValue(false);
    expect(component.isEditableOutsideTutorialMode()).toBe(false);
  });

  it('should open teach oppia modal', () => {
    spyOn(ngbModal, 'open').and.callThrough();

    component.openTeachOppiaModal();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should emit externalSave when closing the modal', () => {
    spyOn(mockExternalSaveEventEmitter, 'emit').and.callThrough();
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);

    component.openTeachOppiaModal();

    expect(mockExternalSaveEventEmitter.emit).toHaveBeenCalled();
  });

  it('should broadcast externalSave flag when dismissing the modal',
    () => {
      spyOn(mockExternalSaveEventEmitter, 'emit').and.callThrough();
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject()
      } as NgbModalRef);

      component.openTeachOppiaModal();

      expect(mockExternalSaveEventEmitter.emit).toHaveBeenCalled();
    });

  it('should fetch unresolved state stats from backend', () => {
    spyOn(stateTopAnswersStatsService, 'getUnresolvedStateStats').and
      .returnValue(null);
    expect(component.getUnresolvedStateStats()).toEqual(null);
  });
});
