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
 * @fileoverview Unit tests for storyViewerNavbarBreadcrumb.
 */

describe('Story viewer navbar breadcrumb component', function() {
  var ctrl = null;
  var $rootScope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');

    $rootScope = $rootScope.$new();
    ctrl = $componentController('storyViewerNavbarBreadcrumb', {
      $rootScope: $rootScope
    });
    ctrl.$onInit();
  }));

  it('should not get topic url when story data is not loaded yet', function() {
    expect(function() {
      ctrl.getTopicUrl();
    }).toThrowError(
      'Every parameter passed into interpolateUrl must have' +
      ' string values, but received: {topic_name: undefined}');
  });

  it('should get topic url when story data is already loaded', function() {
    $rootScope.$broadcast('storyData', {
      topicName: 'topic_1',
      storyTitle: 'Story title'
    });

    expect(ctrl.getTopicUrl()).toBe('/topic/topic_1');
  });
});
