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
  let gtagSpy: jasmine.Spy = null;

  beforeEach(() => {
    sas = TestBed.get(SiteAnalyticsService);
    ws = TestBed.get(WindowRef);
    spyOnProperty(sas, 'CAN_SEND_ANALYTICS_EVENTS', 'get')
      .and.returnValue(true);

    ws.nativeWindow.gtag = function() {};
    gtagSpy = spyOn(ws.nativeWindow, 'gtag').and.stub();
  });

  it('should register start login event', () => {
    const element = 'LoginEventButton';
    sas.registerStartLoginEvent(element);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'LoginButton', {
      action: 'click',
      label: '/context.html LoginEventButton'
    });
  });

  it('should register new signup event', () => {
    sas.registerNewSignupEvent();

    expect(gtagSpy).toHaveBeenCalledWith('event', 'OnboardingEngagement', {
      action: 'signup',
      label: 'AccountSignUp'
    });
  });

  it('should register click browse lessons event', () => {
    sas.registerClickBrowseLessonsButtonEvent();

    expect(gtagSpy).toHaveBeenCalledWith('event', 'BrowseLessonsButton', {
      action: 'click',
      label: '/context.html'
    });
  });

  it('should register click start learning button event', () => {
    sas.registerClickStartLearningButtonEvent();

    expect(gtagSpy).toHaveBeenCalledWith('event', 'StartLearningButton', {
      action: 'click',
      label: '/context.html'
    });
  });

  it('should register click start contributing button event', () => {
    sas.registerClickStartContributingButtonEvent();

    expect(gtagSpy).toHaveBeenCalledWith('event', 'StartContributingButton', {
      action: 'click',
      label: '/context.html'
    });
  });

  it('should register go to donation site event', () => {
    const donationSite = 'https://donation.com';
    sas.registerGoToDonationSiteEvent(donationSite);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'GoToDonationSite', {
      action: 'click',
      label: donationSite
    });
  });

  it('should register apply to teach with oppia event', () => {
    sas.registerApplyToTeachWithOppiaEvent();

    expect(gtagSpy).toHaveBeenCalledWith('event', 'ApplyToTeachWithOppia', {
      action: 'click',
      label: ''
    });
  });

  it('should register click create exploration button event', () => {
    sas.registerClickCreateExplorationButtonEvent();

    expect(gtagSpy).toHaveBeenCalledWith('event', 'CreateExplorationButton', {
      action: 'click',
      label: '/context.html'
    });
  });

  it('should register create new exploration event', () => {
    const explorationId = 'abc1';
    sas.registerCreateNewExplorationEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'NewExploration', {
      action: 'create',
      label: explorationId
    });
  });

  it('should register create new exploration in collection event', () => {
    const explorationId = 'abc1';
    sas.registerCreateNewExplorationInCollectionEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'NewExplorationFromCollection', {
        action: 'create',
        label: explorationId
      });
  });

  it('should register new collection event', () => {
    const collectionId = 'abc1';
    sas.registerCreateNewCollectionEvent(collectionId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'NewCollection', {
      action: 'create',
      label: collectionId
    });
  });

  it('should register commit changes to private exploration event', () => {
    const explorationId = 'abc1';
    sas.registerCommitChangesToPrivateExplorationEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'CommitToPrivateExploration', {
        action: 'click',
        label: explorationId
      });
  });

  it('should register share exploration event', () => {
    const network = 'ShareExplorationNetwork';
    sas.registerShareExplorationEvent(network);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'social', {
      network: network,
      action: 'share',
      label: '/context.html'
    });
  });

  it('should register share collection event', () => {
    const network = 'ShareCollectionNetwork';
    sas.registerShareCollectionEvent(network);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'social', {
      network: network,
      action: 'share',
      label: '/context.html'
    });
  });

  it('should register open embed info event', () => {
    const explorationId = 'abc1';
    sas.registerOpenEmbedInfoEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'EmbedInfoModal', {
        action: 'open',
        label: explorationId
      });
  });

  it('should register commit changes to public exploration event', () => {
    const explorationId = 'abc1';
    sas.registerCommitChangesToPublicExplorationEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'CommitToPublicExploration', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register tutorial modal open event', () => {
    const explorationId = 'abc1';
    sas.registerTutorialModalOpenEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'TutorialModalOpen', {
      action: 'open',
      label: explorationId
    });
  });

  it('should register decline tutorial modal event', () => {
    const explorationId = 'abc1';
    sas.registerDeclineTutorialModalEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'DeclineTutorialModal', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register accept tutorial modal event', () => {
    const explorationId = 'abc1';
    sas.registerAcceptTutorialModalEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'AcceptTutorialModal', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register click help button event', () => {
    const explorationId = 'abc1';
    sas.registerClickHelpButtonEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'ClickHelpButton', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register visit help center event', () => {
    const explorationId = 'abc1';
    sas.registerVisitHelpCenterEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'VisitHelpCenter', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register open tutorial from help center event', () => {
    const explorationId = 'abc1';
    sas.registerOpenTutorialFromHelpCenterEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'OpenTutorialFromHelpCenter', {
        action: 'click',
        label: explorationId
      });
  });

  it('should register skip tutorial event', () => {
    const explorationId = 'abc1';
    sas.registerSkipTutorialEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'SkipTutorial', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register finish tutorial event', () => {
    const explorationId = 'abc1';
    sas.registerFinishTutorialEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FinishTutorial', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register editor first entry event', () => {
    const explorationId = 'abc1';
    sas.registerEditorFirstEntryEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FirstEnterEditor', {
      action: 'open',
      label: explorationId
    });
  });

  it('should register first open content box event', () => {
    const explorationId = 'abc1';
    sas.registerFirstOpenContentBoxEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FirstOpenContentBox', {
      action: 'open',
      label: explorationId
    });
  });

  it('should register first save content event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSaveContentEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FirstSaveContent', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register first click add interaction event', () => {
    const explorationId = 'abc1';
    sas.registerFirstClickAddInteractionEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FirstClickAddInteraction', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register select interaction type event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSelectInteractionTypeEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'FirstSelectInteractionType', {
        action: 'click',
        label: explorationId
      });
  });

  it('should register first save interaction event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSaveInteractionEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FirstSaveInteraction', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register first save rule event', () => {
    const explorationId = 'abc1';
    sas.registerFirstSaveRuleEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FirstSaveRule', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register first create second state event', () => {
    const explorationId = 'abc1';
    sas.registerFirstCreateSecondStateEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'FirstCreateSecondState', {
      action: 'create',
      label: explorationId
    });
  });

  it('should register save playable exploration event', () => {
    const explorationId = 'abc1';
    sas.registerSavePlayableExplorationEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'SavePlayableExploration', {
      action: 'save',
      label: explorationId
    });
  });

  it('should register open publish exploration modal event', () => {
    const explorationId = 'abc1';
    sas.registerOpenPublishExplorationModalEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'PublishExplorationModal', {
      action: 'open',
      label: explorationId
    });
  });

  it('should register publish exploration event', () => {
    const explorationId = 'abc1';
    sas.registerPublishExplorationEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'PublishExploration', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register visit oppia from iframe event', () => {
    const explorationId = 'abc1';
    sas.registerVisitOppiaFromIframeEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'VisitOppiaFromIframe', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register new card when card number is less than 10', () => {
    const cardNumber = 1;
    sas.registerNewCard(cardNumber);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'PlayerNewCard', {
      action: 'click',
      label: String(cardNumber)
    });
  });

  it('should register new card when card number is greather than 10 and' +
    ' it\'s a multiple of 10', () => {
    const cardNumber = 20;
    sas.registerNewCard(cardNumber);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'PlayerNewCard', {
      action: 'click',
      label: String(cardNumber)
    });
  });

  it('should not register new card', () => {
    const cardNumber = 35;
    sas.registerNewCard(cardNumber);

    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('should register finish exploration event', () => {
    sas.registerFinishExploration('123');

    expect(gtagSpy).toHaveBeenCalledWith('event', 'PlayerFinishExploration', {
      action: 'engage',
      label: '123'
    });
  });

  it('should register finish curated lesson event', () => {
    sas.registerCuratedLessonCompleted('123');

    expect(gtagSpy).toHaveBeenCalledWith('event', 'CuratedLessonCompleted', {
      action: 'engage',
      label: '123'
    });
  });

  it('should register open collection from landing page event', () => {
    const collectionId = 'abc1';
    sas.registerOpenCollectionFromLandingPageEvent(collectionId);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'OpenFractionsFromLandingPage', {
        action: 'click',
        label: collectionId
      });
  });

  it('should register stewards landing page event', () => {
    const viewerType = 'user';
    const buttonText = 'Button Text';
    sas.registerStewardsLandingPageEvent(viewerType, buttonText);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'ClickButtonOnStewardsPage', {
      action: 'click',
      label: viewerType + ':' + buttonText
    });
  });

  it('should register save recorded audio event', () => {
    const explorationId = 'abc1';
    sas.registerSaveRecordedAudioEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'SaveRecordedAudio', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register audio recording event', () => {
    const explorationId = 'abc1';
    sas.registerStartAudioRecordingEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'StartAudioRecording', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register upload audio event', () => {
    const explorationId = 'abc1';
    sas.registerUploadAudioEvent(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'UploadRecordedAudio', {
      action: 'click',
      label: explorationId
    });
  });

  it('should register Contributor Dashboard suggest event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardSuggestEvent(contributionType);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'ContributorDashboardSuggest', {
        action: 'click',
        label: contributionType
      });
  });

  it('should register Contributor Dashboard submit suggestion event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardSubmitSuggestionEvent(contributionType);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'ContributorDashboardSubmitSuggestion', {
        action: 'click',
        label: contributionType
      });
  });

  it('should register Contributor Dashboard view suggestion for review event',
    () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardViewSuggestionForReview(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'ContributorDashboardViewSuggestionForReview', {
          action: 'click',
          label: contributionType
        });
    });

  it('should register Contributor Dashboard accept suggestion event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardAcceptSuggestion(contributionType);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'ContributorDashboardAcceptSuggestion', {
        action: 'click',
        label: contributionType
      });
  });

  it('should register Contributor Dashboard reject suggestion event', () => {
    const contributionType = 'Translation';
    sas.registerContributorDashboardRejectSuggestion(contributionType);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'ContributorDashboardRejectSuggestion', {
        action: 'click',
        label: contributionType
      });
  });

  it('should register active lesson usage', () => {
    sas.registerLessonActiveUse();

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'ActiveUserStartAndSawCards', {
        action: 'engage',
        label: ''
      });
  });

  it('should register exploration start', () => {
    const explorationId = 'abc1';
    sas.registerStartExploration(explorationId);

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'PlayerStartExploration', {
        action: 'engage',
        label: explorationId
      });
  });

  it('should register active classroom lesson usage', () => {
    sas.registerClassroomLessonActiveUse();

    expect(gtagSpy).toHaveBeenCalledWith(
      'event', 'ClassroomActiveUserStartAndSawCards', {
        action: 'engage',
        label: ''
      });
  });

  it('should register classroom header click event', () => {
    sas.registerClassoomHeaderClickEvent();

    expect(gtagSpy).toHaveBeenCalledWith('event', 'ClassroomEngagement', {
      action: 'click',
      label: 'ClickOnClassroom'
    });
  });
});
