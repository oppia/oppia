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
 * @fileoverview Unit tests for Question Player Component.
 */


import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { UserService } from 'services/user.service';
import { Answer, QuestionData, QuestionPlayerComponent, QuestionPlayerConfig } from './question-player.component';
import { QuestionPlayerStateService } from './services/question-player-state.service';
import { Location } from '@angular/common';
import { UserInfo } from 'domain/user/user-info.model';
import { UrlService } from 'services/contextual/url.service';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Question Player Component', () => {
  let component: QuestionPlayerComponent;
  let fixture: ComponentFixture<QuestionPlayerComponent>;
  let ngbModal: NgbModal;
  let playerPositionService: PlayerPositionService;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let questionPlayerStateService: QuestionPlayerStateService;
  let userService: UserService;
  let windowRef: WindowRef;
  let playerPositionServiceEmitter = new EventEmitter();
  let explorationPlayerStateServiceEmitter = new EventEmitter();
  let questionPlayerStateServiceEmitter = new EventEmitter();
  let urlService: UrlService;
  let userInfo = new UserInfo(
    [], true, false, false, false,
    true, 'en', 'username1', 'tester@example.org', true);

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: null
      },
      addEventListener: () => {},
      gtag: () => {}
    };
  }

  class MockPlayerPositionService {
    onCurrentQuestionChange = playerPositionServiceEmitter;
  }

  class MockExplorationPlayerStateService {
    onTotalQuestionsReceived = explorationPlayerStateServiceEmitter;
  }

  class MockQuestionPlayerStateService {
    onQuestionSessionCompleted = questionPlayerStateServiceEmitter;
    resultsPageIsLoadedEventEmitter = new EventEmitter();
  }

  class MockLocation {
    onUrlChange(callback: () => void) {
      callback();
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        QuestionPlayerComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: PlayerPositionService,
          useClass: MockPlayerPositionService
        },
        {
          provide: ExplorationPlayerStateService,
          useClass: MockExplorationPlayerStateService
        },
        {
          provide: QuestionPlayerStateService,
          useClass: MockQuestionPlayerStateService
        },
        {
          provide: Location,
          useClass: MockLocation
        },
        PreventPageUnloadEventService,
        UserService,
        UrlService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionPlayerComponent);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);
    playerPositionService = TestBed.inject(PlayerPositionService);
    preventPageUnloadEventService = (
      TestBed.inject(PreventPageUnloadEventService));
    explorationPlayerStateService = (
      TestBed.inject(ExplorationPlayerStateService));
    questionPlayerStateService = TestBed.inject(QuestionPlayerStateService);
    userService = TestBed.inject(UserService);
    windowRef = TestBed.inject(WindowRef);
    urlService = TestBed.inject(UrlService);

    fixture.detectChanges();

    spyOn(questionPlayerStateService.resultsPageIsLoadedEventEmitter, 'emit');
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
    fixture.destroy();
  });

  it('should set component properties on initialization', () => {
    component.ngOnInit();

    expect(component.currentQuestion).toBe(0);
    expect(component.totalQuestions).toBe(0);
    expect(component.currentProgress).toBe(0);
    expect(component.totalScore).toBe(0.0);
    expect(component.scorePerSkillMapping).toEqual({});
    expect(component.testIsPassed).toBe(true);
    expect(questionPlayerStateService.resultsPageIsLoadedEventEmitter.emit)
      .toHaveBeenCalledWith(false);
  });

  it('should add subscriptions on initialization', fakeAsync(() => {
    spyOn(playerPositionService.onCurrentQuestionChange, 'subscribe');
    spyOn(explorationPlayerStateService.onTotalQuestionsReceived, 'subscribe');
    spyOn(questionPlayerStateService.onQuestionSessionCompleted, 'subscribe');

    component.ngOnInit();
    tick();

    playerPositionServiceEmitter.emit(1);
    explorationPlayerStateServiceEmitter.emit(10);
    questionPlayerStateServiceEmitter.emit('result');
    tick();

    expect(playerPositionService.onCurrentQuestionChange.subscribe)
      .toHaveBeenCalled();
    expect(explorationPlayerStateService.onTotalQuestionsReceived.subscribe)
      .toHaveBeenCalled();
    expect(questionPlayerStateService.onQuestionSessionCompleted.subscribe)
      .toHaveBeenCalled();
  }));

  it('should update current question when current question is changed', () => {
    component.ngOnInit();
    component.totalQuestions = 5;

    expect(component.currentQuestion).toBe(0);
    expect(component.currentProgress).toBe(0);

    playerPositionServiceEmitter.emit(3);

    expect(component.currentQuestion).toBe(4);
    expect(component.currentProgress).toBe(80);
  });

  it('should update total number of questions when count is received',
    fakeAsync(() => {
      component.ngOnInit();

      expect(component.totalQuestions).toBe(0);

      explorationPlayerStateServiceEmitter.emit(3);
      tick();
      questionPlayerStateServiceEmitter.emit('new uri');
      tick();

      expect(component.totalQuestions).toBe(3);
    }));


  it('should get user info on initialization', fakeAsync(() => {
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom_url_fragment');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_url_fragment');
    spyOn(component, 'calculateScores').and.stub();
    spyOn(component, 'calculateMasteryDegrees').and.stub();
    spyOn(component, 'hasUserPassedTest').and.returnValue(true);

    component.userIsLoggedIn = true;
    let data = JSON.stringify({
      state: {}
    });
    windowRef.nativeWindow.location.hash = 'question-player-result=' + data;
    component.ngOnInit();
    tick();
    tick();

    expect(component.testIsPassed).toBeTrue();
    expect(component.calculateScores).toHaveBeenCalled();
    expect(component.userIsLoggedIn).toBe(true);
  }));

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

  it('should close review lowest scored skill modal', () => {
    let mockEmitter = new EventEmitter();
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        skills: null,
        skillIds: null,
        masteryPerSkillMapping: null,
        skillId: null,
        userIsLoggedIn: null,
        openConceptCardModal: mockEmitter
      },
      result: Promise.reject(),
    } as NgbModalRef);

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
      url: ''
    });

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should redirect user if action button has a URL', () => {
    expect(windowRef.nativeWindow.location.href).toBe('');

    component.performAction({
      url: '/url',
      type: ''
    });

    expect(windowRef.nativeWindow.location.href).toBe('/url');
  });

  it('should check if action buttons footer is to be shown or not', () => {
    component.questionPlayerConfig = {
      resultActionButtons: ['first']
    } as QuestionPlayerConfig;

    expect(component.showActionButtonsFooter()).toBe(true);

    component.questionPlayerConfig = {
      resultActionButtons: [],
      questionPlayerMode: {
        modeType: '',
        passCutoff: 0,
      },
      skillDescriptions: [],
      skillList: []
    };
    expect(component.showActionButtonsFooter()).toBe(false);
  });

  it('should check if the user has passed the test or not', () => {
    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    } as QuestionPlayerConfig;
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

    expect(component.hasUserPassedTest()).toBe(false);

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    } as QuestionPlayerConfig;

    expect(component.hasUserPassedTest()).toBe(true);
  });

  it('should get score percentage to set score bar width', () => {
    expect(component.getScorePercentage({
      score: 5,
      total: 10,
      description: ''
    })).toBe(50);
    expect(component.getScorePercentage({
      score: 3,
      total: 10,
      description: ''
    })).toBe(30);
  });

  it('should calculate score based on question state data', () => {
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
      'classroom_url_fragment');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_url_fragment');
    let questionStateData = {
      ques1: {
        answers: [],
        usedHints: [],
        viewedSolution: false,
        linkedSkillIds: []
      },
      ques2: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        } as Answer, {
          isCorrect: true,
        } as Answer
        ],
        usedHints: ['hint1'],
        viewedSolution: true,
        linkedSkillIds: ['skillId1', 'skillId2']
      }
    };
    component.questionPlayerConfig = {
      resultActionButtons: [],
      questionPlayerMode: {
        modeType: '',
        passCutoff: 0,
      },
      skillList: ['skillId1'],
      skillDescriptions: ['description1']
    } as QuestionPlayerConfig;
    component.totalScore = 0.0;

    component.calculateScores(
      questionStateData as {[key: string]: QuestionData});

    expect(component.totalScore).toBe(55);
    expect(questionPlayerStateService.resultsPageIsLoadedEventEmitter.emit)
      .toHaveBeenCalledWith(true);
  });

  it('should calculate score based on question state data', () => {
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
      'classroom_url_fragment');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_url_fragment');
    let questionStateData = {
      ques1: {
        answers: [],
        usedHints: [],
        viewedSolution: false,
        linkedSkillIds: []
      },
      ques2: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        } as Answer, {
          isCorrect: true,
        } as Answer
        ],
        usedHints: ['hint1'],
        viewedSolution: true,
        linkedSkillIds: []
      }
    };
    component.questionPlayerConfig = {
      resultActionButtons: [],
      questionPlayerMode: {
        modeType: '',
        passCutoff: 0,
      },
      skillList: ['skillId1'],
      skillDescriptions: ['description1']
    } as QuestionPlayerConfig;
    component.totalScore = 0.0;

    component.calculateScores(
      questionStateData as {[key: string]: QuestionData});

    expect(questionPlayerStateService.resultsPageIsLoadedEventEmitter.emit)
      .not.toHaveBeenCalledWith(false);
  });

  it('should calculate mastery degrees', () => {
    component.questionPlayerConfig = {
      skillList: ['skillId1'],
      skillDescriptions: ['description1']
    } as QuestionPlayerConfig;
    let questionStateData = {
      ques1: {
        answers: [],
        usedHints: ['hint1'],
        viewedSolution: false,
        linkedSkillIds: []
      },
      ques2: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        } as Answer, {
          isCorrect: true,
        } as Answer
        ],
        usedHints: ['hint1'],
        viewedSolution: true,
        linkedSkillIds: ['skillId1', 'skillId2']
      },
      ques3: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        } as Answer],
        usedHints: ['hint1'],
        viewedSolution: false,
        linkedSkillIds: ['skillId1']
      },
      ques4: {
        answers: [{
          isCorrect: false,
        } as Answer],
        usedHints: ['hint1'],
        viewedSolution: false,
        linkedSkillIds: ['skillId1']
      }
    };

    expect(component.masteryPerSkillMapping).toEqual(undefined);

    component.calculateMasteryDegrees(questionStateData);

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
      total: 7,
      description: ''
    };
    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'NOT_PASS_FAIL',
        passCutoff: 1.5
      }
    } as QuestionPlayerConfig;

    expect(component.getColorForScore(scorePerSkill)).toBe('rgb(0, 150, 136)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    } as QuestionPlayerConfig;

    expect(component.getColorForScore(scorePerSkill)).toBe('rgb(217, 92, 12)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    } as QuestionPlayerConfig;

    expect(component.getColorForScore(scorePerSkill)).toBe('rgb(0, 150, 136)');
  });

  it('should get color for score bar based on score per skill', () => {
    let scorePerSkill = {
      score: 5,
      total: 7,
      description: ''
    };
    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'NOT_PASS_FAIL',
        passCutoff: 1.5
      }
    } as QuestionPlayerConfig;

    expect(
      component.getColorForScoreBar(scorePerSkill)).toBe('rgb(32, 93, 134)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    } as QuestionPlayerConfig;

    expect(
      component.getColorForScoreBar(scorePerSkill)).toBe('rgb(217, 92, 12)');

    component.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    } as QuestionPlayerConfig;

    expect(
      component.getColorForScoreBar(scorePerSkill)).toBe('rgb(32, 93, 134)');
  });

  it('should open skill mastery modal when user clicks on skill',
    fakeAsync(() => {
      let masteryPerSkillMapping = {
        skillId1: -0.1
      };
      let skillId;
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

      let mockEmitter = new EventEmitter();
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          skills: null,
          skillIds: skillId,
          masteryPerSkillMapping: masteryPerSkillMapping,
          skillId: 'skillId1',
          userIsLoggedIn: true,
          openConceptCardModal: mockEmitter
        },
        result: Promise.resolve()
      } as NgbModalRef);

      component.masteryPerSkillMapping = {
        skillId1: -0.1
      };
      component.scorePerSkillMapping = {
        skill1: {
          score: 10,
          total: 5,
          description: ''
        },
        skill2: {
          score: 5,
          total: 10,
          description: ''
        }
      };
      tick();
      component.openConceptCardModal(['skill1', 'skill2']);
      tick();
      component.userIsLoggedIn = true;
      tick();

      component.scorePerSkillMapping = {
        skill1: {
          score: 10,
          total: 5,
          description: ''
        },
        skill2: {
          score: 5,
          total: 10,
          description: ''
        }
      };
      component.openSkillMasteryModal('skillId1');
      tick();

      expect(masteryPerSkillMapping).toEqual({skillId1: -0.1});
      expect(component.userIsLoggedIn).toBe(true);
    }));

  it('should close skill master modal when user clicks cancel',
    fakeAsync(() => {
      component.masteryPerSkillMapping = {
        skillId1: -0.1
      };

      let mockEmitter = new EventEmitter();
      spyOn(component, 'openConceptCardModal').and.stub();
      spyOn(ngbModal, 'open').and.callFake((options) => {
        return {
          componentInstance: {
            skills: null,
            skillIds: null,
            masteryPerSkillMapping: null,
            skillId: null,
            userIsLoggedIn: null,
            openConceptCardModal: mockEmitter
          },
          result: Promise.reject()
        } as NgbModalRef;
      });

      component.openSkillMasteryModal('skillId1');
      mockEmitter.emit('skillId1');
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(component.openConceptCardModal).toHaveBeenCalled();
    }));

  it('should prevent page reload or exit in between' +
  'practice session', () => {
    spyOn(preventPageUnloadEventService, 'addListener').and
      .callFake((callback: () => boolean) => callback() as boolean);

    component.ngOnInit();

    expect(preventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });
});
