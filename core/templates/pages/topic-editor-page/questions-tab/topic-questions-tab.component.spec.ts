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

import { EventEmitter } from '@angular/core';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { QuestionsListService } from 'services/questions-list.service';
import { SkillSummary, SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TestBed } from '@angular/core/testing';
import { TopicRights } from 'domain/topic/topic-rights.model';
import { TopicsAndSkillsDashboardBackendApiService, TopicsAndSkillDashboardData } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

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
    id: '3',
    description: 'description3',
    language_code: 'language_code',
    version: 1,
    misconception_count: null,
    worked_examples_count: null,
    skill_model_created_on: 2,
    skill_model_last_updated: 3
  };

  let CategorizedSkillsDict: {
    test: {
      uncategorized: [],
      test: []
    }
  };

  let skillIdToRubricsObject = {};

  let UntriagedSkillSummaries: SkillSummary[] = (
    [SkillSummary.createFromBackendDict(skillSummaryBackendDict)]);

  const topicsAndSkillsDashboardData: TopicsAndSkillDashboardData = {
    allClassroomNames: null,
    canDeleteTopic: null,
    canCreateTopic: null,
    canDeleteSkill: null,
    canCreateSkill: null,
    untriagedSkillSummaries: UntriagedSkillSummaries,
    mergeableSkillSummaries: null,
    totalSkillCount: null,
    topicSummaries: null,
    categorizedSkillsDict: CategorizedSkillsDict
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
    focusManagerService = $injector.get('FocusManagerService');
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

  it('should initialize the variables', function() {
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
    expect($scope.getSkillsCategorizedByTopics).toBe(CategorizedSkillsDict);
    expect($scope.getUntriagedSkillSummaries)
      .toBe(UntriagedSkillSummaries);
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

  it('should call initTab when topic is initialized', function() {
    $scope.question = 'question1';
    $scope.skillId = '1';
    $scope.topic = null;

    topicInitializedEventEmitter.emit();

    expect($scope.question).toBeNull();
    expect($scope.skillId).toBeNull();
    expect($scope.topic).toBe(topic);
  });

  it('should call initTab when topic is reinitialized', function() {
    $scope.question = 'question1';
    $scope.skillId = '1';
    $scope.topic = null;

    topicInitializedEventEmitter.emit();
    expect($scope.question).toBeNull();
    expect($scope.skillId).toBeNull();
    expect($scope.topic).toBe(topic);
    $scope.question = 'question1';
    $scope.skillId = '1';
    $scope.topic = null;
    topicReinitializedEventEmitter.emit();

    expect($scope.question).toBeNull();
    expect($scope.skillId).toBeNull();
    expect($scope.topic).toBe(topic);
  });

  it('should unsubscribe when onDestroy runs', function() {
    spyOn(ctrl.directiveSubscriptions, 'unsubscribe');

    ctrl.$onDestroy();

    expect(ctrl.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should reinitialize questions list', function() {
    spyOn(qls, 'resetPageNumber');
    spyOn(qls, 'getQuestionSummariesAsync');

    $scope.reinitializeQuestionsList('1');

    expect($scope.selectedSkillId).toEqual('1');
    expect(qls.resetPageNumber).toHaveBeenCalled();
    expect(qls.getQuestionSummariesAsync).toHaveBeenCalledWith('1', true, true);
  });
});
