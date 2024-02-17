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
 * @fileoverview Unit tests for SkillEditorStateService.js
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillRights, SkillRightsBackendDict } from 'domain/skill/skill-rights.model';
import { SkillRightsBackendApiService } from 'domain/skill/skill-rights-backend-api.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import {
  Skill,
  SkillBackendDict,
  SkillObjectFactory,
} from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';

const skillContentsDict = {
  explanation: {
    html: 'test explanation',
    content_id: 'explanation',
  },
  worked_examples: [],
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

const skillDict: SkillBackendDict = {
  id: 'skill_id_1',
  description: 'Description',
  misconceptions: [{
    id: 2,
    name: 'test name',
    notes: 'test notes',
    feedback: 'test feedback',
    must_be_addressed: true,
  }],
  rubrics: [{
    difficulty: 'Easy',
    explanations: ['explanation'],
  }, {
    difficulty: 'Medium',
    explanations: ['explanation'],
  }, {
    difficulty: 'Hard',
    explanations: ['explanation'],
  }],
  skill_contents: skillContentsDict,
  language_code: 'en',
  version: 3,
  prerequisite_skill_ids: [],
  all_questions_merged: true,
  superseding_skill_id: '2',
  next_misconception_id: 3,
};

const skillDict2: SkillBackendDict = {
  id: 'skill_id_2',
  description: 'Description 2',
  misconceptions: [{
    id: 2,
    name: 'test name',
    notes: 'test notes',
    feedback: 'test feedback',
    must_be_addressed: true,
  }],
  rubrics: [{
    difficulty: 'Easy',
    explanations: ['explanation'],
  }],
  skill_contents: skillContentsDict,
  language_code: 'en',
  version: 3,
  prerequisite_skill_ids: [],
  all_questions_merged: true,
  superseding_skill_id: '2',
  next_misconception_id: 3,
};

class FakeSkillBackendApiService {
  skillDictProp = {
    ...skillDict,
    getId: () => skillDict.id,
    getDescription: () => skillDict.description,
    getMisconceptions: () => skillDict.misconceptions,
    getRubrics: () => skillDict.rubrics,
    getConceptCard: () => skillDict.skill_contents,
    getLanguageCode: () => skillDict.language_code,
    getVersion: () => skillDict.version,
    getPrerequisiteSkillIds: () => skillDict.prerequisite_skill_ids,
    getNextMisconceptionId: () => skillDict.next_misconception_id,
    getSupersedingSkillId: () => skillDict.superseding_skill_id,
    getAllQuestionsMerged: () => skillDict.all_questions_merged,
  };

  newBackendSkillObject: SkillBackendDict | null = null;
  skillObject: Skill | null = null;
  failure: string | null = null;

  async fetchSkillAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve({
          skill: this.skillObject,
          groupedSkillSummaries: {
            Name: [
              {
                id: 'skill_id_1',
                description: 'Description 1',
              },
              {
                id: 'skill_id_2',
                description: 'Description 2',
              },
            ],
            Name2: [
              {
                id: 'skill_id_3',
                description: 'Description 1',
              },
              {
                id: 'skill_id_4',
                description: 'Description 2',
              },
            ],
          },
          assignedSkillTopicData: {
            topicName: ['tester'],
          },
        });
      } else {
        reject();
      }
    });
  }

  async updateSkillAsync() {
    return new Promise((resolve, reject) => {
      if (!this.failure) {
        resolve(this.skillObject);
      } else {
        reject();
      }
    });
  }

  async doesSkillWithDescriptionExistAsync(description: string) {
    return new Promise((resolve, reject) => {
      if (description) {
        resolve(true);
      } else {
        reject();
      }
    });
  }
}

class FakeSkillRightsBackendApiService {
  self = {
    backendSkillRightsObject: {
      skill_id: 'skill_id_1',
      can_edit_skill_description: true,
      getSkillId: () => 'skill_id_1',
      canEditSkillDescription: () => false,
    } as SkillRightsBackendDict,
    failure: null,
    fetchSkillRightsAsync: null,
  };

  backendSkillRightsObject!: SkillRightsBackendDict;

  async fetchSkillRightsAsync() {
    return new Promise((resolve, reject) => {
      if (!this.self.failure) {
        resolve(this.self.backendSkillRightsObject);
      } else {
        reject();
      }
    });
  }
}

describe('Skill editor state service', () => {
  let fakeSkillBackendApiService: FakeSkillBackendApiService;
  let fakeSkillRightsBackendApiService: FakeSkillRightsBackendApiService;
  let skillEditorStateService: SkillEditorStateService;
  let skillObjectFactory: SkillObjectFactory;
  let skillRightsObject: SkillRightsBackendDict;
  let skillUpdateService: SkillUpdateService;

  beforeEach(() => {
    fakeSkillBackendApiService = new FakeSkillBackendApiService();
    fakeSkillRightsBackendApiService = new FakeSkillRightsBackendApiService();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: SkillBackendApiService,
          useValue: fakeSkillBackendApiService,
        },
        {
          provide: SkillRightsBackendApiService,
          useValue: fakeSkillRightsBackendApiService,
        },
      ],
    }).compileComponents();

    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    skillUpdateService = TestBed.inject(SkillUpdateService);

    skillRightsObject = {
      skill_id: 'skill_id_1',
      can_edit_skill_description: true,
    };
    fakeSkillRightsBackendApiService.backendSkillRightsObject =
    skillRightsObject;

    fakeSkillBackendApiService.newBackendSkillObject = skillDict;
    fakeSkillBackendApiService.skillObject =
    skillObjectFactory.createFromBackendDict(
      skillDict
    );
  });

  it('should test getters', () => {
    expect(skillEditorStateService.onSkillChange).toBeDefined();
  });

  it('should request to load the skill from the backend', () => {
    spyOn(fakeSkillBackendApiService, 'fetchSkillAsync').and.callThrough();
    skillEditorStateService.loadSkill('skill_id_1');
    expect(fakeSkillBackendApiService.fetchSkillAsync).toHaveBeenCalled();
  });

  it('should track whether it is currently loading the skill', fakeAsync(() => {
    expect(skillEditorStateService.isLoadingSkill()).toBe(false);
    skillEditorStateService.loadSkill('skill_id_1');
    expect(skillEditorStateService.isLoadingSkill()).toBe(true);
    tick(1000);
    expect(skillEditorStateService.isLoadingSkill()).toBe(false);
  }));

  it('should indicate a collection is no longer loading after an error',
    fakeAsync(() => {
      expect(skillEditorStateService.isLoadingSkill()).toBe(false);
      fakeSkillBackendApiService.failure = 'Internal 500 error';
      skillEditorStateService.loadSkill('skill_id_1');
      expect(skillEditorStateService.isLoadingSkill()).toBe(true);
      tick(1000);
      expect(skillEditorStateService.isLoadingSkill()).toBe(false);
    }));

  it('should report that a skill has loaded through loadSkill()',
    fakeAsync(() => {
      spyOn(
        fakeSkillRightsBackendApiService,
        'fetchSkillRightsAsync'
      ).and.callThrough();
      expect(skillEditorStateService.hasLoadedSkill()).toBe(false);
      skillEditorStateService.loadSkill('skill_id_1');
      expect(skillEditorStateService.hasLoadedSkill()).toBe(false);
      tick(1000);
      expect(skillEditorStateService.hasLoadedSkill()).toBe(true);
      const groupedSkillSummaries =
    skillEditorStateService.getGroupedSkillSummaries();
      expect(groupedSkillSummaries.current.length).toEqual(2);
      expect(groupedSkillSummaries.others.length).toEqual(2);

      expect(groupedSkillSummaries.current[0].id).toEqual('skill_id_1');
      expect(groupedSkillSummaries.current[1].id).toEqual('skill_id_2');

      expect(
        skillEditorStateService.getAssignedSkillTopicData()
      ).toEqual({
        topicName: ['tester']
      });
    }));

  it('should return the last skill loaded as the same object',
    fakeAsync(() => {
      skillEditorStateService.setSkillRights(
        SkillRights.createFromBackendDict(skillRightsObject));
      skillEditorStateService.loadSkill('skill_id_1');
      tick(1000);
      const previousSkill = skillEditorStateService.getSkill();

      fakeSkillBackendApiService.newBackendSkillObject = skillDict2;
      fakeSkillBackendApiService.skillObject =
        skillObjectFactory.createFromBackendDict(skillDict2);

      const expectedSkill = fakeSkillBackendApiService.skillObject;
      expect(previousSkill).not.toEqual(expectedSkill);
      skillEditorStateService.loadSkill('skill_id_2');
      tick(1000);
      const actualSkill = skillEditorStateService.getSkill();
      expect(actualSkill).toEqual(expectedSkill);
      expect(actualSkill).toBe(previousSkill);
      expect(actualSkill).not.toBe(expectedSkill);
    }));

  it('should fail to load a skill without first loading one', () => {
    expect(() => {
      skillEditorStateService.saveSkill('commit message', () => {});
    }).toThrowError('Cannot save a skill before one is loaded.');
  });

  it('should not save the skill if there are no pending changes',
    fakeAsync(() => {
      skillEditorStateService.loadSkill('skill_id_1');
      tick(1000);
      expect(skillEditorStateService.saveSkill(
        'commit message',
        () => 'Cannot save a skill before one is loaded.')).toBe(
        false
      );
    }));

  it('should be able to save the collection and pending changes', fakeAsync(
    () => {
      spyOn(fakeSkillBackendApiService, 'updateSkillAsync').and.callThrough();

      skillEditorStateService.loadSkill('skill_id_1');
      tick(1000);
      expect(skillEditorStateService.hasLoadedSkill()).toBeTrue();
      skillUpdateService.setSkillDescription(
        skillEditorStateService.getSkill(),
        'new description'
      );
      tick(1000);

      expect(skillEditorStateService.saveSkill('commit message', () => {}));
      tick(1000);

      const expectedId = 'skill_id_1';
      const expectedVersion = 3;
      const expectedCommitMessage = 'commit message';
      const updateSkillSpy = fakeSkillBackendApiService.updateSkillAsync;
      expect(updateSkillSpy).toHaveBeenCalledWith(
        expectedId,
        expectedVersion,
        expectedCommitMessage,
        [
          {
            property_name: 'description',
            new_value: 'new description',
            old_value: 'Description',
            cmd: 'update_skill_property',
          },
        ]
      );
    }));

  it('should track whether it is currently saving the skill', fakeAsync(() => {
    skillEditorStateService.loadSkill('skill_id_1');
    tick(1000);
    expect(skillEditorStateService.hasLoadedSkill()).toBeTrue();
    skillUpdateService.setSkillDescription(
      skillEditorStateService.getSkill(),
      'new description'
    );
    tick(1000);

    expect(skillEditorStateService.isSavingSkill()).toBe(false);
    skillEditorStateService.saveSkill('commit message', () => {});
    expect(skillEditorStateService.isSavingSkill()).toBe(true);
    tick(1000);
    expect(skillEditorStateService.isSavingSkill()).toBe(false);
  }));

  it('should indicate a skill is no longer saving after an error',
    fakeAsync(() => {
      skillEditorStateService.loadSkill('skill_id_1');
      tick(1000);
      expect(skillEditorStateService.hasLoadedSkill()).toBeTrue();
      skillUpdateService.setSkillDescription(
        skillEditorStateService.getSkill(),
        'new description'
      );
      tick(1000);

      expect(skillEditorStateService.isSavingSkill()).toBe(false);
      fakeSkillBackendApiService.failure = 'Internal 500 error';

      skillEditorStateService.saveSkill('commit message', () => {});

      expect(skillEditorStateService.isSavingSkill()).toBe(true);
      tick(1000);

      expect(skillEditorStateService.isSavingSkill()).toBe(false);
    }));

  it('should request to load the skill rights from the backend', () => {
    spyOn(
      fakeSkillRightsBackendApiService,
      'fetchSkillRightsAsync'
    ).and.callThrough();

    skillEditorStateService.loadSkill('skill_id_1');
    expect(
      fakeSkillRightsBackendApiService.fetchSkillRightsAsync
    ).toHaveBeenCalled();
  });

  it('should be able to set a new skill rights with an in-place copy', () => {
    skillEditorStateService.setSkillRights(SkillRights.createFromBackendDict({
      skill_id: 'skill_id',
      can_edit_skill_description: true,
    }));
    const previousSkillRights = skillEditorStateService.getSkillRights();
    const expectedSkillRights = SkillRights.createFromBackendDict(
      skillRightsObject
    );
    expect(previousSkillRights).not.toEqual(expectedSkillRights);

    skillEditorStateService.setSkillRights(expectedSkillRights);

    const actualSkillRights = skillEditorStateService.getSkillRights();
    expect(actualSkillRights).toEqual(expectedSkillRights);

    expect(actualSkillRights).toBe(previousSkillRights);
    expect(actualSkillRights).not.toBe(expectedSkillRights);
  });

  it('should get validation issues for the skill', fakeAsync(() => {
    skillEditorStateService.loadSkill('skill_id_1');

    tick(1000);

    expect(skillEditorStateService.getSkillValidationIssues()).toEqual([]);
  }));

  it('should update the skill description when calling ' +
    '\'updateExistenceOfSkillDescription\'', fakeAsync(() => {
    spyOn(fakeSkillBackendApiService, 'doesSkillWithDescriptionExistAsync')
      .and.callThrough();
    let successCb = jasmine.createSpy('success');
    skillEditorStateService.updateExistenceOfSkillDescription(
      'description', successCb);
    tick();

    expect(successCb).toHaveBeenCalledWith(true);
  }));

  it('should fail to update the skill description when ' +
    'description is empty', fakeAsync(() => {
    spyOn(fakeSkillBackendApiService, 'doesSkillWithDescriptionExistAsync')
      .and.callThrough();
    let successCb = jasmine.createSpy('success');
    skillEditorStateService.updateExistenceOfSkillDescription(
      '', successCb);
    tick();

    expect(successCb).not.toHaveBeenCalled();
  }));
});
