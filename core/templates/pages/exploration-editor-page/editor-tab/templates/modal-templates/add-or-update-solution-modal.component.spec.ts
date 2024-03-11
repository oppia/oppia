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
 * @fileoverview Unit tests for add or update solution modal component.
 */

import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { Solution, SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { AddOrUpdateSolutionModalComponent } from './add-or-update-solution-modal.component';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Or Update Solution Modal Component', () => {
  let component: AddOrUpdateSolutionModalComponent;
  let fixture: ComponentFixture<AddOrUpdateSolutionModalComponent>;
  let contextService: ContextService;
  let currentInteractionService: CurrentInteractionService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let ngbActiveModal: NgbActiveModal;
  let solutionObjectFactory: SolutionObjectFactory;
  let stateInteractionIdService: StateInteractionIdService;
  let stateSolutionService: StateSolutionService;
  let generateContentIdService: GenerateContentIdService;

  let answerEditorHtml: Solution;
  let mockInteractionRule: InteractionRulesService;

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
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    stateSolutionService = TestBed.inject(StateSolutionService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    generateContentIdService.init(() => 0, () => {});
  });

  describe('when solution is valid', () => {
    beforeEach(() => {
      ngbActiveModal = TestBed.inject(NgbActiveModal);
      contextService = TestBed.inject(ContextService);

      spyOn(contextService, 'getEntityType').and.returnValue('question');
      spyOn(explorationHtmlFormatterService, 'getInteractionHtml')
        .and.returnValue('<p>Interaction Html</p>');

      answerEditorHtml = new Solution(
        explorationHtmlFormatterService, true, 'solution',
        SubtitledHtml.createDefault('Explanation html', 'cont_1'));

      stateSolutionService.init('', answerEditorHtml);
      stateInteractionIdService.init('', 'TextInput');
      component.ngOnInit();
      currentInteractionService.updateViewWithNewAnswer();
    });

    it('should initialize properties after component is initialized', () => {
      stateSolutionService.init('', answerEditorHtml);

      expect(component.correctAnswerEditorHtml).toEqual(
        '<p>Interaction Html</p>');
      expect(component.data).toEqual({
        answerIsExclusive: true,
        correctAnswer: undefined,
        explanationHtml: 'Explanation html',
        explanationContentId: 'cont_1'
      });
      expect(component.answerIsValid).toBeFalse();
      expect(component.ansOptions).toEqual(['The only', 'One']);
      expect(component.tempAnsOption).toEqual('One');
    });

    it('should update the answerIsExclusive correctly', () => {
      component.tempAnsOption = 'The only';

      component.onAnswerChange();

      expect(component.data.answerIsExclusive).toBeTrue();

      component.tempAnsOption = 'One';

      component.onAnswerChange();

      expect(component.data.answerIsExclusive).toBeFalse();
    });

    it('should update correct answer when submitting current interaction',
      () => {
        currentInteractionService.onSubmit('answer', mockInteractionRule);

        expect(component.data.correctAnswer).toEqual('answer');
      });

    it('should submit answer when clicking on submit button', () => {
      spyOn(currentInteractionService, 'submitAnswer');

      component.onSubmitFromSubmitButton();

      expect(currentInteractionService.submitAnswer).toHaveBeenCalled();
    });

    it('should check if additional submit button should be shown', () => {
      stateInteractionIdService.init('', 'TextInput');

      expect(component.shouldAdditionalSubmitButtonBeShown()).toBeTrue();

      stateInteractionIdService.displayed = 'Continue';

      stateInteractionIdService.saveDisplayedValue();

      expect(component.shouldAdditionalSubmitButtonBeShown()).toBeFalse();
    });

    it('should tell if submit button is disabled', () => {
      spyOn(currentInteractionService, 'isSubmitButtonDisabled')
        .and.returnValue(true);

      expect(component.isSubmitButtonDisabled()).toBeTrue();
    });

    it('should save solution when closing the modal', () => {
      spyOn(ngbActiveModal, 'close');
      stateSolutionService.init('', answerEditorHtml);
      currentInteractionService.onSubmit('answer', mockInteractionRule);

      component.saveSolution();

      expect(ngbActiveModal.close).toHaveBeenCalledWith({
        solution: solutionObjectFactory.createNew(
          true, 'answer', 'Explanation html', 'cont_1')
      });
    });

    it('should not show solution explanation length validation error', () => {
      let solutionExplanation = '<p>Explanation html</p>';

      expect(component.isSolutionExplanationLengthExceeded(
        solutionExplanation)).toBeFalse();
    });
  });

  describe('when solution is not valid', () => {
    beforeEach(() => {
      ngbActiveModal = TestBed.inject(NgbActiveModal);
      contextService = TestBed.inject(ContextService);

      spyOn(contextService, 'getEntityType').and.returnValue('question');
      spyOn(explorationHtmlFormatterService, 'getInteractionHtml').and
        .returnValue('answerEditorHtml');

      stateInteractionIdService.init('', 'TextInput');
      fixture.detectChanges();
    });

    it('should not save solution', () => {
      expect(() => {
        component.saveSolution();
      }).toThrowError('Cannot save invalid solution');
    });

    it('should show solution explanation length validation error', () => {
      let solutionExplanation = '<p>Solution explanation</p>'.repeat(180);

      expect(component.isSolutionExplanationLengthExceeded(
        solutionExplanation)).toBeTrue();
    });
  });
});
