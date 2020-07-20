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
 * @fileoverview Unit tests for the skills list directive.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('Skills List Directive', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  var $uibModal = null;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var $httpBackend = null;
  var $rootScope = null;
  var directive = null;
  var $timeout = null;
  var EditableTopicBackendApiService = null;
  var TopicsAndSkillsDashboardBackendApiService = null;

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    $timeout = $injector.get('$timeout');
    $q = $injector.get('$q');
    TopicsAndSkillsDashboardBackendApiService = (
      $injector.get('TopicsAndSkillsDashboardBackendApiService'));
    var MockTopicsAndSkillsDashboardBackendApiService = {
      mergeSkills: () => {
        var deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;
      }
    };
    EditableTopicBackendApiService =
        $injector.get('EditableTopicBackendApiService');
    directive = $injector.get('skillsListDirective')[0];

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      TopicsAndSkillsDashboardBackendApiService:
      MockTopicsAndSkillsDashboardBackendApiService,
      $uibModal
    });
  }));

  it('should init the controller', function() {
    ctrl.$onInit();
    const skillHeadings = [
      'index', 'description', 'worked_examples_count',
      'misconception_count', 'status'];

    expect(ctrl.SKILL_HEADINGS).toEqual(skillHeadings);
  });

  it('should return skill editor url', function() {
    const skillId1 = 'uXcdsad3f42';
    const skillId2 = 'aEdf44DGfre';
    expect(ctrl.getSkillEditorUrl(skillId1)).toEqual(
      '/skill_editor/uXcdsad3f42');
    expect(ctrl.getSkillEditorUrl(skillId2)).toEqual(
      '/skill_editor/aEdf44DGfre');
  });

  it('should open the delete skill modal', function() {
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    ctrl.deleteSkill('dskfm4');
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should return serial number for skill', function() {
    ctrl.getPageNumber = function() {
      return 0;
    };
    ctrl.getItemsPerPage = function() {
      return 10;
    };
    expect(ctrl.getSerialNumberForSkill(2)).toEqual(3);
    ctrl.getPageNumber = function() {
      return 3;
    };
    ctrl.getItemsPerPage = function() {
      return 15;
    };
    expect(ctrl.getSerialNumberForSkill(2)).toEqual(48);
  });

  it('should reinitialize the page after successfully deleting the skill',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      spyOn($rootScope, '$broadcast');

      var skillId = 'CdjnJUE332dd';
      var url = '/skill_editor_handler/data/' + skillId;
      $httpBackend.expectDELETE(url).respond(200);
      ctrl.deleteSkill(skillId);

      $httpBackend.flush();
      $timeout.flush();
      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'topicsAndSkillsDashboardReinitialized');
    });

  it('should select and show edit options for a skill', function() {
    const skillId1 = 'uXcdsad3f42';
    const skillId2 = 'aEdf44DGfre';
    expect(ctrl.showEditOptions(skillId1)).toEqual(false);
    expect(ctrl.showEditOptions(skillId2)).toEqual(false);

    ctrl.changeEditOptions(skillId1);
    expect(ctrl.showEditOptions(skillId1)).toEqual(true);
    expect(ctrl.showEditOptions(skillId2)).toEqual(false);

    ctrl.changeEditOptions(skillId1);
    expect(ctrl.showEditOptions(skillId1)).toEqual(false);
    expect(ctrl.showEditOptions(skillId2)).toEqual(false);

    ctrl.changeEditOptions(skillId2);
    expect(ctrl.showEditOptions(skillId1)).toEqual(false);
    expect(ctrl.showEditOptions(skillId2)).toEqual(true);

    ctrl.changeEditOptions(skillId2);
    expect(ctrl.showEditOptions(skillId1)).toEqual(false);
    expect(ctrl.showEditOptions(skillId2)).toEqual(false);
  });

  it('should reinitialize the page after merging the skill',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          skill: {id: '1'},
          supersedingSkillId: '2'
        })
      });

      spyOn($rootScope, '$broadcast').and.callThrough();
      $scope.getMergeableSkillSummaries = function() {
        return [{id: 'dnfsdk', version: 1}];
      };
      $scope.getSkillsCategorizedByTopics = function() {};
      $scope.getUntriagedSkillSummaries = function() {};
      var skillId = 'CdjnJUE332dd';

      ctrl.mergeSkill(skillId);
      $timeout.flush(100);

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'topicsAndSkillsDashboardReinitialized');
    });

  it('should assign skill to a topic',
    function() {
      var topicIds = ['dnfsdk'];
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve(topicIds)
      });
      var broadcastSpy = spyOn($rootScope, '$broadcast').and.callThrough();

      $scope.getEditableTopicSummaries = function() {
        return [{id: 'dnfsdk', version: 1}];
      };
      var skillId = 'CdjnJUE332dd';

      var topicUpdateSpy = (spyOn(
        EditableTopicBackendApiService, 'updateTopic').and.returnValue(
        $q.resolve()));

      ctrl.assignSkillToTopic(skillId);
      $timeout.flush(100);
      expect(topicUpdateSpy).toHaveBeenCalled();
      expect(broadcastSpy).toHaveBeenCalledWith(
        'topicsAndSkillsDashboardReinitialized', true);
    });
});
