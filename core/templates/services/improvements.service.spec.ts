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
 * @fileoverview Unit tests for improvements service.
 */

import {TestBed} from '@angular/core/testing';

import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {ImprovementsService} from 'services/improvements.service';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';

describe('ImprovementsService', () => {
  let improvementsService: ImprovementsService;
  let stateObjectFactory: StateObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe],
    });

    improvementsService = new ImprovementsService();
    stateObjectFactory = TestBed.get(StateObjectFactory);
  });

  describe('.isStateForcedToResolveOutstandingUnaddressedAnswers', () => {
    it('should return true for states with TextInput interactions', () => {
      let mockStateBackendDict = {
        classifier_model_id: null,
        content: {
          html: '',
          content_id: 'content',
        },
        interaction: {
          id: 'TextInput',
          customization_args: {
            rows: {
              value: 1,
            },
            placeholder: {
              value: {
                unicode_str: 'Type your answer here.',
                content_id: '',
              },
            },
            catchMisspellings: {
              value: false,
            },
          },
          answer_groups: [],
          default_outcome: {
            dest: 'Introduction',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
      };

      let mockState = stateObjectFactory.createFromBackendDict(
        'stateName',
        mockStateBackendDict
      );

      expect(
        improvementsService.isStateForcedToResolveOutstandingUnaddressedAnswers(
          mockState
        )
      ).toBe(true);
    });

    it('should return false for states with FractionInput interactions', () => {
      let mockStateBackendDict = {
        classifier_model_id: null,
        content: {
          html: '',
          content_id: 'content',
        },
        interaction: {
          id: 'FractionInput',
          customization_args: {
            requireSimplestForm: {value: false},
            allowImproperFraction: {value: true},
            allowNonzeroIntegerPart: {value: true},
            customPlaceholder: {
              value: {
                content_id: '',
                unicode_str: '',
              },
            },
          },
          answer_groups: [],
          default_outcome: {
            dest: 'Introduction',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
      };

      let mockState = stateObjectFactory.createFromBackendDict(
        'stateName',
        mockStateBackendDict
      );

      expect(
        improvementsService.isStateForcedToResolveOutstandingUnaddressedAnswers(
          mockState
        )
      ).toBe(false);
    });

    it('should return false if Interaction Id or State is null', () => {
      let mockStateBackendDict = {
        classifier_model_id: null,
        content: {
          html: '',
          content_id: 'content',
        },
        interaction: {
          id: null,
          customization_args: {
            requireSimplestForm: {value: false},
            allowImproperFraction: {value: true},
            allowNonzeroIntegerPart: {value: true},
            customPlaceholder: {
              value: {
                content_id: '',
                unicode_str: '',
              },
            },
          },
          answer_groups: [],
          default_outcome: {
            dest: 'Introduction',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
      };

      let mockState = stateObjectFactory.createFromBackendDict(
        'stateName',
        mockStateBackendDict
      );
      expect(
        improvementsService.isStateForcedToResolveOutstandingUnaddressedAnswers(
          mockState
        )
      ).toBeFalse();
    });
  });
});
