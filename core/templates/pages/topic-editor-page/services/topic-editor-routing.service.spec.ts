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
 * @fileoverview Unit tests for TopicEditorRoutingService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/topic-editor-page/services/topic-editor-routing.service.ts');

describe('Topic editor routing service', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var $rootScope = null;
  var $location = null;
  var $window = null;
  var TopicEditorRoutingService = null;

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $location = $injector.get('$location');
    $window = $injector.get('$window');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
  }));

  it('should return the default active tab name', function() {
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual('main');
  });

  it('should navigate to different tabs', function() {
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual('main');

    TopicEditorRoutingService.navigateToSubtopicPreviewTab(1);
    $rootScope.$apply();
    expect(
      TopicEditorRoutingService.getActiveTabName()).toEqual('subtopic_preview');

    TopicEditorRoutingService.navigateToSubtopicEditorWithId(1);
    $rootScope.$apply();
    expect(
      TopicEditorRoutingService.getActiveTabName()).toEqual('subtopic_editor');

    TopicEditorRoutingService.navigateToQuestionsTab();
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual('questions');

    TopicEditorRoutingService.navigateToMainTab();
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual('main');

    TopicEditorRoutingService.navigateToTopicPreviewTab();
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual(
      'topic_preview');
  });

  it('should handle calls with unexpect paths', function() {
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual('main');

    $location.path();
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual('main');

    $location.path('');
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getActiveTabName()).toEqual('main');
  });

  it('should navigate to skill editor', function() {
    spyOn($window, 'open').and.callFake(function() {
      return true;
    });
    TopicEditorRoutingService.navigateToSkillEditorWithId('10');
    expect($window.open).toHaveBeenCalled();
    expect($window.open).toHaveBeenCalledWith('/skill_editor/10');
  });

  it('should return last tab visited', function() {
    TopicEditorRoutingService.navigateToSubtopicEditorWithId(1);
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getLastTabVisited()).toEqual('subtopic');
    TopicEditorRoutingService.navigateToMainTab();
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getLastTabVisited()).toEqual('topic');
  });

  it('should return last visited subtopic id', function() {
    TopicEditorRoutingService.navigateToSubtopicPreviewTab(1);
    $rootScope.$apply();
    TopicEditorRoutingService.navigateToQuestionsTab();
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getLastSubtopicIdVisited()).toEqual(1);

    TopicEditorRoutingService.navigateToSubtopicPreviewTab(5);
    $rootScope.$apply();
    TopicEditorRoutingService.navigateToQuestionsTab();
    $rootScope.$apply();
    expect(TopicEditorRoutingService.getLastSubtopicIdVisited()).toEqual(5);
  });
});
