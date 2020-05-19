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
  var $scope, ctrl;
  var $httpBackend = null;
  var $uibModal = null;
  var directive;
  var TOPICS_AND_SKILLS_DASHBOARD_DATA_URL =
      '/topics_and_skills_dashboard/data';
  var SAMPLE_TOPIC_ID = 'hyuy4GUlvTqJ';
  var sampleDataResults = {
    topic_summary_dicts: [{
      id: SAMPLE_TOPIC_ID,
      name: 'Sample Name',
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
    untriaged_skill_summary_dicts: [],
    can_create_topic: true,
    can_create_skill: true
  };
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {
    $httpBackend = $injector.get('$httpBackend');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    $httpBackend = $injector.get('$httpBackend');
    directive = $injector.get('topicsAndSkillsDashboardPageDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });
    ctrl.$onInit();
  }));


  it('should initialize the variables', () => {
    const filterOptions = {sort: '',
      keywords: '',
      category: '',
      status: ''};
    expect(2).toEqual(2);
    expect(ctrl.pageNumber).toEqual(0);
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.itemsPerPage).toEqual(10);
    expect(ctrl.skillPageNumber).toEqual(0);
    expect(ctrl.selectedIndex).toEqual(null);
    expect(ctrl.itemsPerPageChoice).toEqual([10, 15, 20]);
    expect(ctrl.categories).toEqual(['Mathematics']);
    expect(ctrl.filterOptions).toEqual(filterOptions);
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
  });

  it('Should init the dashboard and fetch data', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    ctrl._initDashboard(false);
    $httpBackend.flush();
    expect(ctrl.activeTab).toEqual('topics');
    expect(ctrl.totalTopicSummaries).toEqual(
      sampleDataResults.topic_summary_dicts);
    expect(ctrl.untriagedSkillSummaries).toEqual([]);
    expect(ctrl.totalCount).toEqual(1);
    expect(ctrl.userCanCreateTopic).toEqual(true);
    expect(ctrl.userCanCreateSkill).toEqual(true);
  });

  it('should set the active tab', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    ctrl._initDashboard(false);
    $httpBackend.flush();
    expect(ctrl.activeTab).toEqual('topics');
    ctrl.setActiveTab(ctrl.TAB_NAME_UNTRIAGED_SKILLS);
    expect(ctrl.activeTab).toEqual('untriagedSkills');
    ctrl.setActiveTab(ctrl.TAB_NAME_TOPICS);
    expect(ctrl.activeTab).toEqual('topics');
  });

  it('should paginate', function() {
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    ctrl._initDashboard(false);
    $httpBackend.flush();
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);
    ctrl.paginationHandler(4);
    expect(ctrl.topicPageNumber).toEqual(4);
    expect(ctrl.pageNumber).toEqual(4);
  });

  it('should open call createTopic Service ', function() {
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    ctrl.createTopic();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should create open Create Skill modal', function() {
    var modalSpy = spyOn($uibModal, 'open').and.callThrough();
    ctrl.createSkill();
    expect(modalSpy).toHaveBeenCalled();
  });
  it('should navigate the page', function() {
    var totalCount = 50;
    var itemsPerPage = 10;
    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    ctrl._initDashboard(false);
    $httpBackend.flush();

    expect(ctrl.activeTab).toEqual('topics');

    ctrl.totalCount = totalCount;
    ctrl.itemsPerPage = itemsPerPage;

    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);

    ctrl.changePage('next_page');
    expect(ctrl.topicPageNumber).toEqual(1);
    expect(ctrl.pageNumber).toEqual(1);

    ctrl.changePage('next_page');
    expect(ctrl.topicPageNumber).toEqual(2);
    expect(ctrl.pageNumber).toEqual(2);

    ctrl.changePage('prev_page');
    expect(ctrl.topicPageNumber).toEqual(1);
    expect(ctrl.pageNumber).toEqual(1);

    ctrl.changePage('prev_page');
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);

    ctrl.changePage('prev_page');
    expect(ctrl.topicPageNumber).toEqual(0);
    expect(ctrl.pageNumber).toEqual(0);
  });

  it('should reset the filters', function() {
    const filterOptions = {
      sort: '',
      keywords: '',
      category: '',
      status: '',
    };
    expect(ctrl.filterOptions).toEqual(filterOptions);
    ctrl.filterOptions.sort = 'sort1';
    ctrl.filterOptions.keywords = 'keywords1';
    ctrl.filterOptions.category = 'category1';
    ctrl.filterOptions.status = 'status1';
    ctrl.resetFilters();
    expect(ctrl.filterOptions).toEqual(filterOptions);
  });
});
