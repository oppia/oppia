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
 * @fileoverview Unit tests for SkillObjectFactory.
 */

import {TestBed} from '@angular/core/testing';

import {
  ConceptCardBackendDict,
  ConceptCard,
} from 'domain/skill/concept-card.model';
import {
  MisconceptionBackendDict,
  MisconceptionObjectFactory,
} from 'domain/skill/MisconceptionObjectFactory';
import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';
import {Rubric, RubricBackendDict} from 'domain/skill/rubric.model';
import {
  SkillBackendDict,
  SkillObjectFactory,
} from 'domain/skill/SkillObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {AppConstants} from 'app.constants';

describe('Skill object factory', () => {
  let skillObjectFactory: SkillObjectFactory;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let example1 = null;
  let example2 = null;
  let misconceptionDict1: MisconceptionBackendDict;
  let misconceptionDict2: MisconceptionBackendDict;
  let rubricDict: RubricBackendDict;
  let skillContentsDict: ConceptCardBackendDict;
  let skillDict: SkillBackendDict;
  let skillDifficulties: typeof AppConstants.SKILL_DIFFICULTIES;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NormalizeWhitespacePipe],
    });
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    skillDifficulties = AppConstants.SKILL_DIFFICULTIES;
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    misconceptionDict1 = {
      id: 2,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };

    misconceptionDict2 = {
      id: 4,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: false,
    };

    rubricDict = {
      difficulty: skillDifficulties[0],
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
        html: 'worked example question 1',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1',
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
          worked_example_1: {},
          worked_example_2: {},
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
      next_misconception_id: 6,
      superseding_skill_id: '2',
      all_questions_merged: false,
      prerequisite_skill_ids: ['skill_1'],
    };
  });

  it('should create a new skill from a backend dictionary', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.getId()).toEqual('1');
    expect(skill.getDescription()).toEqual('test description');
    expect(skill.getMisconceptions()).toEqual([
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict1),
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict2),
    ]);
    expect(skill.getRubrics()).toEqual([
      Rubric.createFromBackendDict(rubricDict),
    ]);
    expect(skill.getConceptCard()).toEqual(
      ConceptCard.createFromBackendDict(skillContentsDict)
    );
    expect(skill.getLanguageCode()).toEqual('en');
    expect(skill.getVersion()).toEqual(3);
    expect(skill.getSupersedingSkillId()).toEqual('2');
    expect(skill.getAllQuestionsMerged()).toEqual(false);
    expect(skill.getPrerequisiteSkillIds()).toEqual(['skill_1']);
  });

  it('should find misconception by id', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.findMisconceptionById(4)).toEqual(
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict2)
    );
  });

  it(
    'should throw error when there is no misconception' + ' by the given id',
    () => {
      let skill = skillObjectFactory.createFromBackendDict(skillDict);
      expect(() => skill.findMisconceptionById(55)).toThrowError(
        'Could not find misconception with ID: 55'
      );
    }
  );

  it('should delete a misconception given its id', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    skill.deleteMisconception(2);
    expect(skill.getMisconceptions()).toEqual([
      misconceptionObjectFactory.createFromBackendDict(misconceptionDict2),
    ]);
  });

  it('should throw validation errors', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    skill
      .getConceptCard()
      .setExplanation(SubtitledHtml.createDefault('', 'review_material'));
    expect(skill.getValidationIssues()).toEqual([
      'There should be review material in the concept card.',
      'All 3 difficulties (Easy, Medium and Hard) should be addressed ' +
        'in rubrics.',
    ]);
  });

  it('should add/update a rubric given difficulty', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.getRubrics()[0].getExplanations()).toEqual(['explanation']);
    expect(skill.getRubrics().length).toEqual(1);

    skill.updateRubricForDifficulty(skillDifficulties[0], [
      'new explanation 1',
      'new explanation 2',
    ]);
    expect(skill.getRubrics()[0].getExplanations()).toEqual([
      'new explanation 1',
      'new explanation 2',
    ]);

    skill.updateRubricForDifficulty(skillDifficulties[1], ['explanation 2']);
    expect(skill.getRubrics().length).toEqual(2);
    expect(skill.getRubrics()[1].getExplanations()).toEqual(['explanation 2']);

    expect(() => {
      skill.updateRubricForDifficulty('invalid difficulty', ['explanation 2']);
    }).toThrowError('Invalid difficulty value passed');
  });

  it('should get the correct next misconception id', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.getNextMisconceptionId()).toEqual(6);
    skill.deleteMisconception(4);
    expect(skill.getNextMisconceptionId()).toEqual(6);

    var misconceptionToAdd1 = misconceptionObjectFactory.createFromBackendDict({
      id: skill.getNextMisconceptionId(),
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    });

    skill.appendMisconception(misconceptionToAdd1);
    expect(skill.getNextMisconceptionId()).toEqual(7);
    skill.deleteMisconception(6);
    expect(skill.getNextMisconceptionId()).toEqual(7);
  });

  it('should convert to a backend dictionary', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.toBackendDict()).toEqual(skillDict);
  });

  it(
    'should throw error when there are no rubrics' +
      ' for the given difficulty',
    () => {
      let skill = skillObjectFactory.createFromBackendDict(skillDict);
      expect(() => {
        skill.getRubricExplanations('difficult');
      }).toThrowError(
        'Unable to get explanation: The given difficulty does ' +
          'not match any difficulty in the rubrcs'
      );
    }
  );

  it('should get misconception id', () => {
    let skill = skillObjectFactory.createFromBackendDict(skillDict);
    expect(skill.getMisconceptionId(0)).toBe(2);
    expect(skill.getMisconceptionId(1)).toBe(4);
  });
});
