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
  var UrlService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    SkillEditorStateService = $injector.get('SkillEditorStateService');
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
});
