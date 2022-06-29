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
 * @fileoverview Unit tests for the skill editor main tab directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
// ^^^ This block is to be removed.

class MockNgbModalRef {
  componentInstance: {
    body: 'xyz';
  };
}

describe('Skill editor main tab directive', function() {
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  let $timeout = null;
  var directive = null;
  var UndoRedoService = null;
  let ngbModal: NgbModal = null;
  var SkillEditorRoutingService = null;
  var SkillEditorStateService = null;
  var focusManagerService = null;
  var assignedSkillTopicData = {topic1: 'subtopic1', topic2: 'subtopic2'};

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    focusManagerService = TestBed.get(FocusManagerService);
    ngbModal = TestBed.inject(NgbModal);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    ngbModal = $injector.get('NgbModal');
    UndoRedoService = $injector.get('UndoRedoService');
    directive = $injector.get('skillEditorMainTabDirective')[0];
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    focusManagerService = $injector.get('FocusManagerService');

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should initialize the variables', () => {
    expect($scope.selectedTopic).toEqual(null);
    expect($scope.subtopicName).toEqual(null);
  });

  it('should navigate to questions tab when unsaved changes are not present',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
      var routingSpy = spyOn(
        SkillEditorRoutingService, 'navigateToQuestionsTab').and.callThrough();
      $scope.createQuestion(),
      expect(routingSpy).toHaveBeenCalled();
      var createQuestionEventSpyon = spyOn(
        SkillEditorRoutingService, 'creatingNewQuestion')
        .and.callThrough();
      $scope.createQuestion();
      expect(createQuestionEventSpyon).toHaveBeenCalled();
    });

  it('should return if skill has been loaded', function() {
    expect($scope.hasLoadedSkill()).toBe(false);
    spyOn(SkillEditorStateService, 'hasLoadedSkill').and.returnValue(true);
    expect($scope.hasLoadedSkill()).toBe(true);
  });

  it('should open save changes modal with $uibModal when unsaved changes are' +
  ' present', function() {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      }) as NgbModalRef;
    });

    $scope.createQuestion(),
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should return assigned Skill Topic Data', function() {
    expect($scope.assignedSkillTopicData).toEqual(null);
    expect($scope.getAssignedSkillTopicData()).toEqual(null);
    $scope.assignedSkillTopicData = assignedSkillTopicData;
    expect($scope.getAssignedSkillTopicData()).toEqual(assignedSkillTopicData);
  });

  it('should return subtopic name', function() {
    expect($scope.subtopicName).toEqual(null);
    $scope.subtopicName = 'Subtopic1';
    expect($scope.getSubtopicName()).toEqual('Subtopic1');
  });

  it('should change subtopic when selected topic is changed', function() {
    $scope.assignedSkillTopicData = assignedSkillTopicData;
    $scope.changeSelectedTopic('topic1');
    expect($scope.getSubtopicName()).toEqual(assignedSkillTopicData.topic1);
    $scope.changeSelectedTopic('topic2');
    expect($scope.getSubtopicName()).toEqual(assignedSkillTopicData.topic2);
  });

  it('should return whether the topic dropdown is enabled', function() {
    expect($scope.isTopicDropdownEnabled()).toEqual(false);
    $scope.assignedSkillTopicData = assignedSkillTopicData;
    expect($scope.isTopicDropdownEnabled()).toEqual(true);
  });

  it('should set focus on create question button', function() {
    var focusSpy = spyOn(focusManagerService, 'setFocus');
    ctrl.$onInit();
    $timeout.flush();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should update the changes for misconception', function() {
    spyOn($rootScope, '$applyAsync');

    $scope.getMisconceptionChange();

    expect($rootScope.$applyAsync).toHaveBeenCalled();
  });

  it('should update the changes for concept card', function() {
    spyOn($rootScope, '$applyAsync');

    $scope.getConceptCardChange();

    expect($rootScope.$applyAsync).toHaveBeenCalled();
  });
});
