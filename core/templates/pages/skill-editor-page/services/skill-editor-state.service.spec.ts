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
 * @fileoverview Unit tests for SkillEditorStateService.js
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// skill-editor-state.service.ts is upgraded to Angular 8.
import { QuestionSummaryObjectFactory } from
  'domain/question/QuestionSummaryObjectFactory';
import { QuestionSummaryForOneSkillObjectFactory } from
  'domain/question/QuestionSummaryForOneSkillObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { SkillRightsObjectFactory } from
  'domain/skill/SkillRightsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

require('domain/skill/skill-update.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

describe('Skill editor state service', function() {
  var SkillEditorStateService = null, $q, $rootScope,
    SkillObjectFactory = null, SkillUpdateService = null,
    skillRightsObjectFactory = null;
  var fakeSkillBackendApiService = null;
  var fakeSkillRightsBackendApiService = null;
  var skillRightsObject = null;
  var skillDifficulties = null;

  var FakeSkillBackendApiService = function() {
    var self = {
      newBackendSkillObject: null,
      skillObject: null,
      failure: null,
      fetchSkill: null,
      updateSkill: null
    };

    var _fetchSkill = function() {
      return $q(function(resolve, reject) {
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
      return $q(function(resolve, reject) {
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
      fetchSkillRights: null
    };

    var _fetchSkillRights = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendSkillRightsObject);
        } else {
          reject();
        }
      });
    };

    self.backendSkillRightsObject = {};
    self.failure = null;
    self.fetchSkillRights = _fetchSkillRights;

    return self;
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeSkillBackendApiService = (
      FakeSkillBackendApiService());
    $provide.value(
      'QuestionSummaryObjectFactory', new QuestionSummaryObjectFactory());
    $provide.value(
      'QuestionSummaryForOneSkillObjectFactory',
      new QuestionSummaryForOneSkillObjectFactory(
        new QuestionSummaryObjectFactory));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value('SkillRightsObjectFactory', new SkillRightsObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'SkillBackendApiService',
      [fakeSkillBackendApiService][0]);

    fakeSkillRightsBackendApiService = (
      FakeSkillRightsBackendApiService());
    $provide.value(
      'SkillRightsBackendApiService',
      [fakeSkillRightsBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    SkillEditorStateService = $injector.get(
      'SkillEditorStateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    // The injector is required because this service is directly used in this
    // spec, therefore even though SkillRightsObjectFactory is upgraded to
    // Angular, it cannot be used just by instantiating it by its class but
    // instead needs to be injected. Note that 'skillRightsObjectFactory' is
    // the injected service instance whereas 'SkillRightsObjectFactory' is the
    // service class itself. Therefore, use the instance instead of the class in
    // the specs.
    skillRightsObjectFactory = $injector.get('SkillRightsObjectFactory');
    SkillUpdateService = $injector.get('SkillUpdateService');
    skillDifficulties = $injector.get('SKILL_DIFFICULTIES');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: false
    };

    var rubricDict = {
      difficulty: skillDifficulties[0],
      explanation: ['explanation']
    };

    var example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1'
      }
    };

    var example2 = {
      question: {
        html: 'worked example question 2',
        content_id: 'worked_example_q_2'
      },
      explanation: {
        html: 'worked example explanation 2',
        content_id: 'worked_example_e_2'
      }
    };

    var skillContentsDict = {
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

    var skillDict = {
      id: 'skill_id_1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: []
    };

    skillRightsObject = {
      skill_id: 'skill_id_1',
      can_edit_skill_description: true
    };
    fakeSkillRightsBackendApiService.backendSkillRightsObject = (
      skillRightsObject);

    fakeSkillBackendApiService.newBackendSkillObject = skillDict;
    fakeSkillBackendApiService.skillObject = SkillObjectFactory
      .createFromBackendDict(skillDict);
  }));

  it('should request to load the skill from the backend', function() {
    spyOn(fakeSkillBackendApiService, 'fetchSkill').and.callThrough();
    SkillEditorStateService.loadSkill('skill_id_1');
    expect(fakeSkillBackendApiService.fetchSkill)
      .toHaveBeenCalled();
  });

  it('should track whether it is currently loading the skill', function() {
    expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
    SkillEditorStateService.loadSkill('skill_id_1');
    expect(SkillEditorStateService.isLoadingSkill()).toBe(true);
    $rootScope.$apply();
    expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
  });

  it('should indicate a collection is no longer loading after an error',
    function() {
      expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
      fakeSkillBackendApiService.failure = 'Internal 500 error';
      SkillEditorStateService.loadSkill('skill_id_1');
      expect(SkillEditorStateService.isLoadingSkill()).toBe(true);
      $rootScope.$apply();
      expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
    });

  it('should report that a skill has loaded through loadSkill()', function() {
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(false);
    SkillEditorStateService.loadSkill('skill_id_1');
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(false);
    $rootScope.$apply();
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(true);
    var groupedSkillSummaries =
      SkillEditorStateService.getGroupedSkillSummaries();
    expect(groupedSkillSummaries.current.length).toEqual(2);
    expect(groupedSkillSummaries.others.length).toEqual(0);

    expect(groupedSkillSummaries.current[0].id).toEqual('skill_id_1');
    expect(groupedSkillSummaries.current[1].id).toEqual('skill_id_2');
  });

  it('should return the last skill loaded as the same object', function() {
    var previousSkill = SkillEditorStateService.getSkill();
    var expectedSkill = SkillObjectFactory.createFromBackendDict(
      fakeSkillBackendApiService.newBackendSkillObject);
    expect(previousSkill).not.toEqual(expectedSkill);
    SkillEditorStateService.loadSkill('skill_id_1');
    $rootScope.$apply();
    var actualSkill = SkillEditorStateService.getSkill();
    expect(actualSkill).toEqual(expectedSkill);
    expect(actualSkill).toBe(previousSkill);
    expect(actualSkill).not.toBe(expectedSkill);
  });

  it('should fail to load a skill without first loading one',
    function() {
      expect(function() {
        SkillEditorStateService.saveSkill('commit message');
      }).toThrowError('Cannot save a skill before one is loaded.');
    });

  it('should not save the skill if there are no pending changes',
    function() {
      SkillEditorStateService.loadSkill('skill_id_1');
      $rootScope.$apply();
      expect(SkillEditorStateService.saveSkill(
        'commit message')).toBe(false);
    });

  it('should be able to save the collection and pending changes',
    function() {
      spyOn(
        fakeSkillBackendApiService, 'updateSkill').and.callThrough();

      SkillEditorStateService.loadSkill('skill_id_1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.saveSkill(
        'commit message')).toBe(true);
      $rootScope.$apply();

      var expectedId = 'skill_id_1';
      var expectedVersion = 3;
      var expectedCommitMessage = 'commit message';
      var updateSkillSpy = (
        fakeSkillBackendApiService.updateSkill);
      expect(updateSkillSpy).toHaveBeenCalledWith(
        expectedId, expectedVersion, expectedCommitMessage,
        jasmine.any(Object));
    });

  it('should track whether it is currently saving the skill',
    function() {
      SkillEditorStateService.loadSkill('skill_id_1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
      SkillEditorStateService.saveSkill('commit message');
      expect(SkillEditorStateService.isSavingSkill()).toBe(true);

      $rootScope.$apply();
      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
    }
  );

  it('should indicate a skill is no longer saving after an error',
    function() {
      SkillEditorStateService.loadSkill('skill_id_1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
      fakeSkillBackendApiService.failure = 'Internal 500 error';

      SkillEditorStateService.saveSkill('commit message');
      expect(SkillEditorStateService.isSavingSkill()).toBe(true);

      $rootScope.$apply();
      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
    });

  it('should request to load the skill rights from the backend',
    function() {
      spyOn(fakeSkillRightsBackendApiService, 'fetchSkillRights')
        .and.callThrough();

      SkillEditorStateService.loadSkill('skill_id_1');
      expect(fakeSkillRightsBackendApiService.fetchSkillRights)
        .toHaveBeenCalled();
    });

  it('should initially return an interstitial skill rights object', function() {
    var skillRights = SkillEditorStateService.getSkillRights();
    expect(skillRights.getSkillId()).toEqual(null);
    expect(skillRights.canEditSkillDescription()).toEqual(false);
  });

  it('should be able to set a new skill rights with an in-place copy',
    function() {
      var previousSkillRights = SkillEditorStateService.getSkillRights();
      var expectedSkillRights = skillRightsObjectFactory.createFromBackendDict(
        skillRightsObject);
      expect(previousSkillRights).not.toEqual(expectedSkillRights);

      SkillEditorStateService.setSkillRights(expectedSkillRights);

      var actualSkillRights = SkillEditorStateService.getSkillRights();
      expect(actualSkillRights).toEqual(expectedSkillRights);

      expect(actualSkillRights).toBe(previousSkillRights);
      expect(actualSkillRights).not.toBe(expectedSkillRights);
    }
  );
});
