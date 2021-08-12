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
 * @fileoverview Unit tests for the Worked example editor directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WorkedExample, WorkedExampleBackendDict, WorkedExampleObjectFactory } from 'domain/skill/WorkedExampleObjectFactory';

fdescribe('Worked example editor directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $timeout = null;
  let directive = null;
  let UndoRedoService = null;
  let $uibModal = null;
  let workedExampleObjectFactory: WorkedExampleObjectFactory = null;

  let example1: WorkedExampleBackendDict = null;
  let workedExample1: WorkedExample = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    UndoRedoService = $injector.get('UndoRedoService');
    directive = $injector.get('workedExampleEditorDirective')[0];

    workedExampleObjectFactory = $injector.get('WorkedExampleObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');
    UndoRedoService = $injector.get('UndoRedoService');
    UndoRedoService = $injector.get('UndoRedoService');
    UndoRedoService = $injector.get('UndoRedoService');

    example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1',
      },
    };

    workedExample1 = workedExampleObjectFactory.createFromBackendDict(example1);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
  }));

  it('should set properties when initialized', function() {
    $scope.workedExample = workedExample1;
    ctrl.$onInit();
  });
});