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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { AnswerStats } from
  'domain/exploration/answer-stats.model';
import { AnswerStatsBackendDict } from
  'domain/exploration/visualization-info.model';
import { StateBackendDict } from 'domain/state/StateObjectFactory';
import { Rule } from 'domain/exploration/rule.model';
import { StateTopAnswersStats } from
  'domain/statistics/state-top-answers-stats-object.factory';
import { StateTopAnswersStatsService } from
  'services/state-top-answers-stats.service';
import { StateTopAnswersStatsBackendApiService } from
  'services/state-top-answers-stats-backend-api.service';
import { States, StatesObjectFactory } from
  'domain/exploration/StatesObjectFactory';

const joC = jasmine.objectContaining;

describe('StateTopAnswersStatsService', () => {
  let stateTopAnswersStatsBackendApiService:
    StateTopAnswersStatsBackendApiService;
  let stateTopAnswersStatsService: StateTopAnswersStatsService;
  let statesObjectFactory: StatesObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});

    stateTopAnswersStatsBackendApiService = (
      TestBed.get(StateTopAnswersStatsBackendApiService));
    stateTopAnswersStatsService = TestBed.get(StateTopAnswersStatsService);
    statesObjectFactory = TestBed.get(StatesObjectFactory);
  });

  const expId = '7';

  const stateBackendDict: StateBackendDict = {
    content: {content_id: 'content', html: 'Say "hello" in Spanish!'},
    linked_skill_id: null,
    param_changes: [],
    interaction: {
      answer_groups: [{
        rule_specs: [{
          rule_type: 'Contains',
          inputs: {x: {
            contentId: 'rule_input',
            normalizedStrSet: ['hola']
          }}
        }],
        outcome: {
          dest: 'Me Llamo',
          dest_if_really_stuck: null,
          feedback: {content_id: 'feedback_1', html: '¡Buen trabajo!'},
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        training_data: [],
        tagged_skill_misconception_id: null,
      }],
      default_outcome: {
        dest: 'Hola',
        dest_if_really_stuck: null,
        feedback: {content_id: 'default_outcome', html: 'Try again!'},
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      },
      hints: [],
      id: 'TextInput',
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: ''
          }
        },
        rows: { value: 1 },
        catchMisspellings: {
          value: false
        }
      },
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
    card_is_checkpoint: false,
  };

  const makeStates = (statesBackendDict = {Hola: stateBackendDict}): States => {
    return statesObjectFactory.createFromBackendDict(statesBackendDict);
  };

  const spyOnBackendApiFetchStatsAsync = (
      stateName: string,
      answersStatsBackendDicts: AnswerStatsBackendDict[]): jasmine.Spy => {
    const answersStats = answersStatsBackendDicts.map(
      a => AnswerStats.createFromBackendDict(a));
    return spyOn(stateTopAnswersStatsBackendApiService, 'fetchStatsAsync')
      .and.returnValue(Promise.resolve(new StateTopAnswersStats(
        {[stateName]: answersStats}, {[stateName]: 'TextInput'})));
  };

  it('should not contain any stats before init', () => {
    expect(stateTopAnswersStatsService.hasStateStats('Hola')).toBeFalse();
  });

  it('should identify unaddressed issues', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [
      {answer: 'hola', frequency: 5, is_addressed: false},
      {answer: 'adios', frequency: 3, is_addressed: false},
      {answer: 'ciao', frequency: 1, is_addressed: false},
    ]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    const stateStats = stateTopAnswersStatsService.getStateStats('Hola');
    expect(stateStats).toContain(joC({answer: 'hola', isAddressed: true}));
    expect(stateStats).toContain(joC({answer: 'adios', isAddressed: false}));
    expect(stateStats).toContain(joC({answer: 'ciao', isAddressed: false}));
  }));

  it('should reject with error', fakeAsync(async() => {
    const states = makeStates();
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    spyOn(stateTopAnswersStatsBackendApiService, 'fetchStatsAsync')
      .and.callFake(() => {
        throw new Error('Random Error');
      });

    stateTopAnswersStatsService.initAsync(expId, states).then(
      successHandler, failHandler);
    flushMicrotasks();

    expect(failHandler).toHaveBeenCalledWith(new Error('Random Error'));
  }));

  it('should order results by frequency', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [
      {answer: 'hola', frequency: 7, is_addressed: false},
      {answer: 'adios', frequency: 4, is_addressed: false},
      {answer: 'ciao', frequency: 2, is_addressed: false},
    ]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    expect(stateTopAnswersStatsService.getStateStats('Hola')).toEqual([
      joC({answer: 'hola', frequency: 7}),
      joC({answer: 'adios', frequency: 4}),
      joC({answer: 'ciao', frequency: 2}),
    ]);
  }));

  it('should throw when stats for state do not exist', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [
      {answer: 'hola', frequency: 7, is_addressed: false},
      {answer: 'adios', frequency: 4, is_addressed: false},
      {answer: 'ciao', frequency: 2, is_addressed: false},
    ]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    expect(() => stateTopAnswersStatsService.getStateStats('Me Llamo'))
      .toThrowError('Me Llamo does not exist.');
  }));

  it('should have stats for state provided by backend', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync(
      'Hola', [{answer: 'hola', frequency: 3, is_addressed: false}]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    expect(stateTopAnswersStatsService.hasStateStats('Hola')).toBeTrue();
  }));

  it('should have stats for state without any answers', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    expect(stateTopAnswersStatsService.hasStateStats('Hola')).toBeTrue();
  }));

  it('should not have stats for state not provided by backend',
    fakeAsync(async() => {
      const states = makeStates();
      spyOnBackendApiFetchStatsAsync('Hola', []);
      stateTopAnswersStatsService.initAsync(expId, states);
      flushMicrotasks();
      await stateTopAnswersStatsService.getInitPromiseAsync();

      expect(stateTopAnswersStatsService.hasStateStats('Me Llamo')).toBeFalse();
    }));

  it('should only returns state names with stats', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    expect(stateTopAnswersStatsService.getStateNamesWithStats())
      .toEqual(['Hola']);
  }));

  it('should return empty stats for a newly added state', fakeAsync(async() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', []);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

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
    await stateTopAnswersStatsService.getInitPromiseAsync();

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
    await stateTopAnswersStatsService.getInitPromiseAsync();

    const oldStats = stateTopAnswersStatsService.getStateStats('Hola');

    stateTopAnswersStatsService.onStateRenamed('Hola', 'Bonjour');

    expect(stateTopAnswersStatsService.getStateStats('Bonjour'))
      .toEqual(oldStats);

    expect(() => stateTopAnswersStatsService.getStateStats('Hola'))
      .toThrowError('Hola does not exist.');
    expect(() => stateTopAnswersStatsService.onStateRenamed('Hola', 'Bonjour'))
      .toThrowError('Hola does not exist.');
  }));

  it('should recognize newly resolved answers', fakeAsync(async() => {
    const states = makeStates();

    spyOnBackendApiFetchStatsAsync(
      'Hola', [{answer: 'adios', frequency: 3, is_addressed: false}]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .toContain(joC({answer: 'adios'}));

    const updatedState = states.getState('Hola');
    updatedState.interaction.answerGroups[0].rules.push(
      Rule.createFromBackendDict(
        {
          rule_type: 'Contains',
          inputs: {
            x: {
              contentId: 'rule_input',
              normalizedStrSet: ['adios']
            }
          }
        },
        'TextInput'
      ));
    stateTopAnswersStatsService.onStateInteractionSaved(updatedState);

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .not.toContain(joC({answer: 'adios'}));
  }));

  it('should add new answer when Interaction Id\'s are not equal',
    fakeAsync(async() => {
      const states = makeStates();
      spyOnBackendApiFetchStatsAsync(
        'Hola', [{answer: 'adios', frequency: 3, is_addressed: false}]);
      stateTopAnswersStatsService.initAsync(expId, states);
      flushMicrotasks();
      await stateTopAnswersStatsService.getInitPromiseAsync();

      const updatedState = states.getState('Hola');
      updatedState.interaction.answerGroups[0].rules.push(
        Rule.createFromBackendDict(
          {
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input',
                normalizedStrSet: ['adios']
              }
            }
          },
          'MultipleChoiceInput'
        ));
      updatedState.interaction.id = 'MultipleChoiceInput';

      // Pre-checks.
      expect(stateTopAnswersStatsService.getStateStats('Hola'))
        .toEqual([new AnswerStats('adios', 'adios', 3, false)]);

      // Action.
      stateTopAnswersStatsService.onStateInteractionSaved(updatedState);

      // Post-Check.
      expect(stateTopAnswersStatsService.getStateStats('Hola')).toEqual([]);
    }));

  it('should recognize newly unresolved answers', fakeAsync(async() => {
    const states = makeStates();

    spyOnBackendApiFetchStatsAsync(
      'Hola', [{answer: 'hola', frequency: 3, is_addressed: false}]);
    stateTopAnswersStatsService.initAsync(expId, states);
    flushMicrotasks();
    await stateTopAnswersStatsService.getInitPromiseAsync();

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .not.toContain(joC({answer: 'hola'}));

    const updatedState = states.getState('Hola');
    updatedState.interaction.answerGroups[0].rules = [
      Rule.createFromBackendDict(
        {
          rule_type: 'Contains',
          inputs: {
            x: {
              contentId: 'rule_input',
              normalizedStrSet: ['bonjour']
            }
          }
        },
        'TextInput'
      )
    ];
    stateTopAnswersStatsService.onStateInteractionSaved(updatedState);

    expect(stateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
      .toContain(joC({answer: 'hola'}));
  }));

  it('should throw error if state does not exist', fakeAsync(async() => {
    const states = makeStates();

    const updatedState = states.getState('Hola');
    updatedState.interaction.answerGroups[0].rules.push(
      Rule.createFromBackendDict(
        {
          rule_type: 'Contains',
          inputs: {
            x: {
              contentId: 'rule_input',
              normalizedStrSet: ['adios']
            }
          }
        },
        'TextInput'
      ));

    expect(() => {
      stateTopAnswersStatsService.onStateInteractionSaved(updatedState);
    }).toThrowError('Hola does not exist.');
  }));

  it('should throw error if Interaction id does not exist',
    fakeAsync(async() => {
      const states = makeStates();
      spyOnBackendApiFetchStatsAsync(
        'Hola', [{answer: 'adios', frequency: 3, is_addressed: false}]);
      stateTopAnswersStatsService.initAsync(expId, states);
      flushMicrotasks();
      await stateTopAnswersStatsService.getInitPromiseAsync();

      const updatedState = states.getState('Hola');
      updatedState.interaction.id = null;

      expect(() => {
        stateTopAnswersStatsService.onStateInteractionSaved(updatedState);
      }).toThrowError('Interaction ID cannot be null.');
    }));

  it('should getTopAnswersByStateNameAsync', fakeAsync(() => {
    const states = makeStates();
    spyOnBackendApiFetchStatsAsync('Hola', [
      {answer: 'hola', frequency: 7, is_addressed: false},
      {answer: 'adios', frequency: 4, is_addressed: false},
      {answer: 'ciao', frequency: 2, is_addressed: false},
    ]);
    stateTopAnswersStatsService.initAsync(expId, states);

    flushMicrotasks();

    stateTopAnswersStatsService.getTopAnswersByStateNameAsync(
      expId, states).then(
      (data) => {
        expect(data.get('Hola')).toEqual([
          new AnswerStats('hola', 'hola', 7, true),
          new AnswerStats('adios', 'adios', 4, false),
          new AnswerStats('ciao', 'ciao', 2, false)]);
      });
  }));
});
