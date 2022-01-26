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
 * @fileoverview Unit test for state solution editor component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Solution, SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { SolutionVerificationService } from 'pages/exploration-editor-page/editor-tab/services/solution-verification.service';
import { AlertsService } from 'services/alerts.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { StateEditorService } from '../state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from '../state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from '../state-editor-properties-services/state-solution.service';
import { StateSolutionEditorComponent } from './state-solution-editor.component';

describe('State Solution Editor Component', () => {
  let component: StateSolutionEditorComponent;
  let fixture: ComponentFixture<StateSolutionEditorComponent>;
  let alertsService: AlertsService;
  let convertToPlainTextPipe: ConvertToPlainTextPipe;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let ngbModal: NgbModal;
  let solutionValidityService: SolutionValidityService;
  let solutionVerificationService: SolutionVerificationService;
  let stateEditorService: StateEditorService;
  let stateSolutionService: StateSolutionService;
  let stateInteractionIdService: StateInteractionIdService;
  let windowDimensionsService: WindowDimensionsService;

  let solution: Solution;
  let solutionObjectFactory: SolutionObjectFactory;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        StateSolutionEditorComponent
      ],
      providers: [
        AlertsService,
        ExplorationHtmlFormatterService,
        SolutionValidityService,
        SolutionVerificationService,
        StateEditorService,
        StateSolutionService,
        ConvertToPlainTextPipe,
        StateInteractionIdService,
        WindowDimensionsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateSolutionEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);

    convertToPlainTextPipe = TestBed.inject(ConvertToPlainTextPipe);
    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateSolutionService = TestBed.inject(StateSolutionService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    solutionValidityService = TestBed.inject(SolutionValidityService);
    alertsService = TestBed.inject(AlertsService);
    solutionVerificationService = TestBed.inject(SolutionVerificationService);
    solutionObjectFactory = TestBed.inject(SolutionObjectFactory);

    solution = solutionObjectFactory.createFromBackendDict({
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer'
      }
    });

    spyOn(explorationHtmlFormatterService, 'getInteractionHtml')
      .and.returnValue('answerEditorHtml');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
  });

  it('should set component properties on initialization', () => {
    component.ngOnInit();

    expect(component.solutionCardIsShown).toBeTrue();
    expect(component.correctAnswer).toBe(null);
    expect(component.inlineSolutionEditorIsActive).toBeFalse();
    expect(component.SOLUTION_EDITOR_FOCUS_LABEL).toBe(
      'currentCorrectAnswerEditorHtmlForSolutionEditor');
    expect(component.correctAnswerEditorHtml).toEqual('answerEditorHtml');
  });

  it('should toggle solution card visibility', () => {
    component.solutionCardIsShown = true;

    component.toggleSolutionCard();

    expect(component.solutionCardIsShown).toBeFalse();

    component.toggleSolutionCard();

    expect(component.solutionCardIsShown).toBeTrue();
  });

  it('should open delete solution modal when user clicks on delete',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue(
        {
          result: Promise.resolve()
        } as NgbModalRef
      );
      spyOn(stateEditorService, 'deleteCurrentSolutionValidity');
      spyOn(stateSolutionService, 'saveDisplayedValue');

      const value = {
        index: 0,
        evt: new Event('')
      };

      component.deleteSolution(value);
      tick();

      expect(
        stateEditorService.deleteCurrentSolutionValidity).toHaveBeenCalled();
      expect(stateSolutionService.saveDisplayedValue).toHaveBeenCalled();
    }));

  it('should close delete solution modal when user clicks cancel',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue(
        {
          result: Promise.reject()
        } as NgbModalRef
      );

      const value = {
        index: 0,
        evt: new Event('')
      };

      component.deleteSolution(value);
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));

  it('should inject invalid solution tooltip text', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValues(true, false);

    // When in question mode.
    expect(component.getInvalidSolutionTooltip()).toBe(
      'This solution doesn\'t correspond to an answer ' +
      'marked as correct. Verify the rules specified for the ' +
      'answers or change the solution.'
    );

    // When not in question mode.
    expect(component.getInvalidSolutionTooltip()).toBe(
      'This solution does not lead to another card. Verify the ' +
      'responses specified or change the solution.'
    );
  });

  it('should check if current solution is valid or not', () => {
    spyOn(stateEditorService, 'isCurrentSolutionValid').and.returnValue(true);

    expect(component.isSolutionValid()).toBeTrue();
  });

  it('should toggle activity of inline solution editor', () => {
    component.inlineSolutionEditorIsActive = true;

    component.toggleInlineSolutionEditorIsActive();

    expect(component.inlineSolutionEditorIsActive).toBeFalse();

    component.toggleInlineSolutionEditorIsActive();

    expect(component.inlineSolutionEditorIsActive).toBeTrue();
  });

  it('should inject summary of solution', () => {
    stateSolutionService.savedMemento = solution;
    spyOn(convertToPlainTextPipe, 'transform').and.callFake((response) => {
      return response;
    });

    expect(component.getSolutionSummary()).toBe(
      'One solution is "This is a correct answer!".' +
      ' This is the explanation to the answer.');
  });

  it('should check if current interaction is linear or not', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.isCurrentInteractionLinear()).toBeFalse();
  });

  it('should open add or update solution modal when user clicks on' +
    ' \'+ ADD SOLUTION\'', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve({
        solution: solution
      })
    } as NgbModalRef);
    spyOn(solutionVerificationService, 'verifySolution').and.returnValue(false);
    spyOn(solutionValidityService, 'updateValidity').and.stub();
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValues(true, false);
    spyOn(alertsService, 'addInfoMessage');

    // In question mode.
    component.openAddOrUpdateSolutionModal();
    tick();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'The current solution does not correspond to a correct answer.', 4000
    );

    // Not in question mode.
    component.openAddOrUpdateSolutionModal();
    tick();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'The current solution does not lead to another card.', 4000
    );
  }));

  it('should close add or update solution modal if user clicks cancel',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject()
      } as NgbModalRef);

      component.openAddOrUpdateSolutionModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));

  it('should save solution and open showMarkAllAudioAsNeedingUpdateModal' +
    ' when user click', () => {
    spyOn(component, 'showMarkAllAudioAsNeedingUpdateModalIfRequired').and
      .callThrough();
    spyOn(component, 'onSaveSolution').and.callThrough();

    component.openMarkAllAudioAsNeedingUpdateModalIfRequired(solution);
    component.onSaveSolution(solution);

    expect(component.showMarkAllAudioAsNeedingUpdateModalIfRequired)
      .toHaveBeenCalledWith(solution);
    expect(component.onSaveSolution).toHaveBeenCalledWith(solution);
  });
});
