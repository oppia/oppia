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

const constants = require( '../../../../../assets/constants');

declare global {
  interface Window {
    ga: any;
  }
}
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
      eventCategory, eventAction, eventLabel) {
    if (this.windowRef.nativeWindow.ga && constants.CAN_SEND_ANALYTICS_EVENTS) {
      this.windowRef.nativeWindow.ga('send', 'event',
        eventCategory, eventAction, eventLabel);
    }
  }

  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/
  //   social-interactions
  __sendSocialEventToGoogleAnalytics(
      network, action, targetUrl) {
    if (this.windowRef.nativeWindow.ga && constants.CAN_SEND_ANALYTICS_EVENTS) {
      this.windowRef.nativeWindow.ga('send', 'social',
        network, action, targetUrl);
    }
  }

  // The srcElement refers to the element on the page that is clicked.
  registerStartLoginEvent(srcElement) {
    this._sendEventToGoogleAnalytics(
      'LoginButton', 'click',
      this.windowRef.nativeWindow.location.pathname + ' ' + srcElement);
  }
  registerNewSignupEvent() {
    this._sendEventToGoogleAnalytics('SignupButton', 'click', '');
  }
  registerClickBrowseLibraryButtonEvent() {
    this._sendEventToGoogleAnalytics(
      'BrowseLibraryButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }
  registerGoToDonationSiteEvent(donationSiteName) {
    this._sendEventToGoogleAnalytics(
      'GoToDonationSite', 'click', donationSiteName);
  }
  registerApplyToTeachWithOppiaEvent() {
    this._sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
  }
  registerClickCreateExplorationButtonEvent() {
    this._sendEventToGoogleAnalytics(
      'CreateExplorationButton', 'click',
      this.windowRef.nativeWindow.location.pathname);
  }
  registerCreateNewExplorationEvent(explorationId) {
    this._sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
  }
  registerCreateNewExplorationInCollectionEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'NewExplorationFromCollection', 'create', explorationId);
  }
  registerCreateNewCollectionEvent(collectionId) {
    this._sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
  }
  registerCommitChangesToPrivateExplorationEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'CommitToPrivateExploration', 'click', explorationId);
  }
  registerShareExplorationEvent(network) {
    this.__sendSocialEventToGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }
  registerShareCollectionEvent(network) {
    this.__sendSocialEventToGoogleAnalytics(
      network, 'share', this.windowRef.nativeWindow.location.pathname);
  }
  registerOpenEmbedInfoEvent(explorationId) {
    this._sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
  }
  registerCommitChangesToPublicExplorationEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'CommitToPublicExploration', 'click', explorationId);
  }
  // Metrics for tutorial on first creating exploration
  registerTutorialModalOpenEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'TutorialModalOpen', 'open', explorationId);
  }
  registerDeclineTutorialModalEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'DeclineTutorialModal', 'click', explorationId);
  }
  registerAcceptTutorialModalEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'AcceptTutorialModal', 'click', explorationId);
  }
  // Metrics for visiting the help center
  registerClickHelpButtonEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'ClickHelpButton', 'click', explorationId);
  }
  registerVisitHelpCenterEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'VisitHelpCenter', 'click', explorationId);
  }
  registerOpenTutorialFromHelpCenterEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'OpenTutorialFromHelpCenter', 'click', explorationId);
  }
  // Metrics for exiting the tutorial
  registerSkipTutorialEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'SkipTutorial', 'click', explorationId);
  }
  registerFinishTutorialEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FinishTutorial', 'click', explorationId);
  }
  // Metrics for first time editor use
  registerEditorFirstEntryEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstEnterEditor', 'open', explorationId);
  }
  registerFirstOpenContentBoxEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstOpenContentBox', 'open', explorationId);
  }
  registerFirstSaveContentEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstSaveContent', 'click', explorationId);
  }
  registerFirstClickAddInteractionEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstClickAddInteraction', 'click', explorationId);
  }
  registerFirstSelectInteractionTypeEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstSelectInteractionType', 'click', explorationId);
  }
  registerFirstSaveInteractionEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstSaveInteraction', 'click', explorationId);
  }
  registerFirstSaveRuleEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstSaveRule', 'click', explorationId);
  }
  registerFirstCreateSecondStateEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'FirstCreateSecondState', 'create', explorationId);
  }
  // Metrics for publishing explorations
  registerSavePlayableExplorationEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'SavePlayableExploration', 'save', explorationId);
  }
  registerOpenPublishExplorationModalEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'PublishExplorationModal', 'open', explorationId);
  }
  registerPublishExplorationEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'PublishExploration', 'click', explorationId);
  }
  registerVisitOppiaFromIframeEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'VisitOppiaFromIframe', 'click', explorationId);
  }
  registerNewCard(cardNum) {
    if (cardNum <= 10 || cardNum % 10 === 0) {
      this._sendEventToGoogleAnalytics('PlayerNewCard', 'click', cardNum);
    }
  }
  registerFinishExploration() {
    this._sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
  }
  registerOpenCollectionFromLandingPageEvent(collectionId) {
    this._sendEventToGoogleAnalytics(
      'OpenFractionsFromLandingPage', 'click', collectionId);
  }
  registerStewardsLandingPageEvent(viewerType, buttonText) {
    this._sendEventToGoogleAnalytics(
      'ClickButtonOnStewardsPage', 'click', viewerType + ':' + buttonText);
  }
  registerSaveRecordedAudioEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'SaveRecordedAudio', 'click', explorationId);
  }
  registerStartAudioRecordingEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'StartAudioRecording', 'click', explorationId);
  }
  registerUploadAudioEvent(explorationId) {
    this._sendEventToGoogleAnalytics(
      'UploadRecordedAudio', 'click', explorationId);
  }
}

angular.module('oppia').factory(
  'SiteAnalyticsService',
  downgradeInjectable(SiteAnalyticsService));

