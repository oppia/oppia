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
 * @fileoverview Unit tests for collection permission card directive.
 */

import { destroyPlatform } from '@angular/core';
import { setupAndGetUpgradedComponentAsync } from 'tests/unit-test-utils';
import { CollectionPermissionsCard } from
  './collection-permissions-card.directive';
import { async } from '@angular/core/testing';
require('./collection-permissions-card.directive.ts');

describe('Collection Permissions Card component', () => {
  var $rootScope = null;
  var ctrl = null;
  var $scope = null;
  let getCollectionRights: jasmine.Spy;
  let hasLoadedCollection: jasmine.Spy;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    getCollectionRights = jasmine.createSpy('getCollectionRightsSpy');
    hasLoadedCollection = jasmine.createSpy('hasLoadedCollectionSpy');
    const mockCollectionEditorStateService = {
      getCollectionRights, hasLoadedCollection
    };
    $provide.value(
      'CollectionEditorStateService', mockCollectionEditorStateService);
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('collectionPermissionsCard', {
      scope: $scope
    });
  }));
  it('should fetch collection rights on initialization.', () => {
    ctrl.$onInit();
    expect(getCollectionRights).toHaveBeenCalled();
  });
  it('should check if the collections have been loaded.', () => {
    ctrl.hasPageLoaded();
    expect(hasLoadedCollection).toHaveBeenCalled();
  });
});

describe('Upgraded component', () => {
  beforeEach(() => destroyPlatform());
  afterEach(() => destroyPlatform());

  it('should create the upgraded component', async(() => {
    setupAndGetUpgradedComponentAsync(
      'collection-permissions-card',
      'collectionPermissionsCard',
      [CollectionPermissionsCard]
    ).then(
      async(textContext) => expect(textContext).toBe('Hello Oppia!')
    );
  }));
});
