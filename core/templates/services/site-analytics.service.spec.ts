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
 * @fileoverview Unit tests for SiteAnalyticsService.
 */

import { TestBed } from '@angular/core/testing';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Site Analytics Service', () => {
  let sas = null;
  let ws = null;
  let gaSpy: jasmine.Spy = null;

  beforeEach(() => {
    sas = TestBed.get(SiteAnalyticsService);
    ws = TestBed.get(WindowRef);
    spyOnProperty(sas, 'CAN_SEND_ANALYTICS_EVENTS', 'get')
      .and.returnValue(true);

    ws.nativeWindow.ga = function() {};
    gaSpy = spyOn(ws.nativeWindow, 'ga').and.stub();
  });

  it('should register start login event', () => {
    const element = 'LoginEventButton';
    sas.registerStartLoginEvent(element);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'LoginButton', 'click',
      '/context.html LoginEventButton');
  });

  it('should register new signup event', () => {
    sas.registerNewSignupEvent();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'OnboardingEngagement', 'signup', 'AccountSignUp');
  });

  it('should register click browse lessons event', () => {
    sas.registerClickBrowseLessonsButtonEvent();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'BrowseLessonsButton', 'click', '/context.html');
  });

  it('should register click start learning button event', () => {
    sas.registerClickStartLearningButtonEvent();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'StartLearningButton', 'click', '/context.html');
  });

  it('should register click start contributing button event', () => {
    sas.registerClickStartContributingButtonEvent();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'StartContributingButton', 'click', '/context.html');
  });

  it('should register go to donation site event', () => {
    const donationSite = 'https://donation.com';
    sas.registerGoToDonationSiteEvent(donationSite);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'GoToDonationSite', 'click', donationSite);
  });

  it('should register apply to teach with oppia event', () => {
    sas.registerApplyToTeachWithOppiaEvent();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ApplyToTeachWithOppia', 'click', '');
  });

  it('should register click create exploration button event', () => {
    sas.registerClickCreateExplorationButtonEvent();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'CreateExplorationButton', 'click', '/context.html');
  });

  it('should register create new exploration event', () => {
    const explorationId = 'abc1';
    sas.registerCreateNewExplorationEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'NewExploration', 'create', explorationId);
  });

  it('should register create new exploration in collection event', () => {
    const explorationId = 'abc1';
    sas.registerCreateNewExplorationInCollectionEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'NewExplorationFromCollection', 'create',
      explorationId);
  });

  it('should register new collection event', () => {
    const collectionId = 'abc1';
    sas.registerCreateNewCollectionEvent(collectionId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'NewCollection', 'create', collectionId);
  });

  it('should register commit changes to private exploration event', () => {
    const explorationId = 'abc1';
    sas.registerCommitChangesToPrivateExplorationEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'CommitToPrivateExploration', 'click', explorationId);
  });

  it('should register share exploration event', () => {
    const network = 'ShareExplorationNetwork';
    sas.registerShareExplorationEvent(network);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'social', network, 'share', '/context.html');
  });

  it('should register share collection event', () => {
    const network = 'ShareCollectionNetwork';
    sas.registerShareCollectionEvent(network);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'social', network, 'share', '/context.html');
  });

  it('should register open embed info event', () => {
    const explorationId = 'abc1';
    sas.registerOpenEmbedInfoEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'EmbedInfoModal', 'open', explorationId);
  });

  it('should register commit changes to public exploration event', () => {
    const explorationId = 'abc1';
    sas.registerCommitChangesToPublicExplorationEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'CommitToPublicExploration', 'click', explorationId);
  });

  it('should register tutorial modal open event', () => {
    const explorationId = 'abc1';
    sas.registerTutorialModalOpenEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'TutorialModalOpen', 'open', explorationId);
  });

  it('should register decline tutorial modal event', () => {
    const explorationId = 'abc1';
    sas.registerDeclineTutorialModalEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'DeclineTutorialModal', 'click', explorationId);
  });

  it('should register accept tutorial modal event', () => {
    const explorationId = 'abc1';
    sas.registerAcceptTutorialModalEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'AcceptTutorialModal', 'click', explorationId);
  });

  it('should register click help button event', () => {
    const explorationId = 'abc1';
    sas.registerClickHelpButtonEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ClickHelpButton', 'click', explorationId);
  });

  it('should register visit help center event', () => {
    const explorationId = 'abc1';
    sas.registerVisitHelpCenterEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'VisitHelpCenter', 'click', explorationId);
  });

  it('should register open tutorial from help center event', () => {
    const explorationId = 'abc1';
    sas.registerOpenTutorialFromHelpCenterEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'OpenTutorialFromHelpCenter', 'click', explorationId);
  });

  it('should register skip tutorial event', () => {
    const explorationId = 'abc1';
    sas.registerSkipTutorialEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'SkipTutorial', 'click', explorationId);
  });

  it('should register finish tutorial event', () => {
    const explorationId = 'abc1';
    sas.registerFinishTutorialEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FinishTutorial', 'click', explorationId);
  });

  it('should register editor first entry event', () => {
    const explorationId = 'abc1';
    sas.registerEditorFirstEntryEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstEnterEditor', 'open', explorationId);
  });

  it('should register first open content box event', () => {
    const explorationId = 'abc1';
    sas.registerFirstOpenContentBoxEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstOpenContentBox', 'open', explorationId);
  });

  it('should register first save content event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSaveContentEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstSaveContent', 'click', explorationId);
  });

  it('should register first click add interaction event', () => {
    const explorationId = 'abc1';
    sas.registerFirstClickAddInteractionEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstClickAddInteraction', 'click', explorationId);
  });

  it('should register select interaction type event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSelectInteractionTypeEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstSelectInteractionType', 'click', explorationId);
  });

  it('should register first save interaction event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSaveInteractionEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstSaveInteraction', 'click', explorationId);
  });

  it('should register first save rule event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSaveRuleEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstSaveRule', 'click', explorationId);
  });

  it('should register first create second state event', () => {
    const explorationId = 'abc1';
    sas.registerFirstCreateSecondStateEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'FirstCreateSecondState', 'create', explorationId);
  });

  it('should register save playable exploration event', () => {
    const explorationId = 'abc1';
    sas.registerSavePlayableExplorationEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'SavePlayableExploration', 'save', explorationId);
  });

  it('should register open publish exploration modal event', () => {
    const explorationId = 'abc1';
    sas.registerOpenPublishExplorationModalEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'PublishExplorationModal', 'open', explorationId);
  });

  it('should register publish exploration event', () => {
    const explorationId = 'abc1';
    sas.registerPublishExplorationEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'PublishExploration', 'click', explorationId);
  });

  it('should register visit oppia from iframe event', () => {
    const explorationId = 'abc1';
    sas.registerVisitOppiaFromIframeEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'VisitOppiaFromIframe', 'click', explorationId);
  });

  it('should register new card when card number is less than 10', () => {
    const cardNumber = 1;
    sas.registerNewCard(cardNumber);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'PlayerNewCard', 'click', String(cardNumber));
  });

  it('should register new card when card number is greather than 10 and' +
    ' it\'s a multiple of 10', () => {
    const cardNumber = 20;
    sas.registerNewCard(cardNumber);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'PlayerNewCard', 'click', String(cardNumber));
  });

  it('should not register new card', () => {
    const cardNumber = 35;
    sas.registerNewCard(cardNumber);

    expect(gaSpy).not.toHaveBeenCalled();
  });

  it('should register finish exploration event', () => {
    sas.registerFinishExploration('123');

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'PlayerFinishExploration', 'engage', '123');
  });

  it('should register finish curated lesson event', () => {
    sas.registerCuratedLessonCompleted('123');

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'CuratedLessonCompleted', 'engage', '123');
  });

  it('should register open collection from landing page event', () => {
    const collectionId = 'abc1';
    sas.registerOpenCollectionFromLandingPageEvent(collectionId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'OpenFractionsFromLandingPage', 'click', collectionId);
  });

  it('should register stewards landing page event', () => {
    const viewerType = 'user';
    const buttonText = 'Button Text';
    sas.registerStewardsLandingPageEvent(viewerType, buttonText);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ClickButtonOnStewardsPage', 'click',
      viewerType + ':' + buttonText);
  });

  it('should register save recorded audio event', () => {
    const explorationId = 'abc1';
    sas.registerSaveRecordedAudioEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'SaveRecordedAudio', 'click', explorationId);
  });

  it('should register audio recording event', () => {
    const explorationId = 'abc1';
    sas.registerStartAudioRecordingEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'StartAudioRecording', 'click', explorationId);
  });

  it('should register upload audio event', () => {
    const explorationId = 'abc1';
    sas.registerUploadAudioEvent(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'UploadRecordedAudio', 'click', explorationId);
  });

  it('should register Contributor Dashboard suggest event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardSuggestEvent(contributionType);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ContributorDashboardSuggest', 'click',
      contributionType);
  });

  it('should register Contributor Dashboard submit suggestion event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardSubmitSuggestionEvent(contributionType);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ContributorDashboardSubmitSuggestion', 'click',
      contributionType);
  });

  it('should register Contributor Dashboard view suggestion for review event',
    () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardViewSuggestionForReview(contributionType);

      expect(gaSpy).toHaveBeenCalledWith(
        'send', 'event', 'ContributorDashboardViewSuggestionForReview', 'click',
        contributionType);
    });

  it('should register Contributor Dashboard accept suggestion event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardAcceptSuggestion(contributionType);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ContributorDashboardAcceptSuggestion', 'click',
      contributionType);
  });

  it('should register Contributor Dashboard reject suggestion event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardRejectSuggestion(contributionType);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ContributorDashboardRejectSuggestion', 'click',
      contributionType);
  });

  it('should register active lesson usage', () => {
    sas.registerLessonActiveUse();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ActiveUserStartAndSawCards', 'engage', '');
  });

  it('should register exploration start', () => {
    const explorationId = 'abc1';
    sas.registerStartExploration(explorationId);

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'PlayerStartExploration', 'engage', explorationId);
  });

  it('should register active classroom lesson usage', () => {
    sas.registerClassroomLessonActiveUse();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ClassroomActiveUserStartAndSawCards', 'engage', '');
  });

  it('should register classroom header click event', () => {
    sas.registerClassoomHeaderClickEvent();

    expect(gaSpy).toHaveBeenCalledWith(
      'send', 'event', 'ClassroomEngagement', 'click', 'ClickOnClassroom');
  });
});
