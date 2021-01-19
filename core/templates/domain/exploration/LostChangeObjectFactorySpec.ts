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
 * @fileoverview Unit tests for Lost Change Object Factory.
 */

import { TestBed } from '@angular/core/testing';
import { LostChangeObjectFactory } from
  'domain/exploration/LostChangeObjectFactory';
import { OutcomeObjectFactory } from './OutcomeObjectFactory';

describe('Lost Change Object Factory', () => {
  let lcof: LostChangeObjectFactory = null;
  let oof: OutcomeObjectFactory = null;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LostChangeObjectFactory]
    });

    lcof = TestBed.get(LostChangeObjectFactory);
    oof = TestBed.get(OutcomeObjectFactory);
  });

  it('should evaluate values from a Lost Change', () => {
    const lostChange = lcof.createNew({
      cmd: 'add_state',
      state_name: 'State name',
    });

    expect(lostChange.cmd).toBe('add_state');
    expect(lostChange.stateName).toBe('State name');
  });

  it('should evaluate values from a renaming Lost Change', () => {
    const lostChange = lcof.createNew({
      cmd: 'rename_state',
      old_state_name: 'Old state name',
      new_state_name: 'New state name'
    });

    expect(lostChange.cmd).toBe('rename_state');
    expect(lostChange.oldStateName).toBe('Old state name');
    expect(lostChange.newStateName).toBe('New state name');
  });

  it('should evaluate values from a Lost Change with edition changes', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        html: 'newValue',
        content_id: ''
      },
      old_value: {
        html: 'oldValue',
        content_id: ''
      },
      property_name: 'content'
    });

    expect(lostChange.getRelativeChangeToGroups()).toBe('edited');
    expect(lostChange.getStatePropertyValue(lostChange.newValue)).toEqual({
      html: 'newValue',
      content_id: ''
    });
    expect(lostChange.getStatePropertyValue(lostChange.oldValue)).toEqual({
      html: 'oldValue',
      content_id: ''
    });
    expect(lostChange.isOutcomeFeedbackEqual()).toBe(false);
    expect(lostChange.isFeedbackEqual()).toBe(false);
  });

  it('should get state property value when it is an array from a Lost Change',
    () => {
      const lostChange = lcof.createNew({
        cmd: 'edit_state_property',
        state_name: 'Edited state name',
        new_value: ['value 1', 'value 2'],
        old_value: ['value 2', 'value 1'],
        property_name: 'content'
      });

      expect(lostChange.getRelativeChangeToGroups()).toBe('edited');
      expect(lostChange.isOldValueEmpty()).toBe(false);
      expect(lostChange.isNewValueEmpty()).toBe(false);
      expect(lostChange.getStatePropertyValue(lostChange.newValue)).toEqual(
        'value 2');
      expect(lostChange.getStatePropertyValue(lostChange.oldValue)).toEqual(
        'value 1');
    });

  it('should get relative changes when changes is awways from a Lost Change',
    () => {
      const lostChange = lcof.createNew({
        cmd: 'edit_state_property',
        state_name: 'Edited state name',
        new_value: ['value 1', 'value 2', 'value 3'],
        old_value: ['value 2', 'value 1'],
        property_name: 'content'
      });

      expect(lostChange.getRelativeChangeToGroups()).toBe('added');
      expect(lostChange.isOldValueEmpty()).toBe(false);
      expect(lostChange.isNewValueEmpty()).toBe(false);

      const lostChange2 = lcof.createNew({
        cmd: 'edit_state_property',
        state_name: 'Edited state name',
        new_value: ['value 1'],
        old_value: ['value 2', 'value 1'],
        property_name: 'content'
      });

      expect(lostChange2.getRelativeChangeToGroups()).toBe('deleted');
      expect(lostChange2.isOldValueEmpty()).toBe(false);
      expect(lostChange2.isNewValueEmpty()).toBe(false);
    });

  it('should evaluate values from a EndExploration Lost Change', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'EndExploration',
      old_value: null,
      property_name: 'widget_id'
    });

    expect(lostChange.getRelativeChangeToGroups()).toBe('added');
    expect(lostChange.isEndingExploration()).toBe(true);
    expect(lostChange.isAddingInteraction()).toBe(false);
    expect(lostChange.isOldValueEmpty()).toBe(true);
    expect(lostChange.isNewValueEmpty()).toBe(false);
  });

  it('should evaluate values from a Lost Change with deleted changes', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: null,
      old_value: 'EndExploration',
      property_name: 'widget_id'
    });

    expect(lostChange.getRelativeChangeToGroups()).toBe('deleted');
    expect(lostChange.isEndingExploration()).toBe(false);
    expect(lostChange.isAddingInteraction()).toBe(false);
    expect(lostChange.isOldValueEmpty()).toBe(false);
    expect(lostChange.isNewValueEmpty()).toBe(true);
  });

  it('should evaluate values from a Lost Change with equal outcomes and' +
    ' rules', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 2',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      old_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'answer_groups'
    });

    expect(lostChange.isRulesEqual()).toBe(true);
    expect(lostChange.isOutcomeFeedbackEqual()).toBe(true);
    expect(lostChange.isOutcomeDestEqual()).toBe(false);
  });

  it('should evaluate values from a Lost Change with equal outcomes', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: oof.createFromBackendDict({
        dest: 'outcome 2',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      }),
      old_value: oof.createFromBackendDict({
        dest: 'outcome 1',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      }),
      property_name: 'default_outcome'
    });

    expect(lostChange.isFeedbackEqual()).toBe(true);
    expect(lostChange.isDestEqual()).toBe(false);
    expect(lostChange.isOutcomeDestEqual()).toBe(false);
  });
});
