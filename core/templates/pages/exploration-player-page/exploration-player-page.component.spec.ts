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
import 'mousetrap';

import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/exploration-player-page/exploration-player-page.component.ts');
require(
  'pages/exploration-player-page/services/window-wrapper-message.service.ts');

describe('Exploration player page', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var ContextService = null;
  var PageTitleService = null;
  var ReadOnlyExplorationBackendApiService = null;
  var CommandExecutorService = null;
  var WindowWrapperMessageService = null;
  var skipButton = document.createElement('button');
  var nextButton = document.createElement('button');
  var continueToNextCardButton = document.createElement('button');
  var continueButton = document.createElement('button');
  var backButton = document.createElement('button');

  var explorationId = 'exp1';
  var exploration = {
    title: 'Exploration Title',
    objective: 'Exploration Objective',
  };

  beforeEach(() => {
    skipButton.setAttribute('id', 'skipToMainContentId');
    backButton.setAttribute('id', 'backButtonId');
    nextButton.setAttribute('class', 'protractor-test-next-button');
    continueButton.setAttribute('class', 'protractor-test-continue-button');
    continueToNextCardButton.setAttribute(
      'class', 'protractor-test-continue-to-next-card-button');
    document.body.append(skipButton);
    document.body.append(continueButton);
    document.body.append(backButton);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    PageTitleService = $injector.get('PageTitleService');
    CommandExecutorService = $injector.get('CommandExecutorService');
    WindowWrapperMessageService = $injector.get(
      'WindowWrapperMessageService');
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationPlayerPage', {
      $scope: $scope
    });
    spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);
  }));

  it('should load skill based on its id on url when component is initialized' +
    ' and set angular element content property based on the exploration',
  function() {
    spyOn(ReadOnlyExplorationBackendApiService, 'fetchExploration').and
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

    Mousetrap.trigger('s');
    expect(skipButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('k');
    expect(backButton.isEqualNode(document.activeElement));

    Mousetrap.trigger('j');
    expect(continueButton.isEqualNode(document.activeElement));

    document.body.append(continueToNextCardButton);
    Mousetrap.trigger('j');
    expect(continueToNextCardButton.isEqualNode(document.activeElement));

    document.body.append(nextButton);
    Mousetrap.trigger('j');
    expect(nextButton.isEqualNode(document.activeElement));

    expect(PageTitleService.setPageTitle).toHaveBeenCalledWith(
      'Exploration Title - Oppia');
    expect(elementNameItemProp.attr('content')).toBe(exploration.title);
    expect(elementDescriptionItemProp.attr('content')).toBe(
      exploration.objective);
    expect(elementTitleProperty.attr('content')).toBe(exploration.title);
    expect(elementDescriptionProperty.attr('content')).toBe(
      exploration.objective);
  });

  it('should initialize command executor service',
    function() {
      WindowWrapperMessageService.getLocationHref =
      jasmine.createSpy('parentMessage spy').and.returnValue(
        'https://www.oppia.org/exploration/embed/fake?' +
        'secret_hostname=testSecret');
      CommandExecutorService.initialize = jasmine.createSpy(
        'outerFrameEvents spy');

      ctrl.$onInit();
      $scope.$apply();

      expect(CommandExecutorService.initialize)
        .toHaveBeenCalled();
    });

  it('should indicate readiness for parent to send host state' +
    ' through command executor sendParentReadyState method',
  function() {
    WindowWrapperMessageService.getLocationHref =
    jasmine.createSpy('parentMessage spy').and.returnValue(
      'https://www.oppia.org/exploration/embed/fake?' +
      'secret_hostname=testSecret');
    CommandExecutorService.sendParentReadyState = jasmine.createSpy(
      'sendParentReadyState spy');

    ctrl.$onInit();
    $scope.$apply();

    expect(CommandExecutorService.sendParentReadyState)
      .toHaveBeenCalled();
  });
});
