// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { WindowRef } from 'services/contextual/window-ref.service';
import { initializeGoogleAnalytics } from 'google-analytics.initializer';

// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.

@Injectable({
  providedIn: 'root'
})
export class SiteAnalyticsService {
  static googleAnalyticsIsInitialized: boolean = false;

  constructor(private windowRef: WindowRef) {
    if (!SiteAnalyticsService.googleAnalyticsIsInitialized) {
      // This ensures that google analytics is initialized whenever this
      // service is used.
      initializeGoogleAnalytics();
      SiteAnalyticsService.googleAnalyticsIsInitialized = true;
    }
  }

  // For definitions of the various arguments, please see:
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
  _sendEventToLegacyGoogleAnalytics(
      eventCategory: string, eventAction: string, eventLabel: string): void {
    this.windowRef.nativeWindow.gtag('event', eventAction, {
      event_category: eventCategory,
      event_label: eventLabel
    });
  }

  _sendEventToGoogleAnalytics(
      eventName: string,
      eventParameters: Object = {}
  ): void {
    this.windowRef.nativeWindow.gtag(
      'event',
      eventName,
      eventParameters
    );
  }

  // The srcElement refers to the element on the page that is clicked.
  registerStartLoginEvent(srcElement: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'LoginButton', 'click',
      this.windowRef.nativeWindow.location.pathname + ' ' + srcElement);
    this._sendEventToGoogleAnalytics('login', {
      source_element: srcElement
    });
  }

  registerNewSignupEvent(srcElement: string): void {
    this._sendEventToGoogleAnalytics('sign_up', {
      source_element: srcElement
    });
  }

  registerSiteLanguageChangeEvent(siteLanguageCode: string): void {
    this._sendEventToGoogleAnalytics('page_load', {
      site_language: siteLanguageCode
    });
  }

  registerClickBrowseLessonsButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'BrowseLessonsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
    this._sendEventToGoogleAnalytics('discovery_browse_lessons');
  }

  registerClickHomePageStartLearningButtonEvent(): void {
    this._sendEventToGoogleAnalytics('discovery_start_learning');
  }

  registerSearchResultsViewedEvent(): void {
    this._sendEventToGoogleAnalytics('view_search_results');
  }

  registerClickGuideParentsButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'GuideParentsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickTipforParentsButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'TipforParentsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickExploreLessonsButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ExploreLessonsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickStartLearningButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'StartLearningButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickStartContributingButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'StartContributingButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickStartTeachingButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'StartTeachingButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickVisitClassroomButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ClassroomButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickBrowseLibraryButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'BrowseLibraryButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerGoToDonationSiteEvent(donationSiteName: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'GoToDonationSite', 'click', donationSiteName);
  }

  registerCreateLessonButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'CreateLessonButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerApplyToTeachWithOppiaEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ApplyToTeachWithOppia', 'click', '');
  }

  registerClickCreateExplorationButtonEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'CreateExplorationButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerCreateNewExplorationEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'NewExploration', 'create', explorationId);
  }

  registerCreateNewExplorationInCollectionEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'NewExplorationFromCollection', 'create', explorationId);
  }

  registerCreateNewCollectionEvent(collectionId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'NewCollection', 'create', collectionId);
  }

  registerCommitChangesToPrivateExplorationEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'CommitToPrivateExploration', 'click', explorationId);
  }

  registerShareExplorationEvent(network: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }

  registerShareCollectionEvent(network: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }

  registerShareBlogPostEvent(network: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }

  registerOpenEmbedInfoEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'EmbedInfoModal', 'open', explorationId);
  }

  registerCommitChangesToPublicExplorationEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'CommitToPublicExploration', 'click', explorationId);
  }

  // Metrics for tutorial on first creating exploration.
  registerTutorialModalOpenEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'TutorialModalOpen', 'open', explorationId);
  }

  registerDeclineTutorialModalEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'DeclineTutorialModal', 'click', explorationId);
  }

  registerAcceptTutorialModalEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'AcceptTutorialModal', 'click', explorationId);
  }

  // Metrics for visiting the help center.
  registerClickHelpButtonEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ClickHelpButton', 'click', explorationId);
  }

  registerVisitHelpCenterEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'VisitHelpCenter', 'click', explorationId);
  }

  registerOpenTutorialFromHelpCenterEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'OpenTutorialFromHelpCenter', 'click', explorationId);
  }

  // Metrics for exiting the tutorial.
  registerSkipTutorialEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'SkipTutorial', 'click', explorationId);
  }

  registerFinishTutorialEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FinishTutorial', 'click', explorationId);
  }

  // Metrics for first time editor use.
  registerEditorFirstEntryEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstEnterEditor', 'open', explorationId);
  }

  registerFirstOpenContentBoxEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstOpenContentBox', 'open', explorationId);
  }

  registerFirstSaveContentEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstSaveContent', 'click', explorationId);
  }

  registerFirstClickAddInteractionEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstClickAddInteraction', 'click', explorationId);
  }

  registerFirstSelectInteractionTypeEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstSelectInteractionType', 'click', explorationId);
  }

  registerFirstSaveInteractionEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstSaveInteraction', 'click', explorationId);
  }

  registerFirstSaveRuleEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstSaveRule', 'click', explorationId);
  }

  registerFirstCreateSecondStateEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'FirstCreateSecondState', 'create', explorationId);
  }

  // Metrics for publishing explorations.
  registerSavePlayableExplorationEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'SavePlayableExploration', 'save', explorationId);
  }

  registerOpenPublishExplorationModalEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'PublishExplorationModal', 'open', explorationId);
  }

  registerPublishExplorationEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'PublishExploration', 'click', explorationId);
  }

  registerVisitOppiaFromIframeEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'VisitOppiaFromIframe', 'click', explorationId);
  }

  registerNewCard(cardNum: number, explorationId: string): void {
    if (cardNum <= 10 || cardNum % 10 === 0) {
      this._sendEventToLegacyGoogleAnalytics(
        'PlayerNewCard', 'click', cardNum.toString());
      this._sendEventToGoogleAnalytics(
        'new_card_load',
        {
          exploration_id: explorationId,
          card_number: cardNum
        }
      );
    }
  }

  registerStartAudioPlayedEvent(
      explorationId: string,
      cardIndex: number
  ): void {
    this._sendEventToGoogleAnalytics(
      'audio_played', {
        exploration_id: explorationId,
        card_number: cardIndex
      }
    );
  }

  registerPracticeSessionStartEvent(
      classroomName: string,
      topicName: string,
      stringifiedSubtopicIds: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'practice_session_start', {
        classroom_name: classroomName,
        topic_name: topicName,
        practice_session_id: stringifiedSubtopicIds
      }
    );
  }

  registerPracticeSessionEndEvent(
      classroomName: string,
      topicName: string,
      stringifiedSubtopicIds: string,
      questionsAnswered: number,
      totalScore: number
  ): void {
    this._sendEventToGoogleAnalytics(
      'practice_session_complete', {
        classroom_name: classroomName,
        topic_name: topicName,
        practice_session_id: stringifiedSubtopicIds,
        questions_answered: questionsAnswered,
        total_score: totalScore
      }
    );
  }

  registerOpenCollectionFromLandingPageEvent(collectionId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'OpenFractionsFromLandingPage', 'click', collectionId);
  }

  registerSaveRecordedAudioEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'SaveRecordedAudio', 'click', explorationId);
  }

  registerStartAudioRecordingEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'StartAudioRecording', 'click', explorationId);
  }

  registerUploadAudioEvent(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'UploadRecordedAudio', 'click', explorationId);
  }

  // Contributor Dashboard Events.
  registerContributorDashboardSuggestEvent(contributionType: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ContributorDashboardSuggest', 'click', contributionType);
  }

  registerContributorDashboardSubmitSuggestionEvent(
      contributionType: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ContributorDashboardSubmitSuggestion', 'click', contributionType);
  }

  registerContributorDashboardViewSuggestionForReview(
      contributionType: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ContributorDashboardViewSuggestionForReview',
      'click',
      contributionType
    );
  }

  registerContributorDashboardAcceptSuggestion(
      contributionType: string
  ): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ContributorDashboardAcceptSuggestion', 'click', contributionType);
  }

  registerContributorDashboardRejectSuggestion(
      contributionType: string
  ): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ContributorDashboardRejectSuggestion', 'click', contributionType);
  }

  registerLessonActiveUse(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ActiveUserStartAndSawCards', 'engage', '');
  }

  registerStartExploration(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'PlayerStartExploration', 'engage', explorationId);
    this._sendEventToGoogleAnalytics(
      'lesson_started', {
        exploration_id: explorationId
      }
    );
  }

  registerFinishExploration(explorationId: string): void {
    this._sendEventToLegacyGoogleAnalytics(
      'PlayerFinishExploration', 'engage', explorationId);
    this._sendEventToGoogleAnalytics(
      'lesson_completed', {
        exploration_id: explorationId
      }
    );
  }

  registerCuratedLessonStarted(
      topicName: string, explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'classroom_lesson_started', {
        topic_name: topicName,
        exploration_id: explorationId
      }
    );
  }

  registerCuratedLessonCompleted(
      classroomName: string,
      topicName: string,
      chapterName: string,
      explorationId: string,
      chapterNumber: string,
      chapterCardCount: string,
      explorationLanguage: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'classroom_lesson_completed', {
        classroom_name: classroomName,
        topic_name: topicName,
        chapter_name: chapterName,
        exploration_id: explorationId,
        chapter_number: chapterNumber,
        chapter_card_count: chapterCardCount,
        exploration_language: explorationLanguage
      }
    );
  }

  registerCommunityLessonStarted(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'community_lesson_started', {
        exploration_id: explorationId
      }
    );
  }

  registerCommunityLessonCompleted(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'community_lesson_completed', {
        exploration_id: explorationId
      }
    );
  }

  registerClassroomLessonEngagedWithEvent(
      classroomName: string,
      topicName: string,
      chapterName: string,
      explorationId: string,
      chapterNumber: string,
      chapterCardCount: string,
      explorationLanguage: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'classroom_lesson_engaged_with', {
        classroom_name: classroomName,
        topic_name: topicName,
        chapter_name: chapterName,
        exploration_id: explorationId,
        chapter_number: chapterNumber,
        chapter_card_count: chapterCardCount,
        exploration_language: explorationLanguage
      }
    );
  }

  registerCommunityLessonEngagedWithEvent(
      explorationId: string,
      explorationLanguage: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'community_lesson_engaged_with', {
        exploration_id: explorationId,
        exploration_language: explorationLanguage
      }
    );
  }

  registerLessonEngagedWithEvent(
      explorationId: string,
      explorationLanguage: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'lesson_engaged_with', {
        exploration_id: explorationId,
        exploration_language: explorationLanguage
      }
    );
  }

  registerClassroomHeaderClickEvent(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ClassroomEngagement', 'click', 'ClickOnClassroom');
  }

  registerClassroomPageViewed(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'ClassroomEngagement', 'impression', 'ViewClassroom');
  }

  registerAccountDeletion(): void {
    this._sendEventToLegacyGoogleAnalytics(
      'OnboardingEngagement', 'delete', 'AccountDeletion');
  }

  registerAnswerSubmitted(
      explorationId: string, answerIsCorrect: boolean): void {
    this._sendEventToGoogleAnalytics(
      'answer_submitted', {
        exploration_id: explorationId,
        answer_is_correct: answerIsCorrect,
      }
    );
  }
}

angular.module('oppia').factory(
  'SiteAnalyticsService',
  downgradeInjectable(SiteAnalyticsService));
