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
 * @fileoverview Unit tests for SkillBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { AppConstants } from 'app.constants';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillObjectFactory, SkillBackendDict } from 'domain/skill/SkillObjectFactory';

describe('Skill backend API service', () => {
  let httpTestingController: HttpTestingController;
  let skillBackendApiService: SkillBackendApiService;
  let skillBackendDict: SkillBackendDict;
  let skillObjectFactory: SkillObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);

    const misconceptionDict = {
      id: 2,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    const rubricDict = {
      difficulty: AppConstants.SKILL_DIFFICULTIES[0],
      explanations: ['explanation']
    };

    const exampleDict = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1'
      }
    };

    const skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [exampleDict],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      }
    };

    skillBackendDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 6,
      superseding_skill_id: '2',
      all_questions_merged: false,
      prerequisite_skill_ids: ['skill_1']
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch all skills', fakeAsync(() => {
    const skills: SkillBackendDict[] = [];
    skills.push(
      skillObjectFactory.createFromBackendDict(skillBackendDict).toBackendDict()
    );
    skillBackendApiService.fetchAllSkills().toPromise().then(
      res => {
        expect(res).toEqual(skills);
      }
    );
    let req = httpTestingController.expectOne('/fetch_skills');
    expect(req.request.method).toEqual('GET');
    req.flush(skills);

    flushMicrotasks();
  }));

  it(
    'should succesfully fetch an existing skill from the backend.',
    fakeAsync(() => {
      const skill = skillObjectFactory.createFromBackendDict(skillBackendDict);
      const assignedSkillTopicData = {
        topic: 'skillId'
      };
      const skillSummaryBackendDict = {
        language_code: 'en',
        skill_model_last_updated: 1594649197855.071,
        skill_model_created_on: 1594649197855.059,
        id: 'Q5JuLf64rzV0',
        worked_examples_count: 0,
        description: 'Dummy Skill 1',
        misconception_count: 0,
        version: 1
      };
      const groupedSkillSummaries = {
        topic: skillSummaryBackendDict
      };

      const backendResponse = {
        skill: skillBackendDict,
        assigned_skill_topic_data_dict: assignedSkillTopicData,
        grouped_skill_summaries: groupedSkillSummaries
      };

      const expectedResponse = {
        skill: skill,
        assignedSkillTopicData: assignedSkillTopicData,
        groupedSkillSummaries: groupedSkillSummaries
      };

      skillBackendApiService.fetchSkillAsync('1').then(response => {
        expect(response).toEqual(expectedResponse);
      });

      let req = httpTestingController.expectOne('/skill_editor_handler/data/1');
      expect(req.request.method).toEqual('GET');
      req.flush(backendResponse);

      flushMicrotasks();
    }));

  it(
    'should use the rejection handler if backend request failed.',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      skillBackendApiService.fetchSkillAsync('1').then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/skill_editor_handler/data/1');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    }));

  it(
    'should make a request to update the skill in the backend.',
    fakeAsync(() => {
      const skill = skillObjectFactory.createFromBackendDict(skillBackendDict);
      const backendResponse = {
        skill: skillBackendDict
      };
      const changeList = {
        cmd: 'add_prerequisite_skill',
        skill_id: '2'
      } as const;

      skillBackendApiService.updateSkillAsync(
        '1', 1, 'commit message', [changeList]).then(response => {
        expect(response).toEqual(skill);
      });

      let req = httpTestingController.expectOne('/skill_editor_handler/data/1');
      expect(req.request.method).toEqual('PUT');
      req.flush(backendResponse);

      flushMicrotasks();
    }));

  it(
    'should make a request to check if skill description exists in backend.',
    fakeAsync(() => {
      const backendResponse = {
        skill_description_exists: false,
      };
      const description = 'Adding Fractions';

      skillBackendApiService.doesSkillWithDescriptionExistAsync(
        description).then(response => {
        expect(response).toEqual(false);
      });

      let req = httpTestingController.expectOne(
        '/skill_description_handler/Adding%20Fractions'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(backendResponse);

      flushMicrotasks();
    }));

  it(
    'should use the rejection handler if skill description exists backend ' +
    'request failed.', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const description = 'Adding Fractions';

      skillBackendApiService.doesSkillWithDescriptionExistAsync(
        description).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/skill_description_handler/Adding%20Fractions'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    }));

  it(
    'should make a request to check if skill assigned for diagnostic test.',
    fakeAsync(() => {
      const backendResponse = {
        topic_names: [],
      };
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      const skillId = 'skill1';

      skillBackendApiService
        .getTopicNamesWithGivenSkillAssignedForDiagnosticTest(
          skillId).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/diagnostic_test_skill_assignment_handler/skill1'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(backendResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it(
    'should use the rejection handler if skill assigned for diagnostic test' +
    ' request failed.', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const skillId = 'skill1';

      skillBackendApiService
        .getTopicNamesWithGivenSkillAssignedForDiagnosticTest(
          skillId).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/diagnostic_test_skill_assignment_handler/skill1'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    }));

  it(
    'should use the rejection handler if the skill update in the backend' +
    'failed.', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const changeList = {
        cmd: 'add_prerequisite_skill',
        skill_id: '2'
      } as const;

      skillBackendApiService.updateSkillAsync(
        '1', 1, 'commit message', [changeList]).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/skill_editor_handler/data/1');
      expect(req.request.method).toEqual('PUT');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    }));

  it(
    'should succesfully fetch multiple existing skills from the backend.',
    fakeAsync(() => {
      const skill = skillObjectFactory.createFromBackendDict(skillBackendDict);
      const backendResponse = {
        skills: [skillBackendDict, skillBackendDict]
      };

      skillBackendApiService.fetchMultiSkillsAsync(['1', '2']).then(
        response => {
          expect(response).toEqual([skill, skill]);
        });

      let req = httpTestingController.expectOne(
        '/skill_data_handler/' + encodeURIComponent('1,2'));
      expect(req.request.method).toEqual('GET');
      req.flush(backendResponse);

      flushMicrotasks();
    }));

  it(
    'should use the rejection handler if fetch multiple skills from the ' +
    'backend failed.', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      skillBackendApiService.fetchMultiSkillsAsync(['1', '2']).then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/skill_data_handler/' + encodeURIComponent('1,2'));
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    }));

  it('should successfully delete a skill.', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    skillBackendApiService.deleteSkillAsync('1').then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/skill_editor_handler/data/1');
    expect(req.request.method).toEqual('DELETE');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should use the rejection handler if delete a existing skill fails.',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      skillBackendApiService.deleteSkillAsync('1').then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/skill_editor_handler/data/1');
      expect(req.request.method).toEqual('DELETE');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    }));
});
