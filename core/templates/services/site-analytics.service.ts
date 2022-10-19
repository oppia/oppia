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
  _sendEventToGoogleAnalytics(
      eventCategory: string, eventAction: string, eventLabel: string): void {
    this.windowRef.nativeWindow.gtag('event', eventAction, {
      event_category: eventCategory,
      event_label: eventLabel
    });
  }

  // The srcElement refers to the element on the page that is clicked.
  registerStartLoginEvent(srcElement: string): void {
    this._sendEventToGoogleAnalytics(
      'LoginButton', 'click',
      this.windowRef.nativeWindow.location.pathname + ' ' + srcElement);
  }

  registerNewSignupEvent(): void {
    this._sendEventToGoogleAnalytics(
      'OnboardingEngagement', 'signup', 'AccountSignUp');
  }

  registerClickBrowseLessonsButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'BrowseLessonsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickGuideParentsButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'GuideParentsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickTipforParentsButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'TipforParentsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickExploreLessonsButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'ExploreLessonsButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickStartLearningButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'StartLearningButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickStartContributingButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'StartContributingButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickStartTeachingButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'StartTeachingButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickVisitClassroomButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'ClassroomButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerClickBrowseLibraryButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'BrowseLibraryButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerGoToDonationSiteEvent(donationSiteName: string): void {
    this._sendEventToGoogleAnalytics(
      'GoToDonationSite', 'click', donationSiteName);
  }

  registerCreateLessonButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'CreateLessonButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerApplyToTeachWithOppiaEvent(): void {
    this._sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
  }

  registerClickCreateExplorationButtonEvent(): void {
    this._sendEventToGoogleAnalytics(
      'CreateExplorationButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }

  registerCreateNewExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
  }

  registerCreateNewExplorationInCollectionEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'NewExplorationFromCollection', 'create', explorationId);
  }

  registerCreateNewCollectionEvent(collectionId: string): void {
    this._sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
  }

  registerCommitChangesToPrivateExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'CommitToPrivateExploration', 'click', explorationId);
  }

  registerShareExplorationEvent(network: string): void {
    this._sendEventToGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }

  registerShareCollectionEvent(network: string): void {
    this._sendEventToGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }

  registerOpenEmbedInfoEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
  }

  registerCommitChangesToPublicExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'CommitToPublicExploration', 'click', explorationId);
  }

  // Metrics for tutorial on first creating exploration.
  registerTutorialModalOpenEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'TutorialModalOpen', 'open', explorationId);
  }

  registerDeclineTutorialModalEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'DeclineTutorialModal', 'click', explorationId);
  }

  registerAcceptTutorialModalEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'AcceptTutorialModal', 'click', explorationId);
  }

  // Metrics for visiting the help center.
  registerClickHelpButtonEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'ClickHelpButton', 'click', explorationId);
  }

  registerVisitHelpCenterEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'VisitHelpCenter', 'click', explorationId);
  }

  registerOpenTutorialFromHelpCenterEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'OpenTutorialFromHelpCenter', 'click', explorationId);
  }

  // Metrics for exiting the tutorial.
  registerSkipTutorialEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'SkipTutorial', 'click', explorationId);
  }

  registerFinishTutorialEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FinishTutorial', 'click', explorationId);
  }

  // Metrics for first time editor use.
  registerEditorFirstEntryEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstEnterEditor', 'open', explorationId);
  }

  registerFirstOpenContentBoxEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstOpenContentBox', 'open', explorationId);
  }

  registerFirstSaveContentEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstSaveContent', 'click', explorationId);
  }

  registerFirstClickAddInteractionEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstClickAddInteraction', 'click', explorationId);
  }

  registerFirstSelectInteractionTypeEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstSelectInteractionType', 'click', explorationId);
  }

  registerFirstSaveInteractionEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstSaveInteraction', 'click', explorationId);
  }

  registerFirstSaveRuleEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstSaveRule', 'click', explorationId);
  }

  registerFirstCreateSecondStateEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FirstCreateSecondState', 'create', explorationId);
  }

  // Metrics for publishing explorations.
  registerSavePlayableExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'SavePlayableExploration', 'save', explorationId);
  }

  registerOpenPublishExplorationModalEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'PublishExplorationModal', 'open', explorationId);
  }

  registerPublishExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'PublishExploration', 'click', explorationId);
  }

  registerVisitOppiaFromIframeEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'VisitOppiaFromIframe', 'click', explorationId);
  }

  registerNewCard(cardNum: number): void {
    if (cardNum <= 10 || cardNum % 10 === 0) {
      this._sendEventToGoogleAnalytics(
        'PlayerNewCard', 'click', cardNum.toString());
    }
  }

  registerOpenCollectionFromLandingPageEvent(collectionId: string): void {
    this._sendEventToGoogleAnalytics(
      'OpenFractionsFromLandingPage', 'click', collectionId);
  }

  registerSaveRecordedAudioEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'SaveRecordedAudio', 'click', explorationId);
  }

  registerStartAudioRecordingEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'StartAudioRecording', 'click', explorationId);
  }

  registerUploadAudioEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'UploadRecordedAudio', 'click', explorationId);
  }

  // Contributor Dashboard Events.
  registerContributorDashboardSuggestEvent(contributionType: string): void {
    this._sendEventToGoogleAnalytics(
      'ContributorDashboardSuggest', 'click', contributionType);
  }

  registerContributorDashboardSubmitSuggestionEvent(
      contributionType: string): void {
    this._sendEventToGoogleAnalytics(
      'ContributorDashboardSubmitSuggestion', 'click', contributionType);
  }

  registerContributorDashboardViewSuggestionForReview(
      contributionType: string): void {
    this._sendEventToGoogleAnalytics(
      'ContributorDashboardViewSuggestionForReview', 'click', contributionType);
  }

  registerContributorDashboardAcceptSuggestion(contributionType: string): void {
    this._sendEventToGoogleAnalytics(
      'ContributorDashboardAcceptSuggestion', 'click', contributionType);
  }

  registerContributorDashboardRejectSuggestion(contributionType: string): void {
    this._sendEventToGoogleAnalytics(
      'ContributorDashboardRejectSuggestion', 'click', contributionType);
  }

  registerLessonActiveUse(): void {
    this._sendEventToGoogleAnalytics(
      'ActiveUserStartAndSawCards', 'engage', '');
  }

  registerStartExploration(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'PlayerStartExploration', 'engage', explorationId);
  }

  registerFinishExploration(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'PlayerFinishExploration', 'engage', explorationId);
  }

  registerCuratedLessonStarted(
      topicName: string, explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'CuratedLessonStarted', `start ${topicName}`, explorationId);
  }

  registerCuratedLessonCompleted(
      topicName: string, explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'CuratedLessonCompleted', `start ${topicName}`, explorationId);
  }

  registerClassroomLessonActiveUse(
      topicName: string, explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'ClassroomActiveUserStartAndSawCards',
      `start ${topicName}`,
      explorationId);
  }

  registerClassroomHeaderClickEvent(): void {
    this._sendEventToGoogleAnalytics(
      'ClassroomEngagement', 'click', 'ClickOnClassroom');
  }

  registerClassroomPageViewed(): void {
    this._sendEventToGoogleAnalytics(
      'ClassroomEngagement', 'impression', 'ViewClassroom');
  }

  registerAccountDeletion(): void {
    this._sendEventToGoogleAnalytics(
      'OnboardingEngagement', 'delete', 'AccountDeletion');
  }
}

angular.module('oppia').factory(
  'SiteAnalyticsService',
  downgradeInjectable(SiteAnalyticsService));
