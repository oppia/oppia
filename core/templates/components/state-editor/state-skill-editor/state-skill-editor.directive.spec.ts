// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for state skill editor directive.
 */

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('State skill editor directive', function() {
  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  var $uibModal = null;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var directive = null;
  var state = null;
  var AlertsService = null;
  var ExplorationStatesService = null;
  var StateEditorService = null;
  var StateObjectFactory = null;
  var StateLinkedSkillIdService = null;
  var StoryEditorStateService = null;
  var WindowDimensionsService = null;

  beforeEach(angular.mock.inject(function($injector) {
    $q = $injector.get('$q');
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    AlertsService = $injector.get('AlertsService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');
    StateEditorService = $injector.get('StateEditorService');
    StateObjectFactory = $injector.get('StateObjectFactory');
    StateLinkedSkillIdService = $injector.get('StateLinkedSkillIdService');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    WindowDimensionsService = $injector.get('WindowDimensionsService');

    var stateName = 'State1';
    var sampleStateBackendObject = {
      classifier_model_id: '1',
      content: {
        content_id: 'content1',
        html: 'This is a html text'
      },
      interaction: {
        answer_groups: [{
          outcome: {
            dest: 'outcome 1',
            feedback: {
              content_id: 'content2',
              html: ''
            },
            labelled_as_correct: true,
            param_changes: [],
            refresher_exploration_id: null
          },
          rule_specs: [],
          tagged_skill_misconception_id: ''
        }, {
          outcome: {
            dest: 'outcome 2',
            feedback: {
              content_id: 'content3',
              html: ''
            },
            labelled_as_correct: true,
            param_changes: [],
            refresher_exploration_id: null
          },
          rule_specs: [],
          tagged_skill_misconception_id: ''
        }],
        confirmed_unclassified_answers: null,
        customization_args: {},
        hints: [],
        id: null,
        solution: {
          answer_is_exclusive: false,
          correct_answer: 'This is the correct answer',
          explanation: {
            content_id: 'content1',
            html: 'This is a html text'
          }
        }
      },
      linked_skill_id: null,
      param_changes: [],
      recorded_voiceovers: {
        voiceovers_mapping: {
          content_1: {
            en: {
              needs_update: false,
            },
            es: {
              needs_update: true,
            }
          }
        }
      },
      solicit_answer_details: true,
      written_translations: {
        translations_mapping: {}
      }
    };
    state = StateObjectFactory.createFromBackendDict(
      stateName, sampleStateBackendObject);
    directive = $injector.get('stateSkillEditorDirective')[0];

    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(StoryEditorStateService, 'getSkillSummaries').and.returnValue(
      [{id: '1', description: 'Skill description'}]);
    spyOn(StateEditorService, 'getActiveStateName').and.returnValue(
      stateName);
    spyOn(ExplorationStatesService, 'getState').and.returnValue(state);
    var MockTopicsAndSkillsDashboardBackendApiService = {
      fetchDashboardDataAsync: () => {
        var deferred = $q.defer();
        deferred.resolve({
          categorizedSkillsDict: {},
          untriagedSkillSummaries: {}
        });
        return deferred.promise;
      }
    };
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      TopicsAndSkillsDashboardBackendApiService:
      MockTopicsAndSkillsDashboardBackendApiService,
      $uibModal
    });
    ctrl.$onInit();
    $rootScope.$apply();
  }));

  it('should open add skill modal for adding skill', function() {
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    $scope.addSkill();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call StateSkill service for adding skill id', function() {
    var deferred = $q.defer();
    deferred.resolve({
      id: 'skill_10'
    });
    var modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    var skillServiceSpy = spyOn(
      StateLinkedSkillIdService, 'saveDisplayedValue');
    $scope.addSkill();
    $rootScope.$apply();
    expect(modalSpy).toHaveBeenCalled();
    expect(skillServiceSpy).toHaveBeenCalled();
  });

  it('should call StateSkill service for adding skill and' +
      ' catch if the call fails', function() {
    var deferred = $q.defer();
    deferred.resolve({
      id: 'skill_10'
    });
    var alertsSpy = spyOn(AlertsService, 'addInfoMessage');
    var modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    var skillServiceSpy = spyOn(
      StateLinkedSkillIdService, 'saveDisplayedValue').and.throwError(
      'Error');
    $scope.addSkill();
    $rootScope.$apply();
    expect(modalSpy).toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
    expect(skillServiceSpy).toHaveBeenCalled();
  });

  it('should not add skill when dismissing add skill model', function() {
    var skillServiceSpy = spyOn(
      StateLinkedSkillIdService, 'saveDisplayedValue');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    $scope.addSkill();
    $rootScope.$apply();
    expect(skillServiceSpy).not.toHaveBeenCalled();
  });

  it('should open remove skill modal for removing skill', function() {
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    $scope.deleteSkill();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call StateSkill service for removing skill id', function() {
    var deferred = $q.defer();
    deferred.resolve({
      id: 'skill_0'
    });
    var modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {result: deferred.promise});
    var alertsSpy = spyOn(AlertsService, 'clearWarnings');
    var skillServiceSpy = spyOn(
      StateLinkedSkillIdService,
      'saveDisplayedValue');
    $scope.deleteSkill();
    $rootScope.$apply();
    expect(modalSpy).toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
    expect(skillServiceSpy).toHaveBeenCalled();
  });

  it('should not delete skill when dismissing delete skill model', function() {
    var skillServiceSpy = spyOn(
      StateLinkedSkillIdService, 'saveDisplayedValue');
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    $scope.deleteSkill();
    $rootScope.$apply();
    expect(skillServiceSpy).not.toHaveBeenCalled();
  });

  it('should toggle skill editor', function() {
    $scope.skillEditorIsShown = true;
    $scope.toggleSkillEditor();
    expect($scope.skillEditorIsShown).toEqual(false);
  });

  it('should return skill editor URL', function() {
    StateLinkedSkillIdService.displayed = 'skill_1';
    StateLinkedSkillIdService.saveDisplayedValue();
    var skillEditorUrl = $scope.getSkillEditorUrl();
    expect(skillEditorUrl).toEqual('/skill_editor/skill_1');
  });
});
