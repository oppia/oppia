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
 * @fileoverview Unit tests for exploration player page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.

import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

import { TestBed } from '@angular/core/testing';

import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';

require('pages/exploration-player-page/exploration-player-page.component.ts');

describe('Exploration player page', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var ContextService = null;
  var PageTitleService = null;
  var ReadOnlyExplorationBackendApiService = null;

  var explorationId = 'exp1';
  var exploration = {
    title: 'Exploration Title',
    objective: 'Exploration Objective',
  };

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'KeyboardShortcutService',
      TestBed.get(KeyboardShortcutService));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    PageTitleService = $injector.get('PageTitleService');
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationPlayerPage', {
      $scope: $scope
    });
  }));

  it('should load skill based on its id on url when component is initialized' +
    ' and set angular element content property based on the exploration',
  function() {
    spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(ReadOnlyExplorationBackendApiService, 'fetchExplorationAsync').and
      .returnValue($q.resolve({
        exploration: exploration
      }));
    spyOn(PageTitleService, 'setPageTitle').and.callThrough();

    var angularElementSpy = spyOn(angular, 'element');

    var elementNameItemProp = $('<div>');
    angularElementSpy.withArgs(
      'meta[itemprop="name"]').and.returnValue(elementNameItemProp);

    var elementDescriptionItemProp = $('<div>');
    angularElementSpy.withArgs(
      'meta[itemprop="description"]').and.returnValue(
      elementDescriptionItemProp);

    var elementTitleProperty = $('<div>');
    angularElementSpy.withArgs(
      'meta[property="og:title"]').and.returnValue(elementTitleProperty);

    var elementDescriptionProperty = $('<div>');
    angularElementSpy.withArgs(
      'meta[property="og:description"]').and.returnValue(
      elementDescriptionProperty);

    ctrl.$onInit();
    $scope.$apply();

    expect(PageTitleService.setPageTitle).toHaveBeenCalledWith(
      'Exploration Title - Oppia');
    expect(elementNameItemProp.attr('content')).toBe(exploration.title);
    expect(elementDescriptionItemProp.attr('content')).toBe(
      exploration.objective);
    expect(elementTitleProperty.attr('content')).toBe(exploration.title);
    expect(elementDescriptionProperty.attr('content')).toBe(
      exploration.objective);
  });
});
