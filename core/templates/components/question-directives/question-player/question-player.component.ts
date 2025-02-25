// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the questions player.
 */

import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SecurityContext,
} from '@angular/core';
import {Location} from '@angular/common';
import {DomSanitizer} from '@angular/platform-browser';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';
import {SkillMasteryBackendApiService} from 'domain/skill/skill-mastery-backend-api.service';
import {ExplorationPlayerStateService} from 'pages/exploration-player-page/services/exploration-player-state.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {QuestionPlayerConceptCardModalComponent} from './question-player-concept-card-modal.component';
import {QuestionPlayerConstants} from 'components/question-directives/question-player/question-player.constants';
import {SkillMasteryModalComponent} from './skill-mastery-modal.component';
import {UserService} from 'services/user.service';
import {QuestionPlayerStateService} from './services/question-player-state.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ContextService} from 'services/context.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UrlService} from 'services/contextual/url.service';

export interface QuestionData {
  linkedSkillIds: string[];
  viewedSolution: boolean;
  answers: Answer[];
  usedHints: string[];
}

interface ActionButton {
  type: string;
  url: string;
}

export interface Answer {
  isCorrect: boolean;
  timestamp: number;
  taggedSkillMisconceptionId: string;
}

interface MasteryChangePerQuestion {
  [skillID: string]: number;
}

interface ScorePerSkill {
  score: number;
  total: number;
  description: string;
}

interface ScorePerSkillMapping {
  [skillId: string]: ScorePerSkill;
}

interface MasteryPerSkillMapping {
  [key: string]: number;
}

export interface QuestionPlayerConfig {
  resultActionButtons: string[];
  questionPlayerMode: {
    modeType: string;
    passCutoff: number;
  };
  skillDescriptions: string[];
  skillList: string[];
}

@Component({
  selector: 'oppia-question-player',
  templateUrl: './question-player.component.html',
})
export class QuestionPlayerComponent implements OnInit, OnDestroy {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() questionPlayerConfig!: QuestionPlayerConfig;
  resultsLoaded!: boolean;
  currentQuestion!: number;
  totalQuestions!: number;
  currentProgress!: number;
  totalScore!: number;
  allQuestions!: number;
  finalCorrect!: number;
  scorePerSkillMapping!: ScorePerSkillMapping;
  testIsPassed!: boolean;
  masteryPerSkillMapping!: MasteryPerSkillMapping;
  failedSkillIds!: string[];
  userIsLoggedIn!: boolean;
  canCreateCollections!: boolean;
  componentSubscription = new Subscription();

  constructor(
    private contextService: ContextService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private location: Location,
    private ngbModal: NgbModal,
    private playerPositionService: PlayerPositionService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private questionPlayerStateService: QuestionPlayerStateService,
    private skillMasteryBackendApiService: SkillMasteryBackendApiService,
    private userService: UserService,
    private windowRef: WindowRef,
    private _sanitizer: DomSanitizer,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlService: UrlService
  ) {}

  calculateScores(questionStateData: {[key: string]: QuestionData}): void {
    this.createScorePerSkillMapping();
    this.resultsLoaded = false;
    let totalQuestions = Object.keys(questionStateData).length;
    for (let question in questionStateData) {
      let questionData = questionStateData[question];
      let totalHintsPenalty = 0.0;
      let wrongAnswerPenalty = 0.0;
      if (questionData.answers) {
        wrongAnswerPenalty =
          (questionData.answers.length - 1) *
          QuestionPlayerConstants.WRONG_ANSWER_PENALTY;
      }
      if (questionData.usedHints) {
        totalHintsPenalty =
          questionData.usedHints.length *
          QuestionPlayerConstants.VIEW_HINT_PENALTY;
      }
      let questionScore = Number(
        QuestionPlayerConstants.MAX_SCORE_PER_QUESTION
      );
      if (questionData.viewedSolution) {
        questionScore = 0.0;
      } else {
        // If questionScore goes negative, set it to 0.
        questionScore = Math.max(
          0,
          questionScore - totalHintsPenalty - wrongAnswerPenalty
        );
      }
      // Calculate total score.
      this.totalScore += questionScore;

      // Increment number of questions.
      this.allQuestions += 1;

      // Calculate scores per skill.
      if (questionData.linkedSkillIds) {
        for (let i = 0; i < questionData.linkedSkillIds.length; i++) {
          let skillId = questionData.linkedSkillIds[i];
          if (!(skillId in this.scorePerSkillMapping)) {
            continue;
          }
          this.scorePerSkillMapping[skillId].score += questionScore;
          this.scorePerSkillMapping[skillId].total += 1.0;
        }
      }
    }
    this.finalCorrect = this.totalScore;
    this.totalScore = Math.round((this.totalScore * 100) / totalQuestions);
    this.resultsLoaded = true;
    this.questionPlayerStateService.resultsPageIsLoadedEventEmitter.emit(
      this.resultsLoaded
    );
  }

  getMasteryChangeForWrongAnswers(
    answers: Answer[],
    masteryChangePerQuestion: MasteryChangePerQuestion
  ): MasteryChangePerQuestion {
    answers.forEach(answer => {
      if (!answer.isCorrect) {
        if (answer.taggedSkillMisconceptionId) {
          let skillId = answer.taggedSkillMisconceptionId.split('-')[0];
          if (masteryChangePerQuestion.hasOwnProperty(skillId)) {
            masteryChangePerQuestion[skillId] -=
              QuestionPlayerConstants.WRONG_ANSWER_PENALTY_FOR_MASTERY;
          }
        } else {
          for (let masterySkillId in masteryChangePerQuestion) {
            masteryChangePerQuestion[masterySkillId] -=
              QuestionPlayerConstants.WRONG_ANSWER_PENALTY_FOR_MASTERY;
          }
        }
      }
    });

    return masteryChangePerQuestion;
  }

  updateMasteryPerSkillMapping(
    masteryChangePerQuestion: MasteryChangePerQuestion
  ): void {
    for (let skillId in masteryChangePerQuestion) {
      if (!(skillId in this.masteryPerSkillMapping)) {
        continue;
      }
      // Set the lowest bound of mastery change for each question.
      this.masteryPerSkillMapping[skillId] += Math.max(
        masteryChangePerQuestion[skillId],
        QuestionPlayerConstants.MAX_MASTERY_LOSS_PER_QUESTION
      );
    }
  }

  calculateMasteryDegrees(questionStateData: {
    [key: string]: QuestionData;
  }): void {
    this.createMasteryPerSkillMapping();

    for (let question in questionStateData) {
      let questionData = questionStateData[question];
      if (questionData.linkedSkillIds) {
        let masteryChangePerQuestion =
          this.createMasteryChangePerQuestion(questionData);

        if (questionData.viewedSolution) {
          for (let skillId in masteryChangePerQuestion) {
            masteryChangePerQuestion[skillId] =
              QuestionPlayerConstants.MAX_MASTERY_LOSS_PER_QUESTION;
          }
        } else {
          if (questionData.usedHints) {
            for (let skillId in masteryChangePerQuestion) {
              masteryChangePerQuestion[skillId] -=
                questionData.usedHints.length *
                QuestionPlayerConstants.VIEW_HINT_PENALTY_FOR_MASTERY;
            }
          }
          if (questionData.answers) {
            masteryChangePerQuestion = this.getMasteryChangeForWrongAnswers(
              questionData.answers,
              masteryChangePerQuestion
            );
          }
        }
        this.updateMasteryPerSkillMapping(masteryChangePerQuestion);
      }
    }

    this.skillMasteryBackendApiService.updateSkillMasteryDegreesAsync(
      this.masteryPerSkillMapping
    );
  }

  hasUserPassedTest(): boolean {
    let testIsPassed: boolean = true;
    let failedSkillIds: string[] = [];
    if (this.isInPassOrFailMode()) {
      Object.keys(this.scorePerSkillMapping).forEach(skillId => {
        let correctionRate =
          this.scorePerSkillMapping[skillId].score /
          this.scorePerSkillMapping[skillId].total;
        if (
          correctionRate <
          this.questionPlayerConfig.questionPlayerMode.passCutoff
        ) {
          testIsPassed = false;
          failedSkillIds.push(skillId);
        }
      });
    }

    if (!testIsPassed) {
      this.questionPlayerConfig.resultActionButtons = [];
      this.failedSkillIds = failedSkillIds;
    }
    return testIsPassed;
  }

  getScorePercentage(scorePerSkill: ScorePerSkill): number {
    return (scorePerSkill.score / scorePerSkill.total) * 100;
  }

  getColorForScore(scorePerSkill: ScorePerSkill): string {
    if (!this.isInPassOrFailMode()) {
      return QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR;
    }
    let correctionRate = scorePerSkill.score / scorePerSkill.total;
    if (
      correctionRate >= this.questionPlayerConfig.questionPlayerMode.passCutoff
    ) {
      return QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR;
    } else {
      return QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR;
    }
  }

  getColorForScoreBar(scorePerSkill: ScorePerSkill): string {
    if (!this.isInPassOrFailMode()) {
      return QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_BAR;
    }
    let correctionRate = scorePerSkill.score / scorePerSkill.total;
    if (
      correctionRate >= this.questionPlayerConfig.questionPlayerMode.passCutoff
    ) {
      return QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_BAR;
    } else {
      return QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR;
    }
  }

  reviewConceptCardAndRetryTest(): void {
    if (!this.failedSkillIds || this.failedSkillIds.length === 0) {
      throw new Error('No failed skills');
    }

    this.openConceptCardModal(this.failedSkillIds);
  }

  openSkillMasteryModal(skillId: string): void {
    let masteryPerSkillMapping = this.masteryPerSkillMapping;

    let modelRef = this.ngbModal.open(SkillMasteryModalComponent, {
      backdrop: true,
    });

    modelRef.componentInstance.masteryPerSkillMapping = masteryPerSkillMapping;
    modelRef.componentInstance.skillId = skillId;
    modelRef.componentInstance.userIsLoggedIn = this.userIsLoggedIn;
    modelRef.componentInstance.openConceptCardModal.subscribe(
      (value: string[]) => {
        this.openConceptCardModal(value);
      }
    );

    modelRef.result.then(
      () => {},
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  reviewLowestScoredSkillsModal(): void {
    let reviewLowestScoredSkill = this.getWorstSkillIds();
    if (reviewLowestScoredSkill.length !== 0) {
      this.openConceptCardModal(reviewLowestScoredSkill);
    }
  }

  getClassNameForType(actionButtonType: string): string | null {
    if (actionButtonType === 'REVIEW_LOWEST_SCORED_SKILL') {
      return 'review-lowest-scored-skill-';
    }
    if (actionButtonType === 'RETRY_SESSION') {
      return 'new-session-';
    }
    if (actionButtonType === 'DASHBOARD') {
      return 'my-dashboard-';
    }
    return null;
  }

  updateCurrentQuestion(currentQuestion: number): void {
    this.currentQuestion = currentQuestion;
    this.updateQuestionProgression();
  }

  updateTotalQuestions(totalQuestions: number): void {
    this.totalQuestions = totalQuestions;
    this.updateQuestionProgression();
  }

  updateQuestionProgression(): void {
    if (this.getTotalQuestions() > 0) {
      this.currentProgress =
        (this.getCurrentQuestion() * 100) / this.getTotalQuestions();
    } else {
      this.currentProgress = 0;
    }
  }

  getCurrentQuestion(): number {
    return this.currentQuestion;
  }

  getTotalQuestions(): number {
    return this.totalQuestions;
  }

  isInPassOrFailMode(): boolean {
    return (
      this.questionPlayerConfig.questionPlayerMode &&
      this.questionPlayerConfig.questionPlayerMode.modeType ===
        QuestionPlayerConstants.QUESTION_PLAYER_MODE.PASS_FAIL_MODE
    );
  }

  createScorePerSkillMapping(): void {
    let scorePerSkillMapping: Record<string, ScorePerSkill> = {};

    if (this.questionPlayerConfig.skillList) {
      for (let i = 0; i < this.questionPlayerConfig.skillList.length; i++) {
        let skillId = this.questionPlayerConfig.skillList[i];
        let description = this.questionPlayerConfig.skillDescriptions[i];
        scorePerSkillMapping[skillId] = {
          description: description,
          score: 0.0,
          total: 0.0,
        };
      }
    }

    this.scorePerSkillMapping = scorePerSkillMapping;
  }

  createMasteryPerSkillMapping(): void {
    let masteryPerSkillMapping: Record<string, number> = {};
    if (this.questionPlayerConfig.skillList) {
      for (let i = 0; i < this.questionPlayerConfig.skillList.length; i++) {
        let skillId = this.questionPlayerConfig.skillList[i];
        masteryPerSkillMapping[skillId] = 0.0;
      }
    }
    this.masteryPerSkillMapping = masteryPerSkillMapping;
  }

  createMasteryChangePerQuestion(
    questionData: QuestionData
  ): MasteryChangePerQuestion {
    let masteryChangePerQuestion: Record<string, number> = {};
    for (let i = 0; i < questionData.linkedSkillIds.length; i++) {
      let skillId = questionData.linkedSkillIds[i];
      masteryChangePerQuestion[skillId] =
        QuestionPlayerConstants.MAX_MASTERY_GAIN_PER_QUESTION;
    }
    return masteryChangePerQuestion;
  }

  getActionButtonInnerClass(actionButtonType: string): string {
    let className = this.getClassNameForType(actionButtonType);

    if (className) {
      return className + 'inner';
    }

    return '';
  }

  getActionButtonIconHtml(actionButtonType: string): string {
    let iconHtml = '';
    if (actionButtonType === 'REVIEW_LOWEST_SCORED_SKILL') {
      iconHtml =
        '<i class="material-icons md-18 ' + 'action-button-icon">&#xe869</i>';
    } else if (actionButtonType === 'RETRY_SESSION') {
      iconHtml =
        '<i class="material-icons md-18 ' + 'action-button-icon">&#xE5D5</i>';
    } else if (actionButtonType === 'DASHBOARD') {
      iconHtml =
        '<i class="material-icons md-18 ' + 'action-button-icon">&#xE88A</i>';
    }
    return this._sanitizer.sanitize(SecurityContext.HTML, iconHtml) as string;
  }

  performAction(actionButton: ActionButton): void {
    if (actionButton.type === 'REVIEW_LOWEST_SCORED_SKILL') {
      this.reviewLowestScoredSkillsModal();
    } else if (actionButton.url) {
      this.windowRef.nativeWindow.location.href = actionButton.url;
    }
  }

  showActionButtonsFooter(): boolean {
    return (
      this.questionPlayerConfig.resultActionButtons &&
      this.questionPlayerConfig.resultActionButtons.length > 0
    );
  }

  getWorstSkillIds(): string[] {
    let minScore: number = 0.95;
    let worstSkillIds: [number, string][] = [];
    Object.keys(this.scorePerSkillMapping).forEach(skillId => {
      let skillScoreData = this.scorePerSkillMapping[skillId];
      let scorePercentage = skillScoreData.score / skillScoreData.total;
      if (scorePercentage < minScore) {
        worstSkillIds.push([scorePercentage, skillId]);
      }
    });

    return worstSkillIds
      .sort()
      .slice(0, 3)
      .map(info => info[1]);
  }

  openConceptCardModal(skillIds: string[]): void {
    let skills: string[] = [];
    skillIds.forEach(skillId => {
      skills.push(this.scorePerSkillMapping[skillId].description);
    });

    const modelRef = this.ngbModal.open(
      QuestionPlayerConceptCardModalComponent,
      {
        backdrop: true,
      }
    );

    modelRef.componentInstance.skills = skills;
    modelRef.componentInstance.skillIds = skillIds;

    modelRef.result.then(
      () => {},
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  initResults(): void {
    this.resultsLoaded = false;
    this.currentQuestion = 0;
    this.totalQuestions = 0;
    this.currentProgress = 0;
    this.totalScore = 0.0;
    this.allQuestions = 0;
    this.finalCorrect = 0.0;
    this.scorePerSkillMapping = {};
    this.testIsPassed = true;
  }

  ngOnInit(): void {
    {
      this.componentSubscription.add(
        this.playerPositionService.onCurrentQuestionChange.subscribe(result =>
          this.updateCurrentQuestion(result + 1)
        )
      );

      this.componentSubscription.add(
        this.explorationPlayerStateService.onTotalQuestionsReceived.subscribe(
          result => this.updateTotalQuestions(result)
        )
      );

      this.componentSubscription.add(
        this.questionPlayerStateService.onQuestionSessionCompleted.subscribe(
          result => {
            this.windowRef.nativeWindow.location.hash =
              QuestionPlayerConstants.HASH_PARAM +
              encodeURIComponent(JSON.stringify(result));
            this.contextService.removeCustomEntityContext();
          }
        )
      );

      this.location.onUrlChange(() => {
        let hashContent = this.windowRef.nativeWindow.location.hash;

        if (
          !hashContent ||
          hashContent.indexOf(QuestionPlayerConstants.HASH_PARAM) === -1
        ) {
          return;
        }

        let resultHashString = decodeURIComponent(
          hashContent.substring(
            hashContent.indexOf(QuestionPlayerConstants.HASH_PARAM) +
              QuestionPlayerConstants.HASH_PARAM.length
          )
        );

        if (resultHashString) {
          this.initResults();
          let questionStateData = JSON.parse(resultHashString);
          this.calculateScores(questionStateData);
          if (this.userIsLoggedIn) {
            this.calculateMasteryDegrees(questionStateData);
          }

          this.testIsPassed = this.hasUserPassedTest();
          this.siteAnalyticsService.registerPracticeSessionEndEvent(
            this.urlService.getClassroomUrlFragmentFromLearnerUrl(),
            this.urlService.getTopicUrlFragmentFromLearnerUrl(),
            Object.keys(this.scorePerSkillMapping).toString(),
            Object.keys(questionStateData).length,
            this.totalScore
          );
        }
      });

      this.userIsLoggedIn = false;
      this.userService.getUserInfoAsync().then(userInfo => {
        this.canCreateCollections = userInfo.canCreateCollections();
        this.userIsLoggedIn = userInfo.isLoggedIn();
      });
      // The initResults function is written separately since it is also
      // called in this.$on when some external events are triggered.
      this.initResults();
      this.questionPlayerStateService.resultsPageIsLoadedEventEmitter.emit(
        this.resultsLoaded
      );
      this.preventPageUnloadEventService.addListener(() => {
        return this.getCurrentQuestion() > 1;
      });
    }
  }

  ngOnDestroy(): void {
    this.componentSubscription.unsubscribe();
  }
}
