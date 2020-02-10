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
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { TestBed } from '@angular/core/testing';
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

describe('State Object Factory', () => {
  let sof, shof, iof, pcof, rvof, wtof;
  let stateObject;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    sof = TestBed.get(StateObjectFactory);
    shof = TestBed.get(SubtitledHtmlObjectFactory);
    iof = TestBed.get(InteractionObjectFactory);
    pcof = TestBed.get(ParamChangesObjectFactory);
    rvof = TestBed.get(RecordedVoiceoversObjectFactory);
    wtof = TestBed.get(WrittenTranslationsObjectFactory);

    stateObject = {
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
      // Overrides the param_changes from stateObject
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
});
