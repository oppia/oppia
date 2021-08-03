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
 * @fileoverview Unit tests for the Collection details editor directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { destroyPlatform } from '@angular/core';
import { setupAndGetUpgradedComponentAsync } from 'tests/unit-test-utils.ajs';
import { async, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { CollectionDetailsEditor } from './collection-details-editor.directive';
// ^^^ This block is to be removed.

fdescribe('Collection details editor directive', function() {
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  let $timeout = null;
  var directive = null;
  var UndoRedoService = null;
  var $uibModal = null;
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
  });


  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    UndoRedoService = $injector.get('UndoRedoService');
    directive = $injector.get('collectionDetailsEditorDirective')[0];
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    focusManagerService = $injector.get('FocusManagerService');

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should initialize the variables', function() {

  });
});

describe('Upgraded component', () => {
    beforeEach(() => destroyPlatform());
    afterEach(() => destroyPlatform());

  it('should create the upgraded component', async(() => {
    setupAndGetUpgradedComponentAsync(
      'collection-details-editor',
      'collectionDetailsEditor',
      [CollectionDetailsEditor]
    ).then(
      async(textContext) => expect(textContext).toBe('Hello Oppia!')
    );
  }));
});