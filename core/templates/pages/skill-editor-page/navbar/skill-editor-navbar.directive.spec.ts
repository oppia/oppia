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
 * @fileoverview Unit tests for the Skill Editor Navbar Directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillEditorStateService } from '../services/skill-editor-state.service';
import { AlertsService } from 'services/alerts.service';
import { Skill, SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { EventEmitter } from '@angular/core';

fdescribe('Skill Editor Navbar Directive', function() {
    let $scope = null;
    let ctrl = null;
    let $rootScope = null;
    let directive = null;
    let $uibModal = null;
    let alertsService: AlertsService = null;
    let skillEditorRoutingService = null;
    let skillEditorStateService: SkillEditorStateService = null;
    let skillObjectFactory: SkillObjectFactory = null;

    let alertsSpy = null;
    let sampleSkill: Skill = null;
    let mockEventEmitter = new EventEmitter();


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
      $uibModal = $injector.get('$uibModal');
      directive = $injector.get('skillEditorNavbarDirective')[0];
      alertsService = $injector.get('AlertsService');
      skillObjectFactory = $injector.get('SkillObjectFactory');
      skillEditorStateService = $injector.get('SkillEditorStateService');
      skillEditorRoutingService = $injector.get('SkillEditorRoutingService');

      sampleSkill = skillObjectFactory.createInterstitialSkill();
      spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
      alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue(null);
      spyOnProperty(skillEditorStateService, 'onSkillChange')
        .and.returnValue(mockEventEmitter);
  
      ctrl = $injector.instantiate(directive.controller, {
        $rootScope: $scope,
        $scope: $scope
      });

    }));

    it('should set properties when initialized', function() {
        expect($scope.activeTab).toBe(undefined);
        expect(ctrl.skill).toEqual(undefined);

        ctrl.$onInit();
        mockEventEmitter.emit();

        expect($scope.activeTab).toBe('Editor');
        expect(ctrl.skill).toEqual(sampleSkill);
    });
});