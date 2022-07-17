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
import { ContextService } from 'services/context.service';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { UserService } from 'services/user.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuestionSuggestionEditorModalComponent } from '../modal-templates/question-suggestion-editor-modal.component';
import constants from 'assets/constants';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillOpportunity } from 'domain/opportunity/skill-opportunity.model';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { QuestionsOpportunitiesSelectDifficultyModalComponent } from 'pages/topic-editor-page/modal-templates/questions-opportunities-select-difficulty-modal.component';
import { AlertsService } from 'services/alerts.service';

interface Opportunities {
  opportunities: SkillOpportunity[];
  more: unknown;
}

@Component({
  selector: 'oppia-question-opportunities',
  templateUrl: './question-opportunities.component.html'
})
export class QuestionOpportunitiesComponent implements OnInit {
  userIsLoggedIn: boolean = false;
  allOpportunities = [];

  constructor(
    private contextService: ContextService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private questionObjectFactory: QuestionObjectFactory,
    private questionUndoRedoService: QuestionUndoRedoService,
    private userService: UserService,
    private ngbModal: NgbModal,
    private siteAnalyticsService: SiteAnalyticsService,
    private alertsService: AlertsService,
  ) {}

  getPresentableOpportunitiesData(
      opportunitiesObject: Opportunities): object {
    let opportunitiesDicts = [];
    let more = opportunitiesObject.more;

    for (let index in opportunitiesObject.opportunities) {
      const opportunity = opportunitiesObject.opportunities[index];
      const heading = opportunity.getOpportunityHeading();
      const subheading = opportunity.getOpportunitySubheading();
      const progressPercentage = (
        (opportunity.getQuestionCount() / constants.MAX_QUESTIONS_PER_SKILL) *
        100).toFixed(2);
      var opportunityDict = {
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
      skill: Skill, skillDifficulty: SkillDifficulty | string): void {
    const skillId = skill.getId();
    const question =
      this.questionObjectFactory.createDefaultQuestion([skillId]);
    const questionId = question.getId();
    const questionStateData = question.getStateData();
    this.questionUndoRedoService.clearChanges();


    let modalRef = this.ngbModal.open(QuestionSuggestionEditorModalComponent, {
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

  loadMoreOpportunities(): unknown {
    return (
      this.contributionOpportunitiesService
        .getMoreSkillOpportunitiesAsync().then(
          this.getPresentableOpportunitiesData.bind(this)));
  }

  loadOpportunities(): unknown {
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
