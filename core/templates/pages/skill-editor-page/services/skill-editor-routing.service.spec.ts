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
 * @fileoverview Unit tests for SkillEditorRoutingService.
 */

require('pages/skill-editor-page/services/skill-editor-routing.service');

describe('Skill Editor Routing Service', function() {
  var sers = null;
  var $rootScope = null;
  var $location = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    sers = $injector.get('SkillEditorRoutingService');
    $rootScope = $injector.get('$rootScope');
    $location = $injector.get('$location');
  }));

  it('should handler calls with unexpect paths', function() {
    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');
    $location.path();
    $rootScope.$apply();
    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');
    $location.path('');
    $rootScope.$apply();
    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');
  });

  it('should toggle between main tab and questions tab', function() {
    sers.navigateToQuestionsTab();
    $rootScope.$apply();
    expect(sers.getActiveTabName()).toBe('questions');
    expect(sers.getTabStatuses()).toBe('questions');
    sers.navigateToMainTab();
    $rootScope.$apply();
    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');
  });
});
