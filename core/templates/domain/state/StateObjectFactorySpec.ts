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
 * @fileoverview Unit tests for StateObjectFactory.
 */

import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {
  StateBackendDict,
  StateObjectFactory,
} from 'domain/state/StateObjectFactory';
import {TestBed} from '@angular/core/testing';

describe('State Object Factory', () => {
  let sof: StateObjectFactory;
  let stateObject: StateBackendDict;
  let TextInputInteraction = {
    classifier_model_id: null,
    content: {
      html: '',
      content_id: 'content',
    },
    inapplicable_skill_misconception_ids: [],
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
    next_content_id_index: 0,
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {},
    },
    solicit_answer_details: false,
    card_is_checkpoint: false,
  };

  type DefaultOutcome =
    (typeof TextInputInteraction.interaction)['default_outcome'];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe],
    });
    sof = TestBed.inject(StateObjectFactory);

    spyOnProperty(sof, 'NEW_STATE_TEMPLATE', 'get').and.returnValue(
      TextInputInteraction
    );

    stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content_0',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content_0: {},
          default_outcome_1: {},
        },
      },
      inapplicable_skill_misconception_ids: [],
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
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
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome_1',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
    };
  });

  it('should create a new state object from backend dict', () => {
    const stateObjectBackend = sof.createFromBackendDict(
      'State name',
      stateObject
    );
    expect(stateObjectBackend.toBackendDict()).toEqual(stateObject);
  });

  it(
    'should correctly create a state object when param_changes length ' +
      'is greater than 0',
    () => {
      const paramChanges = [
        {
          customization_args: {
            parse_with_jinja: false,
            value: '10',
          },
          generator_id: 'Copier',
          name: 'Param change 1',
        },
      ];
      stateObject.param_changes = paramChanges;
      const stateObjectBackend = sof.createFromBackendDict(
        'State name',
        stateObject
      );

      expect(stateObjectBackend.toBackendDict()).toEqual({
        ...stateObject,
        // Overrides the param_changes from stateObject.
        param_changes: paramChanges,
      });
    }
  );

  it('should create a default state object', () => {
    const stateName = 'Default state';
    const stateObjectDefault = sof.createDefaultState(
      stateName,
      'content_0',
      'default_outcome_1'
    );

    const outcome = stateObject.interaction.default_outcome as DefaultOutcome;
    outcome.dest = stateName;

    expect(stateObjectDefault.toBackendDict()).toEqual(stateObject);
  });

  it('should set a new name for state object', () => {
    const stateName = 'New name';
    const stateObjectDefault = sof.createFromBackendDict(
      'Default state',
      stateObject
    );

    stateObjectDefault.setName(stateName);
    expect(stateObjectDefault.name).toBe(stateName);
  });

  it('should copy a state object', () => {
    const otherState = sof.createFromBackendDict('Other state', stateObject);
    const stateObjectDefault = sof.createFromBackendDict('', stateObject);

    stateObjectDefault.copy(otherState);

    expect(stateObjectDefault).toEqual(otherState);
    expect(stateObjectDefault.name).toEqual('Other state');
  });
});
