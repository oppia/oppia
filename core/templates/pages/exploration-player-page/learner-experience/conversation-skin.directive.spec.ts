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
 * @fileoverview Unit tests for Conversation skin directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { LearnerAnswerInfoService } from '../services/learner-answer-info.service';
// ^^^ This block is to be removed.

fdescribe('Conversation skin directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $timeout = null;
  let directive = null;
  let UndoRedoService = null;
  let $uibModal = null;
  let SkillEditorRoutingService = null;
  let SkillEditorStateService = null;
  let learnerAnswerInfoService: LearnerAnswerInfoService = null;
  let focusManagerService: FocusManagerService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LearnerAnswerInfoService
      ]
    });
    focusManagerService = TestBed.inject(FocusManagerService);
  });


  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    UndoRedoService = $injector.get('UndoRedoService');
    directive = $injector.get('conversationSkinDirective')[0];
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    focusManagerService = $injector.get('FocusManagerService');
    learnerAnswerInfoService = TestBed.inject(LearnerAnswerInfoService);

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      $rootScope: $scope,
      LearnerAnswerInfoService: learnerAnswerInfoService,
    });
    $scope.getQuestionPlayerConfig = function() {
      return;
    }
  }));

  it('should set properties when initialized', function() {
    ctrl.$onInit();
  });

})