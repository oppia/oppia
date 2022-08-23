// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for topic questions tab.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { EventEmitter } from '@angular/core';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { QuestionsListService } from 'services/questions-list.service';
import { SkillSummary, SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TestBed } from '@angular/core/testing';
import { TopicRights } from 'domain/topic/topic-rights.model';
import { TopicsAndSkillsDashboardBackendApiService, TopicsAndSkillDashboardData } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

describe('Topic questions tab', function() {
  var $rootScope = null;
  var $scope = null;
  var $window = null;
  var TopicEditorStateService = null;
  var TopicObjectFactory = null;
  var ctrl = null;
  var focusManagerService = null;
  var qls = null;
  var subtopic1 = null;
  var topic = null;
  var topicInitializedEventEmitter = null;
  var topicReinitializedEventEmitter = null;

  let skillSummaryBackendDict: SkillSummaryBackendDict = {
    id: 'test_id',
    description: 'description',
    language_code: 'sadf',
    version: 10,
    misconception_count: 0,
    worked_examples_count: 1,
    skill_model_created_on: 2,
    skill_model_last_updated: 3
  };

  let categorizedSkillsDictData: {
    topicName: {
      uncategorized: [];
      test: [];
    };
  };

  let skillIdToRubricsObject = {};

  let untriagedSkillSummariesData: SkillSummary[] = (
    [SkillSummary.createFromBackendDict(skillSummaryBackendDict)]);

  const topicsAndSkillsDashboardData: TopicsAndSkillDashboardData = {
    allClassroomNames: [
      'math'
    ],
    canDeleteTopic: true,
    canCreateTopic: true,
    canDeleteSkill: true,
    canCreateSkill: true,
    untriagedSkillSummaries: untriagedSkillSummariesData,
    mergeableSkillSummaries: [
      {
        id: 'ho60YBh7c3Sn',
        description: 'terst',
        languageCode: 'en',
        version: 1,
        misconceptionCount: 0,
        workedExamplesCount: 0,
        skillModelCreatedOn: 1622827020924.104,
        skillModelLastUpdated: 1622827020924.109
      }
    ],
    totalSkillCount: 1,
    topicSummaries: null,
    categorizedSkillsDict: categorizedSkillsDictData
  };

  class MockTopicsAndSkillsDashboardBackendApiService {
    success: boolean = true;
    fetchDashboardDataAsync() {
      return {
        then: (callback: (resp) => void) => {
          callback(topicsAndSkillsDashboardData);
        }
      };
    }
  }

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TopicsAndSkillsDashboardBackendApiService,
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        }
      ]
    });
    qls = TestBed.get(QuestionsListService);
    focusManagerService = TestBed.get(FocusManagerService);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $window = $injector.get('$window');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    topicInitializedEventEmitter = new EventEmitter();
    topicReinitializedEventEmitter = new EventEmitter();

    ctrl = $componentController('questionsTab', {
      $scope: $scope,
    });

    topic = TopicObjectFactory.createInterstitialTopic();
    subtopic1 = Subtopic.createFromTitle(1, 'Subtopic1');
    subtopic1.addSkill('skill1', 'subtopic1 skill');
    topic.getSubtopics = function() {
      return [subtopic1];
    };

    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(focusManagerService, 'setFocus');
    spyOnProperty(TopicEditorStateService, 'onTopicInitialized').and.callFake(
      function() {
        return topicInitializedEventEmitter;
      });
    spyOnProperty(
      TopicEditorStateService, 'onTopicReinitialized').and.callFake(
      function() {
        return topicReinitializedEventEmitter;
      });
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should initialize the variables when topic is initialized', function() {
    const topicRights = TopicRights.createInterstitialRights();
    const allSkillSummaries = subtopic1.getSkillSummaries();
    spyOn(TopicEditorStateService, 'getSkillIdToRubricsObject').and
      .returnValue(skillIdToRubricsObject);

    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'selectSkillField');
    expect($scope.selectedSkillId).toBeNull();
    expect($scope.question).toBeNull();
    expect($scope.skillId).toBeNull();
    expect($scope.topic).toBe(topic);
    expect($scope.topicRights).toEqual(topicRights);
    expect($scope.skillIdToRubricsObject).toEqual(skillIdToRubricsObject);
    expect($scope.allSkillSummaries).toEqual(allSkillSummaries);
    expect($scope.getSkillsCategorizedByTopics).toBe(categorizedSkillsDictData);
    expect($scope.getUntriagedSkillSummaries)
      .toBe(untriagedSkillSummariesData);
    expect($scope.canEditQuestion).toBe(false);
    expect($scope.misconceptions).toEqual([]);
    expect($scope.questionIsBeingUpdated).toBe(false);
    expect($scope.questionIsBeingSaved).toBe(false);
    expect($scope.emptyMisconceptionsList).toEqual([]);
  });

  it('should setFocus on selectSkillField when screen loads', function() {
    $window.onload();

    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'selectSkillField');
  });

  it('should initialize tab when topic is initialized', function() {
    // Setup.
    const topicRights = TopicRights.createInterstitialRights();
    const allSkillSummaries = subtopic1.getSkillSummaries();
    $scope.allSkillSummaries = null;
    $scope.topicRights = null;
    $scope.topic = null;

    // Baseline verification.
    expect($scope.allSkillSummaries).toBeNull();
    expect($scope.topicRights).toBeNull();
    expect($scope.topic).toBeNull();

    // Action.
    topicInitializedEventEmitter.emit();

    // Endline verification.
    expect($scope.allSkillSummaries).toEqual(allSkillSummaries);
    expect($scope.topicRights).toEqual(topicRights);
    expect($scope.topic).toBe(topic);
  });

  it('should initialize tab when topic is reinitialized', function() {
    const topicRights = TopicRights.createInterstitialRights();
    const allSkillSummaries = subtopic1.getSkillSummaries();
    $scope.allSkillSummaries = null;
    $scope.topicRights = null;
    $scope.topic = null;

    expect($scope.allSkillSummaries).toBeNull();
    expect($scope.topicRights).toBeNull();
    expect($scope.topic).toBeNull();


    topicInitializedEventEmitter.emit();
    expect($scope.allSkillSummaries).toEqual(allSkillSummaries);
    expect($scope.topicRights).toEqual(topicRights);
    expect($scope.topic).toBe(topic);
    $scope.allSkillSummaries = null;
    $scope.topicRights = null;
    $scope.topic = null;
    topicReinitializedEventEmitter.emit();

    expect($scope.allSkillSummaries).toEqual(allSkillSummaries);
    expect($scope.topicRights).toEqual(topicRights);
    expect($scope.topic).toBe(topic);
  });

  it('should unsubscribe when component is destroyed', function() {
    spyOn(ctrl.directiveSubscriptions, 'unsubscribe').and.callThrough();

    expect(ctrl.directiveSubscriptions.closed).toBe(false);

    ctrl.$onDestroy();

    expect(ctrl.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
    expect(ctrl.directiveSubscriptions.closed).toBe(true);
  });

  it('should reinitialize questions list when a skill is selected', function() {
    spyOn(qls, 'resetPageNumber').and.callThrough();
    spyOn(qls, 'getQuestionSummariesAsync');
    qls.incrementPageNumber();
    qls.incrementPageNumber();

    expect($scope.selectedSkillId).toBeNull();
    expect(qls.getCurrentPageNumber()).toBe(2);

    $scope.reinitializeQuestionsList('1');

    expect($scope.selectedSkillId).toEqual('1');
    expect(qls.resetPageNumber).toHaveBeenCalled();
    expect(qls.getCurrentPageNumber()).toBe(0);
    expect(qls.getQuestionSummariesAsync).toHaveBeenCalledWith('1', true, true);
  });
});
