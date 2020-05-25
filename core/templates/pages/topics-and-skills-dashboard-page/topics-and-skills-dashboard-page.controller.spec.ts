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
 * @fileoverview Unit tests for the topics and skills dashboard page.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('Topics and Skills Dashboard Page', function() {
  var $scope = null, ctrl = null;
  var $httpBackend = null;
  var $uibModal = null;
  var directive = null;
  var $rootScope = null;
  var $q = null;
  var DashboardFilterObjectFactory = null;
  var TOPICS_AND_SKILLS_DASHBOARD_DATA_URL =
      '/topics_and_skills_dashboard/data';
  var SAMPLE_TOPIC_ID = 'hyuy4GUlvTqJ';
  var AlertsService = null;
  var sampleDataResults = {
    topic_summary_dicts: [{
      id: SAMPLE_TOPIC_ID,
      name: 'Sample Name',
      category: 'Mathematics',
      language_code: 'en',
      version: 1,
      canonical_story_count: 3,
      additional_story_count: 0,
      uncategorized_skill_count: 3,
      subtopic_count: 3,
      topic_model_created_on: 1466178691847.67,
      topic_model_last_updated: 1466178759209.839
    }],
    skill_summary_dicts: [],
    untriaged_skill_summary_dicts: [{
      id: SAMPLE_TOPIC_ID,
      name: 'Sample Name',
      language_code: 'en'
    }],
    can_create_topic: true,
    can_create_skill: true,
    can_delete_topic: true,
    can_delete_skill: true
  };
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
    $provide.factory(
      'SkillCreationService', ['$http', $http => {
        return {
          createNewSkill: (a, b, c, d) => $http.post(
            '/skill_editor_handler/create_new')
        };
      }]);

    $provide.factory(
      'TopicsAndSkillsDashboardBackendApiService', ['$http', $http => {
        return {
          fetchDashboardData: () => $http.get(
            '/topics_and_skills_dashboard/data')
        };
      }]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    $httpBackend = $injector.get('$httpBackend');
    AlertsService = $injector.get('AlertsService');
    $q = $injector.get('$q');
    DashboardFilterObjectFactory = $injector.get(
      'DashboardFilterObjectFactory');

    directive = $injector.get('topicsAndSkillsDashboardPageDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
    });
    ctrl.$onInit();
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('Should init the dashboard and fetch data', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();

    const filterObject = DashboardFilterObjectFactory.createDefault();
    expect(ctrl.pageNumber).toEqual(0);
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.itemsPerPage).toEqual(10);
    expect(ctrl.skillPageNumber).toEqual(0);
    expect(ctrl.selectedIndex).toEqual(null);
    expect(ctrl.itemsPerPageChoice).toEqual([10, 15, 20]);
    expect(ctrl.categories).toEqual(['Mathematics']);
    expect(ctrl.filterObject).toEqual(filterObject);
    enum ESortOptions {
      IncreasingCreatedOn = 'Newly Created',
      DecreasingCreatedOn = 'Oldest Created',
      IncreasingUpdatedOn = 'Most Recently Updated',
      DecreasingUpdatedOn = 'Least Recently Updated',
    }

    enum EPublishedOptions {
      Published = 'Published',
      NotPublished = 'Not Published'
    }
    expect(ctrl.sortOptions).toEqual(ESortOptions);
    expect(ctrl.statusOptions).toEqual(EPublishedOptions);

    expect(ctrl.activeTab).toEqual('topics');
    expect(ctrl.totalTopicSummaries).toEqual(
      sampleDataResults.topic_summary_dicts);
    expect(ctrl.untriagedSkillSummaries).toEqual(
      sampleDataResults.untriaged_skill_summary_dicts);
    expect(ctrl.totalEntityCountToDisplay).toEqual(1);
    expect(ctrl.userCanCreateTopic).toEqual(true);
    expect(ctrl.userCanCreateSkill).toEqual(true);
  });

  it('should set the active tab', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    expect(ctrl.activeTab).toEqual('topics');
    ctrl.setActiveTab(ctrl.TAB_NAME_UNTRIAGED_SKILLS);
    expect(ctrl.activeTab).toEqual('untriagedSkills');
    ctrl.setActiveTab(ctrl.TAB_NAME_TOPICS);
    expect(ctrl.activeTab).toEqual('topics');
  });

  it('should go to Page Number', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);
    ctrl.goToPageNumber(4);
    expect(ctrl.topicPageNumber).toEqual(4);
    expect(ctrl.pageNumber).toEqual(4);
  });

  it('should open the create Topic Modal', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    ctrl.createTopic();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should open Create Skill Modal', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    ctrl.createSkill();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call the skill creation service', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();

    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        description: 'Description',
        rubrics: 'Easy',
        explanation: 'Explanation'
      })
    });

    $httpBackend.expectPOST('/skill_editor_handler/create_new').respond(200);
    ctrl.createSkill();
    $httpBackend.flush();
  });

  it('should navigate the page', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    var totalEntityCountToDisplay = 50;
    var itemsPerPage = 10;

    expect(ctrl.activeTab).toEqual('topics');

    ctrl.totalEntityCountToDisplay = totalEntityCountToDisplay;
    ctrl.itemsPerPage = itemsPerPage;

    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);

    ctrl.changePageByOne('next_page');
    expect(ctrl.topicPageNumber).toEqual(1);
    expect(ctrl.pageNumber).toEqual(1);

    ctrl.changePageByOne('next_page');
    expect(ctrl.topicPageNumber).toEqual(2);
    expect(ctrl.pageNumber).toEqual(2);

    ctrl.changePageByOne('prev_page');
    expect(ctrl.topicPageNumber).toEqual(1);
    expect(ctrl.pageNumber).toEqual(1);

    ctrl.changePageByOne('prev_page');
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);

    ctrl.changePageByOne('prev_page');
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);
  });

  it('should reset the filters', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    const filterObject = DashboardFilterObjectFactory.createDefault();
    expect(ctrl.filterObject).toEqual(filterObject);
    ctrl.filterObject.sort = 'sort1';
    ctrl.filterObject.keywords = 'keywords1';
    ctrl.filterObject.category = 'category1';
    ctrl.filterObject.status = 'status1';
    ctrl.resetFilters();
    expect(ctrl.filterObject).toEqual(filterObject);
  });

  it('should return number from 1 to the range specified', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    var array = ctrl.generateNumbersTillRange(5);
    expect(array).toEqual([0, 1, 2, 3, 4]);
  });

  it('should apply the filters', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    const topic1 = {
      is_published: true, name: 'Alpha', category: 'Mathematics',
      description: 'Alpha description',
    };
    const topic2 = {
      is_published: false, name: 'Alpha2', category: 'Mathematics',
      description: 'Alp2 desc',
    };
    const topic3 = {
      is_published: false, name: 'Beta', category: 'Mathematics',
      description: 'Beta description',
    };
    const topic4 = {
      is_published: true, name: 'Gamma', category: 'Mathematics',
      description: 'Gamma description',
    };
    ctrl.filterObject = DashboardFilterObjectFactory.createDefault();
    ctrl.totalTopicSummaries = [topic1, topic2, topic3, topic4];

    ctrl.applyFilters();
    expect(ctrl.topicSummaries).toEqual(ctrl.totalTopicSummaries);
    expect(ctrl.displayedTopicSummaries).toEqual(ctrl.totalTopicSummaries);
    expect(ctrl.currentCount).toEqual(4);
    expect(ctrl.pageNumber).toEqual(0);

    ctrl.filterObject.status = 'Published';
    ctrl.applyFilters();
    expect(ctrl.topicSummaries).toEqual([topic1, topic4]);
    expect(ctrl.displayedTopicSummaries).toEqual([topic1, topic4]);
    expect(ctrl.currentCount).toEqual(2);
    expect(ctrl.pageNumber).toEqual(0);

    ctrl.filterObject.keywords = 'gamm';
    ctrl.applyFilters();
    expect(ctrl.topicSummaries).toEqual([topic4]);
    expect(ctrl.displayedTopicSummaries).toEqual([topic4]);
    expect(ctrl.currentCount).toEqual(1);
    expect(ctrl.pageNumber).toEqual(0);
  });

  it('should show warning if fetch dashboard data failed with fatal error',
    function() {
      var alertSpy = spyOn(AlertsService, 'addWarning').and.callThrough();
      $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
        400);
      $httpBackend.flush();

      expect(alertSpy).toHaveBeenCalled();
    });

  it('should show warning if fetch dashboard data failed with fatal error',
    function() {
      var alertSpy = spyOn(AlertsService, 'addWarning').and.callThrough();
      $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
        402);
      $httpBackend.flush();

      expect(alertSpy).toHaveBeenCalledWith(
        'Unexpected error code from the server.');
    });

  it('should change active tab to skills if topic summaries are null',
    function() {
      var sampleDataResults2 = {
        topic_summary_dicts: [],
        skill_summary_dicts: [],
        untriaged_skill_summary_dicts: [{
          id: SAMPLE_TOPIC_ID,
          name: 'Sample Name',
          language_code: 'en'
        }],
        can_create_topic: true,
        can_create_skill: true
      };
      $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
        sampleDataResults2);
      $httpBackend.flush();
      expect(ctrl.activeTab).toEqual('untriagedSkills');
    });

  it('should call goToPageNumber when changeItemsPerPage is called',
    function() {
      var changePageSpy = spyOn(ctrl, 'goToPageNumber');
      ctrl.changeItemsPerPage();
      expect(changePageSpy).toHaveBeenCalledWith(0);
    });

  it('should call initDashboard on reinitialized event', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    $httpBackend.flush();
    var initDashboardSpy = spyOn(ctrl, '_initDashboard');
    $rootScope.$broadcast('topicsAndSkillsDashboardReinitialized');
    expect(initDashboardSpy).toHaveBeenCalled();
  });
});
