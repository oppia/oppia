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
 * @fileoverview Unit tests for TrainingDataEditorPanelServiceModalcomponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { Rule } from 'domain/exploration/rule.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { TruncateInputBasedOnInteractionAnswerTypePipe } from 'filters/truncate-input-based-on-interaction-answer-type.pipe';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { AnswerClassificationService } from 'pages/exploration-player-page/services/answer-classification.service';
import { AlertsService } from 'services/alerts.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ResponsesService } from '../services/responses.service';
import { TrainingDataEditorPanelComponent } from './training-data-editor-panel-modal.component';
import { TrainingDataService } from './training-data.service';
import { TrainingModalService } from './training-modal.service';


 class MockStateEditorService {
   getActiveStateName() {
     return 'Hola';
   }
 }

 class MockExplorationStatesService {
   getState(item1: string) {
     return {
       content: {
         html: 'This is Hola State'
       }
     };
   }
 }

 class MockResponsesService {
   getActiveAnswerGroupIndex() {
     return 1;
   }

   getAnswerGroup() {
     return new AnswerGroup([
       new Rule('TextInput', {
         x: [],
       }, {
         x: 'ListOfSetsOfTranslatableHtmlContentIds'
       }),
       new Rule('TextInput', {
         x: [],
       }, {
         x: 'ListOfSetsOfTranslatableHtmlContentIds'
       }),
     ], {} as Outcome, ['Answer1', 'Answer2'], null);
   }
 }

 class MockExplorationHtmlFormatterService {
   getInteractionHtml() {
     return 'MockExplorationHtmlFormattered string';
   }

   getAnswerHtml() {
     return 'answer';
   }
 }

 class MockActiveModal {
   close(): void {
     return;
   }

   dismiss(): void {
     return;
   }
 }

 class MockStateInteractionIdService {
   savedMemento = 'TextInput';
 }

 class MockAnswerClassificationService {
   getMatchingClassificationResult() {
     return {
       outcome: {
         dest: 'dest',
         feedback: 'feedback'
       },
       classificationCategorization: 'explicit Type'
     };
   }
 }

describe('Training Data Editor Panel Component', () => {
  let component: TrainingDataEditorPanelComponent;
  let fixture: ComponentFixture<TrainingDataEditorPanelComponent>;
  let focusManagerService: FocusManagerService;
  let ngbActiveModal: NgbActiveModal;
  let trainingModalService: TrainingModalService;
  let trainingDataService: TrainingDataService;
  let truncateInputBasedOnInteractionAnswerTypePipe:
     TruncateInputBasedOnInteractionAnswerTypePipe;
  let answerClassificationService: AnswerClassificationService;
  let stateEditorService: StateEditorService;
  let trainingModalServiceeventEmitter = new EventEmitter();

   class MockTrainingModalService {
     get onFinishTrainingCallback() {
       return trainingModalServiceeventEmitter;
     }

     getTrainingDataOfAnswerGroup(index1: string) {
       return ['name', 'class'];
     }

     openTrainUnresolvedAnswerModal(
         item1: string, item2: string, item3: string) {
     }
   }

   beforeEach(waitForAsync(() => {
     TestBed.configureTestingModule({
       imports: [
         HttpClientTestingModule,
       ],
       declarations: [
         TrainingDataEditorPanelComponent
       ],
       providers: [
         FocusManagerService,
         AlertsService,
         TruncateInputBasedOnInteractionAnswerTypePipe,
         {
           provide: ExplorationDataService,
           useValue: {
             explorationId: 0,
             autosaveChangeListAsync() {
               return;
             }
           }
         },
         {
           provide: StateInteractionIdService,
           useClass: MockStateInteractionIdService
         },
         {
           provide: NgbActiveModal,
           useClass: MockActiveModal
         },
         {
           provide: StateEditorService,
           useClass: MockStateEditorService
         },
         {
           provide: ExplorationStatesService,
           useClass: MockExplorationStatesService
         },
         {
           provide: ResponsesService,
           useClass: MockResponsesService
         },
         {
           provide: ExplorationHtmlFormatterService,
           useClass: MockExplorationHtmlFormatterService
         },
         {
           provide: TrainingModalService,
           useClass: MockTrainingModalService
         },
         {
           provide: AnswerClassificationService,
           useClass: MockAnswerClassificationService
         },
         TrainingDataService
       ],
       schemas: [NO_ERRORS_SCHEMA]
     }).compileComponents();
   }));

   beforeEach(() => {
     fixture = TestBed.createComponent(TrainingDataEditorPanelComponent);
     component = fixture.componentInstance;

     trainingDataService = TestBed.inject(TrainingDataService);
     trainingModalService = TestBed.inject(TrainingModalService);
     answerClassificationService = TestBed.inject(AnswerClassificationService);
     focusManagerService = TestBed.inject(FocusManagerService);
     stateEditorService = TestBed.inject(StateEditorService);
     ngbActiveModal = TestBed.inject(NgbActiveModal);
     truncateInputBasedOnInteractionAnswerTypePipe =
       TestBed.inject(TruncateInputBasedOnInteractionAnswerTypePipe);

     spyOn(focusManagerService, 'setFocus').and.stub();
     spyOn(truncateInputBasedOnInteractionAnswerTypePipe, 'transform')
       .and.returnValue('of question');
     spyOn(trainingDataService, 'associateWithAnswerGroup')
       .and.stub();

     fixture.detectChanges();
   });

   it('should initialize component properties after component is initialized',
     fakeAsync(() => {
       component.ngOnInit();

       trainingModalServiceeventEmitter.emit({
         answer: 'answer',
         interactionId: 'interactionId',
       });
       tick();

       component.ngOnDestroy();

       expect(truncateInputBasedOnInteractionAnswerTypePipe.transform)
         .toHaveBeenCalled();
       expect(component.stateName).toBe('Hola');
       expect(component.stateContent).toBe('This is Hola State');
       expect(component.answerGroupHasNonEmptyRules).toBe(true);
       expect(component.inputTemplate).toBe(
         'MockExplorationHtmlFormattered string');
     }));

   it('should call init when component is initialized', () => {
     expect(component.trainingData).toEqual([{
       answer: 'Answer1',
       answerTemplate: 'answer'
     }, {
       answer: 'Answer2',
       answerTemplate: 'answer'
     }]);
     expect(component.newAnswerIsAlreadyResolved).toBe(false);
     expect(component.answerSuccessfullyAdded).toBe(false);
   });

   it('should remove answer from training data', () => {
     spyOn(trainingDataService, 'removeAnswerFromAnswerGroupTrainingData')
       .and.stub();

     component.removeAnswerFromTrainingData(0);
     expect(component.trainingData).toEqual([{
       answer: 'Answer2',
       answerTemplate: 'answer'
     }]);
   });

   it('should submit answer that is not explicity classified', () => {
     component.submitAnswer('answer');

     expect(component.newAnswerTemplate).toBe(
       'answer');
     expect(component.newAnswerFeedback).toEqual(
       'feedback');
     expect(component.newAnswerOutcomeDest).toBe('dest');
     expect(component.newAnswerIsAlreadyResolved).toBe(false);
   });

   it('should submit answer that is explicity classified', () => {
     spyOn(answerClassificationService, 'getMatchingClassificationResult')
       .and.returnValue({
         outcome: new Outcome(
           'Hola',
           '',
           new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
           false,
           [],
           '',
           '',
         ),
         answerGroupIndex: 0,
         ruleIndex: null,
         classificationCategorization: 'explicit',
       });

     component.submitAnswer('answer');

     expect(component.newAnswerTemplate).toBe(
       'answer');
     expect(component.newAnswerFeedback).toEqual(
       new SubtitledHtml('<p>Saved Outcome</p>', 'Id'));
     expect(component.newAnswerOutcomeDest).toBe('(try again)');
     expect(component.newAnswerIsAlreadyResolved).toBe(true);
   });

   it('should open train unresolved answer modal', () => {
     component.answerGroupHasNonEmptyRules = true;

     spyOn(trainingModalService, 'openTrainUnresolvedAnswerModal').and
       .stub();

     component.openTrainUnresolvedAnswerModal(1);
     expect(trainingModalService.openTrainUnresolvedAnswerModal)
       .toHaveBeenCalled();
   });

   it('should exit modal', () => {
     spyOn(ngbActiveModal, 'close').and.stub();

     component.exit();

     expect(ngbActiveModal.close).toHaveBeenCalled();
   });

   it('should dismiss modal', () => {
     spyOn(ngbActiveModal, 'dismiss').and.stub();

     component.cancel();

     expect(ngbActiveModal.dismiss).toHaveBeenCalled();
   });

   it('should throw error if state name is null', fakeAsync(() => {
     spyOn(stateEditorService, 'getActiveStateName').and.returnValue(null);
     expect(() => {
       component.ngOnInit();
     }).toThrowError('State name cannot be empty.');
   }));

   it('should throw error if state name is null', fakeAsync(() => {
     component._stateName = null;
     expect(() => {
       component.submitAnswer('answer');
     }).toThrowError('State name cannot be empty.');
   }));
});
