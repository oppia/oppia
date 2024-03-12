// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TrainingModalController.
 */

import {ExplorationDataService} from 'pages/exploration-editor-page/services/exploration-data.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {TrainingModalComponent} from './training-modal.component';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {ResponsesService} from '../services/responses.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {TrainingDataService} from './training-data.service';
import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {ExplorationWarningsService} from 'pages/exploration-editor-page/services/exploration-warnings.service';

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

class MockExplorationStatesService {
  saveInteractionAnswerGroups(item1, item2) {}

  saveInteractionDefaultOutcome(item1, item2) {}

  getState() {
    return {
      interaction: 'TextInput',
    };
  }
}

class MockStateEditorService {
  getActiveStateName() {
    return 'main';
  }
}

class MockAnswerClassificationService {
  getMatchingClassificationResult() {
    return {
      answerGroupIndex: 2,
      outcome: null,
    };
  }
}

describe('Training Modal Component', () => {
  let component: TrainingModalComponent;
  let fixture: ComponentFixture<TrainingModalComponent>;
  let responsesService: ResponsesService;
  let ngbActiveModal: NgbActiveModal;
  let trainingDataService: TrainingDataService;
  let answerGroupObjectFactory: AnswerGroupObjectFactory;
  let graphDataService: GraphDataService;
  let explorationWarningsService: ExplorationWarningsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TrainingModalComponent],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            },
          },
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: StateInteractionIdService,
          useClass: MockStateInteractionIdService,
        },
        {
          provide: StateEditorService,
          useClass: MockStateEditorService,
        },
        {
          provide: ExplorationStatesService,
          useClass: MockExplorationStatesService,
        },
        {
          provide: AnswerClassificationService,
          useClass: MockAnswerClassificationService,
        },
        AnswerGroupObjectFactory,
        TrainingDataService,
        ResponsesService,
        ExplorationWarningsService,
        GraphDataService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainingModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    answerGroupObjectFactory = TestBed.inject(AnswerGroupObjectFactory);
    trainingDataService = TestBed.inject(TrainingDataService);
    responsesService = TestBed.inject(ResponsesService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);
    graphDataService = TestBed.inject(GraphDataService);
    spyOn(ngbActiveModal, 'close').and.stub();
    spyOn(explorationWarningsService, 'updateWarnings').and.stub();
    spyOn(graphDataService, 'recompute').and.stub();

    fixture.detectChanges();
  });

  it('should exit training modal', () => {
    component.exitTrainer();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it(
    'should click on confirm button when ' +
      'answerGroupIndex is greater than Response',
    () => {
      component.classification = {
        answerGroupIndex: 2,
        newOutcome: new Outcome('dest', null, null, true, [], null, null),
      };
      component.unhandledAnswer = 'string';

      spyOn(answerGroupObjectFactory, 'createNew').and.returnValue(null);
      spyOn(trainingDataService, 'associateWithAnswerGroup').and.stub();
      spyOn(responsesService, 'getAnswerGroupCount').and.returnValue(1);
      spyOn(responsesService, 'getAnswerGroups').and.returnValue([
        {},
      ] as AnswerGroup[]);
      spyOn(responsesService, 'save').and.callFake(
        (answerGroups, getDefaultOutcome, save) => {
          save(null, null);
        }
      );

      component.ngOnInit();
      component.onConfirm();

      expect(responsesService.save).toHaveBeenCalled();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    }
  );

  it(
    'should click on confirm button when ' +
      'answerGroupIndex is greater than Response',
    () => {
      component.classification = {
        answerGroupIndex: 1,
        newOutcome: new Outcome('dest', null, null, true, [], null, null),
      };
      component.unhandledAnswer = 'string';

      spyOn(trainingDataService, 'associateWithDefaultResponse').and.stub();
      spyOn(responsesService, 'getAnswerGroupCount').and.returnValue(1);

      component.onConfirm();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    }
  );

  it(
    'should click on confirm button when ' +
      'answerGroupIndex is less than Response',
    () => {
      component.classification = {
        answerGroupIndex: 1,
        newOutcome: new Outcome('dest', null, null, true, [], null, null),
      };
      component.unhandledAnswer = 'string';

      spyOn(trainingDataService, 'associateWithAnswerGroup').and.stub();
      spyOn(responsesService, 'getAnswerGroupCount').and.returnValue(3);

      component.onConfirm();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    }
  );
});
