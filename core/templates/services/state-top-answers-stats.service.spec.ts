// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for domain object which holds the list of top answer
 * statistics for a particular state.
 */

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { IAnswerStatsBackendDict, AnswerStatsObjectFactory } from
  'domain/exploration/AnswerStatsObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { StateTopAnswersStatsService } from
  'services/state-top-answers-stats.service';
import { StateTopAnswersStatsBackendApiService, StateAnswerStatsResponse } from
  'services/state-top-answers-stats-backend-api.service';
import { States, StatesObjectFactory } from
  'domain/exploration/StatesObjectFactory';
import { IStateBackendDict } from 'domain/state/StateObjectFactory';

const joC = jasmine.objectContaining;

describe('stateTopAnswersStatsService', () => {
  let answerStatsObjectFactory: AnswerStatsObjectFactory;
  let ruleObjectFactory: RuleObjectFactory;
  let stateTopAnswersStatsBackendApiService:
    StateTopAnswersStatsBackendApiService;
  let stateTopAnswersStatsService: StateTopAnswersStatsService;
  let statesObjectFactory: StatesObjectFactory;

  beforeEach(() => {
    ruleObjectFactory = TestBed.get(RuleObjectFactory);
    stateTopAnswersStatsBackendApiService = (
      TestBed.get(StateTopAnswersStatsBackendApiService));
    stateTopAnswersStatsService = TestBed.get(StateTopAnswersStatsService);
    statesObjectFactory = TestBed.get(StatesObjectFactory);
  });

  const expId = '7';

  const stateBackendDict: IStateBackendDict = {
    content: {content_id: 'content', html: 'Say "hello" in Spanish!'},
    param_changes: [],
    interaction: {
      answer_groups: [{
        rule_specs: [
          {rule_type: 'Contains', inputs: {x: 'hola'}},
        ],
        outcome: {
          dest: 'Me Llamo',
          feedback: {content_id: 'feedback_1', html: '¡Buen trabajo!'},
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        training_data: null,
        tagged_skill_misconception_id: null,
      }],
      default_outcome: {
        dest: 'Hola',
        feedback: {content_id: 'default_outcome', html: 'Try again!'},
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      },
      hints: [],
      id: 'TextInput',
      confirmed_unclassified_answers: [],
      customization_args: {},
      solution: null,
    },
    classifier_model_id: null,
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {},
        default_outcome: {},
        feedback_1: {},
      },
    },
    solicit_answer_details: false,
    written_translations: {
      translations_mapping: {
        content: {},
        default_outcome: {},
        feedback_1: {},
      },
    },
  };

  const makeStates = (statesBackendDict = {Hola: stateBackendDict}): States => {
    return statesObjectFactory.createFromBackendDict(statesBackendDict);
  };

  const spyOnBackendApiFetchStatsAsync = (
      stateName: string,
      answersStatsBackendDicts: IAnswerStatsBackendDict[]): jasmine.Spy => {
    const answersStats = answersStatsBackendDicts.map(
      a => answerStatsObjectFactory.createFromBackendDict(a));
    return spyOn(stateTopAnswersStatsBackendApiService, 'fetchStatsAsync')
      .and.returnValue(Promise.resolve(new StateAnswerStatsResponse(
        new Map([[stateName, answersStats]]),
        new Map([[stateName, 'TextInput']]))));
  };

  it('should not contain any stats before init', () => {
    expect(stateTopAnswersStatsService.hasStateStats('Hola')).toBeFalse();
  });

  it('should identify unaddressed issues', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [
      {answer: 'hola', frequency: 5},
      {answer: 'adios', frequency: 3},
      {answer: 'ciao', frequency: 1},
    ]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    const stateStats = stateTopAnswersStatsService.getStateStats('Hola');
    expect(stateStats).toContain(joC({answer: 'hola', isAddressed: true}));
    expect(stateStats).toContain(joC({answer: 'adios', isAddressed: false}));
    expect(stateStats).toContain(joC({answer: 'ciao', isAddressed: false}));
  }));

  it('should order results by frequency', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [
      {answer: 'hola', frequency: 7},
      {answer: 'adios', frequency: 4},
      {answer: 'ciao', frequency: 2},
    ]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(stateTopAnswersStatsService.getStateStats('Hola')).toEqual([
      joC({answer: 'hola', frequency: 7}),
      joC({answer: 'adios', frequency: 4}),
      joC({answer: 'ciao', frequency: 2}),
    ]);
  }));

  it('should throw when stats for state do not exist', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [
      {answer: 'hola', frequency: 7},
      {answer: 'adios', frequency: 4},
      {answer: 'ciao', frequency: 2},
    ]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(() => stateTopAnswersStatsService.getStateStats('Me Llamo'))
      .toThrowError('Me Llamo does not exist.');
  }));

  it('should have stats for state provided by backend', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [{answer: 'hola', frequency: 3}]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(stateTopAnswersStatsService.hasStateStats('Hola')).toBeTrue();
  }));

  it('should have stats for state without any answers', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(stateTopAnswersStatsService.hasStateStats('Hola')).toBeTrue();
  }));

  it('should not have stats for state not provided by backend',
    fakeAsync(async() => {
      const states = makeStates();
      spyOnBackendApiFetchStatsAsync('Hola', []);
      stateTopAnswersStatsService.initAsync(expId, states);
      flushMicrotasks();
      await stateTopAnswersStatsService.getInitPromise();

      expect(stateTopAnswersStatsService.hasStateStats('Me Llamo')).toBeFalse();
    }));

  it('only returns state names with stats', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(stateTopAnswersStatsService.getStateNamesWithStats())
      .toEqual(['Hola']);
  }));

  it('should return empty stats for newly added state', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(() => stateTopAnswersStatsService.getStateStats('Me Llamo'))
      .toThrowError('Me Llamo does not exist.');

    stateTopAnswersStatsService.onStateAdded('Me Llamo');
    expect(stateTopAnswersStatsService.getStateStats('Me Llamo'))
      .toEqual([]);
  }));

  it('should throw when accessing a deleted state', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    stateTopAnswersStatsService.onStateDeleted('Hola');
    flushMicrotasks();

    expect(() => stateTopAnswersStatsService.getStateStats('Hola'))
      .toThrowError('Hola does not exist.');
  }));

  it('should respond to changes in state names', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    const oldStats = stateTopAnswersStatsService.getStateStats('Hola');

    stateTopAnswersStatsService.onStateRenamed('Hola', 'Bonjour');

    expect(stateTopAnswersStatsService.getStateStats('Bonjour'))
      .toBe(oldStats);

    expect(() => stateTopAnswersStatsService.getStateStats('Hola'))
      .toThrowError('Hola does not exist.');
  }));

  it('should recognize newly resolved answers', fakeAsync(async() => {
    const states = makeStates();

    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .toContain(joC({answer: 'adios'}));

    states.getState('Hola').interaction.answerGroups[0].rules.push(
      ruleObjectFactory.createNew('Contains', {x: 'adios'}));
    stateTopAnswersStatsService.onStateInteractionSaved('Hola');

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .not.toContain(joC({answer: 'adios'}));
  }));

  it('should recognize newly unresolved answers', fakeAsync(async() => {
    const states = makeStates();

    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromise();

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .not.toContain(joC({answer: 'hola'}));

    states.getState('Hola').interaction.answerGroups[0].rules = [
      ruleObjectFactory.createNew('Contains', {x: 'bonjour'})
    ];
    stateTopAnswersStatsService.onStateInteractionSaved('Hola');

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .toContain(joC({answer: 'hola'}));
  }));
});
