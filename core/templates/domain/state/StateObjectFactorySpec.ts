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
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { StateBackendDict, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { TestBed } from '@angular/core/testing';

describe('State Object Factory', () => {
  let sof: StateObjectFactory;
  let stateObject: StateBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    sof = TestBed.get(StateObjectFactory);

    spyOnProperty(sof, 'NEW_STATE_TEMPLATE', 'get').and.returnValue({
      classifier_model_id: null,
      content: {
        html: '',
        content_id: 'content'
      },
      interaction: {
        id: 'TextInput',
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: ''
            }
          }
        },
        answer_groups: [],
        default_outcome: {
          dest: 'Introduction',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        confirmed_unclassified_answers: [],
        hints: [],
        solution: null
      },
      next_content_id_index: 0,
      param_changes: [],
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {}
        }
      }
    });

    stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: ''
            }
          }
        },
        default_outcome: {
          dest: '(untitled state)',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        solution: null,
        id: 'TextInput'
      },
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {}
        }
      }
    };
  });

  it('should create a new state object from backend dict', () => {
    const stateObjectBackend = sof.createFromBackendDict(
      'State name', stateObject);
    expect(stateObjectBackend.toBackendDict()).toEqual(stateObject);
  });

  it('should correctly create a state object when param_changes length ' +
    'is greater than 0', () => {
    const paramChanges = [{
      customization_args: {
        parse_with_jinja: false,
        value: '10'
      },
      generator_id: 'Copier',
      name: 'Param change 1',
    }];
    stateObject.param_changes = paramChanges;
    const stateObjectBackend = sof.createFromBackendDict(
      'State name', stateObject);

    expect(stateObjectBackend.toBackendDict()).toEqual({
      ...stateObject,
      // Overrides the param_changes from stateObject.
      param_changes: paramChanges
    });
  });

  it('should create a default state object', () => {
    const stateName = 'Default state';
    const stateObjectDefault = sof.createDefaultState(stateName);
    stateObject.interaction.default_outcome.dest = stateName;

    expect(stateObjectDefault.toBackendDict()).toEqual(stateObject);
  });

  it('should set a new name for state object', () => {
    const stateName = 'New name';
    const stateObjectDefault = sof.createFromBackendDict(
      'Default state', stateObject);

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

  it('should correctly get required written translation content ids', () => {
    const state = sof.createFromBackendDict('State name', stateObject);
    state.interaction.id = null;
    expect(
      state.getRequiredWrittenTranslationContentIds()
    ).toEqual(new Set(['content', 'rule_input_2']));

    state.writtenTranslations.addContentId('feedback_1');
    state.writtenTranslations.addWrittenTranslation(
      'feedback_1', 'fr', 'html', '<p>Translation</p>');
    expect(
      state.getRequiredWrittenTranslationContentIds()
    ).toEqual(new Set(['content', 'rule_input_2', 'feedback_1']));

    state.interaction.id = 'TextInput';
    expect(
      state.getRequiredWrittenTranslationContentIds()
    ).toEqual(new Set([
      'content', 'rule_input_2', 'feedback_1', 'hint_1', 'default_outcome']));
  });
});
