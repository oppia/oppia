// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for questionOpportunities.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContributionOpportunitiesBackendApiService } from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { SkillOpportunity } from 'domain/opportunity/skill-opportunity.model';
import { AlertsService } from 'services/alerts.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { UserService } from 'services/user.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { QuestionOpportunitiesComponent } from './question-opportunities.component';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserInfo } from 'domain/user/user-info.model';

class MockNgbModalRef {
  componentInstance!: {
    skillId: null;
  };
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Question opportunities component', () => {
  let component: QuestionOpportunitiesComponent;
  let fixture: ComponentFixture<QuestionOpportunitiesComponent>;
  let alertsService: AlertsService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  let ngbModal: NgbModal;
  let questionUndoRedoService: QuestionUndoRedoService;
  let siteAnalyticsService: SiteAnalyticsService;
  let skillObjectFactory: SkillObjectFactory;
  let userService: UserService;
  let opportunitiesArray: SkillOpportunity[] = [];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        QuestionOpportunitiesComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        AlertsService,
        SiteAnalyticsService,
        SkillObjectFactory,
        UserService,
        ContributionOpportunitiesBackendApiService,
        ContributionOpportunitiesService,
        QuestionUndoRedoService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionOpportunitiesComponent);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    userService = TestBed.inject(UserService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService);
    questionUndoRedoService = TestBed.inject(QuestionUndoRedoService);

    opportunitiesArray = [
      SkillOpportunity.createFromBackendDict({
        id: '1',
        skill_description: 'Skill description 1',
        topic_name: 'topic_1',
        question_count: 5
      }),
      SkillOpportunity.createFromBackendDict({
        id: '2',
        skill_description: 'Skill description 2',
        topic_name: 'topic_1',
        question_count: 2
      })
    ];
  });

  it('should load question opportunities', () => {
    spyOn(contributionOpportunitiesService, 'getSkillOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: false
      }));

    component.loadOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(false);
    });
  });

  it('should load more question opportunities', () => {
    spyOn(contributionOpportunitiesService, 'getSkillOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: true
      }));

    component.loadOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(true);
    });

    spyOn(
      contributionOpportunitiesService, 'getMoreSkillOpportunitiesAsync').and
      .returnValue(Promise.resolve({
        opportunities: opportunitiesArray,
        more: false
      }));

    component.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBe(false);
    });
  });

  it('should register Contributor Dashboard suggest event when clicking on' +
    ' suggest question button', fakeAsync(() => {
    spyOn(component, 'createQuestion').and.stub();
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          skill: null,
          skillDifficulty: 'null'
        })
      } as NgbModalRef
    );
    spyOn(siteAnalyticsService, 'registerContributorDashboardSuggestEvent');
    let userInfo = new UserInfo(
      ['USER_ROLE'], true, false, false, false, true,
      'en', 'username1', 'tester@example.com', true
    );
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
    component.ngOnInit();
    tick();

    component.onClickSuggestQuestionButton('1');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should open requires login modal when trying to select a question and' +
    ' a skill difficulty and user is not logged', () => {
    let userInfo = new UserInfo(
      ['USER_ROLE'], true, false, false, false, true,
      'en', 'username1', 'tester@example.com', true
    );
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
    component.ngOnInit();

    spyOn(ngbModal, 'open');
    // The callFake is to avoid conflicts when testing modal calls.
    spyOn(contributionOpportunitiesService, 'showRequiresLoginModal').and
      .callFake(() => {});
    component.onClickSuggestQuestionButton('1');

    expect(ngbModal.open).not.toHaveBeenCalled();
  });


  it('should open select skill and skill difficulty modal when clicking' +
    ' on suggesting question button', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef
    );
    let userInfo = new UserInfo(
      ['USER_ROLE'], true, false, false, false, true,
      'en', 'username1', 'tester@example.com', true
    );
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
    component.ngOnInit();

    component.onClickSuggestQuestionButton('1');

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should open create question modal when creating a question', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        suggestionId: '',
        question: null,
        questionId: 'questionId',
        questionStateData: null,
        skill: null,
        skillDifficulty: 0.6
      },
      result: Promise.reject()
    } as NgbModalRef);

    component.createQuestion(
      skillObjectFactory.createFromBackendDict({
        id: '1',
        description: 'test description',
        misconceptions: [],
        rubrics: [],
        skill_contents: {
          explanation: {
            html: 'test explanation',
            content_id: 'explanation',
          },
          worked_examples: [],
          recorded_voiceovers: {
            voiceovers_mapping: {}
          }
        },
        language_code: 'en',
        version: 3,
        all_questions_merged: false,
        next_misconception_id: 0,
        prerequisite_skill_ids: [],
        superseding_skill_id: ''
      }), 1);

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should create a question when closing create question modal',
    fakeAsync(() => {
      let userInfo = new UserInfo(
        ['USER_ROLE'], true, false, false, false, true,
        'en', 'username1', 'tester@example.com', true
      );
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);

      component.ngOnInit();
      tick();
      alertsService.clearWarnings();

      spyOn(questionUndoRedoService, 'clearChanges');
      let openSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          skill: skillObjectFactory.createFromBackendDict({
            id: '1',
            description: 'test description',
            misconceptions: [],
            rubrics: [],
            skill_contents: {
              explanation: {
                html: 'test explanation',
                content_id: 'explanation',
              },
              worked_examples: [],
              recorded_voiceovers: {
                voiceovers_mapping: {}
              }
            },
            language_code: 'en',
            version: 3,
            all_questions_merged: false,
            next_misconception_id: 0,
            prerequisite_skill_ids: [],
            superseding_skill_id: ''
          }),
          skillDifficulty: 1
        })
      } as NgbModalRef);

      component.onClickSuggestQuestionButton('1');
      tick();

      expect(openSpy).toHaveBeenCalled();
      expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    }));

  it('should suggest a question when dismissing create question modal',
    fakeAsync(() => {
      let userInfo = new UserInfo(
        ['USER_ROLE'], true, false, false, false, true,
        'en', 'username1', 'tester@example.com', true
      );
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);

      component.ngOnInit();
      tick();
      alertsService.clearWarnings();

      spyOn(questionUndoRedoService, 'clearChanges');
      let openSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          skill: skillObjectFactory.createFromBackendDict({
            id: '1',
            description: 'test description',
            misconceptions: [],
            rubrics: [],
            skill_contents: {
              explanation: {
                html: 'test explanation',
                content_id: 'explanation',
              },
              worked_examples: [],
              recorded_voiceovers: {
                voiceovers_mapping: {}
              }
            },
            language_code: 'en',
            version: 3,
            all_questions_merged: false,
            next_misconception_id: 0,
            prerequisite_skill_ids: [],
            superseding_skill_id: ''
          }),
          skillDifficulty: 1
        })
      } as NgbModalRef);

      component.onClickSuggestQuestionButton('1');
      tick();

      expect(openSpy).toHaveBeenCalled();
      expect(questionUndoRedoService.clearChanges).toHaveBeenCalled();
    }));

  it('should not create a question when dismissing select skill and skill' +
    ' difficulty modal', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: MockNgbModalRef,
        result: Promise.reject()
      } as NgbModalRef
    );
    let userInfo = new UserInfo(
      ['USER_ROLE'], true, false, false, false, true,
      'en', 'username1', 'tester@example.com', true
    );
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
    component.ngOnInit();


    component.onClickSuggestQuestionButton('1');


    expect(ngbModal.open).toHaveBeenCalled();
  });
});
