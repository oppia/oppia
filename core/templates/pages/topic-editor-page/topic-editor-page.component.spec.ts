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
 * @fileoverview Unit tests for topic editor page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/topic-editor-page/topic-editor-page.component.ts');

import { EventEmitter } from '@angular/core';

describe('Topic editor page', function() {
  var ctrl = null;
  var $scope = null;
  var ContextService = null;
  var PageTitleService = null;
  var TopicEditorRoutingService = null;
  var TopicEditorStateService = null;
  var UrlService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    PageTitleService = $injector.get('PageTitleService');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    UrlService = $injector.get('UrlService');

    $scope = $rootScope.$new();
    ctrl = $componentController('topicEditorPage', {
      $scope: $scope
    });
  }));

  it('should load topic based on its id on url when component is initialized' +
    ' and set page title', function() {
    let topicInitializedEventEmitter = new EventEmitter();
    let topicReinitializedEventEmitter = new EventEmitter();
    spyOn(TopicEditorStateService, 'loadTopic').and.callFake(function() {
      topicInitializedEventEmitter.emit();
      topicReinitializedEventEmitter.emit();
    });
    spyOnProperty(TopicEditorStateService,
      'onTopicInitialized').and.returnValue(
      topicInitializedEventEmitter);
    spyOnProperty(TopicEditorStateService,
      'onTopicReinitialized').and.returnValue(
      topicReinitializedEventEmitter);
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(PageTitleService, 'setPageTitle').and.callThrough();

    ctrl.$onInit();

    expect(TopicEditorStateService.loadTopic).toHaveBeenCalledWith('topic_1');
    expect(PageTitleService.setPageTitle).toHaveBeenCalledTimes(2);

    ctrl.$onDestroy();
  });

  it('should get active tab name', function() {
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and.returnValue(
      'questions');
    expect(ctrl.getActiveTabName()).toBe('questions');
  });

  it('should get entity type from context service', function() {
    spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
    expect(ctrl.getEntityType()).toBe('exploration');
  });
});
