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
 * @fileoverview Unit tests for the topics and skills dashboard controller.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.component.ts');

describe('Topics and Skills Dashboard Page', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var $scope = null, ctrl = null;
  var $uibModal = null;
  var directive = null;
  var $rootScope = null;
  var $q = null;
  var $timeout = null;
  var TopicsAndSkillsDashboardBackendApiService = null;
  var WindowDimensionsService = null;
  var TopicsAndSkillsDashboardFilterObjectFactory = null;
  var SAMPLE_TOPIC_ID = 'hyuy4GUlvTqJ';
  var AlertsService = null;

  describe('when backend dict contains topics', function() {
    var sampleDataResults = {
      topic_summary_dicts: [{
        id: SAMPLE_TOPIC_ID,
        name: 'Sample Name',
        classroom: 'Math',
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
      all_classroom_names: ['math'],
      can_create_topic: true,
      can_create_skill: true,
      can_delete_topic: true,
      can_delete_skill: true
    };
    var SkillCreationService;

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $timeout = $injector.get('$timeout');
      $uibModal = $injector.get('$uibModal');
      AlertsService = $injector.get('AlertsService');
      WindowDimensionsService = $injector.get('WindowDimensionsService');
      $q = $injector.get('$q');
      TopicsAndSkillsDashboardFilterObjectFactory = $injector.get(
        'TopicsAndSkillsDashboardFilterObjectFactory');
      TopicsAndSkillsDashboardBackendApiService = $injector.get(
        'TopicsAndSkillsDashboardBackendApiService');
      var MockTopicsAndSkillsDashboardBackendApiService = {
        fetchDashboardData: () => {
          var deferred = $q.defer();
          deferred.resolve(sampleDataResults);
          return deferred.promise;
        },
        fetchSkillsDashboardData: () => {
          var deferred = $q.defer();
          deferred.resolve(sampleDataResults);
          return deferred.promise;
        }
      };
      var MockWindowDimensionsService = {
        isWindowNarrow: () => false
      };
      SkillCreationService = $injector.get('SkillCreationService');

      ctrl = $componentController('topicsAndSkillsDashboardPage', {
        $scope: $scope,
        WindowDimensionsService: MockWindowDimensionsService,
        TopicsAndSkillsDashboardBackendApiService:
        MockTopicsAndSkillsDashboardBackendApiService
      });

      ctrl.$onInit();
      $rootScope.$apply();
    }));

    it('should init the dashboard and fetch data', function() {
      const filterObject =
        TopicsAndSkillsDashboardFilterObjectFactory.createDefault();
      expect(ctrl.pageNumber).toEqual(0);
      expect(ctrl.topicPageNumber).toEqual(0);
      expect(ctrl.itemsPerPage).toEqual(10);
      expect(ctrl.skillPageNumber).toEqual(0);
      expect(ctrl.selectedIndex).toEqual(null);
      expect(ctrl.itemsPerPageChoice).toEqual([10, 15, 20]);
      expect(ctrl.classrooms).toEqual(['All', 'Unassigned', 'math']);
      expect(ctrl.filterObject).toEqual(filterObject);

      expect(ctrl.sortOptions).toEqual([
        'Newly Created', 'Oldest Created',
        'Most Recently Updated', 'Least Recently Updated']);
      expect(ctrl.statusOptions).toEqual([
        'All', 'Published', 'Not Published']);

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
      expect(ctrl.activeTab).toEqual('topics');
      ctrl.setActiveTab(ctrl.TAB_NAME_SKILLS);
      expect(ctrl.activeTab).toEqual('skills');
      ctrl.setActiveTab(ctrl.TAB_NAME_TOPICS);
      expect(ctrl.activeTab).toEqual('topics');
    });

    it('should toggle the filter box visibility', function() {
      expect(ctrl.filterBoxIsShown).toEqual(true);
      ctrl.toggleFilterBox();
      expect(ctrl.filterBoxIsShown).toEqual(false);
      ctrl.toggleFilterBox();
      expect(ctrl.filterBoxIsShown).toEqual(true);
      ctrl.toggleFilterBox();
      expect(ctrl.filterBoxIsShown).toEqual(false);
    });
    it('should go to Page Number', function() {
      expect(ctrl.topicPageNumber).toEqual(0);
      expect(ctrl.pageNumber).toEqual(0);
      ctrl.goToPageNumber(4);
      expect(ctrl.topicPageNumber).toEqual(4);
      expect(ctrl.pageNumber).toEqual(4);
    });

    it('should open the create Topic Modal', function() {
      var modalSpy = spyOn($uibModal, 'open').and.callThrough();
      ctrl.createTopic();
      expect(modalSpy).toHaveBeenCalled();
    });

    it('should open Create Skill Modal', function() {
      var modalSpy = spyOn($uibModal, 'open').and.callThrough();
      ctrl.createSkill();
      expect(modalSpy).toHaveBeenCalled();
    });

    it('should call the skill creation service', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          description: 'Description',
          rubrics: 'Easy',
          explanation: 'Explanation'
        })
      });

      var skillSpy = spyOn(SkillCreationService, 'createNewSkill');
      ctrl.createSkill();
      $rootScope.$apply();
      expect(skillSpy).toHaveBeenCalled();
    });

    it('should navigate the page', function() {
      var currentCount = 50;
      var itemsPerPage = 10;

      expect(ctrl.activeTab).toEqual('topics');

      ctrl.currentCount = currentCount;
      ctrl.itemsPerPage = itemsPerPage;

      expect(ctrl.topicPageNumber).toEqual(0);
      expect(ctrl.pageNumber).toEqual(0);

      ctrl.changePageByOne('next_page');
      expect(ctrl.topicPageNumber).toEqual(1);
      expect(ctrl.pageNumber).toEqual(1);
      ctrl.currentCount = currentCount;

      ctrl.changePageByOne('next_page');
      expect(ctrl.topicPageNumber).toEqual(2);
      expect(ctrl.pageNumber).toEqual(2);
      ctrl.currentCount = currentCount;

      ctrl.changePageByOne('prev_page');
      expect(ctrl.topicPageNumber).toEqual(1);
      expect(ctrl.pageNumber).toEqual(1);
      ctrl.currentCount = currentCount;

      ctrl.changePageByOne('prev_page');
      expect(ctrl.topicPageNumber).toEqual(0);
      expect(ctrl.pageNumber).toEqual(0);
      ctrl.currentCount = currentCount;

      ctrl.changePageByOne('prev_page');
      expect(ctrl.topicPageNumber).toEqual(0);
      expect(ctrl.pageNumber).toEqual(0);
    });

    it('should reset the filters', function() {
      const filterObject = (
        TopicsAndSkillsDashboardFilterObjectFactory.createDefault());
      expect(ctrl.filterObject).toEqual(filterObject);
      ctrl.filterObject.sort = 'Newly Created';
      ctrl.filterObject.keywords = ['keyword1'];
      ctrl.filterObject.classroom = 'math';
      ctrl.filterObject.status = 'Published';
      ctrl.resetFilters();
      expect(ctrl.filterObject).toEqual(filterObject);
    });

    it('should re-render the filter dropdowns', function() {
      ctrl.applyFilters();
      expect(ctrl.select2DropdownIsShown).toBe(false);
      $timeout.flush();
      expect(ctrl.select2DropdownIsShown).toBe(true);
    });

    it('should return the upper count value for pagination', function() {
      // This basically signifies that there is no second page,
      // since there's just 1 topic, so the pagination header should say
      // 1-1 of 1.
      expect(ctrl.getUpperLimitValueForPagination()).toEqual(1);
      ctrl.currentCount = 15;
      // This basically signifies that there's a second page since current
      // count is 15 so the pagination header should show 1-10 of 15.
      expect(ctrl.getUpperLimitValueForPagination()).toEqual(10);
      ctrl.currentCount = 15;
      ctrl.pageNumber = 1;
      // This basically signifies that there's a second page since current
      // count is 15 so the pagination header should show 10-15 of 15.
      expect(ctrl.getUpperLimitValueForPagination()).toEqual(15);
    });

    it('should return number from 1 to the range specified', function() {
      var array = ctrl.generateNumbersTillRange(5);
      expect(array).toEqual([0, 1, 2, 3, 4]);
    });

    it('should apply the filters', function() {
      const topic1 = {
        is_published: true, name: 'Alpha', classroom: 'Math',
        description: 'Alpha description',
      };
      const topic2 = {
        is_published: false, name: 'Alpha2', classroom: 'Math',
        description: 'Alp2 desc',
      };
      const topic3 = {
        is_published: false, name: 'Beta', classroom: 'Math',
        description: 'Beta description',
      };
      const topic4 = {
        is_published: true, name: 'Gamma', classroom: 'Math',
        description: 'Gamma description',
      };
      ctrl.filterObject = (
        TopicsAndSkillsDashboardFilterObjectFactory.createDefault());
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

      ctrl.filterObject.keywords = ['gamm'];
      ctrl.applyFilters();
      expect(ctrl.topicSummaries).toEqual([topic4]);
      expect(ctrl.displayedTopicSummaries).toEqual([topic4]);
      expect(ctrl.currentCount).toEqual(1);
      expect(ctrl.pageNumber).toEqual(0);
    });

    it('should call goToPageNumber when refreshPagination is called',
      function() {
        var changePageSpy = spyOn(ctrl, 'goToPageNumber');
        ctrl.refreshPagination();
        expect(changePageSpy).toHaveBeenCalledWith(0);
      });

    it('should call initDashboard on reinitialized event', function() {
      var initDashboardSpy = spyOn(ctrl, '_initDashboard');
      $rootScope.$broadcast('topicsAndSkillsDashboardReinitialized');
      expect(initDashboardSpy).toHaveBeenCalled();
    });
  });

  describe('when the backend dict has no topics', function() {
    beforeEach(angular.mock.inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      AlertsService = $injector.get('AlertsService');
      $q = $injector.get('$q');
      TopicsAndSkillsDashboardFilterObjectFactory = $injector.get(
        'TopicsAndSkillsDashboardFilterObjectFactory');
      TopicsAndSkillsDashboardBackendApiService = $injector.get(
        'TopicsAndSkillsDashboardBackendApiService');
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
      var MockTopicsAndSkillsDashboardBackendApiService = {
        fetchDashboardData: () => {
          var deferred = $q.defer();
          deferred.resolve(sampleDataResults2);
          return deferred.promise;
        },
        fetchSkillsDashboardData: () => {
          var deferred = $q.defer();
          deferred.resolve({
            skill_summary_dicts: [
              {id: 'id1', description: 'description1'},
              {id: 'id2', description: 'description2'},
              {id: 'id3', description: 'description3'},
              {id: 'id4', description: 'description4'}],
            more: true,
            next_cursor: 'kasfmk424'
          });
          return deferred.promise;
        }
      };

      directive = $injector.get('topicsAndSkillsDashboardPageDirective')[0];
      ctrl = $injector.instantiate(directive.controller, {
        $scope: $scope,
        TopicsAndSkillsDashboardBackendApiService:
        MockTopicsAndSkillsDashboardBackendApiService
      });

      ctrl.$onInit();
      ctrl.displayedSkillSummaries = [];
      $rootScope.$apply();
    }));

    it('should change active tab to skills if topic summaries are null',
      function() {
        expect(ctrl.activeTab).toEqual('skills');
      });

    it('should return the total count value for skills', function() {
      expect(ctrl.getTotalCountValueForSkills()).toEqual(4);
      ctrl.itemsPerPage = 2;
      expect(ctrl.getTotalCountValueForSkills()).toEqual('many');
    });

    it('should fetch skills when filters are applied', function() {
      expect(ctrl.activeTab).toEqual('skills');
      var fetchSkillSpy = spyOn(ctrl, 'fetchSkills').and.callThrough();
      ctrl.applyFilters();
      expect(fetchSkillSpy).toHaveBeenCalled();
    });

    it('should paginate if skills are present in memory instead of fetching',
      function() {
        expect(ctrl.activeTab).toEqual('skills');
        ctrl.moreSkillsPresent = true;
        ctrl.fetchSkills();
        ctrl.itemsPerPage = 1;
        ctrl.skillPageNumber = 1;
        var paginateSkillSpy = spyOn(ctrl, 'goToPageNumber');
        ctrl.moreSkillsPresent = false;
        ctrl.fetchSkills();
        expect(paginateSkillSpy).toHaveBeenCalled();
      });

    it('should paginate forward without fetching if skills are present',
      function() {
        expect(ctrl.activeTab).toEqual('skills');
        ctrl.moreSkillsPresent = false;
        ctrl.pageNumber = 2;
        spyOn(ctrl, 'isNextSkillPagePresent').and.returnValue(true);
        var paginateSkillSpy = spyOn(ctrl, 'goToPageNumber').and.callThrough();
        ctrl.navigateSkillPage('next_page');
        expect(paginateSkillSpy).toHaveBeenCalled();
        expect(ctrl.pageNumber).toEqual(3);
      });

    it('should change page number after fetching skills', function() {
      ctrl.pageNumber = 1;
      ctrl.firstTimeFetchingSkills = false;
      ctrl.moreSkillsPresent = true;
      ctrl.fetchSkills();
      $rootScope.$apply();
      expect(ctrl.pageNumber).toEqual(2);
    });

    it('should fetch skills when filters are applied', function() {
      expect(ctrl.activeTab).toEqual('skills');
      var fetchSkillSpy = spyOn(ctrl, 'fetchSkills').and.callThrough();
      ctrl.applyFilters();
      expect(fetchSkillSpy).toHaveBeenCalled();
    });

    it('should navigate skill page forward', function() {
      var skillSpy = spyOn(ctrl, 'fetchSkills');
      ctrl.navigateSkillPage('next_page');
      expect(skillSpy).toHaveBeenCalled();
    });

    it('should navigate skill page backward', function() {
      ctrl.pageNumber = 3;
      ctrl.navigateSkillPage('prev_page');
      expect(ctrl.pageNumber).toEqual(2);
    });
  });

  describe('when fetching the backend data fails with fatal error', function() {
    var mockAlertsService;
    beforeEach(angular.mock.inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $uibModal = $injector.get('$uibModal');
      AlertsService = $injector.get('AlertsService');
      $q = $injector.get('$q');
      TopicsAndSkillsDashboardBackendApiService = $injector.get(
        'TopicsAndSkillsDashboardBackendApiService');
      mockAlertsService = {
        addWarning: function() {}
      };
      var MockTopicsAndSkillsDashboardBackendApiService = {
        fetchDashboardData: () => {
          var deferred = $q.defer();
          var errorResponse = {
            status: 500
          };
          deferred.reject(errorResponse);
          return deferred.promise;
        }
      };

      directive = $injector.get('topicsAndSkillsDashboardPageDirective')[0];
      ctrl = $injector.instantiate(directive.controller, {
        $scope: $scope,
        AlertsService: mockAlertsService,
        TopicsAndSkillsDashboardBackendApiService:
                MockTopicsAndSkillsDashboardBackendApiService
      });

      ctrl.$onInit();
    }));

    it('should show warning if fetch dashboard data failed with fatal error',
      function() {
        var alertSpy = spyOn(mockAlertsService, 'addWarning');
        $rootScope.$apply();
        expect(alertSpy).toHaveBeenCalledWith('Failed to get dashboard data.');
      });
  });

  describe('when fetching the backend data fails', function() {
    var mockAlertsService;
    beforeEach(angular.mock.inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      mockAlertsService = {
        addWarning: function() {}
      };
      $uibModal = $injector.get('$uibModal');
      AlertsService = $injector.get('AlertsService');
      $q = $injector.get('$q');
      TopicsAndSkillsDashboardBackendApiService = $injector.get(
        'TopicsAndSkillsDashboardBackendApiService');
      var MockTopicsAndSkillsDashboardBackendApiService = {
        fetchDashboardData: () => {
          var deferred = $q.defer();
          var errorResponse = {
            status: 402
          };
          deferred.reject(errorResponse);
          return deferred.promise;
        }
      };

      directive = $injector.get('topicsAndSkillsDashboardPageDirective')[0];
      ctrl = $injector.instantiate(directive.controller, {
        $scope: $scope,

        AlertsService: mockAlertsService,
        TopicsAndSkillsDashboardBackendApiService:
                MockTopicsAndSkillsDashboardBackendApiService
      });

      ctrl.$onInit();
    }));

    it('should show warning if fetch dashboard data failed',
      function() {
        var alertSpy = spyOn(mockAlertsService, 'addWarning');
        $rootScope.$apply();
        expect(alertSpy).toHaveBeenCalledWith(
          'Unexpected error code from the server.');
      });
  });
});
