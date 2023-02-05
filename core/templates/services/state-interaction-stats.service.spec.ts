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
 * @fileoverview Unit tests for state interaction stats service.
 */

import { TestBed, flushMicrotasks, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { NormalizeWhitespacePunctuationAndCasePipe } from
  // eslint-disable-next-line max-len
  'filters/string-utility-filters/normalize-whitespace-punctuation-and-case.pipe';
import { StateInteractionStats, StateInteractionStatsService } from
  'services/state-interaction-stats.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { State, StateBackendDict, StateObjectFactory } from
  'domain/state/StateObjectFactory';

const joC = jasmine.objectContaining;

describe('State Interaction Stats Service', () => {
  let httpTestingController: HttpTestingController;
  let stateObjectFactory: StateObjectFactory;
  let stateInteractionStatsService: StateInteractionStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        NormalizeWhitespacePipe,
        NormalizeWhitespacePunctuationAndCasePipe
      ],
    });

    stateObjectFactory = TestBed.get(StateObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
    stateInteractionStatsService = (
      TestBed.get(StateInteractionStatsService));
  });

  afterEach(() => httpTestingController.verify());

  const expId = 'expid';
  let mockState: State;

  beforeEach(() => {
    const stateDict: StateBackendDict = {
      classifier_model_id: 'model_id',
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {}
      },
      interaction: {
        answer_groups: [
          {
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: {
                contentId: 'rule_input',
                normalizedStrSet: ['hola!']
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
          },
          {
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
          },
          {
            rule_specs: [{
              rule_type: 'FuzzyEquals',
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
          }
        ],
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
        default_outcome: {
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {content_id: 'default_outcome', html: ''},
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        id: 'TextInput',
        solution: {
          answer_is_exclusive: true,
          correct_answer: '',
          explanation: {
            content_id: '',
            html: ''
          }
        }
      },
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      linked_skill_id: null,
    };

    mockState = stateObjectFactory.createFromBackendDict('Hola', stateDict);
  });

  it('should support improvements overview for states with text-input', () => {
    expect(
      stateInteractionStatsService.stateSupportsImprovementsOverview(mockState)
    ).toBeTrue();
  });

  it('should throw error if state name does not exist',
    fakeAsync(async() => {
      mockState.name = null;

      expect(() => {
        stateInteractionStatsService.computeStatsAsync(expId, mockState);
        tick();
      }).toThrowError();
    }));

  it('should throw error if interaction id does not exist',
    fakeAsync(async() => {
      mockState.interaction.id = null;

      expect(() => {
        stateInteractionStatsService.computeStatsAsync(expId, mockState);
        tick();
      }).toThrowError();
    }));

  describe('when gathering stats from the backend', () => {
    it('should provide cached results after first call', fakeAsync(() => {
      let statsCaptured: StateInteractionStats[] = [];
      const captureStats = (stats: StateInteractionStats) => {
        expect(stats).toBeDefined();
        statsCaptured.push(stats);
      };

      stateInteractionStatsService.computeStatsAsync(expId, mockState)
        .then(captureStats);
      const req = httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Hola');
      expect(req.request.method).toEqual('GET');
      req.flush({
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        }]
      });
      flushMicrotasks();

      stateInteractionStatsService.computeStatsAsync(expId, mockState)
        .then(captureStats);
      httpTestingController.expectNone(
        '/createhandler/state_interaction_stats/expid/Hola');
      flushMicrotasks();

      expect(statsCaptured.length).toEqual(2);
      const [statsFromFirstFetch, statsFromSecondFetch] = statsCaptured;
      expect(statsFromSecondFetch).toBe(statsFromFirstFetch);
    }));

    it('should have separate caches for different states', fakeAsync(() => {
      let statsCaptured: StateInteractionStats[] = [];
      const captureStats = (stats: StateInteractionStats) => {
        expect(stats).toBeDefined();
        statsCaptured.push(stats);
      };

      stateInteractionStatsService.computeStatsAsync(expId, mockState)
        .then(captureStats);
      const holaReq = httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Hola');
      expect(holaReq.request.method).toEqual('GET');
      holaReq.flush({
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        }]
      });
      flushMicrotasks();

      mockState.name = 'Adios';
      stateInteractionStatsService.computeStatsAsync(expId, mockState)
        .then(captureStats);
      const adiosReq = httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Adios');
      expect(adiosReq.request.method).toEqual('GET');
      adiosReq.flush({
        visualizations_info: [{
          data: [
            {answer: 'Zai Jian', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Adios', frequency: 1}
          ]
        }]
      });
      flushMicrotasks();

      expect(statsCaptured.length).toEqual(2);
      const [statsFromFirstFetch, statsFromSecondFetch] = statsCaptured;
      expect(statsFromSecondFetch).not.toBe(statsFromFirstFetch);
    }));

    it('should include answer frequencies in the response', fakeAsync(() => {
      const onSuccess = jasmine.createSpy('success');
      const onFailure = jasmine.createSpy('failure');

      stateInteractionStatsService.computeStatsAsync(expId, mockState)
        .then(onSuccess, onFailure);

      const req = httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Hola');
      expect(req.request.method).toEqual('GET');
      req.flush({
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        }]
      });
      flushMicrotasks();

      expect(onSuccess).toHaveBeenCalledWith(joC({
        visualizationsInfo: [joC({
          data: [
            joC({answer: 'Ni Hao', frequency: 5}),
            joC({answer: 'Aloha', frequency: 3}),
            joC({answer: 'Hola', frequency: 1})
          ]
        })]
      }));
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it(
      'should determine whether TextInput answers are addressed explicitly',
      fakeAsync(() => {
        const onSuccess = jasmine.createSpy('success');
        const onFailure = jasmine.createSpy('failure');

        stateInteractionStatsService.computeStatsAsync(expId, mockState).then(
          onSuccess, onFailure);

        const req = httpTestingController.expectOne(
          '/createhandler/state_interaction_stats/expid/Hola');
        expect(req.request.method).toEqual('GET');
        req.flush({
          visualizations_info: [{
            data: [{answer: 'Ni Hao'}, {answer: 'Aloha'}, {answer: 'Hola'}],
            addressed_info_is_supported: true
          }]
        });
        flushMicrotasks();

        expect(onSuccess).toHaveBeenCalledWith(joC({
          visualizationsInfo: [joC({
            data: [
              joC({answer: 'Ni Hao', isAddressed: false}),
              joC({answer: 'Aloha', isAddressed: false}),
              joC({answer: 'Hola', isAddressed: true})
            ]
          })]
        }));
        expect(onFailure).not.toHaveBeenCalled();
      }));

    it('should return content of MultipleChoiceInput answers', fakeAsync(() => {
      const onSuccess = jasmine.createSpy('success');
      const onFailure = jasmine.createSpy('failure');

      mockState.name = 'Fraction';
      mockState.interaction.id = 'MultipleChoiceInput';
      mockState.interaction.customizationArgs = {
        choices: {
          value: [
            new SubtitledHtml('<p>foo</p>', ''),
            new SubtitledHtml('<p>bar</p>', '')
          ]
        }
      };
      stateInteractionStatsService.computeStatsAsync(expId, mockState).then(
        onSuccess, onFailure);

      const req = httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Fraction');
      expect(req.request.method).toEqual('GET');
      req.flush({
        visualizations_info: [{
          data: [{answer: 0, frequency: 3}, {answer: 1, frequency: 5}],
        }]
      });
      flushMicrotasks();

      expect(onSuccess).toHaveBeenCalledWith(joC({
        visualizationsInfo: [joC({
          data: [
            joC({answer: '<p>foo</p>'}),
            joC({answer: '<p>bar</p>'}),
          ]
        })]
      }));
    }));

    it(
      'should return FractionInput answers as readable strings',
      fakeAsync(() => {
        const onSuccess = jasmine.createSpy('success');
        const onFailure = jasmine.createSpy('failure');

        mockState.name = 'Fraction';
        mockState.interaction.id = 'FractionInput';
        mockState.interaction.customizationArgs = {
          choices: {
            value: [
              new SubtitledHtml('<p>foo</p>', ''),
              new SubtitledHtml('<p>bar</p>', '')
            ]
          }
        };

        stateInteractionStatsService.computeStatsAsync(expId, mockState).then(
          onSuccess, onFailure);

        const req = httpTestingController.expectOne(
          '/createhandler/state_interaction_stats/expid/Fraction');
        expect(req.request.method).toEqual('GET');
        req.flush({
          visualizations_info: [
            {
              data: [
                {
                  answer: {
                    isNegative: false,
                    wholeNumber: 0,
                    numerator: 1,
                    denominator: 2
                  },
                  frequency: 3
                },
                {
                  answer: {
                    isNegative: false,
                    wholeNumber: 0,
                    numerator: 0,
                    denominator: 1
                  },
                  frequency: 5
                }
              ]
            }
          ]
        });
        flushMicrotasks();

        expect(onSuccess).toHaveBeenCalledWith(joC({
          visualizationsInfo: [joC({
            data: [
              joC({ answer: '1/2' }),
              joC({ answer: '0' })
            ]
          })]
        }));
      }));
  });
});
