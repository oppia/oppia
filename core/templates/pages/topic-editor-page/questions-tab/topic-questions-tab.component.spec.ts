// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {QuestionsListService} from 'services/questions-list.service';
import {
  SkillSummary,
  SkillSummaryBackendDict,
} from 'domain/skill/skill-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TopicRights} from 'domain/topic/topic-rights.model';
import {
  TopicsAndSkillsDashboardBackendApiService,
  TopicsAndSkillDashboardData,
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TopicQuestionsTabComponent} from './topic-questions-tab.component';
import {QuestionsListComponent} from '../../../components/question-directives/questions-list/questions-list.component';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {Topic} from 'domain/topic/topic-object.model';

let skillSummaryBackendDict: SkillSummaryBackendDict = {
  id: 'test_id',
  description: 'description',
  language_code: 'sadf',
  version: 10,
  misconception_count: 0,
  worked_examples_count: 1,
  skill_model_created_on: 2,
  skill_model_last_updated: 3,
};

let categorizedSkillsDictData: {
  topicName: {
    uncategorized: [];
    test: [];
  };
};

let skillIdToRubricsObject = {};

let untriagedSkillSummariesData: SkillSummary[] = [
  SkillSummary.createFromBackendDict(skillSummaryBackendDict),
];

const topicsAndSkillsDashboardData: TopicsAndSkillDashboardData = {
  allClassroomNames: ['math'],
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
      skillModelLastUpdated: 1622827020924.109,
    },
  ],
  totalSkillCount: 1,
  topicSummaries: [],
  // This throws "Argument of type 'null' is not assignable to parameter of
  // type 'object'" We need to suppress this error because of the need to test
  // validations. This is because the value of categorizedSkillsDict is null
  // when the topic is not yet initialized.
  // @ts-ignore
  categorizedSkillsDict: categorizedSkillsDictData,
};

class MockTopicsAndSkillsDashboardBackendApiService {
  success: boolean = true;
  fetchDashboardDataAsync() {
    return {
      then: (callback: (resp: TopicsAndSkillDashboardData) => void) => {
        callback(topicsAndSkillsDashboardData);
      },
    };
  }
}

describe('Topic questions tab', () => {
  let component: TopicQuestionsTabComponent;
  let questionsListComponent: QuestionsListComponent;
  let fixture: ComponentFixture<TopicQuestionsTabComponent>;
  let topicEditorStateService: TopicEditorStateService;
  let focusManagerService: FocusManagerService;
  let qls: QuestionsListService;
  let subtopic1: Subtopic;
  let topic: Topic;
  let topicInitializedEventEmitter: EventEmitter<void>;
  let topicReinitializedEventEmitter: EventEmitter<void>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TopicQuestionsTabComponent, QuestionsListComponent],
      providers: [
        TopicsAndSkillsDashboardBackendApiService,
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicQuestionsTabComponent);
    component = fixture.componentInstance;
    const questionsListFixture = TestBed.createComponent(
      QuestionsListComponent
    );
    questionsListComponent = questionsListFixture.componentInstance;
    qls = TestBed.inject(QuestionsListService);
    focusManagerService = TestBed.inject(FocusManagerService);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicInitializedEventEmitter = new EventEmitter();
    topicReinitializedEventEmitter = new EventEmitter();

    topic = new Topic(
      '',
      'Topic name loading',
      'Abbrev. name loading',
      'Url Fragment loading',
      'Topic description loading',
      'en',
      [],
      [],
      [],
      1,
      1,
      [],
      '',
      '',
      {},
      false,
      '',
      '',
      []
    );
    subtopic1 = Subtopic.createFromTitle(1, 'Subtopic1');
    subtopic1.addSkill('skill1', 'subtopic1 skill');
    topic.getSubtopics = () => {
      return [subtopic1];
    };

    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(focusManagerService, 'setFocus');
    spyOnProperty(topicEditorStateService, 'onTopicInitialized').and.callFake(
      () => {
        return topicInitializedEventEmitter;
      }
    );
    spyOnProperty(topicEditorStateService, 'onTopicReinitialized').and.callFake(
      () => {
        return topicReinitializedEventEmitter;
      }
    );
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize the variables when topic is initialized', () => {
    const topicRights = new TopicRights(false, false, false);
    const allSkillSummaries = subtopic1.getSkillSummaries();
    spyOn(topicEditorStateService, 'getSkillIdToRubricsObject').and.returnValue(
      skillIdToRubricsObject
    );

    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'selectSkillField'
    );
    expect(component.selectedSkillId).toBeUndefined();
    expect(component.topic).toBe(topic);
    expect(component.topicRights).toEqual(topicRights);
    expect(component.skillIdToRubricsObject).toEqual(skillIdToRubricsObject);
    expect(component.allSkillSummaries).toEqual(allSkillSummaries);
    expect(component.getSkillsCategorizedByTopics).toBe(
      categorizedSkillsDictData
    );
    expect(component.getUntriagedSkillSummaries).toBe(
      untriagedSkillSummariesData
    );
    expect(component.canEditQuestion).toBe(false);
  });

  it('should setFocus on selectSkillField when screen loads', () => {
    component.ngAfterViewInit();

    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'selectSkillField'
    );
  });

  it('should unsubscribe when component is destroyed', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe').and.callThrough();

    expect(component.directiveSubscriptions.closed).toBe(false);

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
    expect(component.directiveSubscriptions.closed).toBe(true);
  });

  it('should reinitialize questions list when a skill is selected', () => {
    spyOn(qls, 'resetPageNumber').and.callThrough();
    spyOn(qls, 'getQuestionSummariesAsync');
    qls.incrementPageNumber();
    qls.incrementPageNumber();

    expect(component.selectedSkillId).toBeUndefined();
    expect(qls.getCurrentPageNumber()).toBe(2);

    component.reinitializeQuestionsList('1');

    expect(component.selectedSkillId).toEqual('1');
    expect(qls.resetPageNumber).toHaveBeenCalled();
    expect(qls.getCurrentPageNumber()).toBe(0);
    expect(qls.getQuestionSummariesAsync).toHaveBeenCalledWith('1', true, true);
  });

  it('should initialize tab when topic is initialized', () => {
    // Setup.
    const topicRights = new TopicRights(false, false, false);
    const allSkillSummaries = subtopic1.getSkillSummaries();

    // Action.
    topicInitializedEventEmitter.emit();

    // Endline verification.
    expect(component.allSkillSummaries).toEqual(allSkillSummaries);
    expect(component.topicRights).toEqual(topicRights);
    expect(component.topic).toBe(topic);
  });

  it('should initialize tab when topic is reinitialized', () => {
    const topicRights = new TopicRights(false, false, false);
    const allSkillSummaries = subtopic1.getSkillSummaries();

    topicInitializedEventEmitter.emit();
    expect(component.allSkillSummaries).toEqual(allSkillSummaries);
    expect(component.topicRights).toEqual(topicRights);
    expect(component.topic).toBe(topic);
    topicReinitializedEventEmitter.emit();

    expect(component.allSkillSummaries).toEqual(allSkillSummaries);
    expect(component.topicRights).toEqual(topicRights);
    expect(component.topic).toBe(topic);
  });

  describe('should change drop-down to a heading when the questionEditor is opened', () => {
    it('should return "Creating new" when creating a new question', () => {
      spyOn(questionsListComponent, 'createQuestion').and.callThrough();
      spyOn(topicEditorStateService, 'toggleQuestionEditor').and.callThrough();

      questionsListComponent.createQuestion();
      expect(topicEditorStateService.toggleQuestionEditor).toHaveBeenCalledWith(
        true,
        true
      );
      expect(component.getEditorAction()).toBe('Creating new');
    });

    it('should return "Editing" when editing a question', () => {
      spyOn(questionsListComponent, 'openQuestionEditor').and.callThrough();
      spyOn(topicEditorStateService, 'toggleQuestionEditor').and.callThrough();

      questionsListComponent.openQuestionEditor();
      expect(topicEditorStateService.toggleQuestionEditor).toHaveBeenCalledWith(
        true
      );
      expect(component.getEditorAction()).toBe('Editing');
    });
  });
});
