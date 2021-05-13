// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Editor state service.
 */

import { TestBed } from '@angular/core/testing';

import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

describe('Editor state service', () => {
  let ecs: StateEditorService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateEditorService]
    });

    ecs = TestBed.get(StateEditorService);
  });

  it('should correctly set and get state names', () => {
    ecs.setActiveStateName('A State');
    expect(ecs.getActiveStateName()).toBe('A State');
  });

  it('should not allow invalid state names to be set', () => {
    ecs.setActiveStateName('');
    expect(ecs.getActiveStateName()).toBeNull();

    ecs.setActiveStateName(null);
    expect(ecs.getActiveStateName()).toBeNull();
  });

  it('should correctly set and get solicitAnswerDetails', () => {
    expect(ecs.getSolicitAnswerDetails()).toBeNull();
    ecs.setSolicitAnswerDetails(false);
    expect(ecs.getSolicitAnswerDetails()).toEqual(false);
    ecs.setSolicitAnswerDetails(true);
    expect(ecs.getSolicitAnswerDetails()).toEqual(true);
  });

  it('should correctly set and get misconceptionsBySkill', () => {
    const misconceptionsBySkill = {
      skillId1: [0],
      skillId2: [1, 2]
    };
    expect(ecs.getMisconceptionsBySkill()).toEqual({});
    ecs.setMisconceptionsBySkill(misconceptionsBySkill);
    expect(ecs.getMisconceptionsBySkill()).toEqual(misconceptionsBySkill);
  });

  it('should correctly set and get linkedSkillId', () => {
    const linkedSkillId = 'skill_id1';

    expect(ecs.getLinkedSkillId()).toEqual(null);
    ecs.setLinkedSkillId(linkedSkillId);
    expect(ecs.getLinkedSkillId()).toEqual(linkedSkillId);
  });

  it('should correctly return answer choices for interaction', () => {
    const customizationArgsForMultipleChoiceInput = {
      choices: {
        value: [
          new SubtitledHtml('Choice 1', ''),
          new SubtitledHtml('Choice 2', '')
        ]
      }
    };
    expect(
      ecs.getAnswerChoices(
        'MultipleChoiceInput', customizationArgsForMultipleChoiceInput)
    ).toEqual([{
      val: 0,
      label: 'Choice 1',
    }, {
      val: 1,
      label: 'Choice 2',
    }]);

    const customizationArgsForImageClickInput = {
      imageAndRegions: {
        value: {
          labeledRegions: [{
            label: 'Label 1'
          }, {
            label: 'Label 2'
          }]
        }
      }
    };
    expect(
      ecs.getAnswerChoices(
        'ImageClickInput', customizationArgsForImageClickInput)
    ).toEqual([{
      val: 'Label 1',
      label: 'Label 1',
    }, {
      val: 'Label 2',
      label: 'Label 2',
    }]);

    const customizationArgsForItemSelectionAndDragAndDropInput = {
      choices: {
        value: [
          new SubtitledHtml('Choice 1', 'ca_choices_0'),
          new SubtitledHtml('Choice 2', 'ca_choices_1')
        ]
      }
    };
    expect(
      ecs.getAnswerChoices(
        'ItemSelectionInput',
        customizationArgsForItemSelectionAndDragAndDropInput)
    ).toEqual([{
      val: 'ca_choices_0',
      label: 'Choice 1',
    }, {
      val: 'ca_choices_1',
      label: 'Choice 2',
    }]);
    expect(
      ecs.getAnswerChoices(
        'DragAndDropSortInput',
        customizationArgsForItemSelectionAndDragAndDropInput)
    ).toEqual([{
      val: 'ca_choices_0',
      label: 'Choice 1',
    }, {
      val: 'ca_choices_1',
      label: 'Choice 2',
    }]);
  });
});
