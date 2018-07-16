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

describe('Skill editor state service', function() {
  var SkillEditorStateService, $q, $rootScope,
    SkillObjectFactory, SkillUpdateService;
  var fakeEditableSkillBackendApiService = null;

  var FakeEditableSkillBackendApiService = function() {
    var self = {};

    var _fetchOrUpdateSkill = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendSkillObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendSkillObject = {};
    self.failure = null;
    self.fetchSkill = _fetchOrUpdateSkill;
    self.updateSkill = _fetchOrUpdateSkill;

    return self;
  };

  var FakeSkillRightsBackendApiService = function() {
    var self = {};

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

  beforeEach(module('oppia'));
  beforeEach(module('oppia', function($provide) {
    fakeEditableSkillBackendApiService = (
      new FakeEditableSkillBackendApiService());
    $provide.value(
      'EditableSkillBackendApiService',
      [fakeEditableSkillBackendApiService][0]);

    fakeSkillRightsBackendApiService = (
      new FakeSkillRightsBackendApiService());
    $provide.value(
      'SkillRightsBackendApiService',
      [fakeSkillRightsBackendApiService][0]);
  }));

  beforeEach(inject(function($injector) {
    SkillEditorStateService = $injector.get(
      'SkillEditorStateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    SkillRightsObjectFactory = $injector.get('SkillRightsObjectFactory');
    SkillUpdateService = $injector.get('SkillUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var skillContentsDict = {
      explanation: 'test explanation',
      worked_examples: ['test worked_example 1', 'test worked example 2']
    };

    var skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3
    };

    skillRightsObject = {
      skill_id: '1',
      creator_id: '0',
      skill_is_private: true,
      can_edit_skill_description: true
    };
    fakeSkillRightsBackendApiService.backendSkillRightsObject = (
      skillRightsObject);

    fakeEditableSkillBackendApiService.newBackendSkillObject = skillDict;
  }));

  it('should request to load the skill from the backend', function() {
    spyOn(fakeEditableSkillBackendApiService, 'fetchSkill').and.callThrough();
    SkillEditorStateService.loadSkill('1');
    expect(fakeEditableSkillBackendApiService.fetchSkill)
      .toHaveBeenCalled();
  });

  it('should track whether it is currently loading the skill', function() {
    expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
    SkillEditorStateService.loadSkill('1');
    expect(SkillEditorStateService.isLoadingSkill()).toBe(true);
    $rootScope.$apply();
    expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
  });

  it('should indicate a collection is no longer loading after an error',
    function() {
      expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
      fakeEditableSkillBackendApiService.failure = 'Internal 500 error';
      SkillEditorStateService.loadSkill('1');
      expect(SkillEditorStateService.isLoadingSkill()).toBe(true);
      $rootScope.$apply();
      expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
    });

  it('should report that a skill has loaded through loadSkill()', function() {
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(false);
    var newSkill = SkillEditorStateService.loadSkill('1');
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(false);
    $rootScope.$apply();
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(true);
  });

  it('should return the last skill loaded as the same object', function() {
    var previousSkill = SkillEditorStateService.getSkill();
    var expectedSkill = SkillObjectFactory.createFromBackendDict(
      fakeEditableSkillBackendApiService.newBackendSkillObject);
    expect(previousSkill).not.toEqual(expectedSkill);
    SkillEditorStateService.loadSkill('1');
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
      }).toThrow();
    });

  it('should not save the skill if there are no pending changes',
    function() {
      SkillEditorStateService.loadSkill('1');
      $rootScope.$apply();
      expect(SkillEditorStateService.saveSkill(
        'commit message')).toBe(false);
    });

  it('should be able to save the collection and pending changes',
    function() {
      spyOn(fakeEditableSkillBackendApiService,
        'updateSkill').and.callThrough();

      SkillEditorStateService.loadSkill('1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.saveSkill(
        'commit message')).toBe(true);
      $rootScope.$apply();

      var expectedId = '1';
      var expectedVersion = 3;
      var expectedCommitMessage = 'commit message';
      var updateSkillSpy = (
        fakeEditableSkillBackendApiService.updateSkill);
      expect(updateSkillSpy).toHaveBeenCalledWith(
        expectedId, expectedVersion, expectedCommitMessage,
        jasmine.any(Object));
    });

  it('should track whether it is currently saving the skill',
    function() {
      SkillEditorStateService.loadSkill('1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
      SkillEditorStateService.saveSkill('commit message');
      expect(SkillEditorStateService.isSavingSkill()).toBe(true);

      $rootScope.$apply();
      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
    });

  it('should indicate a skill is no longer saving after an error',
    function() {
      SkillEditorStateService.loadSkill('1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
      fakeEditableSkillBackendApiService.failure = 'Internal 500 error';

      SkillEditorStateService.saveSkill('commit message');
      expect(SkillEditorStateService.isSavingSkill()).toBe(true);

      $rootScope.$apply();
      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
    });

  it('should request to load the skill rights from the backend',
    function() {
      spyOn(fakeSkillRightsBackendApiService, 'fetchSkillRights')
        .and.callThrough();

      SkillEditorStateService.loadSkill('1');
      expect(fakeSkillRightsBackendApiService.fetchSkillRights)
        .toHaveBeenCalled();
    });

  it('should initially return an interstitial skill rights object', function() {
    var skillRights = SkillEditorStateService.getSkillRights();
    expect(skillRights.getSkillId()).toEqual(null);
    expect(skillRights.getCreatorId()).toEqual(null);
    expect(skillRights.isPrivate()).toEqual(true);
    expect(skillRights.canEditSkillDescription()).toEqual(false);
  });

  it('should be able to set a new skill rights with an in-place copy',
    function() {
      var previousSkillRights = SkillEditorStateService.getSkillRights();
      var expectedSkillRights = SkillRightsObjectFactory.create(
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
