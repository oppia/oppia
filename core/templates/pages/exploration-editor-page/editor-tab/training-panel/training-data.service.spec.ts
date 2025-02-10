// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the training data service.
 */

import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExplorationDataService} from 'pages/exploration-editor-page/services/exploration-data.service';
import {TrainingDataService} from './training-data.service';
import {ResponsesService} from '../services/responses.service';
import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {Rule} from 'domain/exploration/rule.model';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {State} from 'domain/state/StateObjectFactory';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockResponsesService {
  AnswerGroupArray = [
    new AnswerGroup(
      [new Rule('TextInput', null, null), new Rule('TextInput', null, null)],
      null,
      ['trainingData 1'],
      null
    ),
    new AnswerGroup(
      [new Rule('TextInput', null, null), new Rule('TextInput', null, null)],
      null,
      ['trainingData 1', 'trainingData 2'],
      null
    ),
  ];

  getAnswerGroup(index: number) {
    return this.AnswerGroupArray[index];
  }

  getAnswerGroups() {
    return this.AnswerGroupArray;
  }

  updateAnswerGroup(
    item1: string,
    item2: string,
    item3: (arg0: string) => void
  ) {
    item3(null);
  }

  save(item1: string, item2: string, item3: (arg0: string) => void) {
    item3(null);
  }

  updateConfirmedUnclassifiedAnswers(item1: string) {}
  getConfirmedUnclassifiedAnswers() {
    return ['answer1', 'answer2'];
  }

  getDefaultOutcome() {
    return null;
  }
}

class MockExplorationStatesService {
  saveInteractionAnswerGroups(item1: string, item2: string) {}

  saveInteractionDefaultOutcome(item1: string, item2: string) {}

  saveConfirmedUnclassifiedAnswers(item1: string, item2: string) {}
}

class MockStateEditorService {
  getActiveStateName() {
    return 'activeStateName';
  }
}

describe('Training Data Service', () => {
  let trainingDataService: TrainingDataService;
  let responsesService: ResponsesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            },
          },
        },
        TrainingDataService,
        {
          provide: ExplorationStatesService,
          useClass: MockExplorationStatesService,
        },
        {
          provide: StateEditorService,
          useClass: MockStateEditorService,
        },
        {
          provide: ResponsesService,
          useClass: MockResponsesService,
        },
      ],
    });

    responsesService = TestBed.inject(ResponsesService);
    trainingDataService = TestBed.inject(TrainingDataService);
  });

  it('should be able to train answer groups and the default response', () => {
    spyOn(responsesService, 'updateAnswerGroup');

    // Training the first answer of a group should add a new classifier.
    trainingDataService.associateWithAnswerGroup(0, 'answer1');

    expect(responsesService.updateAnswerGroup).toHaveBeenCalled();
  });

  it(
    'should be able to retrain answers between answer groups and the ' +
      'default outcome',
    () => {
      // Retraining an answer from the answer group to the default outcome
      // should remove it from the first, then add it to the second.
      trainingDataService.associateWithAnswerGroup(0, 'text answer');
      trainingDataService.associateWithAnswerGroup(0, 'second answer');
      trainingDataService.associateWithDefaultResponse('third answer');

      expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
        'trainingData 1',
        'text answer',
        'second answer',
      ]);

      // Try to retrain the second answer (answer group -> default response).
      trainingDataService.associateWithDefaultResponse('second answer');
      expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
        'trainingData 1',
        'text answer',
        'second answer',
      ]);

      // Try to retrain the third answer (default response -> answer group).
      trainingDataService.associateWithAnswerGroup(0, 'third answer');

      expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
        'trainingData 1',
        'text answer',
        'second answer',
        'third answer',
      ]);
    }
  );

  it('should not be able to train duplicated answers', () => {
    trainingDataService.associateWithAnswerGroup(0, 'trainingData 2');
    trainingDataService.associateWithDefaultResponse('second answer');

    expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
      'trainingData 1',
      'trainingData 2',
    ]);

    // Training a duplicate answer for the answer group should change nothing.
    trainingDataService.associateWithAnswerGroup(0, 'trainingData 3');

    // Training a duplicate answer for the default response should change
    // nothing.
    trainingDataService.associateWithDefaultResponse('second answer');

    expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
      'trainingData 1',
      'trainingData 2',
      'trainingData 3',
    ]);
  });

  it('should get all potential outcomes of an interaction', () => {
    // First the answer group's outcome is listed, then the default.

    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'Outcome'." We need to suppress this error because of the need to
    // test validations. This throws an error because the outcome is null.
    // @ts-ignore
    expect(
      trainingDataService.getAllPotentialOutcomes(
        new State(
          'State',
          'id',
          'some',
          null,
          new Interaction(
            [
              new AnswerGroup(
                [
                  new Rule('TextInput', null, null),
                  new Rule('TextInput', null, null),
                ],
                null,
                ['trainingData 1'],
                null
              ),
              new AnswerGroup(
                [
                  new Rule('TextInput', null, null),
                  new Rule('TextInput', null, null),
                ],
                null,
                ['trainingData 1'],
                null
              ),
            ],
            [],
            null,
            new Outcome(
              'Hola',
              null,
              new SubtitledHtml('<p> HTML string </p>', 'Id'),
              false,
              [],
              null,
              null
            ),
            [],
            'id',
            null
          ),
          null,
          null,
          true,
          null
        )
      )
    ).toEqual([
      null,
      null,
      new Outcome(
        'Hola',
        null,
        new SubtitledHtml('<p> HTML string </p>', 'Id'),
        false,
        [],
        null,
        null
      ),
    ]);
  });

  it(
    'should remove answer from training data associated with given answer ' +
      'group',
    () => {
      trainingDataService.associateWithAnswerGroup(0, 'text answer');
      trainingDataService.associateWithAnswerGroup(0, 'second answer');
      trainingDataService.associateWithAnswerGroup(0, 'second answer');

      trainingDataService.removeAnswerFromAnswerGroupTrainingData(
        'second answer',
        0
      );

      expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
        'trainingData 1',
        'text answer',
        'second answer',
        'second answer',
      ]);
    }
  );

  it(
    'should correctly check whether answer is in confirmed unclassified ' +
      'answers',
    fakeAsync(() => {
      trainingDataService.associateWithAnswerGroup(0, 'text answer');
      trainingDataService.associateWithAnswerGroup(0, 'second answer');
      trainingDataService.associateWithDefaultResponse('second answer');
      tick();

      expect(
        trainingDataService.isConfirmedUnclassifiedAnswer('text answer')
      ).toBe(false);
      expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
        'trainingData 1',
        'text answer',
        'second answer',
      ]);
    })
  );

  it('should get all the training data answers', () => {
    trainingDataService.associateWithAnswerGroup(0, 'text answer');
    trainingDataService.associateWithAnswerGroup(0, 'second answer');
    trainingDataService.associateWithDefaultResponse('second answer');

    expect(trainingDataService.getTrainingDataAnswers()).toEqual([
      {
        answerGroupIndex: 0,
        answers: ['trainingData 1', 'text answer', 'second answer'],
      },
      {
        answerGroupIndex: 1,
        answers: ['trainingData 1', 'trainingData 2'],
      },
    ]);
    expect(trainingDataService.getTrainingDataOfAnswerGroup(0)).toEqual([
      'trainingData 1',
      'text answer',
      'second answer',
    ]);
  });
});
