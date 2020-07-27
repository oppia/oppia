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
 * @fileoverview Unit tests for story editor page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

import { EventEmitter } from '@angular/core';

// ^^^ This block is to be removed.

require('pages/story-editor-page/story-editor-page.component.ts');

describe('Story editor page', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var $uibModal = null;
  var PageTitleService = null;
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;
  var UndoRedoService = null;
  var UrlService = null;

  var mockedWindow = {
    open: () => {}
  };
  var story = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockedWindow);
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    PageTitleService = $injector.get('PageTitleService');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');
    UrlService = $injector.get('UrlService');

    story = StoryObjectFactory.createFromBackendDict({
      id: '2',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      story_contents: {
        initial_node_id: '',
        nodes: [],
        next_node_id: ''
      },
      language_code: 'en',
      version: 1,
      corresponding_topic_id: '2',
      thumbnail_bg_color: null,
      thumbnail_filename: null
    });
    spyOn(StoryEditorStateService, 'getStory').and.returnValue(story);

    $scope = $rootScope.$new();
    ctrl = $componentController('storyEditorPage', {
      $scope: $scope
    });
  }));

  it('should load story based on its id on url when component is initialized' +
    ' and set page title', function() {
    let storyInitializedEventEmitter = new EventEmitter();
    let storyReinitializedEventEmitter = new EventEmitter();
    spyOn(StoryEditorStateService, 'loadStory').and.callFake(function() {
      storyInitializedEventEmitter.emit();
      storyReinitializedEventEmitter.emit();
    });
    spyOnProperty(StoryEditorStateService,
      'onStoryInitialized').and.returnValue(
      storyInitializedEventEmitter);
    spyOnProperty(StoryEditorStateService,
      'onStoryReinitialized').and.returnValue(
      storyReinitializedEventEmitter);
    spyOn(UrlService, 'getStoryIdFromUrl').and.returnValue('story_1');
    spyOn(PageTitleService, 'setPageTitle').and.callThrough();

    ctrl.$onInit();

    expect(StoryEditorStateService.loadStory).toHaveBeenCalledWith('story_1');
    expect(PageTitleService.setPageTitle).toHaveBeenCalledTimes(2);
  });

  it('should return to topic editor page when closing confirmation modal',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      ctrl.returnToTopicEditorPage();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

  it('should return to topic editor page when dismissing confirmation modal',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });

      ctrl.returnToTopicEditorPage();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

  it('should open topic editor page when there is no change',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
      spyOn(mockedWindow, 'open').and.callThrough();

      ctrl.returnToTopicEditorPage();
      expect(mockedWindow.open).toHaveBeenCalledWith(
        '/topic_editor/2', '_self');
    });
});
