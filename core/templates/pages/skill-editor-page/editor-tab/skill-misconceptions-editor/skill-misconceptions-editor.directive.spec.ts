// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Skill Misconceptions Editor Directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { SkillUpdateService } from 'domain/skill/skill-update.service';

fdescribe('Misconception Editor Directive', function() {
    let $scope = null;
    let ctrl = null;
    let $rootScope = null;
    let directive = null;
    let skillEditorStateService: SkillEditorStateService = null;
    let skillUpdateService: SkillUpdateService = null;
    let skillObjectFactory: SkillObjectFactory = null;
    let misconceptionObjectFactory: MisconceptionObjectFactory = null;

    let sampleSkill = null;
    let sampleMisconception = null;

    beforeEach(angular.mock.module('oppia'));
    importAllAngularServices();

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule]
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
  
      directive = $injector.get('skillMisconceptionsEditorDirective')[0];
      skillEditorStateService = $injector.get('SkillEditorStateService');
      skillUpdateService = $injector.get('SkillUpdateService');
      skillObjectFactory = $injector.get('SkillObjectFactory');
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

      sampleSkill = skillObjectFactory.createInterstitialSkill();
      sampleMisconception = misconceptionObjectFactory.create(
        'misconceptionId', 'name', 'notes', 'feedback', false);
  
      spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);

      ctrl = $injector.instantiate(directive.controller, {
        $rootScope: $scope,
        $scope: $scope
      });
      $scope.misconception = sampleMisconception;
      $scope.isEditable = function() {
        return true;
      };
      ctrl.$onInit();
    }));

});