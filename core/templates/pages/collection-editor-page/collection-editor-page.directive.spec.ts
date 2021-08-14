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
 * @fileoverview Unit tests for the collection editor page directive.
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Collection Editor Page', () => {
  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let directive = null;
  let CollectionEditorStateService = null;
  let PageTitleService = null;
  let RouterService = null;
  let UrlService = null;

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    CollectionEditorStateService = $injector.get(
      'CollectionEditorStateService');
    UrlService = $injector.get('UrlService');
    RouterService = $injector.get('RouterService');
    PageTitleService = $injector.get('PageTitleService');
    $scope = $rootScope.$new();

    directive = $injector.get('collectionEditorPageDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });

    spyOn(CollectionEditorStateService, 'loadCollection')
      .and.callFake((url, callback) => {
        callback();
      });
    spyOn(UrlService, 'getCollectionIdFromEditorUrl').and.returnValue(
      'collection/edit/1'
    );
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should load collections on initialization', () => {
    ctrl.$onInit();

    expect(CollectionEditorStateService.loadCollection).toHaveBeenCalled();
  });

  it('should set title when collection is initialized', () => {
    let onCollectionInitializedEmitter = new EventEmitter();
    spyOnProperty(CollectionEditorStateService, 'onCollectionInitialized')
      .and.returnValue(onCollectionInitializedEmitter);
    spyOn(CollectionEditorStateService, 'getCollection').and.returnValues({
      getTitle: () => 'title'
    }, {
      getTitle: () => undefined
    });
    spyOn(PageTitleService, 'setPageTitle');

    ctrl.$onInit();

    onCollectionInitializedEmitter.emit();
    $scope.$apply();

    expect(PageTitleService.setPageTitle)
      .toHaveBeenCalledWith('title - Oppia Editor');

    // When title does not exist. Sets default page title.
    onCollectionInitializedEmitter.emit();
    $scope.$apply();

    expect(PageTitleService.setPageTitle)
      .toHaveBeenCalledWith('Untitled Collection - Oppia Editor');
  });

  it('should get active tab\'s name', () => {
    spyOn(RouterService, 'getActiveTabName').and.returnValue('Statistics');

    expect(ctrl.getActiveTabName()).toBe('Statistics');
  });
});
