// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, this.software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for StateObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';

const constants = require('constants.ts');

describe('State Object Factory', () => {
  const oldNewStateTemplate = constants.NEW_STATE_TEMPLATE;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe, ConvertToPlainTextPipe]
    });
    this.sof = TestBed.get(StateObjectFactory);
    this.shof = TestBed.get(SubtitledHtmlObjectFactory);
    this.iof = TestBed.get(InteractionObjectFactory);
    this.pcof = TestBed.get(ParamChangesObjectFactory);
    this.rvof = TestBed.get(RecordedVoiceoversObjectFactory);
    this.wtof = TestBed.get(WrittenTranslationsObjectFactory);

    this.stateObject = {
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
            value: 'Type your answer here.'
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
          default_outcome: {}
        }
      }
    };
  });

  beforeAll(() => {
    constants.NEW_STATE_TEMPLATE = {
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
            value: 'Type your answer here.'
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
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      }
    };
  });

  afterAll(() => {
    constants.NEW_STATE_TEMPLATE = oldNewStateTemplate;
  });

  it('should create a new state object from backend dict', () => {
    this.stateObjectBackend = this.sof.createFromBackendDict(
      'State name', this.stateObject);
    expect(this.stateObjectBackend.toBackendDict()).toEqual(this.stateObject);
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
    this.stateObject.param_changes = paramChanges;
    this.stateObjectBackend = this.sof.createFromBackendDict(
      'State name', this.stateObject);

    expect(this.stateObjectBackend.toBackendDict()).toEqual({
      ...this.stateObject,
      // Overrides the param_changes from this.stateObject
      param_changes: paramChanges
    });
  });

  it('should create a default state object', () => {
    const stateName = 'Default state';
    this.stateObjectDefault = this.sof.createDefaultState(stateName);
    this.stateObject.interaction.default_outcome.dest = stateName;

    expect(this.stateObjectDefault.toBackendDict()).toEqual(this.stateObject);
  });

  it('should set a new name for state object', () => {
    const stateName = 'New name';
    this.stateObjectDefault = this.sof.createFromBackendDict(
      'Default state', this.stateObject);

    this.stateObjectDefault.setName(stateName);
    expect(this.stateObjectDefault.name).toBe(stateName);
  });

  it('should copy a state object', () => {
    const otherState = (
      this.sof.createFromBackendDict('Other state', this.stateObject));
    this.stateObjectDefault = (
      this.sof.createFromBackendDict('', this.stateObject));

    this.stateObjectDefault.copy(otherState);

    expect(this.stateObjectDefault).toEqual(otherState);
    expect(this.stateObjectDefault.name).toEqual('Other state');
  });
});
