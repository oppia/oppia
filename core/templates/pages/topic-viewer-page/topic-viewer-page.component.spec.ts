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
 * @fileoverview Unit tests for topic viewer page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/topic-viewer-page/topic-viewer-page.component.ts');

describe('Topic viewer page', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var AlertsService = null;
  var PageTitleService = null;
  var ReadOnlyTopicObjectFactory = null;
  var TopicViewerBackendApiService = null;
  var UrlService = null;
  var WindowDimensionsService = null;

  var topicName = 'Topic Name';

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    AlertsService = $injector.get('AlertsService');
    PageTitleService = $injector.get('PageTitleService');
    ReadOnlyTopicObjectFactory = $injector.get('ReadOnlyTopicObjectFactory');
    TopicViewerBackendApiService = $injector.get(
      'TopicViewerBackendApiService');
    UrlService = $injector.get('UrlService');
    WindowDimensionsService = $injector.get('WindowDimensionsService');

    $scope = $rootScope.$new();
    ctrl = $componentController('topicViewerPage', {
      $scope: $scope
    });
  }));

  it('should successfully get topic data', function() {
    spyOn(UrlService, 'getAbbrevTopicNameFromLearnerUrl').and.returnValue(
      topicName);
    spyOn(UrlService, 'getClassroomNameFromLearnerUrl').and.returnValue(
      'math');
    var topicDataObject = (
      ReadOnlyTopicObjectFactory.createFromBackendDict({
        topic_id: '1',
        topic_name: 'Topic Name',
        topic_description: 'Topic Description',
        canonical_story_dicts: [{
          id: '2',
          title: 'Story Title',
          node_titles: ['Node title 1', 'Node title 2'],
          thumbnail_filename: '',
          thumbnail_bg_color: '',
          description: 'Story Description',
          story_is_published: true
        }],
        additional_story_dicts: [],
        uncategorized_skill_ids: [],
        subtopics: [],
        degrees_of_mastery: {},
        skill_descriptions: {},
        train_tab_should_be_displayed: true
      }));
    spyOn(TopicViewerBackendApiService, 'fetchTopicData').and.returnValue(
      $q.resolve(topicDataObject));
    spyOn(PageTitleService, 'setPageTitle').and.callThrough();

    ctrl.$onInit();

    expect(ctrl.canonicalStorySummaries).toEqual([]);
    expect(ctrl.activeTab).toBe('info');
    expect(ctrl.topicIsLoading).toBe(true);
    $scope.$apply();

    expect(ctrl.topicId).toBe('1');
    expect(ctrl.topicName).toBe('Topic Name');
    expect(PageTitleService.setPageTitle).toHaveBeenCalledWith(
      topicName + ' - Oppia');
    expect(ctrl.topicDescription).toBe('Topic Description');
    expect(ctrl.canonicalStorySummaries.length).toBe(1);
    expect(ctrl.chapterCount).toBe(2);
    expect(ctrl.degreesOfMastery).toEqual({});
    expect(ctrl.subtopics).toEqual([]);
    expect(ctrl.skillDescriptions).toEqual({});
    expect(ctrl.topicIsLoading).toBe(false);
    expect(ctrl.trainTabShouldBeDisplayed).toBe(true);
  });

  it('should set story tab correctly', function() {
    spyOn(UrlService, 'getAbbrevTopicNameFromLearnerUrl').and.returnValue(
      topicName);
    spyOn(UrlService, 'getClassroomNameFromLearnerUrl').and.returnValue(
      'math');
    spyOn(UrlService, 'getPathname').and.returnValue(
      `/learn/math/${topicName}/story`);
    ctrl.$onInit();
    expect(ctrl.activeTab).toBe('story');
  });

  it('should set revision tab correctly', function() {
    spyOn(UrlService, 'getAbbrevTopicNameFromLearnerUrl').and.returnValue(
      topicName);
    spyOn(UrlService, 'getClassroomNameFromLearnerUrl').and.returnValue(
      'math');
    spyOn(UrlService, 'getPathname').and.returnValue(
      `/learn/math/${topicName}/revision`);
    ctrl.$onInit();
    expect(ctrl.activeTab).toBe('subtopics');
  });

  it('should set practice tab correctly', function() {
    spyOn(UrlService, 'getAbbrevTopicNameFromLearnerUrl').and.returnValue(
      topicName);
    spyOn(UrlService, 'getClassroomNameFromLearnerUrl').and.returnValue(
      'math');
    spyOn(UrlService, 'getPathname').and.returnValue(
      `/learn/math/${topicName}/practice`);
    ctrl.$onInit();
    expect(ctrl.activeTab).toBe('practice');
  });

  it('should switch to info tab if practice tab is hidden', function() {
    spyOn(UrlService, 'getAbbrevTopicNameFromLearnerUrl').and.returnValue(
      topicName);
    spyOn(UrlService, 'getClassroomNameFromLearnerUrl').and.returnValue(
      'math');
    spyOn(UrlService, 'getPathname').and.returnValue(
      `/learn/math/${topicName}/practice`);
    var topicDataObject = (
      ReadOnlyTopicObjectFactory.createFromBackendDict({
        topic_id: '1',
        topic_name: 'Topic Name',
        topic_description: 'Topic Description',
        canonical_story_dicts: [{
          id: '2',
          title: 'Story Title',
          node_titles: ['Node title 1', 'Node title 2'],
          thumbnail_filename: '',
          thumbnail_bg_color: '',
          description: 'Story Description',
          story_is_published: true
        }],
        additional_story_dicts: [],
        uncategorized_skill_ids: [],
        subtopics: [],
        degrees_of_mastery: {},
        skill_descriptions: {},
        train_tab_should_be_displayed: false
      }));
    spyOn(TopicViewerBackendApiService, 'fetchTopicData').and.returnValue(
      $q.resolve(topicDataObject));
    spyOn(PageTitleService, 'setPageTitle').and.callThrough();

    ctrl.$onInit();

    expect(ctrl.canonicalStorySummaries).toEqual([]);
    expect(ctrl.activeTab).toBe('practice');
    $scope.$apply();

    expect(ctrl.trainTabShouldBeDisplayed).toBe(false);
    expect(ctrl.activeTab).toBe('info');
  });

  it('should use reject handler when fetching subtopic data fails',
    function() {
      spyOn(UrlService, 'getAbbrevTopicNameFromLearnerUrl').and.returnValue(
        topicName);
      spyOn(UrlService, 'getClassroomNameFromLearnerUrl').and.returnValue(
        'math');
      spyOn(TopicViewerBackendApiService, 'fetchTopicData').and
        .returnValue(
          $q.reject({
            status: 404
          }));
      spyOn(AlertsService, 'addWarning').and.callThrough();

      ctrl.$onInit();
      $scope.$apply();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get dashboard data');
    });

  it('should get static image url', function() {
    var imagePath = '/path/to/image.png';
    var staticImageUrl = ctrl.getStaticImageUrl(imagePath);

    expect(staticImageUrl).toBe('/assets/images/path/to/image.png');
  });

  it('should check if the view is mobile or not', function() {
    var widthSpy = spyOn(WindowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(400);
    expect(ctrl.checkMobileView()).toBe(true);

    widthSpy.and.returnValue(700);
    expect(ctrl.checkMobileView()).toBe(false);
  });
});
