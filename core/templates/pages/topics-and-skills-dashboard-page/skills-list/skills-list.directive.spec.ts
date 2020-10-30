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

import { EventEmitter } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

import { Subscription } from 'rxjs';

describe('Skills List Directive', function() {
  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  var $uibModal = null;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var directive = null;
  var $timeout = null;
  var EditableTopicBackendApiService = null;
  var SkillBackendApiService = null;

  var mockTasdReinitializedEventEmitter;
  var tasdReinitializedSpy = null;
  var testSubscription = null;

  var MockTopicsAndSkillsDashboardBackendApiService = {
    mergeSkills: () => {
      var deferred = $q.defer();
      deferred.resolve();
      return deferred.promise;
    },

    get onTopicsAndSkillsDashboardReinitialized() {
      return mockTasdReinitializedEventEmitter;
    }
  };

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $timeout = $injector.get('$timeout');
    $q = $injector.get('$q');

    EditableTopicBackendApiService =
        $injector.get('EditableTopicBackendApiService');
    SkillBackendApiService = $injector.get('SkillBackendApiService');
    directive = $injector.get('skillsListDirective')[0];

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      SkillBackendApiService: SkillBackendApiService,
      TopicsAndSkillsDashboardBackendApiService:
      MockTopicsAndSkillsDashboardBackendApiService,
      $uibModal
    });
  }));

  beforeEach(() => {
    mockTasdReinitializedEventEmitter = new EventEmitter();
    tasdReinitializedSpy = jasmine.createSpy('tasdReinitialized');
    testSubscription = new Subscription();
    testSubscription.add(
      MockTopicsAndSkillsDashboardBackendApiService.
        onTopicsAndSkillsDashboardReinitialized.subscribe(tasdReinitializedSpy)
    );
  });

  afterEach(() => {
    testSubscription.unsubscribe();
  });


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
    fakeAsync(() => {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      spyOn(SkillBackendApiService, 'deleteSkill').and.returnValue(
        $q.resolve());

      var skillId = 'CdjnJUE332dd';
      ctrl.deleteSkill(skillId);

      $timeout.flush();
      tick(100);
      expect(tasdReinitializedSpy).toHaveBeenCalled();
    }));

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

      $scope.getMergeableSkillSummaries = function() {
        return [{id: 'dnfsdk', version: 1}];
      };
      $scope.getSkillsCategorizedByTopics = function() {};
      $scope.getUntriagedSkillSummaries = function() {};
      var skillId = 'CdjnJUE332dd';

      ctrl.mergeSkill(skillId);
      $timeout.flush(100);

      expect(tasdReinitializedSpy).toHaveBeenCalled();
    });

  it('should assign skill to a topic',
    function() {
      var topicIds = ['dnfsdk'];
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve(topicIds)
      });

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
      expect(tasdReinitializedSpy).toHaveBeenCalled();
    });
});
