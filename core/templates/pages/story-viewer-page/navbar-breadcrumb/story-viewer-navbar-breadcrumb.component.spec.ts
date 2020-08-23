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
  var urlService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    urlService = $injector.get('UrlService');

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic1');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom1');

    $rootScope = $rootScope.$new();
    ctrl = $componentController('storyViewerNavbarBreadcrumb', {
      $rootScope: $rootScope
    });
    ctrl.$onInit();
  }));

  it('should get topic url when story data is already loaded', function() {
    $rootScope.$broadcast('storyData', {
      topicName: 'topic_1',
      storyTitle: 'Story title'
    });

    expect(ctrl.getTopicUrl()).toBe('/learn/classroom1/topic1/story');
  });
});
