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

import { RubricBackendDict } from 'domain/skill/RubricObjectFactory';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillRights } from 'domain/skill/skill-rights.model';
import { SkillRightsBackendApiService } from 'domain/skill/skill-rights-backend-api.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { SkillBackendDict, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';

const constants = require('constants.ts');

// class FakeSkillBackendApiService {
//   self = {
//     newBackendSkillObject: {},
//     skillObject: {},
//     failure: null,
//   };

//   fetchSkill() {
//     return new Promise((resolve, reject) => {
//       if (!this.self.failure) {
//         resolve({
//           skill: this.self.skillObject,
//           groupedSkillSummaries: {
//             Name: [{
//               id: 'skill_id_1',
//               description: 'Description 1'
//             }, {
//               id: 'skill_id_2',
//               description: 'Description 2'
//             }]
//           }
//         });
//       } else {
//         reject();
//       }
//     });
//   }

//   updateSkill() {
//     return new Promise((resolve, reject) => {
//       if (!this.self.failure) {
//         resolve(this.self.skillObject);
//       } else {
//         reject();
//       }
//     });
//   }
// }

// class FakeSkillRightsBackendApiService {
//   self = {
//     backendSkillRightsObject: {
//       skill_id: 'skill_id_1',
//       can_edit_skill_description: true
//     },
//     failure: null,
//     fetchSkillRightsAsync: null
//   };

//   fetchSkillRightsAsync() {
//     console.log("getting here===========")
//     return new Promise((resolve, reject) => {
//       console.log(this.self, "selfgetting here===========")
//       if (!this.self.failure) {
//         resolve(this.self.backendSkillRightsObject);
//       } else {
//         reject();
//       }
//     });
//   }
// }

fdescribe('Skill editor state service', () => {
  let fakeSkillBackendApiService = null;
  let fakeSkillRightsBackendApiService = null;
  let skillDifficulties = null;
  let skillEditorStateService: SkillEditorStateService = null;
  let skillObjectFactory: SkillObjectFactory = null;
  let skillRightsObject = null;
  let skillUpdateService: SkillUpdateService = null;

  var FakeSkillBackendApiService = function() {
    var self = {
      newBackendSkillObject: null,
      skillObject: null,
      failure: null,
      fetchSkill: null,
      updateSkill: null
    };

    var _fetchSkill = function() {
      return new Promise(function(resolve, reject) {
        if (!self.failure) {
          resolve({
            skill: self.skillObject,
            groupedSkillSummaries: {
              Name: [{
                id: 'skill_id_1',
                description: 'Description 1'
              }, {
                id: 'skill_id_2',
                description: 'Description 2'
              }]
            }
          });
        } else {
          reject();
        }
      });
    };

    var _updateSkill = function() {
      return new Promise(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.skillObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendSkillObject = {};
    self.skillObject = null;
    self.failure = null;
    self.fetchSkill = _fetchSkill;
    self.updateSkill = _updateSkill;

    return self;
  };

  var FakeSkillRightsBackendApiService = function() {
    var self = {
      backendSkillRightsObject: null,
      failure: null,
      fetchSkillRightsAsync: null
    };

    var _fetchSkillRights = function() {
      return new Promise(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendSkillRightsObject);
        } else {
          reject();
        }
      });
    };

    self.backendSkillRightsObject = {};
    self.failure = null;
    self.fetchSkillRightsAsync = _fetchSkillRights;

    return self;
  };

  beforeEach(() => {
    fakeSkillBackendApiService = (FakeSkillBackendApiService());
    fakeSkillRightsBackendApiService = (FakeSkillRightsBackendApiService());

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: SkillBackendApiService,
          useValue: fakeSkillBackendApiService
        },
        {
          provide: SkillRightsBackendApiService,
          useValue: fakeSkillRightsBackendApiService
        }
      ]
    }).compileComponents();

    skillEditorStateService = TestBed.get(SkillEditorStateService);
    skillObjectFactory = TestBed.get(SkillObjectFactory);
    skillUpdateService = TestBed.get(SkillUpdateService);

    skillDifficulties = constants.SKILL_DIFFICULTIES;

    const misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    const misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: false
    };

    const rubricDict: RubricBackendDict = {
      difficulty: skillDifficulties[0],
      explanations: ['explanation']
    };

    const example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1'
      }
    };

    const example2 = {
      question: {
        html: 'worked example question 2',
        content_id: 'worked_example_q_2'
      },
      explanation: {
        html: 'worked example explanation 2',
        content_id: 'worked_example_e_2'
      }
    };

    const skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [example1, example2],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      }
    };

    const skillDict: SkillBackendDict = {
      id: 'skill_id_1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: true,
      superseding_skill_id: '2',
      next_misconception_id: 3
    };

    skillRightsObject = {
      skill_id: 'skill_id_1',
      can_edit_skill_description: true
    };
    fakeSkillRightsBackendApiService.backendSkillRightsObject = (
      skillRightsObject);

    fakeSkillBackendApiService.newBackendSkillObject = skillDict;
    fakeSkillBackendApiService.skillObject = skillObjectFactory
      .createFromBackendDict(skillDict);
  });

  it('should request to load the skill from the backend', () => {
    spyOn(fakeSkillBackendApiService, 'fetchSkill').and.callThrough();
    skillEditorStateService.loadSkill('skill_id_1');
    expect(fakeSkillBackendApiService.fetchSkill)
      .toHaveBeenCalled();
  });

  it('should track whether it is currently loading the skill', () => {
    expect(skillEditorStateService.isLoadingSkill()).toBe(false);
    skillEditorStateService.loadSkill('skill_id_1');
    expect(skillEditorStateService.isLoadingSkill()).toBe(true);
    expect(skillEditorStateService.isLoadingSkill()).toBe(false);
  });

  it('should indicate a collection is no longer loading after an error',
    () => {
      expect(skillEditorStateService.isLoadingSkill()).toBe(false);
      fakeSkillBackendApiService.failure = 'Internal 500 error';
      skillEditorStateService.loadSkill('skill_id_1');
      expect(skillEditorStateService.isLoadingSkill()).toBe(true);
      expect(skillEditorStateService.isLoadingSkill()).toBe(false);
    });

  it('should report that a skill has loaded through loadSkill()', () => {
    expect(skillEditorStateService.hasLoadedSkill()).toBe(false);
    skillEditorStateService.loadSkill('skill_id_1');
    expect(skillEditorStateService.hasLoadedSkill()).toBe(false);
    expect(skillEditorStateService.hasLoadedSkill()).toBe(true);
    const groupedSkillSummaries =
      skillEditorStateService.getGroupedSkillSummaries();
    expect(groupedSkillSummaries.current.length).toEqual(2);
    expect(groupedSkillSummaries.others.length).toEqual(0);

    // expect(groupedSkillSummaries.current[0].id).toEqual('skill_id_1');
    // expect(groupedSkillSummaries.current[1].id).toEqual('skill_id_2');
  });

  it('should return the last skill loaded as the same object', () => {
    const previousSkill = skillEditorStateService.getSkill();
    const expectedSkill = skillObjectFactory.createFromBackendDict(
      fakeSkillBackendApiService.newBackendSkillObject);
    expect(previousSkill).not.toEqual(expectedSkill);
    skillEditorStateService.loadSkill('skill_id_1');
    const actualSkill = skillEditorStateService.getSkill();
    expect(actualSkill).toEqual(expectedSkill);
    expect(actualSkill).toBe(previousSkill);
    expect(actualSkill).not.toBe(expectedSkill);
  });

  it('should fail to load a skill without first loading one',
    () => {
      expect(() => {
        skillEditorStateService.saveSkill('commit message', ()=> {});
      }).toThrowError('Cannot save a skill before one is loaded.');
    });

  it('should not save the skill if there are no pending changes',
    () => {
      skillEditorStateService.loadSkill('skill_id_1');

      expect(skillEditorStateService.saveSkill(
        'commit message', ()=> {})).toBe(false);
    });

  it('should be able to save the collection and pending changes',
    () => {
      spyOn(
        fakeSkillBackendApiService, 'updateSkill').and.callThrough();

      skillEditorStateService.loadSkill('skill_id_1');
      skillUpdateService.setSkillDescription(
        skillEditorStateService.getSkill(), 'new description');

      expect(skillEditorStateService.saveSkill(
        'commit message', ()=> {})).toBe(true);

      const expectedId = 'skill_id_1';
      const expectedVersion = 3;
      const expectedCommitMessage = 'commit message';
      const updateSkillSpy = (
        fakeSkillBackendApiService.updateSkill);
      expect(updateSkillSpy).toHaveBeenCalledWith(
        expectedId, expectedVersion, expectedCommitMessage,
        jasmine.any(Object));
    });

  it('should track whether it is currently saving the skill',
    () => {
      skillEditorStateService.loadSkill('skill_id_1');
      skillUpdateService.setSkillDescription(
        skillEditorStateService.getSkill(), 'new description');

      expect(skillEditorStateService.isSavingSkill()).toBe(false);
      skillEditorStateService.saveSkill('commit message', () => {});
      expect(skillEditorStateService.isSavingSkill()).toBe(true);

      expect(skillEditorStateService.isSavingSkill()).toBe(false);
    }
  );

  fit('should indicate a skill is no longer saving after an error',
  fakeAsync(() => {
      skillEditorStateService.loadSkill('skill_id_1');
      skillUpdateService.setSkillDescription(
        skillEditorStateService.getSkill(), 'new description');
      tick(1000);

      expect(skillEditorStateService.isSavingSkill()).toBe(false);
      fakeSkillBackendApiService.failure = 'Internal 500 error';


      skillEditorStateService.saveSkill('commit message', () => {});

      expect(skillEditorStateService.isSavingSkill()).toBe(true);
      tick(1000);

      expect(skillEditorStateService.isSavingSkill()).toBe(false);
    }));

  it('should request to load the skill rights from the backend',
    () => {
      spyOn(fakeSkillRightsBackendApiService, 'fetchSkillRightsAsync')
        .and.callThrough();

      skillEditorStateService.loadSkill('skill_id_1');
      expect(fakeSkillRightsBackendApiService.fetchSkillRightsAsync)
        .toHaveBeenCalled();
    });

  it('should initially return an interstitial skill rights object', () => {
    const skillRights = skillEditorStateService.getSkillRights();
    expect(skillRights.getSkillId()).toEqual(null);
    expect(skillRights.canEditSkillDescription()).toEqual(false);
  });

  it('should be able to set a new skill rights with an in-place copy',
    () => {
      const previousSkillRights = skillEditorStateService.getSkillRights();
      const expectedSkillRights = SkillRights.createFromBackendDict(
        skillRightsObject);
      expect(previousSkillRights).not.toEqual(expectedSkillRights);

      skillEditorStateService.setSkillRights(expectedSkillRights);

      const actualSkillRights = skillEditorStateService.getSkillRights();
      expect(actualSkillRights).toEqual(expectedSkillRights);

      expect(actualSkillRights).toBe(previousSkillRights);
      expect(actualSkillRights).not.toBe(expectedSkillRights);
    }
  );
});
