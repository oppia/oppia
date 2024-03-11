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
 * @fileoverview Component for showing and reviewing contributions.
 */

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';
import { Subscription, Observable } from 'rxjs';
import { Rubric } from 'domain/skill/rubric.model';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import { Question, QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { ActiveContributionDict, TranslationSuggestionReviewModalComponent } from '../modal-templates/translation-suggestion-review-modal.component';
import { ContributorDashboardConstants } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import { QuestionSuggestionReviewModalComponent } from '../modal-templates/question-suggestion-review-modal.component';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { TranslationTopicService } from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';
import { UserService } from 'services/user.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { OpportunitiesListComponent } from '../opportunities-list/opportunities-list.component';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { CALCULATION_TYPE_WORD, HtmlLengthService } from 'services/html-length.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';

export interface Suggestion {
  change_cmd: {
    skill_id: string;
    content_html: string | string[];
    translation_html: string | string[];
    question_dict: QuestionBackendDict;
    skill_difficulty: string[];
  };
  status: string;
  suggestion_type: string;
  target_id: string;
  suggestion_id: string;
  author_name: string;
  exploration_content_html: string | null;
}

export interface ContributionsSummary {
  id: string;
  heading: string;
  subheading: string;
  labelText: string;
  labelColor: string;
  actionButtonTitle: string;
  translationWordCount?: number;
  isPinned?: boolean;
}

export interface Opportunity {
  id: string;
  heading: string;
  subheading: string;
  labelText: string;
  labelColor: string;
  actionButtonTitle: string;
  translationWordCount?: number;
}

export interface GetOpportunitiesResponse {
  opportunitiesDicts: Opportunity[];
  more: boolean;
}

export interface ContributionDetails {
  skill_description: string;
  skill_rubrics: Rubric[];
  chapter_title: string;
  story_title: string;
  topic_name: string;
}

export interface SuggestionDetails {
  suggestion: Suggestion;
  details: ContributionDetails;
}

export interface TabDetails {
  tabType: string;
  tabSubType: string;
  text: string;
  enabled: boolean;
}

export interface CustomMatSnackBarRef {
  onAction: () => Observable<void>;
}

@Component({
  selector: 'oppia-contributions-and-review',
  templateUrl: './contributions-and-review.component.html'
})
export class ContributionsAndReview
   implements OnInit, OnDestroy {
  @ViewChild('opportunitiesList') opportunitiesListRef!:
    OpportunitiesListComponent;

  directiveSubscriptions = new Subscription();

  SUGGESTION_TYPE_QUESTION: string;
  SUGGESTION_TYPE_TRANSLATE: string;
  ACCOMPLISHMENTS_TYPE_STATS: string;
  ACCOMPLISHMENTS_TYPE_BADGE: string;
  TAB_TYPE_CONTRIBUTIONS: string;
  TAB_TYPE_REVIEWS: string;
  TAB_TYPE_ACCOMPLISHMENTS: string;
  REVIEWABLE_QUESTIONS_SORT_KEYS: string[];
  activeExplorationId: string;
  contributions: Record<string, SuggestionDetails> | object;
  userDetailsLoading: boolean;
  userIsLoggedIn: boolean;
  activeTabType: string;
  activeTabSubtype: string;
  dropdownShown: boolean;
  activeDropdownTabChoice: string;
  reviewTabs: TabDetails[] = [];
  accomplishmentsTabs: TabDetails[] = [];
  contributionTabs: TabDetails[] = [];
  languageCode: string;
  userCreatedQuestionsSortKey: string;
  reviewableQuestionsSortKey: string;
  userCreatedTranslationsSortKey: string;
  reviewableTranslationsSortKey: string;
  tabNameToOpportunityFetchFunction: {
    [key: string]: {
      [key: string]: Function;
    };
  };

  opportunities: ExplorationOpportunitySummary[] = [];

  /**
   * The feature flag state to gate the contributor_dashboard_accomplishments.
   * @type {boolean} - contributor_dashboard_accomplishments - A boolean value.
   * This determines whether the contributor_dashboard_accomplishments feature
   * is enabled.
   */
  accomplishmentsTabIsEnabled: boolean = false;
  defaultContributionType: string = 'translationContribution';
  SUGGESTION_LABELS = {
    review: {
      text: 'Awaiting review',
      color: '#eeeeee'
    },
    accepted: {
      text: 'Accepted',
      color: '#8ed274'
    },
    rejected: {
      text: 'Revisions Requested',
      color: '#e76c8c'
    }
  };

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private contributionAndReviewService: ContributionAndReviewService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private ngbModal: NgbModal,
    private questionObjectFactory: QuestionObjectFactory,
    private skillBackendApiService: SkillBackendApiService,
    private translationLanguageService: TranslationLanguageService,
    private translationTopicService: TranslationTopicService,
    private userService: UserService,
    private featureService: PlatformFeatureService,
    private htmlLengthService: HtmlLengthService,
    private htmlEscaperService: HtmlEscaperService,
    private snackBar: MatSnackBar,
  ) {}

  getQuestionContributionsSummary(
      suggestionIdToSuggestions: Record<string, SuggestionDetails>):
      ContributionsSummary[] {
    const questionContributionsSummaryList = [];
    Object.keys(suggestionIdToSuggestions).forEach((key) => {
      const suggestion = suggestionIdToSuggestions[key].suggestion;
      const details = suggestionIdToSuggestions[key].details;
      let subheading = '';
      if (details === null) {
        subheading = (
          ContributorDashboardConstants.CORRESPONDING_DELETED_OPPORTUNITY_TEXT);
      } else {
        subheading = details.skill_description;
      }

      const requiredData = {
        id: suggestion.suggestion_id,
        heading: this.formatRtePreviewPipe.transform(
          suggestion.change_cmd.question_dict.question_state_data.content.html),
        subheading: subheading,
        labelText: this.SUGGESTION_LABELS[suggestion.status].text,
        labelColor: this.SUGGESTION_LABELS[suggestion.status].color,
        actionButtonTitle: (
          this.activeTabType === this.TAB_TYPE_REVIEWS ? 'Review' : 'View')
      };

      questionContributionsSummaryList.push(requiredData);
    });

    return questionContributionsSummaryList;
  }

  getTranslationContributionsSummary(
      suggestionIdToSuggestions: Record<string, SuggestionDetails>
  ): ContributionsSummary[] {
    const translationContributionsSummaryList = [];

    Object.keys(suggestionIdToSuggestions).forEach((key) => {
      const suggestion = suggestionIdToSuggestions[key].suggestion;
      const details = suggestionIdToSuggestions[key].details;
      let subheading = '';
      if (details === null) {
        subheading = (
          ContributorDashboardConstants.CORRESPONDING_DELETED_OPPORTUNITY_TEXT);
      } else {
        subheading = (
          details.topic_name + ' / ' + details.story_title +
          ' / ' + details.chapter_title);
      }

      const requiredData = {
        id: suggestion.suggestion_id,
        heading: this.getTranslationSuggestionHeading(suggestion),
        subheading: subheading,
        labelText: (
          // Missing exploration content means the translation suggestion is
          // now obsolete. See issue #16022.
          suggestion.exploration_content_html === null ?
          'Obsolete' :
          this.SUGGESTION_LABELS[suggestion.status].text),
        labelColor: this.SUGGESTION_LABELS[suggestion.status].color,
        actionButtonTitle: (
          this.activeTabType === this.TAB_TYPE_REVIEWS ? 'Review' : 'View'),
        translationWordCount: (
          this.isReviewTranslationsTab() && this.activeExplorationId) ? (
            this.getTranslationContentLength(
              suggestion.change_cmd.content_html)) : undefined
      };

      translationContributionsSummaryList.push(requiredData);
    });
    return translationContributionsSummaryList;
  }

  getTranslationContentLength(contentHtml: string | string[]): number {
    if (typeof contentHtml === 'string') {
      return this.htmlLengthService.computeHtmlLength(
        contentHtml, CALCULATION_TYPE_WORD);
    } else if (Array.isArray(contentHtml)) {
      let totalLength = 0;
      for (const str of contentHtml) {
        totalLength += this.htmlLengthService.computeHtmlLength(
          str, CALCULATION_TYPE_WORD);
      }
      return totalLength;
    } else {
      throw new Error(
        'Invalid input: contentHtml must be a string or an array of strings.');
    }
  }

  getTranslationSuggestionHeading(suggestion: Suggestion): string {
    const changeTranslation = suggestion.change_cmd.translation_html;

    return this.htmlEscaperService.escapedStrToUnescapedStr(
      this.formatRtePreviewPipe.transform(
        Array.isArray(changeTranslation) ? ', ' : changeTranslation
      )
    );
  }

  resolveSuggestionSuccess(suggestionId: string): void {
    this.alertsService.addSuccessMessage('Submitted suggestion review.');
    this.contributionOpportunitiesService.removeOpportunitiesEventEmitter.emit(
      [suggestionId]);
  }

  _showQuestionSuggestionModal(
      suggestion: Suggestion,
      suggestionIdToContribution: Record<string, ActiveContributionDict>,
      reviewable: boolean,
      question: Question,
      misconceptionsBySkill: MisconceptionSkillMap): void {
    const targetId = suggestion.target_id;
    const suggestionId = suggestion.suggestion_id;
    const updatedQuestion = (
      question || this.questionObjectFactory.createFromBackendDict(
        suggestion.change_cmd.question_dict));

    const modalRef = this.ngbModal.open(
      QuestionSuggestionReviewModalComponent, {
        backdrop: 'static',
        size: 'lg',
      });

    modalRef.componentInstance.reviewable = reviewable;
    modalRef.componentInstance.question = updatedQuestion;
    modalRef.componentInstance.suggestionId = suggestionId;
    modalRef.componentInstance.suggestionIdToContribution = (
      suggestionIdToContribution
    );
    modalRef.componentInstance.misconceptionsBySkill = (
      misconceptionsBySkill);

    modalRef.componentInstance.editSuggestionEmitter.subscribe((value) => {
      this.openQuestionSuggestionModal(
        value.suggestionId,
        value.suggestion,
        value.reviewable);
    });

    modalRef.result.then((result) => {
      this.contributionAndReviewService.reviewSkillSuggestion(
        targetId, suggestionId, result.action, result.reviewMessage,
        result.skillDifficulty, this.resolveSuggestionSuccess.bind(this),
        () => {
          this.alertsService.addInfoMessage('Failed to submit suggestion.');
        });
    }, () => {});
  }

  _showTranslationSuggestionModal(
      suggestionIdToContribution: Record<string, ActiveContributionDict>,
      initialSuggestionId: string, reviewable: boolean): void {
    const details = (
       this.contributions[initialSuggestionId].details as ContributionDetails);
    const subheading = (
      details.topic_name + ' / ' + details.story_title +
       ' / ' + details.chapter_title);

    const modalRef: NgbModalRef = this.ngbModal.open(
      TranslationSuggestionReviewModalComponent, {
        backdrop: 'static',
        windowClass: 'oppia-translation-suggestion-review-modal',
        size: 'lg',
      });

    modalRef.componentInstance.suggestionIdToContribution = (
      cloneDeep(suggestionIdToContribution));
    modalRef.componentInstance.initialSuggestionId = initialSuggestionId;
    modalRef.componentInstance.reviewable = reviewable;
    modalRef.componentInstance.subheading = subheading;

    modalRef.result.then((resolvedSuggestionIds) => {
      this.contributionOpportunitiesService.
        removeOpportunitiesEventEmitter.emit(
          resolvedSuggestionIds);
      resolvedSuggestionIds.forEach((suggestionId) => {
        delete this.contributions[suggestionId];
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  isActiveTab(tabType: string, subType: string): boolean {
    return (
      this.activeTabType === tabType &&
      this.activeTabSubtype === subType);
  }

  isReviewTranslationsTab(): boolean {
    return (
      this.activeTabType === this.TAB_TYPE_REVIEWS &&
      this.activeTabSubtype === this.SUGGESTION_TYPE_TRANSLATE);
  }

  isReviewQuestionsTab(): boolean {
    return (
      this.activeTabType === this.TAB_TYPE_REVIEWS &&
      this.activeTabSubtype === this.SUGGESTION_TYPE_QUESTION);
  }

  openQuestionSuggestionModal(
      suggestionId: string,
      suggestion: Suggestion,
      reviewable: boolean,
      question = undefined): void {
    const suggestionIdToContribution = {};
    for (let suggestionId in this.contributions) {
      var contribution = this.contributions[suggestionId];
      suggestionIdToContribution[suggestionId] = contribution;
    }
    const skillId = suggestion.change_cmd.skill_id;

    this.contextService.setCustomEntityContext(
      AppConstants.IMAGE_CONTEXT.QUESTION_SUGGESTIONS, skillId);

    this.skillBackendApiService.fetchSkillAsync(skillId).then((skillDict) => {
      const misconceptionsBySkill = {};
      const skill = skillDict.skill;
      misconceptionsBySkill[skill.getId()] = skill.getMisconceptions();
      this._showQuestionSuggestionModal(
        suggestion, suggestionIdToContribution, reviewable,
        question,
        misconceptionsBySkill);
    });
  }

  onClickViewSuggestion(suggestionId: string): void {
    const suggestion = this.contributions[suggestionId].suggestion;
    const reviewable = this.activeTabType === this.TAB_TYPE_REVIEWS;
    if (suggestion.suggestion_type === this.SUGGESTION_TYPE_QUESTION) {
      this.openQuestionSuggestionModal(suggestionId, suggestion, reviewable);
    }
    if (suggestion.suggestion_type === this.SUGGESTION_TYPE_TRANSLATE) {
      const suggestionIdToContribution = {};
      for (let suggestionId in this.contributions) {
        const contribution = this.contributions[suggestionId];
        suggestionIdToContribution[suggestionId] = contribution;
      }
      this.contextService.setCustomEntityContext(
        AppConstants.IMAGE_CONTEXT.EXPLORATION_SUGGESTIONS,
        suggestion.target_id);
      this._showTranslationSuggestionModal(
        suggestionIdToContribution, suggestionId, reviewable);
    }
  }

  getContributionSummaries(
      suggestionIdToSuggestions: Record<string, SuggestionDetails>
  ): ContributionsSummary[] {
    if (this.activeTabSubtype === this.SUGGESTION_TYPE_TRANSLATE) {
      return this.getTranslationContributionsSummary(suggestionIdToSuggestions);
    } else if (this.activeTabSubtype === this.SUGGESTION_TYPE_QUESTION) {
      return this.getQuestionContributionsSummary(suggestionIdToSuggestions);
    }
  }

  getActiveDropdownTabText(tabType: string, subType: string): string {
    const tabs = this.contributionTabs.concat(
      this.reviewTabs, this.accomplishmentsTabs);
    const tab = tabs.find(
      (tab) => tab.tabType === tabType && tab.tabSubType === subType);

    if (!tab) {
      throw new Error('Cannot find the tab');
    }

    return tab.text;
  }

  switchToTab(tabType: string, subType: string): void {
    this.activeTabType = tabType;
    this.dropdownShown = false;
    this.activeDropdownTabChoice = this.getActiveDropdownTabText(
      tabType, subType);

    this.activeTabSubtype = subType;
    this.contributionAndReviewService.setActiveTabType(tabType);
    this.contributionAndReviewService.setActiveSuggestionType(subType);
    if (!this.isAccomplishmentsTabActive()) {
      this.activeExplorationId = null;
      this.contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.emit();
    }
  }

  toggleDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
  }

  loadReviewableTranslationOpportunities(): Promise<GetOpportunitiesResponse> {
    return this.contributionOpportunitiesService
      .getReviewableTranslationOpportunitiesAsync(
        this.translationTopicService.getActiveTopicName(),
        this.languageCode)
      .then((response) => {
        const opportunitiesDicts = [];
        response.opportunities.forEach(opportunity => {
          const opportunityDict = {
            id: opportunity.getExplorationId(),
            heading: opportunity.getOpportunityHeading(),
            subheading: opportunity.getOpportunitySubheading(),
            actionButtonTitle: 'Translations',
            isPinned: opportunity.isPinned,
            topicName: opportunity.topicName
          };
          opportunitiesDicts.push(opportunityDict);
        });
        this.opportunities = opportunitiesDicts;
        return {
          opportunitiesDicts: opportunitiesDicts,
          more: response.more
        };
      });
  }

  pinReviewableTranslationOpportunity(
      dict: Record<string, string>
  ): void {
    const topicName = dict.topic_name;
    const explorationId = dict.exploration_id;
    const existingPinnedOpportunity = Object.values(this.opportunities).find(
      (opportunity: {
        topicName: string;
        isPinned: boolean;
      }) => (
        opportunity.topicName === topicName && opportunity.isPinned)
    );

    if (existingPinnedOpportunity) {
      this.openSnackbarWithAction(
        topicName, explorationId,
        'A pinned opportunity already exists for this topic and language.',
        'Pin Anyway'
      );
    } else {
      this.contributionOpportunitiesService.
        pinReviewableTranslationOpportunityAsync(
          topicName, this.languageCode, explorationId);
    }
  }

  unpinReviewableTranslationOpportunity(
      dict: Record<string, string>
  ): void {
    this.contributionOpportunitiesService.
      unpinReviewableTranslationOpportunityAsync(
        dict.topic_name, this.languageCode, dict.exploration_id);
  }

  onClickReviewableTranslations(explorationId: string): void {
    this.activeExplorationId = explorationId;
  }

  onClickBackToReviewableLessons(): void {
    this.activeExplorationId = null;
  }

  loadContributions(shouldResetOffset: boolean):
    Promise<GetOpportunitiesResponse> {
    this.contributions = {};
    if (!this.activeTabType || !this.activeTabSubtype) {
      return new Promise((resolve, reject) => {
        resolve({opportunitiesDicts: [], more: false});
      });
    }
    const fetchFunction = this.tabNameToOpportunityFetchFunction[
      this.activeTabSubtype][this.activeTabType];

    return fetchFunction(shouldResetOffset).then((response) => {
      Object.keys(response.suggestionIdToDetails).forEach(id => {
        this.contributions[id] = response.suggestionIdToDetails[id];
      });
      return {
        opportunitiesDicts: this.getContributionSummaries(
          response.suggestionIdToDetails),
        more: response.more
      };
    });
  }

  loadOpportunities(): Promise<GetOpportunitiesResponse> {
    return this.loadContributions(/* Param shouldResetOffset= */ true);
  }

  loadMoreOpportunities(): Promise<GetOpportunitiesResponse> {
    return this.loadContributions(/* Param shouldResetOffset= */ false);
  }

  closeDropdownWhenClickedOutside(clickEvent: {target: Node}): void {
    const dropdown = document
      .querySelector('.oppia-contributions-dropdown-container');
    if (!dropdown) {
      return;
    }

    const clickOccurredWithinDropdown =
      dropdown.contains(clickEvent.target);
    if (clickOccurredWithinDropdown) {
      return;
    }

    this.dropdownShown = false;
  }

  isAccomplishmentsTabActive(): boolean {
    return this.activeTabType === this.TAB_TYPE_ACCOMPLISHMENTS;
  }

  setReviewableQuestionsSortKey(sortKey: string): void {
    this.reviewableQuestionsSortKey = sortKey;
    this.contributionOpportunitiesService
      .reloadOpportunitiesEventEmitter.emit();
  }

  ngOnInit(): void {
    this.SUGGESTION_TYPE_QUESTION = 'add_question';
    this.SUGGESTION_TYPE_TRANSLATE = 'translate_content';
    this.ACCOMPLISHMENTS_TYPE_STATS = 'stats';
    this.ACCOMPLISHMENTS_TYPE_BADGE = 'badges';
    this.TAB_TYPE_CONTRIBUTIONS = 'contributions';
    this.TAB_TYPE_REVIEWS = 'reviews';
    this.TAB_TYPE_ACCOMPLISHMENTS = 'accomplishments';
    this.REVIEWABLE_QUESTIONS_SORT_KEYS = [
      AppConstants.SUGGESTIONS_SORT_KEY_DATE];
    this.userCreatedQuestionsSortKey = AppConstants.SUGGESTIONS_SORT_KEY_DATE;
    this.reviewableQuestionsSortKey = AppConstants.SUGGESTIONS_SORT_KEY_DATE;
    this.userCreatedTranslationsSortKey = (
      AppConstants.SUGGESTIONS_SORT_KEY_DATE);
    this.reviewableTranslationsSortKey = AppConstants.SUGGESTIONS_SORT_KEY_DATE;
    this.activeExplorationId = null;
    this.contributions = {};
    this.userDetailsLoading = true;
    this.userIsLoggedIn = false;
    this.languageCode = (
      this.translationLanguageService.getActiveLanguageCode());
    this.activeTabType = '';
    this.activeTabSubtype = '';
    this.dropdownShown = false;
    this.activeDropdownTabChoice = '';
    this.reviewTabs = [];
    this.accomplishmentsTabIsEnabled = (
      this.featureService.status.ContributorDashboardAccomplishments.isEnabled);
    this.contributionTabs = [
      {
        tabType: this.TAB_TYPE_CONTRIBUTIONS,
        tabSubType: this.SUGGESTION_TYPE_QUESTION,
        text: 'Questions',
        enabled: false
      },
      {
        tabType: this.TAB_TYPE_CONTRIBUTIONS,
        tabSubType: this.SUGGESTION_TYPE_TRANSLATE,
        text: 'Translations',
        enabled: true
      }
    ];
    this.accomplishmentsTabs = [
      {
        tabSubType: 'stats',
        tabType: this.TAB_TYPE_ACCOMPLISHMENTS,
        text: 'Contribution Stats',
        enabled: true
      },
      {
        tabSubType: 'badges',
        tabType: this.TAB_TYPE_ACCOMPLISHMENTS,
        text: 'Badges',
        enabled: true
      }
    ];

    // Reset active exploration when changing topics.
    this.directiveSubscriptions.add(
      this.translationTopicService.onActiveTopicChanged.subscribe(
        () => {
          this.activeExplorationId = null;
          this.loadOpportunities();
        }));

    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
      this.userDetailsLoading = false;
      if (this.userIsLoggedIn) {
        this.userService.getUserContributionRightsDataAsync().then(
          (userContributionRights) => {
            const userCanReviewTranslationSuggestionsInLanguages = (
              userContributionRights
                .can_review_translation_for_language_codes);
            const userCanReviewQuestionSuggestions = (
              userContributionRights.can_review_questions);
            const userReviewableSuggestionTypes = [];
            const userCanSuggestQuestions = (
              userContributionRights.can_suggest_questions);
            for (let index in this.contributionTabs) {
              if (this.contributionTabs[index].tabSubType === (
                this.SUGGESTION_TYPE_QUESTION)) {
                this.contributionTabs[index].enabled = (
                  userCanSuggestQuestions);
              }
            }
            if (userCanReviewQuestionSuggestions) {
              this.reviewTabs.push({
                tabType: this.TAB_TYPE_REVIEWS,
                tabSubType: this.SUGGESTION_TYPE_QUESTION,
                text: 'Review Questions',
                enabled: false
              });
              userReviewableSuggestionTypes.push(this.SUGGESTION_TYPE_QUESTION);
            }
            if (
              userCanReviewTranslationSuggestionsInLanguages
                .length > 0) {
              this.reviewTabs.push({
                tabType: this.TAB_TYPE_REVIEWS,
                tabSubType: this.SUGGESTION_TYPE_TRANSLATE,
                text: 'Review Translations',
                enabled: false
              });
              userReviewableSuggestionTypes.push(
                this.SUGGESTION_TYPE_TRANSLATE);
            }
            if (userReviewableSuggestionTypes.length > 0) {
              this.switchToTab(
                this.TAB_TYPE_REVIEWS, userReviewableSuggestionTypes[0]);
            } else if (userCanSuggestQuestions) {
              this.switchToTab(
                this.TAB_TYPE_CONTRIBUTIONS, this.SUGGESTION_TYPE_QUESTION);
            } else {
              this.switchToTab(
                this.TAB_TYPE_CONTRIBUTIONS, this.SUGGESTION_TYPE_TRANSLATE);
            }
          });
      }
    });

    this.tabNameToOpportunityFetchFunction = {
      [this.SUGGESTION_TYPE_QUESTION]: {
        [this.TAB_TYPE_CONTRIBUTIONS]: shouldResetOffset => {
          return this.contributionAndReviewService
            .getUserCreatedQuestionSuggestionsAsync(
              shouldResetOffset, this.userCreatedQuestionsSortKey);
        },
        [this.TAB_TYPE_REVIEWS]: shouldResetOffset => {
          return this.contributionAndReviewService
            .getReviewableQuestionSuggestionsAsync(
              shouldResetOffset,
              this.reviewableQuestionsSortKey,
              this.translationTopicService.getActiveTopicName());
        }
      },
      [this.SUGGESTION_TYPE_TRANSLATE]: {
        [this.TAB_TYPE_CONTRIBUTIONS]: shouldResetOffset => {
          return this.contributionAndReviewService
            .getUserCreatedTranslationSuggestionsAsync(
              shouldResetOffset, this.userCreatedTranslationsSortKey);
        },
        [this.TAB_TYPE_REVIEWS]: shouldResetOffset => {
          return this.contributionAndReviewService
            .getReviewableTranslationSuggestionsAsync(
              shouldResetOffset,
              this.reviewableTranslationsSortKey,
              this.activeExplorationId);
        }
      }
    };

    $(document).on('click', this.closeDropdownWhenClickedOutside);
  }

  openSnackbarWithAction(
      topicName: string,
      explorationId: string,
      message: string,
      actionText: string
  ): void {
    const snackBarRef: CustomMatSnackBarRef = this.snackBar.open(
      message, actionText, {
        duration: 3000,
      });

    this.handleSnackbarAction(snackBarRef, topicName, explorationId);
  }

  private handleSnackbarAction(
      snackBarRef: CustomMatSnackBarRef,
      topicName: string,
      explorationId: string
  ): void {
    snackBarRef.onAction().subscribe(() => {
      this.contributionOpportunitiesService
        .pinReviewableTranslationOpportunityAsync(
          topicName,
          this.languageCode,
          explorationId
        );
    });
  }

  onChangeLanguage(languageCode: string): void {
    this.languageCode = languageCode;
    this.opportunitiesListRef.onChangeLanguage(languageCode);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    $(document).off('click', this.closeDropdownWhenClickedOutside);
  }
}

angular.module('oppia').directive('oppiaContributionsAndReview',
  downgradeComponent({
    component: ContributionsAndReview
  }) as angular.IDirectiveFactory);
