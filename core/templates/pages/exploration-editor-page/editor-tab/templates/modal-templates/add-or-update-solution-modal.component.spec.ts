// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AddOrUpdateSolutionModalComponent.
 */

import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { Solution, SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { CurrentInteractionService, InteractionRulesService } from 'pages/exploration-player-page/services/current-interaction.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { AddOrUpdateSolutionModalComponent } from './add-or-update-solution-modal.component';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

fdescribe('Add Or Update Solution Modal Component', function() {
  let component: AddOrUpdateSolutionModalComponent;
  let fixture: ComponentFixture<AddOrUpdateSolutionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let contextService: ContextService;
  let currentInteractionService: CurrentInteractionService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let solutionObjectFactory: SolutionObjectFactory;
  let stateCustomizationArgsService: StateCustomizationArgsService;
  let stateInteractionIdService: StateInteractionIdService;
  let stateSolutionService: StateSolutionService;
  let answerEditorHtml: Solution;
  let inter: InteractionRulesService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddOrUpdateSolutionModalComponent
      ],
      providers: [
        ContextService,
        CurrentInteractionService,
        ChangeDetectorRef,
        ExplorationHtmlFormatterService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        SolutionObjectFactory,
        StateCustomizationArgsService,
        StateInteractionIdService,
        StateSolutionService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOrUpdateSolutionModalComponent);
    component = fixture.componentInstance;
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService);
    solutionObjectFactory = TestBed.inject(SolutionObjectFactory);
    stateCustomizationArgsService = TestBed.inject(StateCustomizationArgsService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    stateSolutionService = TestBed.inject(StateSolutionService);
  });

  describe('when solution is valid', function() {
    beforeEach(() => {
      ngbActiveModal = TestBed.inject(NgbActiveModal);
      contextService = TestBed.inject(ContextService);
      
      spyOn(contextService, 'getEntityType').and.returnValue('question');
      spyOn(explorationHtmlFormatterService, 'getInteractionHtml').and
        .returnValue(null);

      fixture.detectChanges();
    });

    it('should initialize $scope properties after controller is initialized',
      () => {
        stateSolutionService.init('', answerEditorHtml);
        expect(component.correctAnswerEditorHtml).toBe(null);
        expect(component.data).toEqual({
          answerIsExclusive: true,
          correctAnswer: null,
          explanationHtml: 'Explanation html',
          explanationContentId: 'cont_1'
        });
        expect(component.answerIsValid).toBe(false);
      });

    it('should update correct answer when submitting current interaction',
      () => {
        currentInteractionService.onSubmit('answer',inter);

        expect(component.data.correctAnswer).toEqual('answer');
      });

    it('should submit answer when clicking on submit button', function() {
      spyOn(currentInteractionService, 'submitAnswer');

      component.onSubmitFromSubmitButton();

      expect(currentInteractionService.submitAnswer).toHaveBeenCalled();
    });

    it('should check if additional submit button should be shown',
      () => {
        stateInteractionIdService.init('', 'TextInput');

        expect(component.shouldAdditionalSubmitButtonBeShown()).toBe(true);

        stateInteractionIdService.displayed = 'Continue';
        stateInteractionIdService.saveDisplayedValue();

        expect(component.shouldAdditionalSubmitButtonBeShown()).toBe(false);
      });

    it('should save solution when closing the modal', () => {
      stateSolutionService.init('', answerEditorHtml);
      currentInteractionService.onSubmit('answer', inter);
      component.saveSolution();

      expect(ngbActiveModal.close).toHaveBeenCalledWith({
        solution: solutionObjectFactory.createNew(
          true, 'answer', 'Explanation html', 'cont_1')
      });
    });

    it('should not show solution explanation length validation error',
      () => {
        let solutionExplanation = 'Explanation html';

        expect(component.isSolutionExplanationLengthExceeded(
          solutionExplanation)).toBe(false);
      });
  });

  describe('when solution is not valid', function() {
    let answerEditorHtml: string = '';

    beforeEach(() => {
        ngbActiveModal = TestBed.inject(NgbActiveModal);
        contextService = TestBed.inject(ContextService);
    
        spyOn(contextService, 'getEntityType').and.returnValue('question');
        spyOn(explorationHtmlFormatterService, 'getInteractionHtml').and
        .returnValue(answerEditorHtml);

        fixture.detectChanges();
    });

    it('should not save solution', () => {
        expect(() => {
            component.saveSolution();
        }).toThrowError('Cannot save invalid solution');
    });

    it('should show solution explanation length validation error',
      () => {
        let solutionExplanation = 'Solution explanation'.repeat(180);
        expect(component.isSolutionExplanationLengthExceeded(
          solutionExplanation)).toBe(true);
      });
  });
});
