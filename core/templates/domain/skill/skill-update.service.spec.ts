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
 * @fileoverview Unit tests for SkillUpdateService.
 */

import { TestBed } from '@angular/core/testing';
import cloneDeep from 'lodash/cloneDeep';

import { ConceptCardBackendDict } from './concept-card.model';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillContentsWorkedExamplesChange } from 'domain/editor/undo_redo/change.model';
import { SkillBackendDict, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { WorkedExample, WorkedExampleBackendDict } from 'domain/skill/worked-example.model';
import { LocalStorageService } from 'services/local-storage.service';
import { EntityEditorBrowserTabsInfo } from 'domain/entity_editor_browser_tabs_info/entity-editor-browser-tabs-info.model';
import { EventEmitter } from '@angular/core';

describe('Skill update service', () => {
  let skillUpdateService: SkillUpdateService;
  let skillObjectFactory: SkillObjectFactory;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let undoRedoService: UndoRedoService;
  let localStorageService: LocalStorageService;

  let skillDict: SkillBackendDict;
  let skillContentsDict: ConceptCardBackendDict;
  let example1: WorkedExampleBackendDict;
  let example2: WorkedExampleBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SkillUpdateService,
        UndoRedoService,
        MisconceptionObjectFactory,
        SkillObjectFactory
      ],
    });

    skillUpdateService = TestBed.inject(SkillUpdateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    localStorageService = TestBed.inject(LocalStorageService);

    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);

    const misconceptionDict1 = {
      id: 2,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };

    const misconceptionDict2 = {
      id: 4,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };

    const rubricDict = {
      difficulty: 'Easy',
      explanations: ['explanation'],
    };

    example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1',
      },
    };

    example2 = {
      question: {
        html: 'worked example question 2',
        content_id: 'worked_example_q_2',
      },
      explanation: {
        html: 'worked example explanation 2',
        content_id: 'worked_example_e_2',
      },
    };

    skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [example1, example2],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_q_1: {},
          worked_example_e_1: {},
          worked_example_q_2: {},
          worked_example_e_2: {},
        },
      },
    };

    skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: ['skill_1'],
    } as SkillBackendDict;
  });

  it('should set/unset the skill description', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.setSkillDescription(skill, 'new description');
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_property',
        property_name: 'description',
        old_value: 'test description',
        new_value: 'new description',
      },
    ]);

    expect(skill.getDescription()).toEqual('new description');

    undoRedoService.undoChange(skill);
    expect(skill.getDescription()).toEqual('test description');
  });

  it('should set/unset the concept card explanation', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.setConceptCardExplanation(
      skill,
      SubtitledHtml.createDefault('new explanation', 'explanation')
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_contents_property',
        property_name: 'explanation',
        old_value: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        new_value: {
          html: 'new explanation',
          content_id: 'explanation',
        },
      },
    ]);

    expect(skill.getConceptCard().getExplanation()).toEqual(
      SubtitledHtml.createDefault('new explanation', 'explanation')
    );

    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getExplanation()).toEqual(
      SubtitledHtml.createDefault(
        'test explanation',
        'explanation'
      )
    );
  });

  it('should add a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);
    const aNewMisconceptionDict = {
      id: 7,
      name: 'test name 3',
      notes: 'test notes 3',
      feedback: 'test feedback 3',
      must_be_addressed: true,
    };

    const aNewMisconception = misconceptionObjectFactory.createFromBackendDict(
      aNewMisconceptionDict
    );
    skillUpdateService.addMisconception(skill, aNewMisconception);
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'add_skill_misconception',
        new_misconception_dict: aNewMisconceptionDict,
      },
    ]);
    expect(skill.getMisconceptions().length).toEqual(3);

    undoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should delete a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.deleteMisconception(skill, 2);
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'delete_skill_misconception',
        misconception_id: 2,
      },
    ]);
    expect(skill.getMisconceptions().length).toEqual(1);

    undoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should add a prerequisite skill', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.addPrerequisiteSkill(skill, 'skill_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'add_prerequisite_skill',
        skill_id: 'skill_2',
      },
    ]);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(2);

    undoRedoService.undoChange(skill);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(1);

    let mockPrerequisiteSkillChangeEventEmitter = new EventEmitter();
    expect(skillUpdateService.onPrerequisiteSkillChange)
      .toEqual(mockPrerequisiteSkillChangeEventEmitter);
  });

  it('should delete a prerequisite skill', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.deletePrerequisiteSkill(skill, 'skill_1');
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'delete_prerequisite_skill',
        skill_id: 'skill_1',
      },
    ]);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(0);

    undoRedoService.undoChange(skill);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(1);
  });

  it('should update a rubric', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    expect(skill.getRubrics().length).toEqual(1);
    skillUpdateService.updateRubricForDifficulty(skill, 'Easy', [
      'new explanation 1',
      'new explanation 2',
    ]);
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_rubrics',
        difficulty: 'Easy',
        explanations: ['new explanation 1', 'new explanation 2'],
      },
    ]);
    expect(skill.getRubrics().length).toEqual(1);
    expect(skill.getRubrics()[0].getExplanations()).toEqual([
      'new explanation 1',
      'new explanation 2',
    ]);

    undoRedoService.undoChange(skill);
    expect(skill.getRubrics().length).toEqual(1);
    expect(skill.getRubrics()[0].getExplanations()).toEqual(['explanation']);
  });

  it('should not update rubric when skill difficulty is invalid', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    expect(skill.getRubrics().length).toEqual(1);
    const nonExistentSkillDifficulty = 'INSANELY EXTREMELY HARD';
    expect(() => {
      skillUpdateService.updateRubricForDifficulty(
        skill,
        nonExistentSkillDifficulty, [
          'new explanation 1',
          'new explanation 2',
        ]
      );
    }).toThrowError('Invalid difficulty value passed');
  });

  it('should update the name of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionName(
      skill,
      2,
      skill.findMisconceptionById(2).getName(),
      'new name'
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'name',
        old_value: 'test name',
        new_value: 'new name',
        misconception_id: 2,
      },
    ]);
    expect(skill.findMisconceptionById(2).getName()).toEqual('new name');

    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById(2).getName()).toEqual('test name');
  });

  it('should update the notes of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionNotes(
      skill,
      2,
      skill.findMisconceptionById(2).getNotes(),
      'new notes'
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'notes',
        old_value: 'test notes',
        new_value: 'new notes',
        misconception_id: 2,
      },
    ]);
    expect(skill.findMisconceptionById(2).getNotes()).toEqual('new notes');

    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById(2).getNotes()).toEqual('test notes');
  });

  it('should update the feedback of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionFeedback(
      skill,
      2,
      skill.findMisconceptionById(2).getFeedback(),
      'new feedback'
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'feedback',
        old_value: 'test feedback',
        new_value: 'new feedback',
        misconception_id: 2,
      },
    ]);
    expect(skill.findMisconceptionById(2).getFeedback()).toEqual(
      'new feedback'
    );

    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById(2).getFeedback()).toEqual(
      'test feedback'
    );
  });

  it('should update the feedback of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionMustBeAddressed(
      skill,
      2,
      skill.findMisconceptionById(2).isMandatory(),
      false
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'must_be_addressed',
        old_value: true,
        new_value: false,
        misconception_id: 2,
      },
    ]);
    expect(skill.findMisconceptionById(2).isMandatory()).toEqual(false);

    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById(2).isMandatory()).toEqual(true);
  });

  it('should add a worked example', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    const newExample: WorkedExampleBackendDict = {
      question: {
        html: 'worked example question 3',
        content_id: 'worked_example_q_3',
      },
      explanation: {
        html: 'worked example explanation 3',
        content_id: 'worked_example_e_3',
      },
    };

    skillUpdateService.addWorkedExample(
      skill,
      WorkedExample.createFromBackendDict(newExample)
    );

    const workedExamplesObject: SkillContentsWorkedExamplesChange = {
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: skillContentsDict.worked_examples,
      new_value: [...skillContentsDict.worked_examples, newExample],
    };

    expect(undoRedoService.getCommittableChangeList()).toEqual([
      workedExamplesObject,
    ]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      WorkedExample.createFromBackendDict(example1),
      WorkedExample.createFromBackendDict(example2),
      WorkedExample.createFromBackendDict(newExample),
    ]);

    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      WorkedExample.createFromBackendDict(example1),
      WorkedExample.createFromBackendDict(example2),
    ]);
  });

  it('should delete a worked example', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.deleteWorkedExample(skill, 0);

    const workedExamplesObject: SkillContentsWorkedExamplesChange = {
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: skillContentsDict.worked_examples,
      new_value: [skillContentsDict.worked_examples[1]],
    };

    expect(undoRedoService.getCommittableChangeList()).toEqual(
      [workedExamplesObject]
    );
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      WorkedExample.createFromBackendDict(example2),
    ]);

    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      WorkedExample.createFromBackendDict(example1),
      WorkedExample.createFromBackendDict(example2),
    ]);
  });

  it('should update a worked example', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    const modifiedExample1 = {
      question: {
        html: 'new question 1',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html: 'new explanation 1',
        content_id: 'worked_example_e_1',
      },
    };

    skillUpdateService.updateWorkedExample(
      skill,
      0,
      'new question 1',
      'new explanation 1'
    );

    const workedExamplesObject: SkillContentsWorkedExamplesChange = {
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: skillContentsDict.worked_examples,
      new_value: [modifiedExample1, example2],
    };

    expect(undoRedoService.getCommittableChangeList()).toEqual(
      [workedExamplesObject]
    );
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      WorkedExample.createFromBackendDict(modifiedExample1),
      WorkedExample.createFromBackendDict(example2),
    ]);

    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      WorkedExample.createFromBackendDict(example1),
      WorkedExample.createFromBackendDict(example2),
    ]);
  });

  it('should update all worked examples within a skill', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    const oldWorkedExamples = cloneDeep(
      skill.getConceptCard().getWorkedExamples()
    );
    const newWorkedExamples = oldWorkedExamples.map((workedExample, index) => {
      workedExample
        .getQuestion()
        .html = `new question ${index + 1}`;
      workedExample
        .getExplanation()
        .html = `new explanation ${index + 1}`;
      return workedExample;
    });

    skillUpdateService.updateWorkedExamples(
      skill,
      newWorkedExamples
    );

    const workedExamplesObject: SkillContentsWorkedExamplesChange = {
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: skillContentsDict.worked_examples,
      new_value: newWorkedExamples.map((workedExample) => {
        return workedExample.toBackendDict();
      }),
    };

    expect(undoRedoService.getCommittableChangeList()).toEqual(
      [workedExamplesObject]
    );
    expect(skill.getConceptCard().getWorkedExamples()).toEqual(
      newWorkedExamples.map((workedExample) => {
        return WorkedExample.createFromBackendDict(
          workedExample.toBackendDict()
        );
      })
    );

    undoRedoService.undoChange(skill);

    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      WorkedExample.createFromBackendDict(example1),
      WorkedExample.createFromBackendDict(example2),
    ]);
  });

  it('should update skill editor browser tabs unsaved changes status', () => {
    let skillEditorBrowserTabsInfo = EntityEditorBrowserTabsInfo.create(
      'skill', 'skill_id', 2, 1, false);
    spyOn(
      localStorageService, 'getEntityEditorBrowserTabsInfo'
    ).and.returnValue(skillEditorBrowserTabsInfo);
    spyOn(
      localStorageService, 'updateEntityEditorBrowserTabsInfo'
    ).and.callFake(() => {});

    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeFalse();

    const skill = skillObjectFactory.createFromBackendDict(skillDict);
    skillUpdateService.setSkillDescription(skill, 'new description');

    expect(
      skillEditorBrowserTabsInfo.doesSomeTabHaveUnsavedChanges()
    ).toBeTrue();
  });
});
