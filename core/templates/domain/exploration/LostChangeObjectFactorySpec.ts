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
import { LostChangeObjectFactory } from 'domain/exploration/LostChangeObjectFactory';
import { OutcomeObjectFactory } from './OutcomeObjectFactory';
import { SubtitledHtml } from './subtitled-html.model';

describe('Lost Change Object Factory', () => {
  let lcof: LostChangeObjectFactory;
  let oof: OutcomeObjectFactory;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LostChangeObjectFactory]
    });

    lcof = TestBed.inject(LostChangeObjectFactory);
    oof = TestBed.inject(OutcomeObjectFactory);
  });

  it('should evaluate values from a Lost Change', () => {
    const lostChange = lcof.createNew({
      cmd: 'add_state',
      state_name: 'State name',
      content_id_for_state_content: 'content_0',
      content_id_for_default_outcome: 'default_outcome_1'
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
    expect(lostChange.getStatePropertyValue(
      lostChange.oldValue as string[] | Object)
    ).toEqual({
      html: 'oldValue',
      content_id: ''
    });
    expect(lostChange.isOutcomeFeedbackEqual()).toBeFalse();
    expect(lostChange.isFeedbackEqual()).toBeFalse();
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
      expect(lostChange.isOldValueEmpty()).toBeFalse();
      expect(lostChange.isNewValueEmpty()).toBeFalse();
      expect(lostChange.getStatePropertyValue(
        lostChange.newValue as string[] | Object)).toEqual(
        'value 2');
      expect(lostChange.getStatePropertyValue(
        lostChange.oldValue as string[] | Object)).toEqual(
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
      expect(lostChange.isOldValueEmpty()).toBeFalse();
      expect(lostChange.isNewValueEmpty()).toBeFalse();

      const lostChange2 = lcof.createNew({
        cmd: 'edit_state_property',
        state_name: 'Edited state name',
        new_value: ['value 1'],
        old_value: ['value 2', 'value 1'],
        property_name: 'content'
      });

      expect(lostChange2.getRelativeChangeToGroups()).toBe('deleted');
      expect(lostChange2.isOldValueEmpty()).toBeFalse();
      expect(lostChange2.isNewValueEmpty()).toBeFalse();
    });

  it('should evaluate values from a EndExploration Lost Change', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'EndExploration',
      // 'old_value' will be null when the EndExploration
      // is newly added.
      old_value: null,
      property_name: 'widget_id'
    });

    expect(lostChange.getRelativeChangeToGroups()).toBe('added');
    expect(lostChange.isEndingExploration()).toBeTrue();
    expect(lostChange.isAddingInteraction()).toBeFalse();
    expect(lostChange.isOldValueEmpty()).toBeTrue();
    expect(lostChange.isNewValueEmpty()).toBeFalse();
  });

  it('should evaluate values from a Lost Change with deleted changes', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      // 'new_value' will be null when the EndExploration
      // is deleted or removed.
      new_value: null,
      old_value: 'EndExploration',
      property_name: 'widget_id'
    });

    expect(lostChange.getRelativeChangeToGroups()).toBe('deleted');
    expect(lostChange.isEndingExploration()).toBeFalse();
    expect(lostChange.isAddingInteraction()).toBeFalse();
    expect(lostChange.isOldValueEmpty()).toBeFalse();
    expect(lostChange.isNewValueEmpty()).toBeTrue();
  });

  it('should evaluate values from a Lost Change with equal outcomes and' +
    ' rules', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }),
        dest: 'default',
        feedback: new SubtitledHtml('<p>HTML</p>', '12'),
        html: '<p>Correct</p>',
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
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }),
        dest: 'default',
        dest_if_really_stuck: null,
        feedback: new SubtitledHtml('<p>HTML</p>', '12'),
        html: '<p>Correct</p>',
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

    expect(lostChange.isRulesEqual()).toBeTrue();
    expect(lostChange.isOutcomeFeedbackEqual()).toBeTrue();
    expect(lostChange.isOutcomeDestEqual()).toBeFalse();
  });

  it('should return false if any of the outcome dest are not present', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: undefined,
        dest: 'dest2',
        dest_if_really_stuck: null,
        feedback: new SubtitledHtml('<p>HTML</p>', '12'),
        html: '',
        rules: [{
          type: 'Type2',
          inputs: {
            input1: 'input3',
            input2: 'input4'
          }
        }]
      },
      old_value: {
        outcome: undefined,
        dest: 'dest1',
        dest_if_really_stuck: null,
        feedback: new SubtitledHtml('<p>HTML</p>', '12'),
        html: '',
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
    expect(lostChange.isOutcomeDestEqual()).toBeFalse();
  });

  it('should evaluate values from a Lost Change with equal outcomes', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_1',
            html: 'Html'
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }),
        dest: 'dest2',
        dest_if_really_stuck: null,
        feedback: new SubtitledHtml('<p>HTML</p>', '12'),
        html: '',
        rules: [{
          type: 'Type2',
          inputs: {
            input1: 'input3',
            input2: 'input4'
          }
        }]
      },
      old_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_1',
            html: 'Html'
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }),
        dest: 'dest1',
        dest_if_really_stuck: null,
        feedback: new SubtitledHtml('<p>HTML</p>', '12'),
        html: '',
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

    expect(lostChange.isFeedbackEqual()).toBeTrue();
    expect(lostChange.isDestEqual()).toBeFalse();
    expect(lostChange.isOutcomeDestEqual()).toBeFalse();
  });

  it('should return the language name from language code', () => {
    const lostChange = lcof.createNew({
      cmd: 'edit_exploration_property',
      new_value: 'bn',
      old_value: 'en',
      property_name: 'language_code'
    });
    expect(lostChange.getLanguage()).toBe('বাংলা (Bangla)');
    const lostChange2 = lcof.createNew({
      language_code: 'en',
      cmd: 'add_written_translation',
      content_id: 'content',
      translation_html: '<p>Translation Content.</p>',
      state_name: 'Introduction',
      content_html: 'N/A'
    });
    expect(lostChange2.getLanguage()).toBe('English');
  });
});
