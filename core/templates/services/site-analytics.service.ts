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

import {Injectable} from '@angular/core';

import {WindowRef} from 'services/contextual/window-ref.service';
import {initializeGoogleAnalytics} from 'google-analytics.initializer';
import {LocalStorageService} from './local-storage.service';
import {AppConstants} from 'app.constants';
import {NavbarAndFooterGATrackingPages} from 'app.constants';

// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.

@Injectable({
  providedIn: 'root',
})
export class SiteAnalyticsService {
  static googleAnalyticsIsInitialized: boolean = false;

  constructor(
    private windowRef: WindowRef,
    private localStorageService: LocalStorageService
  ) {
    if (!SiteAnalyticsService.googleAnalyticsIsInitialized) {
      // This ensures that google analytics is initialized whenever this
      // service is used.
      initializeGoogleAnalytics();
      SiteAnalyticsService.googleAnalyticsIsInitialized = true;
    }
  }

  _sendEventToGoogleAnalytics(
    eventName: string,
    eventParameters: Object = {}
  ): void {
    this.windowRef.nativeWindow.gtag('event', eventName, eventParameters);
  }

  // The srcElement refers to the element on the page that is clicked.
  registerStartLoginEvent(srcElement: string): void {
    this._sendEventToGoogleAnalytics('login', {
      source_element: srcElement,
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerNewSignupEvent(srcElement: string): void {
    this._sendEventToGoogleAnalytics('sign_up', {
      source_element: srcElement,
    });
  }

  registerSiteLanguageChangeEvent(siteLanguageCode: string): void {
    this._sendEventToGoogleAnalytics('page_load', {
      site_language: siteLanguageCode,
    });
  }

  registerClickBrowseLessonsButtonEvent(): void {
    this._sendEventToGoogleAnalytics('browse_lessons_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickHomePageStartLearningButtonEvent(): void {
    this._sendEventToGoogleAnalytics('discovery_start_learning');
  }

  registerSearchResultsViewedEvent(): void {
    this._sendEventToGoogleAnalytics('view_search_results');
  }

  registerClickGuideParentsButtonEvent(): void {
    this._sendEventToGoogleAnalytics('guide_parents_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickTipforParentsButtonEvent(): void {
    this._sendEventToGoogleAnalytics('tip_for_parents_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickExploreLessonsButtonEvent(): void {
    this._sendEventToGoogleAnalytics('explore_lessons_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickStartLearningButtonEvent(): void {
    this._sendEventToGoogleAnalytics('start_learning_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickStartContributingButtonEvent(): void {
    this._sendEventToGoogleAnalytics('start_contributing_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickStartTeachingButtonEvent(): void {
    this._sendEventToGoogleAnalytics('start_teaching_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickVisitClassroomButtonEvent(): void {
    this._sendEventToGoogleAnalytics('classroom_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickBrowseLibraryButtonEvent(): void {
    this._sendEventToGoogleAnalytics('browse_library_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerGoToDonationSiteEvent(donationSiteName: string): void {
    this._sendEventToGoogleAnalytics('go_to_donation_site', {
      donation_site_name: donationSiteName,
    });
  }

  registerApplyToTeachWithOppiaEvent(): void {
    this._sendEventToGoogleAnalytics('apply_to_teach_with_oppia', {});
  }

  registerClickCreateExplorationButtonEvent(): void {
    this._sendEventToGoogleAnalytics('create_exploration_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerCreateNewExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('create_new_exploration', {
      exploration_id: explorationId,
    });
  }

  registerCreateNewExplorationInCollectionEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('create_new_exploration_in_collection', {
      exploration_id: explorationId,
    });
  }

  registerCreateNewCollectionEvent(collectionId: string): void {
    this._sendEventToGoogleAnalytics('create_new_collection', {
      collection_id: collectionId,
    });
  }

  registerCommitChangesToPrivateExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('commit_changes_to_private_exploration', {
      exploration_id: explorationId,
    });
  }

  registerShareExplorationEvent(network: string): void {
    this._sendEventToGoogleAnalytics('share_exploration', {
      network: network,
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerShareCollectionEvent(network: string): void {
    this._sendEventToGoogleAnalytics('share_collection', {
      network: network,
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerShareBlogPostEvent(network: string): void {
    this._sendEventToGoogleAnalytics('share_blog_post', {
      network: network,
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerOpenEmbedInfoEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('open_embed_info_modal', {
      exploration_id: explorationId,
    });
  }

  registerCommitChangesToPublicExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('commit_changes_to_public_exploration', {
      exploration_id: explorationId,
    });
  }

  registerTutorialModalOpenEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('tutorial_modal_open', {
      exploration_id: explorationId,
    });
  }

  registerDeclineTutorialModalEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('decline_tutorial_modal', {
      exploration_id: explorationId,
    });
  }

  registerAcceptTutorialModalEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('accept_tutorial_modal', {
      exploration_id: explorationId,
    });
  }

  registerClickHelpButtonEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('click_help_button', {
      exploration_id: explorationId,
    });
  }

  registerVisitHelpCenterEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('visit_help_center', {
      exploration_id: explorationId,
    });
  }

  registerOpenTutorialFromHelpCenterEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('open_tutorial_from_help_center', {
      exploration_id: explorationId,
    });
  }

  registerSkipTutorialEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('skip_tutorial', {
      exploration_id: explorationId,
    });
  }

  registerFinishTutorialEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('finish_tutorial', {
      exploration_id: explorationId,
    });
  }
  registerEditorFirstEntryEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('editor_first_entry', {
      exploration_id: explorationId,
    });
  }

  registerFirstOpenContentBoxEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('first_open_content_box', {
      exploration_id: explorationId,
    });
  }

  registerFirstSaveContentEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('first_save_content', {
      exploration_id: explorationId,
    });
  }

  registerFirstClickAddInteractionEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('first_click_add_interaction', {
      exploration_id: explorationId,
    });
  }

  registerFirstSelectInteractionTypeEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('first_select_interaction_type', {
      exploration_id: explorationId,
    });
  }

  registerFirstSaveInteractionEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('first_save_interaction', {
      exploration_id: explorationId,
    });
  }

  registerFirstSaveRuleEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('first_save_rule', {
      exploration_id: explorationId,
    });
  }

  registerFirstCreateSecondStateEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('first_create_second_state', {
      exploration_id: explorationId,
    });
  }

  registerSavePlayableExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('save_playable_exploration', {
      exploration_id: explorationId,
    });
  }

  registerOpenPublishExplorationModalEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('open_publish_exploration_modal', {
      exploration_id: explorationId,
    });
  }

  registerPublishExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('publish_exploration', {
      exploration_id: explorationId,
    });
  }

  registerVisitOppiaFromIframeEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('visit_oppia_from_iframe', {
      exploration_id: explorationId,
    });
  }

  registerNewCard(cardNum: number, explorationId: string): void {
    if (cardNum <= 10 || cardNum % 10 === 0) {
      this._sendEventToGoogleAnalytics('new_card_load', {
        exploration_id: explorationId,
        card_number: cardNum,
      });
    }
  }

  registerStartAudioPlayedEvent(
    explorationId: string,
    cardIndex: number
  ): void {
    this._sendEventToGoogleAnalytics('audio_played', {
      exploration_id: explorationId,
      card_number: cardIndex,
    });
  }

  registerPracticeSessionStartEvent(
    classroomName: string,
    topicName: string,
    stringifiedSubtopicIds: string
  ): void {
    this._sendEventToGoogleAnalytics('practice_session_start', {
      classroom_name: classroomName,
      topic_name: topicName,
      practice_session_id: stringifiedSubtopicIds,
    });
  }

  registerPracticeSessionEndEvent(
    classroomName: string,
    topicName: string,
    stringifiedSubtopicIds: string,
    questionsAnswered: number,
    totalScore: number
  ): void {
    this._sendEventToGoogleAnalytics('practice_session_complete', {
      classroom_name: classroomName,
      topic_name: topicName,
      practice_session_id: stringifiedSubtopicIds,
      questions_answered: questionsAnswered,
      total_score: totalScore,
    });
  }

  registerOpenCollectionFromLandingPageEvent(collectionId: string): void {
    this._sendEventToGoogleAnalytics('open_fractions_from_landing_page', {
      collection_id: collectionId,
    });
  }

  registerSaveRecordedAudioEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('save_recorded_audio', {
      exploration_id: explorationId,
    });
  }

  registerStartAudioRecordingEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('start_audio_recording', {
      exploration_id: explorationId,
    });
  }

  registerUploadAudioEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('upload_recorded_audio', {
      exploration_id: explorationId,
    });
  }

  registerContributorDashboardSuggestEvent(contributionType: string): void {
    this._sendEventToGoogleAnalytics('contributor_dashboard_suggest', {
      contribution_type: contributionType,
    });
  }

  registerContributorDashboardSubmitSuggestionEvent(
    contributionType: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'contributor_dashboard_submit_suggestion',
      {
        contribution_type: contributionType,
      }
    );
  }

  registerContributorDashboardViewSuggestionForReview(
    contributionType: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'contributor_dashboard_view_suggestion_for_review',
      {
        contribution_type: contributionType,
      }
    );
  }

  registerContributorDashboardAcceptSuggestion(contributionType: string): void {
    this._sendEventToGoogleAnalytics(
      'contributor_dashboard_accept_suggestion',
      {
        contribution_type: contributionType,
      }
    );
  }

  registerContributorDashboardRejectSuggestion(contributionType: string): void {
    this._sendEventToGoogleAnalytics(
      'contributor_dashboard_reject_suggestion',
      {
        contribution_type: contributionType,
      }
    );
  }

  registerLessonActiveUse(): void {
    this._sendEventToGoogleAnalytics('active_user_start_and_saw_cards', {});
  }

  registerStartExploration(explorationId: string): void {
    this._sendEventToGoogleAnalytics('lesson_started', {
      exploration_id: explorationId,
    });
  }

  registerFinishExploration(explorationId: string): void {
    this._sendEventToGoogleAnalytics('lesson_completed', {
      exploration_id: explorationId,
    });
  }

  registerCuratedLessonStarted(topicName: string, explorationId: string): void {
    this._sendEventToGoogleAnalytics('classroom_lesson_started', {
      topic_name: topicName,
      exploration_id: explorationId,
    });
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
    this._sendEventToGoogleAnalytics('classroom_lesson_completed', {
      classroom_name: classroomName,
      topic_name: topicName,
      chapter_name: chapterName,
      exploration_id: explorationId,
      chapter_number: chapterNumber,
      chapter_card_count: chapterCardCount,
      exploration_language: explorationLanguage,
    });
  }

  registerCommunityLessonStarted(explorationId: string): void {
    this._sendEventToGoogleAnalytics('community_lesson_started', {
      exploration_id: explorationId,
    });
  }

  registerCommunityLessonCompleted(explorationId: string): void {
    this._sendEventToGoogleAnalytics('community_lesson_completed', {
      exploration_id: explorationId,
    });
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
    this._sendEventToGoogleAnalytics('classroom_lesson_engaged_with', {
      classroom_name: classroomName,
      topic_name: topicName,
      chapter_name: chapterName,
      exploration_id: explorationId,
      chapter_number: chapterNumber,
      chapter_card_count: chapterCardCount,
      exploration_language: explorationLanguage,
    });
  }

  registerCommunityLessonEngagedWithEvent(
    explorationId: string,
    explorationLanguage: string
  ): void {
    this._sendEventToGoogleAnalytics('community_lesson_engaged_with', {
      exploration_id: explorationId,
      exploration_language: explorationLanguage,
    });
  }

  registerLessonEngagedWithEvent(
    explorationId: string,
    explorationLanguage: string
  ): void {
    this._sendEventToGoogleAnalytics('lesson_engaged_with', {
      exploration_id: explorationId,
      exploration_language: explorationLanguage,
    });
  }

  registerClassroomPageViewed(): void {
    this._sendEventToGoogleAnalytics('view_classroom', {});
  }

  registerAccountDeletion(): void {
    this._sendEventToGoogleAnalytics('account_deletion', {});
  }

  registerAnswerSubmitted(
    explorationId: string,
    answerIsCorrect: boolean
  ): void {
    this._sendEventToGoogleAnalytics('answer_submitted', {
      exploration_id: explorationId,
      answer_is_correct: answerIsCorrect,
    });
  }

  registerClickVolunteerCTAButtonEvent(srcElement: string): void {
    this._sendEventToGoogleAnalytics('volunteer_cta_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
      source_element: srcElement,
    });
  }

  registerClickPartnerCTAButtonEvent(srcElement: string): void {
    this._sendEventToGoogleAnalytics('partner_cta_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
      source_element: srcElement,
    });
  }

  registerClickDonateCTAButtonEvent(): void {
    this._sendEventToGoogleAnalytics('donate_cta_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickGetAndroidAppButtonEvent(): void {
    this._sendEventToGoogleAnalytics('get_android_app_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickLearnMoreVolunteerButtonEvent(): void {
    this._sendEventToGoogleAnalytics('learn_more_volunteer_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickLearnMorePartnerButtonEvent(): void {
    this._sendEventToGoogleAnalytics('learn_more_partner_button_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickNavbarButtonEvent(
    buttonName: NavbarAndFooterGATrackingPages
  ): void {
    this._sendEventToGoogleAnalytics('navbar_button_click', {
      button_name: buttonName,
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerClickFooterButtonEvent(
    buttonName: NavbarAndFooterGATrackingPages
  ): void {
    this._sendEventToGoogleAnalytics('footer_button_click', {
      button_name: buttonName,
      page_path: this.windowRef.nativeWindow.location.pathname,
    });
  }

  registerFirstTimePageViewEvent(lastPageViewTimeKey: string): void {
    const lastPageViewTime =
      this.localStorageService.getLastPageViewTime(lastPageViewTimeKey);
    const oneWeekInMillis = AppConstants.ONE_WEEK_IN_MILLIS;
    const oneMonthInMillis = AppConstants.ONE_MONTH_IN_MILLIS;
    if (lastPageViewTime) {
      const timeDifferenceInMillis = new Date().getTime() - lastPageViewTime;
      if (timeDifferenceInMillis > oneMonthInMillis) {
        this._sendEventToGoogleAnalytics('first_time_page_view_in_month', {
          page_path: this.windowRef.nativeWindow.location.pathname,
        });
      }
      if (timeDifferenceInMillis > oneWeekInMillis) {
        this._sendEventToGoogleAnalytics('first_time_page_view_in_week', {
          page_path: this.windowRef.nativeWindow.location.pathname,
        });
      }
    }
    this.localStorageService.setLastPageViewTime(lastPageViewTimeKey);
  }

  registerClickClassroomCardEvent(
    srcElement: string,
    classroomName: string
  ): void {
    this._sendEventToGoogleAnalytics('classroom_card_click', {
      page_path: this.windowRef.nativeWindow.location.pathname,
      source_element: srcElement,
      classroom_name: classroomName,
    });
  }

  registerInProgressClassroomLessonEngagedWithEvent(
    classroomName: string,
    topicName: string
  ): void {
    this._sendEventToGoogleAnalytics(
      'classroom_lesson_in_progress_engaged_with',
      {
        classroom_name: classroomName,
        topic_name: topicName,
      }
    );
  }

  registerNewClassroomLessonEngagedWithEvent(
    classroomName: string,
    topicName: string
  ): void {
    this._sendEventToGoogleAnalytics('new_classroom_lesson_engaged_with', {
      classroom_name: classroomName,
      topic_name: topicName,
    });
  }
}
