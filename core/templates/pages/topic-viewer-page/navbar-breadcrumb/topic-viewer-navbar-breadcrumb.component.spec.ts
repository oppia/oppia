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
 * @fileoverview Unit tests for classroom page component.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlService } from 'services/contextual/url.service';
import { TopicViewerBackendApiService } from
  'domain/topic_viewer/topic-viewer-backend-api.service';
import { ReadOnlyTopicObjectFactory } from
  'domain/topic_viewer/read-only-topic-object.factory';

require('pages/topic-viewer-page/navbar-breadcrumb/' +
  'topic-viewer-navbar-breadcrumb.component');

describe('Topic viewer navbar breadcrumb component', () => {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var readOnlyTopicObjectFactory = null;
  var topicViewerBackendApiService = null;
  var urlService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    readOnlyTopicObjectFactory = TestBed.get(ReadOnlyTopicObjectFactory);
    topicViewerBackendApiService = TestBed.get(TopicViewerBackendApiService);
    urlService = TestBed.get(UrlService);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    spyOn(urlService, 'getTopicNameFromLearnerUrl').and.returnValue('topic1');

    $scope = $rootScope.$new();
    ctrl = $componentController('topicViewerNavbarBreadcrumb', {
      $rootScope: $rootScope,
      $scope: $scope,
      UrlService: urlService
    });

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property topicViewerBackendApiService does not have access type get'
    // or 'Property topicViewerBackendApiService does not have access type set'
    // error.
    Object.defineProperty(ctrl, 'topicViewerBackendApiService', {
      get: () => undefined,
      set: () => {}
    });
    spyOnProperty(ctrl, 'topicViewerBackendApiService').and.returnValue(
      topicViewerBackendApiService);
    spyOn(topicViewerBackendApiService, 'fetchTopicData').and.returnValue(
      $q.resolve(readOnlyTopicObjectFactory.createFromBackendDict({
        subtopics: [],
        skill_descriptions: {},
        uncategorized_skill_ids: [],
        degrees_of_mastery: {},
        canonical_story_dicts: [],
        additional_story_dicts: [],
        topic_name: 'Topic Name 1',
        topic_id: 'topic1',
        topic_description: 'Description',
        train_tab_should_be_displayed: false
      })));
  }));

  it('should evaluate data get from backend, set page title and init' +
    ' translation', function() {
    ctrl.$onInit();
    $scope.$apply();

    expect($scope.topicName).toBe('Topic Name 1');
  });
});
