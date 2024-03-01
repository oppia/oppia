// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for question opportunities.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillOpportunity } from 'domain/opportunity/skill-opportunity.model';
import { QuestionsOpportunitiesSelectDifficultyModalComponent } from 'pages/topic-editor-page/modal-templates/questions-opportunities-select-difficulty-modal.component';
import { QuestionSuggestionEditorModalComponent } from '../modal-templates/question-suggestion-editor-modal.component';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';

interface Opportunity {
  id: string;
  heading: string;
  subheading: string;
  progressPercentage: string;
  actionButtonTitle: string;
}

interface GetSkillOpportunitiesResponse {
  opportunities: SkillOpportunity[];
  more: boolean;
}

interface GetPresentableOpportunitiesResponse {
  opportunitiesDicts: Opportunity[];
  more: boolean;
}

@Component({
  selector: 'oppia-question-opportunities',
  templateUrl: './question-opportunities.component.html'
})
export class QuestionOpportunitiesComponent implements OnInit {
  userIsLoggedIn: boolean = false;
  allOpportunities: Record<string, Opportunity> = {};

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private ngbModal: NgbModal,
    private questionObjectFactory: QuestionObjectFactory,
    private questionUndoRedoService: QuestionUndoRedoService,
    private siteAnalyticsService: SiteAnalyticsService,
    private userService: UserService,
  ) {}

  getPresentableOpportunitiesData(
      opportunitiesObject: GetSkillOpportunitiesResponse
  ): GetPresentableOpportunitiesResponse {
    const opportunitiesDicts: Opportunity[] = [];
    const more = opportunitiesObject.more;

    for (let index in opportunitiesObject.opportunities) {
      const opportunity = opportunitiesObject.opportunities[index];
      const heading = opportunity.getOpportunityHeading();
      const subheading = opportunity.getOpportunitySubheading();
      let maxQuestionsPerSkill = AppConstants.MAX_QUESTIONS_PER_SKILL;
      const progressPercentage = (
        (opportunity.getQuestionCount() / maxQuestionsPerSkill) * 100
      ).toFixed(2);
      const opportunityDict: Opportunity = {
        id: opportunity.id,
        heading: heading,
        subheading: subheading,
        progressPercentage: progressPercentage,
        actionButtonTitle: 'Suggest Question',
      };

      this.allOpportunities[opportunityDict.id] = opportunityDict;
      opportunitiesDicts.push(opportunityDict);
    }

    return {opportunitiesDicts, more};
  }

  createQuestion(
      skill: Skill, skillDifficulty: number): void {
    const skillId = skill.getId();
    const question = (
      this.questionObjectFactory.createDefaultQuestion([skillId]));
    const questionId = question.getId();
    const questionStateData = question.getStateData();
    this.questionUndoRedoService.clearChanges();

    const modalRef = this.ngbModal.open(
      QuestionSuggestionEditorModalComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
      });

    modalRef.componentInstance.suggestionId = '';
    modalRef.componentInstance.question = question;
    modalRef.componentInstance.questionId = questionId;
    modalRef.componentInstance.questionStateData = questionStateData;
    modalRef.componentInstance.skill = skill;
    modalRef.componentInstance.skillDifficulty = skillDifficulty;

    modalRef.result.then(() => {}, () => {
      this.contextService.resetImageSaveDestination();
    });
  }

  loadMoreOpportunities(): Promise<{
    opportunitiesDicts: Opportunity[];
    more: boolean;
  }> {
    return (
      this.contributionOpportunitiesService
        .getMoreSkillOpportunitiesAsync().then(
          this.getPresentableOpportunitiesData.bind(this)));
  }

  loadOpportunities(): Promise<{
    opportunitiesDicts: Opportunity[];
    more: boolean;
  }> {
    return (
      this.contributionOpportunitiesService
        .getSkillOpportunitiesAsync().then(
          this.getPresentableOpportunitiesData.bind(this)));
  }

  onClickSuggestQuestionButton(skillId: string): void {
    if (!this.userIsLoggedIn) {
      this.contributionOpportunitiesService.showRequiresLoginModal();
      return;
    }

    this.siteAnalyticsService.registerContributorDashboardSuggestEvent(
      'Question');

    const modalRef: NgbModalRef = this.ngbModal.open(
      QuestionsOpportunitiesSelectDifficultyModalComponent, {
        backdrop: true,
      });

    modalRef.componentInstance.skillId = skillId;

    modalRef.result.then((result) => {
      if (this.alertsService.warnings.length === 0) {
        this.createQuestion(result.skill, result.skillDifficulty);
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
  }
}

angular.module('oppia').directive('oppiaQuestionOpportunities',
  downgradeComponent({
    component: QuestionOpportunitiesComponent
  }) as angular.IDirectiveFactory);
