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
 * @fileoverview Unit tests for QuestionPlayerComponent.
 */

import { Location } from '@angular/common';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync } from '@angular/core/testing';
import { WindowRef } from 'services/contextual/window-ref.service';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { QuestionPlayerComponent } from './question-player.component';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { UserService } from 'services/user.service';
import { QuestionPlayerStateService } from './services/question-player-state.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserInfo } from 'domain/user/user-info.model';
import { State } from 'domain/state/StateObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillMasteryModalComponent } from './skill-mastery-modal.component';
import { QuestionPlayerConceptCardModalComponent } from './question-player-concept-card-modal.component';

class mockLocation {
  onUrlChange(value) {
  }
}

describe('QuestionPlayerComponent', () => {
  let component: QuestionPlayerComponent;
  let fixture: ComponentFixture<QuestionPlayerComponent>;
  let playerPositionService: PlayerPositionService;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let questionPlayerStateService: QuestionPlayerStateService;
  let userService: UserService;
  let ngbModal: NgbModal;
  let mockWindow = {
    nativeWindow: {
      location: {
        href: '',
        hash: null
      }
    }
  };

  let userInfo = {
    _isModerator: true,
    _isAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        QuestionPlayerComponent,
        SkillMasteryModalComponent,
        QuestionPlayerConceptCardModalComponent
      ],
      providers: [
        NgbModal,
        {
          provide: WindowRef,
          useValue: mockWindow
        },
        {
          provide: Location,
          useClass: mockLocation
        },
        PlayerPositionService,
        PreventPageUnloadEventService,
        ExplorationPlayerStateService,
        QuestionPlayerStateService,
        UserService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionPlayerComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);
    playerPositionService = (
      TestBed.inject(PlayerPositionService));
    preventPageUnloadEventService = (
      TestBed.inject(PreventPageUnloadEventService));
    explorationPlayerStateService = (
      TestBed.inject(ExplorationPlayerStateService));
    questionPlayerStateService = (
      TestBed.inject(QuestionPlayerStateService));
    userService = (
      TestBed.inject(UserService));

    spyOnProperty(
      playerPositionService, 'onCurrentQuestionChange'
    ).and.returnValue(new EventEmitter());
    spyOnProperty(
      explorationPlayerStateService, 'onTotalQuestionsReceived'
    ).and.returnValue(new EventEmitter());
    spyOnProperty(
      questionPlayerStateService, 'onQuestionSessionCompleted'
    ).and.returnValue(new EventEmitter());
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({
        canCreateCollections() {
          return true;
        },
        isLoggedIn() {
          return false;
        }
      } as UserInfo));
    spyOnProperty(
      questionPlayerStateService, 'resultsPageIsLoadedEventEmitter'
    ).and.returnValue(new EventEmitter<boolean>());
    spyOn(questionPlayerStateService.resultsPageIsLoadedEventEmitter, 'emit');

    spyOn(component, 'getMasteryChangeForWrongAnswers').and.stub();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', fakeAsync(() => {
    component.ngOnDestroy();
  }));

  it('should add subscriptions on initialization', () => {
    spyOn(playerPositionService.onCurrentQuestionChange, 'subscribe');
    spyOn(explorationPlayerStateService.onTotalQuestionsReceived, 'subscribe');
    spyOn(questionPlayerStateService.onQuestionSessionCompleted, 'subscribe');

    component.ngOnInit();

    expect(playerPositionService.onCurrentQuestionChange.subscribe)
      .toHaveBeenCalled();
    expect(explorationPlayerStateService.onTotalQuestionsReceived.subscribe)
      .toHaveBeenCalled();
    expect(questionPlayerStateService.onQuestionSessionCompleted.subscribe)
      .toHaveBeenCalled();
  });

  it('should update current question when current question is changed', () => {
    spyOnProperty(playerPositionService, 'onCurrentQuestionChange')
      .and.returnValue(new EventEmitter());

    component.ngOnInit();
    component.totalQuestions = 5;

    expect(component.currentQuestion).toBe(0);
    expect(component.currentProgress).toBe(0);

    playerPositionService.onCurrentQuestionChange.emit(3);

    expect(component.currentQuestion).toBe(4);
    expect(component.currentProgress).toBe(80);
  });

  it('should update total number of questions when count is received', () => {
    spyOnProperty(explorationPlayerStateService, 'onTotalQuestionsReceived')
      .and.returnValue(new EventEmitter());

    component.ngOnInit();

    expect(component.totalQuestions).toBe(0);

    explorationPlayerStateService.onTotalQuestionsReceived.emit(3);

    expect(component.totalQuestions).toBe(3);
  });

  it('should change location hash when question session is completed', () => {
    spyOnProperty(questionPlayerStateService, 'onQuestionSessionCompleted')
      .and.returnValue(new EventEmitter());
    spyOn($location, 'hash').and.stub();

    component.ngOnInit();
    questionPlayerStateService.onQuestionSessionCompleted.emit('new uri');

    expect($location.hash).toHaveBeenCalledWith(
      'question-player-result=%22new%20uri%22');
  });

  it('should get user info on initialization', () => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo as unknown as UserInfo)
    );

    expect(component.canCreateCollections).toBe(undefined);
    expect(component.userIsLoggedIn).toBe(undefined);

    component.ngOnInit();

    expect(component.canCreateCollections).toBe(true);
    expect(component.userIsLoggedIn).toBe(true);
  });

  it('should calculate scores, mastery degree and check if user' +
    ' has passed test', () => {
    spyOnProperty(playerPositionService, 'onCurrentQuestionChange')
      .and.returnValue(new EventEmitter());
    spyOn($location, 'hash').and.returnValue(
      'question-player-result=%22new%20uri%22');
    spyOn(component, 'calculateScores').and.stub();
    spyOn(component, 'calculateMasteryDegrees').and.stub();
    spyOn(component, 'hasUserPassedTest').and.returnValue(true);

    expect(component.testIsPassed).toBe(undefined);

    component.ngOnInit();
    component.userIsLoggedIn = true;

    playerPositionService.onCurrentQuestionChange.emit(3);

    expect(component.calculateScores).toHaveBeenCalled();
    expect(component.calculateMasteryDegrees).toHaveBeenCalled();
    expect(component.testIsPassed).toBe(true);
  });

  it('should get the inner class name for action button', () => {
    expect(component.getActionButtonInnerClass('REVIEW_LOWEST_SCORED_SKILL'))
      .toBe('review-lowest-scored-skill-inner');
    expect(component.getActionButtonInnerClass('RETRY_SESSION'))
      .toBe('new-session-inner');
    expect(component.getActionButtonInnerClass('DASHBOARD'))
      .toBe('my-dashboard-inner');
    expect(component.getActionButtonInnerClass('INVALID_TYPE'))
      .toBe('');
  });

  it('should get html for action button icon', () => {
    expect(component.getActionButtonIconHtml(
      'REVIEW_LOWEST_SCORED_SKILL').toString())
      .toBe('<i class="material-icons md-18 action-button-icon">&#59497;</i>');
    expect(component.getActionButtonIconHtml('RETRY_SESSION').toString())
      .toBe('<i class="material-icons md-18 action-button-icon">&#58837;</i>');
    expect(component.getActionButtonIconHtml('DASHBOARD').toString())
      .toBe('<i class="material-icons md-18 action-button-icon">&#59530;</i>');
  });

  it('should open review lowest scored skill modal when use clicks ' +
    'on action button with type REVIEW_LOWEST_SCORED_SKILL', () => {
    let skills, skillIds;
    spyOn(ngbModal, 'open').and.callFake((options) => {
      skills = options.resolve.skills();
      skillIds = options.resolve.skillIds();
      return {
        result: Promise.resolve()
      };
    });

    component.scorePerSkillMapping = {
      skill1: {
        score: 5,
        total: 8,
        description: ''
      },
      skill2: {
        score: 8,
        total: 8,
        description: ''
      }
    };

    component.performAction({
      type: 'REVIEW_LOWEST_SCORED_SKILL',
      url: 'nothing'
    });

    expect(skills).toEqual(['']);
    expect(skillIds).toEqual(['skill1']);
  });

  it('should close review lowest scored skill modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);

    component.scorePerSkillMapping = {
      skill1: {
        score: 5,
        total: 8
      },
      skill2: {
        score: 8,
        total: 8
      }
    };

    component.performAction({
      type: 'REVIEW_LOWEST_SCORED_SKILL',
      url: 'nothing'
    });

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should redirect user if action button has a URL', () => {
    expect(mockWindow.location.href).toBe('');

    component.performAction({
      type: 'REVIEW_LOWEST_SCORED_SKILL',
      url: '/url'
    });

    expect(mockWindow.location.href).toBe('/url');
  });

  it('should check if action buttons footer is to be shown or not', () => {
    component.questionPlayerConfig = {
      resultActionButtons: ['first']
    };

    expect(component.showActionButtonsFooter()).toBe(true);

    component.questionPlayerConfig = {
      resultActionButtons: []
    };
    expect(component.showActionButtonsFooter()).toBe(false);
  });

  it('should check if the user has passed the test or not', () => {
    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    };
    component.scorePerSkillMapping = {
      skill1: {
        score: 5,
        total: 8
      },
      skill2: {
        score: 8,
        total: 8
      }
    };

    expect(component.hasUserPassedTest()).toBe(false);

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    };

    expect(component.hasUserPassedTest()).toBe(true);
  });

  it('should get score percentage to set score bar width', () => {
    expect(component.getScorePercentage({
      score: 5,
      total: 10
    })).toBe(50);
    expect(component.getScorePercentage({
      score: 3,
      total: 10
    })).toBe(30);
  });

  it('should calculate score based on question state data', () => {
    let questionStateData = {
      ques1: {
        answers: ['1'],
        usedHints: [],
        viewedSolution: false,
      },
      ques2: {
        answers: ['3', '4'],
        usedHints: ['hint1'],
        viewedSolution: true,
        linkedSkillIds: ['skillId1', 'skillId2']
      }
    };
    component.questionPlayerConfig = {
      skillList: ['skillId1'],
      skillDescriptions: ['description1']
    };
    component.totalScore = 0.0;

    component.calculateScores(questionStateData as unknown as State);

    expect(component.totalScore).toBe(50);
    expect(questionPlayerStateService.resultsPageIsLoadedEventEmitter.emit)
      .toHaveBeenCalledWith(true);
  });

  it('should calculate mastery degrees', () => {
    component.questionPlayerConfig = {
      skillList: ['skillId1'],
      skillDescriptions: ['description1']
    };
    let questionStateData = {
      ques1: {
        answers: [],
        usedHints: ['hint1'],
        viewedSolution: false,
      },
      ques2: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        }, {
          isCorrect: true,
        }],
        usedHints: ['hint1'],
        viewedSolution: true,
        linkedSkillIds: ['skillId1', 'skillId2']
      },
      ques3: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        }],
        usedHints: ['hint1'],
        viewedSolution: false,
        linkedSkillIds: ['skillId1']
      },
      ques4: {
        answers: [{
          isCorrect: false,
        }],
        usedHints: ['hint1'],
        viewedSolution: false,
        linkedSkillIds: ['skillId1']
      }
    };

    expect(component.masteryPerSkillMapping).toEqual(undefined);

    component.calculateMasteryDegrees(questionStateData as unknown as State);

    expect(component.masteryPerSkillMapping).toEqual({
      skillId1: -0.04000000000000001
    });
  });

  it('should open concept card modal when user clicks on review' +
    ' and retry', () => {
    spyOn(component, 'openConceptCardModal').and.stub();
    component.failedSkillIds = ['skillId1'];

    component.reviewConceptCardAndRetryTest();

    expect(component.openConceptCardModal).toHaveBeenCalled();
  });

  it('should throw error when user clicks on review and retry' +
    ' and there are no failed skills', () => {
    component.failedSkillIds = [];

    expect(() => component.reviewConceptCardAndRetryTest()).toThrowError(
      'No failed skills'
    );
  });

  it('should get color for score based on score per skill', () => {
    let scorePerSkill = {
      score: 5,
      total: 7
    };
    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'NOT_PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(component.getColorForScore(scorePerSkill)).toBe('rgb(0, 150, 136)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(component.getColorForScore(scorePerSkill)).toBe('rgb(217, 92, 12)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    };

    expect(component.getColorForScore(scorePerSkill)).toBe('rgb(0, 150, 136)');
  });

  it('should get color for score bar based on score per skill', () => {
    let scorePerSkill = {
      score: 5,
      total: 7
    };
    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'NOT_PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(
      component.getColorForScoreBar(scorePerSkill)).toBe('rgb(32, 93, 134)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(
      component.getColorForScoreBar(scorePerSkill)).toBe('rgb(217, 92, 12)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    };

    expect(
      component.getColorForScoreBar(scorePerSkill)).toBe('rgb(32, 93, 134)');
  });

  it('should open skill mastery modal when user clicks on skill', () => {
    let masteryPerSkillMapping;
    let skillId;
    let openConceptCardModal;
    let userIsLoggedIn;

    component.masteryPerSkillMapping = {
      skillId1: -0.1
    };
    component.openConceptCardModal = false;
    component.userIsLoggedIn = true;
    spyOn(ngbModal, 'open').and.callFake((options) => {
      masteryPerSkillMapping = options.resolve.masteryPerSkillMapping();
      openConceptCardModal = options.resolve.openConceptCardModal();
      skillId = options.resolve.skillId();
      userIsLoggedIn = options.resolve.userIsLoggedIn();
      return {
        result: Promise.resolve()
      };
    });

    component.openSkillMasteryModal('skillId1');

    expect(masteryPerSkillMapping).toEqual({skillId1: -0.1});
    expect(skillId).toBe('skillId1');
    expect(openConceptCardModal).toBe(false);
    expect(userIsLoggedIn).toBe(true);
  });

  it('should close skill master modal when user clicks cancel', () => {
    component.masteryPerSkillMapping = {
      skillId1: -0.1
    };

    spyOn(ngbModal, 'open').and.callFake((options) => {
      return {
        result: Promise.reject()
      };
    });

    component.openSkillMasteryModal('skillId1');

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should prevent page reload or exit in between' +
  'practice session', () => {
    spyOn(preventPageUnloadEventService, 'addListener').and
      .callFake((callback) => callback());

    component.ngOnInit();

    expect(preventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });
});
