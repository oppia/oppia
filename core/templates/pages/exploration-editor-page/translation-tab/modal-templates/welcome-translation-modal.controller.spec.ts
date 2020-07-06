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
 * @fileoverview Unit tests for WelcomeTranslationModalController.
 */

import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ANGULAR_SERVICES, ANGULAR_SERVICES_NAMES } from
  'tests/angular-services.index';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Welcome Translation Modal Controller', function() {
  let $scope = null;
  let $uibModalInstance = null;
  let ContextService = null;
  let SiteAnalyticsService = null;

  const explorationId = 'exp1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [...ANGULAR_SERVICES],
      schemas: [NO_ERRORS_SCHEMA]
    });
  });

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    for (let i in ANGULAR_SERVICES) {
      $provide.value(ANGULAR_SERVICES_NAMES[i],
        TestBed.get(ANGULAR_SERVICES[i]));
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    const $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(ContextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(SiteAnalyticsService, 'registerTutorialModalOpenEvent').and
      .callThrough();

    $scope = $rootScope.$new();
    $controller('WelcomeTranslationModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
  }));

  it('should init the constiables', function() {
    expect($scope.explorationId).toBe(explorationId);
    expect(SiteAnalyticsService.registerTutorialModalOpenEvent)
      .toHaveBeenCalledWith(explorationId);
    expect($scope.translationWelcomeImgUrl).toBe(
      '/assets/images/general/editor_welcome.svg');
  });
});
