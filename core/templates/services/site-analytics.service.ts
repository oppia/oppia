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

const constants = require('constants.ts');
import { WindowRef } from 'services/contextual/window-ref.service';

// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.

@Injectable({
  providedIn: 'root'
})
export class SiteAnalyticsService {
  constructor(private windowRef: WindowRef) {}

  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/events
  _sendEventToGoogleAnalytics(
      eventCategory: string, eventAction: string, eventLabel: string): void {
    if (this.windowRef.nativeWindow.ga && constants.CAN_SEND_ANALYTICS_EVENTS) {
      this.windowRef.nativeWindow.ga('send', 'event',
        eventCategory, eventAction, eventLabel);
    }
  }

  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/
  // social-interactions
  // TODO(#7176): Replace 'any' with the exact type.
  __sendSocialEventToGoogleAnalytics(
      network: any, action: any, targetUrl: any): void {
    if (this.windowRef.nativeWindow.ga && constants.CAN_SEND_ANALYTICS_EVENTS) {
      this.windowRef.nativeWindow.ga('send', 'social',
        network, action, targetUrl);
    }
  }

  // The srcElement refers to the element on the page that is clicked.
  // TODO(#7176): Replace 'any' with the exact type.
  registerStartLoginEvent(srcElement: any): void {
    this._sendEventToGoogleAnalytics(
      'LoginButton', 'click',
      this.windowRef.nativeWindow.location.pathname + ' ' + srcElement);
  }
  registerNewSignupEvent(): void {
    this._sendEventToGoogleAnalytics('SignupButton', 'click', '');
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
    this.__sendSocialEventToGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }
  registerShareCollectionEvent(network: string): void {
    this.__sendSocialEventToGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }
  registerOpenEmbedInfoEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
  }
  registerCommitChangesToPublicExplorationEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'CommitToPublicExploration', 'click', explorationId);
  }
  // Metrics for tutorial on first creating exploration
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
  // Metrics for visiting the help center
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
  // Metrics for exiting the tutorial
  registerSkipTutorialEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'SkipTutorial', 'click', explorationId);
  }
  registerFinishTutorialEvent(explorationId: string): void {
    this._sendEventToGoogleAnalytics(
      'FinishTutorial', 'click', explorationId);
  }
  // Metrics for first time editor use
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
  // Metrics for publishing explorations
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
      this._sendEventToGoogleAnalytics('PlayerNewCard', 'click',
        cardNum.toString());
    }
  }
  registerFinishExploration(): void {
    this._sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
  }
  registerOpenCollectionFromLandingPageEvent(collectionId: string): void {
    this._sendEventToGoogleAnalytics(
      'OpenFractionsFromLandingPage', 'click', collectionId);
  }
  registerStewardsLandingPageEvent(
      viewerType: string, buttonText: string): void {
    this._sendEventToGoogleAnalytics(
      'ClickButtonOnStewardsPage', 'click', viewerType + ':' + buttonText);
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
}

angular.module('oppia').factory(
  'SiteAnalyticsService',
  downgradeInjectable(SiteAnalyticsService));
