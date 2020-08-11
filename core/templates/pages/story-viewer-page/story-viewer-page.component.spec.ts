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
 * @fileoverview Unit tests for storyViewerPage.
 */

import { TestBed } from '@angular/core/testing';
import { StoryViewerBackendApiService } from
  'domain/story_viewer/story-viewer-backend-api.service';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StoryNodeObjectFactory } from 'domain/story/StoryNodeObjectFactory';
import { StoryPlaythroughObjectFactory } from
  'domain/story_viewer/StoryPlaythroughObjectFactory';
import { ReadOnlyStoryNodeObjectFactory } from
  'domain/story_viewer/ReadOnlyStoryNodeObjectFactory';

describe('Story Viewer Page component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var alertsService = null;
  var assetsBackendApiService = null;
  var readOnlyStoryNodeObjectFactory = null;
  var storyNodeObjectFactory = null;
  var storyObjectFactory = null;
  var storyPlaythroughObjectFactory = null;
  var storyViewerBackendApiService = null;
  var urlService = null;

  var storyPlaythrough = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    readOnlyStoryNodeObjectFactory = TestBed.get(
      ReadOnlyStoryNodeObjectFactory);
    storyNodeObjectFactory = TestBed.get(StoryNodeObjectFactory);
    storyObjectFactory = TestBed.get(StoryObjectFactory);
    storyPlaythroughObjectFactory = TestBed.get(StoryPlaythroughObjectFactory);
    storyViewerBackendApiService = TestBed.get(StoryViewerBackendApiService);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    alertsService = $injector.get('AlertsService');
    assetsBackendApiService = $injector.get('AssetsBackendApiService');
    urlService = $injector.get('UrlService');

    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and
      .returnValue('thumbnail-url');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_1');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'clasroom_1');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_1');

    ctrl = $componentController('storyViewerPage', {
      $rootScope: $rootScope,
      AlertsService: alertsService
    });

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property classroomBackendApiService does not have access type get'
    // or 'Property classroomBackendApiService does not have access type set'
    // error.
    Object.defineProperty(ctrl, 'storyViewerBackendApiService', {
      get: () => undefined,
      set: () => {}
    });
    spyOnProperty(ctrl, 'storyViewerBackendApiService').and.returnValue(
      storyViewerBackendApiService);

    storyPlaythrough = storyPlaythroughObjectFactory.createFromBackendDict({
      story_nodes: [{
        id: 'node_1',
        title: 'Title 1',
        description: 'Description 1',
        destination_node_ids: [],
        prerequisite_skill_ids: ['skill_1'],
        acquired_skill_ids: ['skill_2'],
        outline: 'Outline',
        outline_is_finalized: false,
        exploration_id: null,
        exp_summary_dict: {
          category: 'Welcome',
          created_on_msec: 1564183471833.675,
          community_owned: true,
          thumbnail_bg_color: '#992a2b',
          title: 'Welcome to Oppia!',
          num_views: 14897,
          tags: [],
          last_updated_msec: 1571653541705.924,
          human_readable_contributors_summary: {},
          status: 'public',
          language_code: 'en',
          objective: "become familiar with Oppia's capabilities",
          thumbnail_icon_url: '/subjects/Welcome.svg',
          ratings: {
            1: 1,
            2: 1,
            3: 3,
            4: 24,
            5: 46
          },
          id: '0',
          activity_type: 'exploration'
        },
        completed: true,
        thumbnail_bg_color: '#fff',
        thumbnail_filename: 'story.svg'
      }, {
        id: 'node_2',
        title: 'Title 2',
        description: 'Description 2',
        destination_node_ids: [],
        prerequisite_skill_ids: ['skill_1'],
        acquired_skill_ids: ['skill_2'],
        outline: 'Outline',
        outline_is_finalized: false,
        exploration_id: null,
        exp_summary_dict: {
          category: 'Welcome',
          created_on_msec: 1564183471833.675,
          community_owned: true,
          thumbnail_bg_color: '#992a2b',
          title: 'Welcome to Oppia! 2',
          num_views: 14897,
          tags: [],
          last_updated_msec: 1571653541705.924,
          human_readable_contributors_summary: {},
          status: 'public',
          language_code: 'en',
          objective: "become familiar with Oppia's capabilities 2",
          thumbnail_icon_url: '/subjects/Welcome.svg',
          ratings: {
            1: 1,
            2: 1,
            3: 3,
            4: 24,
            5: 46
          },
          id: '0',
          activity_type: 'exploration'
        },
        completed: false,
        thumbnail_bg_color: '#000',
        thumbnail_filename: 'story.svg'
      }],
      story_title: 'Story Title 1',
      story_description: 'Story Description 1',
      topic_name: 'topic_1',
    });
  }));

  it('should get path icon parameters after story data is loaded', function() {
    spyOn(storyViewerBackendApiService, 'fetchStoryData').and.returnValue(
      $q.resolve(storyPlaythrough));
    ctrl.$onInit();
    $rootScope.$apply();

    expect(ctrl.pathIconParameters).toEqual([{
      thumbnailIconUrl: 'thumbnail-url',
      left: '225px',
      top: '35px',
      thumbnailBgColor: '#fff'
    }, {
      thumbnailIconUrl: 'thumbnail-url',
      thumbnailBgColor: '#000'
    }]);
  });

  it('should show warning when fetching story data fails', function() {
    spyOn(alertsService, 'addWarning');
    spyOn(storyViewerBackendApiService, 'fetchStoryData').and.returnValue(
      $q.reject({
        status: 404
      }));
    ctrl.$onInit();
    $rootScope.$apply();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get dashboard data');
    expect(ctrl.pathIconParameters).toEqual([]);
  });

  it('should get complete exploration url when clicking on svg element',
    function() {
      var node = storyNodeObjectFactory.createFromIdAndTitle(
        '1', 'Story node title');
      expect(ctrl.getExplorationUrl(node)).toBe(
        '/explore/null?topic_url_fragment=topic_1&' +
        'classroom_url_fragment=clasroom_1&story_url_fragment=story_1&' +
        'node_id=1');
    });

  it('should get static image url', function() {
    var imagePath = '/path/to/image.png';
    expect(ctrl.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
  });

  it('should show story\'s chapters when story has chapters', function() {
    spyOn(storyViewerBackendApiService, 'fetchStoryData').and.returnValue(
      $q.resolve(storyPlaythrough));

    ctrl.$onInit();
    $rootScope.$apply();

    expect(ctrl.showChapters()).toBe(true);
  });

  it('should not show story\'s chapters when story has no chapters',
    function() {
      spyOn(storyViewerBackendApiService, 'fetchStoryData').and.returnValue(
        $q.resolve(storyPlaythroughObjectFactory.createFromBackendDict({
          story_nodes: [],
          story_title: 'Story Title 1',
          story_description: 'Story Description 1',
          topic_name: 'topic_1',
        })));

      ctrl.$onInit();
      $rootScope.$apply();

      expect(ctrl.showChapters()).toBe(false);
    });

  it('should not show story\'s chapters when story data is not loaded',
    function() {
      ctrl.$onInit();

      expect(ctrl.showChapters()).toBe(false);
    });

  it('should not hide chapter when it\'s part of story chapters', function() {
    spyOn(storyViewerBackendApiService, 'fetchStoryData').and.returnValue(
      $q.resolve(storyPlaythrough));

    ctrl.$onInit();
    $rootScope.$apply();

    var node = readOnlyStoryNodeObjectFactory.createFromBackendDict({
      id: 'node_2',
      title: 'Title 2',
      description: 'Description 2',
      destination_node_ids: [],
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      outline: 'Outline',
      outline_is_finalized: false,
      exploration_id: null,
      exp_summary_dict: {
        category: 'Welcome',
        created_on_msec: 1564183471833.675,
        community_owned: true,
        thumbnail_bg_color: '#992a2b',
        title: 'Welcome to Oppia! 2',
        num_views: 14897,
        tags: [],
        last_updated_msec: 1571653541705.924,
        human_readable_contributors_summary: {},
        status: 'public',
        language_code: 'en',
        objective: "become familiar with Oppia's capabilities 2",
        thumbnail_icon_url: '/subjects/Welcome.svg',
        ratings: {
          1: 1,
          2: 1,
          3: 3,
          4: 24,
          5: 46
        },
        id: '0',
        activity_type: 'exploration'
      },
      completed: false,
      thumbnail_bg_color: '#000',
      thumbnail_filename: 'story.svg'
    });
    expect(ctrl.isChapterLocked(node)).toBe(false);
  });

  it('should not hide chapter when it\'s completed', function() {
    spyOn(storyViewerBackendApiService, 'fetchStoryData').and.returnValue(
      $q.resolve(storyPlaythrough));

    ctrl.$onInit();
    $rootScope.$apply();

    var node = readOnlyStoryNodeObjectFactory.createFromBackendDict({
      id: 'node_3',
      title: 'Title 2',
      description: 'Description 2',
      destination_node_ids: [],
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      outline: 'Outline',
      outline_is_finalized: false,
      exploration_id: null,
      exp_summary_dict: {
        category: 'Welcome',
        created_on_msec: 1564183471833.675,
        community_owned: true,
        thumbnail_bg_color: '#992a2b',
        title: 'Welcome to Oppia! 2',
        num_views: 14897,
        tags: [],
        last_updated_msec: 1571653541705.924,
        human_readable_contributors_summary: {},
        status: 'public',
        language_code: 'en',
        objective: "become familiar with Oppia's capabilities 2",
        thumbnail_icon_url: '/subjects/Welcome.svg',
        ratings: {
          1: 1,
          2: 1,
          3: 3,
          4: 24,
          5: 46
        },
        id: '0',
        activity_type: 'exploration'
      },
      completed: true,
      thumbnail_bg_color: '#000',
      thumbnail_filename: 'story.svg'
    });
    expect(ctrl.isChapterLocked(node)).toBe(false);
  });

  it('should hide chapter when it\'s not part of story chapters and' +
    ' it\'s not completed', function() {
    spyOn(storyViewerBackendApiService, 'fetchStoryData').and.returnValue(
      $q.resolve(storyPlaythrough));

    ctrl.$onInit();
    $rootScope.$apply();

    var node = readOnlyStoryNodeObjectFactory.createFromBackendDict({
      id: 'node_3',
      title: 'Title 2',
      description: 'Description 2',
      destination_node_ids: [],
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      outline: 'Outline',
      outline_is_finalized: false,
      exploration_id: null,
      exp_summary_dict: {
        category: 'Welcome',
        created_on_msec: 1564183471833.675,
        community_owned: true,
        thumbnail_bg_color: '#992a2b',
        title: 'Welcome to Oppia! 2',
        num_views: 14897,
        tags: [],
        last_updated_msec: 1571653541705.924,
        human_readable_contributors_summary: {},
        status: 'public',
        language_code: 'en',
        objective: "become familiar with Oppia's capabilities 2",
        thumbnail_icon_url: '/subjects/Welcome.svg',
        ratings: {
          1: 1,
          2: 1,
          3: 3,
          4: 24,
          5: 46
        },
        id: '0',
        activity_type: 'exploration'
      },
      completed: false,
      thumbnail_bg_color: '#000',
      thumbnail_filename: 'story.svg'
    });
    expect(ctrl.isChapterLocked(node)).toBe(true);
  });
});
