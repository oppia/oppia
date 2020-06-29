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
 * @fileoverview Unit tests for skill editor page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/skill-editor-page/skill-editor-page.component.ts');

describe('Skill editor page', function() {
  var ctrl = null;
  var SkillEditorRoutingService = null;
  var SkillEditorStateService = null;
  var SkillObjectFactory = null;
  var UndoRedoService = null;
  var $uibModal = null;
  var UrlService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    $uibModal = $injector.get('$uibModal');
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');
    UrlService = $injector.get('UrlService');

    ctrl = $componentController('skillEditorPage');
  }));

  it('should load skill based on its id on url when component is initialized',
    function() {
      spyOn(SkillEditorStateService, 'loadSkill').and.stub();
      spyOn(UrlService, 'getSkillIdFromUrl').and.returnValue('skill_1');

      ctrl.$onInit();
      expect(SkillEditorStateService.loadSkill).toHaveBeenCalledWith('skill_1');
    });

  it('should get active tab name', function() {
    spyOn(SkillEditorRoutingService, 'getActiveTabName').and.returnValue(
      'questions');
    expect(ctrl.getActiveTabName()).toBe('questions');
  });

  it('should call SkillEditorRoutingService to navigate to main tab',
    function() {
      var routingSpy = spyOn(
        SkillEditorRoutingService, 'navigateToMainTab');
      ctrl.selectMainTab();
      expect(routingSpy).toHaveBeenCalled();
    });

  it('should call SkillEditorRoutingService to navigate to preview tab',
    function() {
      var routingSpy = spyOn(
        SkillEditorRoutingService, 'navigateToPreviewTab');
      ctrl.selectPreviewTab();
      expect(routingSpy).toHaveBeenCalled();
    });

  it('should call open save changes modal if unsaved changes are present',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      var modalSpy = spyOn($uibModal, 'open').and.callThrough();
      ctrl.selectQuestionsTab();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call open save changes modal if unsaved changes are present',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
      var routingSpy = spyOn(
        SkillEditorRoutingService, 'navigateToQuestionsTab').and.callThrough();
      ctrl.selectQuestionsTab();
      expect(routingSpy).toHaveBeenCalled();
    });

  it('should return warnings count for the skill', function() {
    ctrl.skill = SkillObjectFactory.createInterstitialSkill();
    // This is because an interstitial skill has empty rubrics
    // array, and hence there's a warning. See SkillObjectFactory
    // for reference.
    expect(ctrl.getWarningsCount()).toEqual(1);
  });
});
