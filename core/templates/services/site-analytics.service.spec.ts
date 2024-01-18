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
  let sas: SiteAnalyticsService;
  let ws: WindowRef;
  let gtagSpy: jasmine.Spy;
  let pathname = 'pathname';
  const explorationId = 'abc1';

  class MockWindowRef {
    nativeWindow = {
      gtag: () => {},
      location: {
        pathname
      }
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ]
    }).compileComponents();

    sas = TestBed.inject(SiteAnalyticsService);
    ws = TestBed.inject(WindowRef);
  });

  it('should initialize google analytics', () => {
    expect(ws.nativeWindow.gtag).toBeDefined();
  });

  describe('when tested using gtag spy', () => {
    beforeEach(() => {
      gtagSpy = spyOn(ws.nativeWindow, 'gtag');
    });

    it('should register start login event', () => {
      const element = 'LoginEventButton';
      sas.registerStartLoginEvent(element);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'LoginButton',
        event_label: pathname + ' LoginEventButton'
      });
    });

    it('should register new signup event', () => {
      sas.registerNewSignupEvent('srcElement');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'sign_up', {
        source_element: 'srcElement'
      });
    });

    it('should register click browse lessons event', () => {
      sas.registerClickBrowseLessonsButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'BrowseLessonsButton',
        event_label: pathname
      });
    });

    it('should register click start learning button event', () => {
      sas.registerClickStartLearningButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'StartLearningButton',
        event_label: pathname
      });
    });

    it('should register click start contributing button event', () => {
      sas.registerClickStartContributingButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'StartContributingButton',
        event_label: pathname
      });
    });

    it('should register go to donation site event', () => {
      const donationSite = 'https://donation.com';
      sas.registerGoToDonationSiteEvent(donationSite);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'GoToDonationSite',
        event_label: donationSite
      });
    });

    it('should register apply to teach with oppia event', () => {
      sas.registerApplyToTeachWithOppiaEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'ApplyToTeachWithOppia',
        event_label: ''
      });
    });

    it('should register click create exploration button event', () => {
      sas.registerClickCreateExplorationButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'CreateExplorationButton',
        event_label: pathname
      });
    });

    it('should register create new exploration event', () => {
      sas.registerCreateNewExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'create', {
        event_category: 'NewExploration',
        event_label: explorationId
      });
    });

    it('should register create new exploration in collection event', () => {
      sas.registerCreateNewExplorationInCollectionEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'create', {
          event_category: 'NewExplorationFromCollection',
          event_label: explorationId
        });
    });

    it('should register new collection event', () => {
      const collectionId = 'abc1';
      sas.registerCreateNewCollectionEvent(collectionId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'create', {
        event_category: 'NewCollection',
        event_label: collectionId
      });
    });

    it('should register commit changes to private exploration event', () => {
      sas.registerCommitChangesToPrivateExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'click', {
          event_category: 'CommitToPrivateExploration',
          event_label: explorationId
        });
    });

    it('should register share exploration event', () => {
      const network = 'ShareExplorationNetwork';
      sas.registerShareExplorationEvent(network);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'share', {
        event_category: network,
        event_label: pathname
      });
    });

    it('should register share collection event', () => {
      const network = 'ShareCollectionNetwork';
      sas.registerShareCollectionEvent(network);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'share', {
        event_category: network,
        event_label: pathname
      });
    });

    it('should register share blog post event', () => {
      const network = 'ShareBlogPostNetwork';
      sas.registerShareBlogPostEvent(network);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'share', {
        event_category: network,
        event_label: pathname
      });
    });

    it('should register open embed info event', () => {
      sas.registerOpenEmbedInfoEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'open', {
        event_category: 'EmbedInfoModal',
        event_label: explorationId
      });
    });

    it('should register commit changes to public exploration event', () => {
      sas.registerCommitChangesToPublicExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'CommitToPublicExploration',
        event_label: explorationId
      });
    });

    it('should register tutorial modal open event', () => {
      sas.registerTutorialModalOpenEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'open', {
        event_category: 'TutorialModalOpen',
        event_label: explorationId
      });
    });

    it('should register decline tutorial modal event', () => {
      sas.registerDeclineTutorialModalEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'DeclineTutorialModal',
        event_label: explorationId
      });
    });

    it('should register accept tutorial modal event', () => {
      sas.registerAcceptTutorialModalEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'AcceptTutorialModal',
        event_label: explorationId
      });
    });

    it('should register click help button event', () => {
      sas.registerClickHelpButtonEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'ClickHelpButton',
        event_label: explorationId
      });
    });

    it('should register visit help center event', () => {
      sas.registerVisitHelpCenterEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'VisitHelpCenter',
        event_label: explorationId
      });
    });

    it('should register open tutorial from help center event', () => {
      sas.registerOpenTutorialFromHelpCenterEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'OpenTutorialFromHelpCenter',
        event_label: explorationId
      });
    });

    it('should register skip tutorial event', () => {
      sas.registerSkipTutorialEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'SkipTutorial',
        event_label: explorationId
      });
    });

    it('should register finish tutorial event', () => {
      sas.registerFinishTutorialEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'FinishTutorial',
        event_label: explorationId
      });
    });

    it('should register editor first entry event', () => {
      sas.registerEditorFirstEntryEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'open', {
        event_category: 'FirstEnterEditor',
        event_label: explorationId
      });
    });

    it('should register first open content box event', () => {
      sas.registerFirstOpenContentBoxEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'open', {
        event_category: 'FirstOpenContentBox',
        event_label: explorationId
      });
    });

    it('should register first save content event', () => {
      sas.registerFirstSaveContentEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'FirstSaveContent',
        event_label: explorationId
      });
    });

    it('should register first click add interaction event', () => {
      sas.registerFirstClickAddInteractionEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'FirstClickAddInteraction',
        event_label: explorationId
      });
    });

    it('should register select interaction type event', () => {
      sas.registerFirstSelectInteractionTypeEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'FirstSelectInteractionType',
        event_label: explorationId
      });
    });

    it('should register first save interaction event', () => {
      sas.registerFirstSaveInteractionEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'FirstSaveInteraction',
        event_label: explorationId
      });
    });

    it('should register first save rule event', () => {
      sas.registerFirstSaveRuleEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'FirstSaveRule',
        event_label: explorationId
      });
    });

    it('should register first create second state event', () => {
      sas.registerFirstCreateSecondStateEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'create', {
        event_category: 'FirstCreateSecondState',
        event_label: explorationId
      });
    });

    it('should register save playable exploration event', () => {
      sas.registerSavePlayableExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'save', {
        event_category: 'SavePlayableExploration',
        event_label: explorationId
      });
    });

    it('should register open publish exploration modal event', () => {
      sas.registerOpenPublishExplorationModalEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'open', {
        event_category: 'PublishExplorationModal',
        event_label: explorationId
      });
    });

    it('should register publish exploration event', () => {
      sas.registerPublishExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'PublishExploration',
        event_label: explorationId
      });
    });

    it('should register visit oppia from iframe event', () => {
      sas.registerVisitOppiaFromIframeEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'VisitOppiaFromIframe',
        event_label: explorationId
      });
    });

    it('should register new card when card number is less than 10', () => {
      const cardNumber = 1;
      sas.registerNewCard(cardNumber, 'abc1');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'PlayerNewCard',
        event_label: String(cardNumber)
      });
    });

    it('should register new card when card number is greather than 10 and' +
      ' it\'s a multiple of 10', () => {
      const cardNumber = 20;
      sas.registerNewCard(cardNumber, 'abc1');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'PlayerNewCard',
        event_label: String(cardNumber)
      });
    });

    it('should not register new card', () => {
      const cardNumber = 35;
      sas.registerNewCard(cardNumber, 'abc1');

      expect(gtagSpy).not.toHaveBeenCalled();
    });

    it('should register finish exploration event', () => {
      sas.registerFinishExploration('123');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'engage', {
        event_category: 'PlayerFinishExploration',
        event_label: '123'
      });
    });

    it('should register finish curated lesson event', () => {
      sas.registerCuratedLessonStarted('Fractions', '123');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'classroom_lesson_started',
        {
          topic_name: 'Fractions',
          exploration_id: '123'
        }
      );
    });

    it('should register finish curated lesson event', () => {
      sas.registerCuratedLessonCompleted(
        'math',
        'Fractions',
        'ch1',
        '123',
        '2',
        '3',
        'en'
      );

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'classroom_lesson_completed',
        {
          classroom_name: 'math',
          topic_name: 'Fractions',
          chapter_name: 'ch1',
          exploration_id: '123',
          chapter_number: '2',
          chapter_card_count: '3',
          exploration_language: 'en'
        }
      );
    });

    it('should register open collection from landing page event', () => {
      const collectionId = 'abc1';
      sas.registerOpenCollectionFromLandingPageEvent(collectionId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'OpenFractionsFromLandingPage',
        event_label: collectionId
      });
    });

    it('should register save recorded audio event', () => {
      sas.registerSaveRecordedAudioEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'SaveRecordedAudio',
        event_label: explorationId
      });
    });

    it('should register audio recording event', () => {
      sas.registerStartAudioRecordingEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'StartAudioRecording',
        event_label: explorationId
      });
    });

    it('should register upload audio event', () => {
      sas.registerUploadAudioEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'UploadRecordedAudio',
        event_label: explorationId
      });
    });

    it('should register Contributor Dashboard suggest event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardSuggestEvent(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'ContributorDashboardSuggest',
        event_label: contributionType
      });
    });

    it('should register Contributor Dashboard submit suggestion event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardSubmitSuggestionEvent(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'ContributorDashboardSubmitSuggestion',
        event_label: contributionType
      });
    });

    it('should register Contributor Dashboard view suggestion for review event',
      () => {
        const contributionType = 'Translation';
        sas.registerContributorDashboardViewSuggestionForReview(
          contributionType);

        expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
          event_category: 'ContributorDashboardViewSuggestionForReview',
          event_label: contributionType
        });
      });

    it('should register Contributor Dashboard accept suggestion event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardAcceptSuggestion(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'ContributorDashboardAcceptSuggestion',
        event_label: contributionType
      });
    });

    it('should register Contributor Dashboard reject suggestion event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardRejectSuggestion(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'ContributorDashboardRejectSuggestion',
        event_label: contributionType
      });
    });

    it('should register active lesson usage', () => {
      sas.registerLessonActiveUse();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'engage', {
        event_category: 'ActiveUserStartAndSawCards',
        event_label: ''
      });
    });

    it('should register exploration start', () => {
      sas.registerStartExploration(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'engage', {
        event_category: 'PlayerStartExploration',
        event_label: explorationId
      });
    });

    it('should register classroom page viewed', () => {
      spyOn(sas, '_sendEventToLegacyGoogleAnalytics');

      sas.registerClassroomPageViewed();
      expect(sas._sendEventToLegacyGoogleAnalytics).toHaveBeenCalledWith(
        'ClassroomEngagement', 'impression', 'ViewClassroom');
    });

    it('should register active classroom lesson usage', () => {
      let explorationId = '123';
      sas.registerClassroomLessonEngagedWithEvent(
        'math', 'Fractions', 'ch1', explorationId, '2', '3', 'en');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'classroom_lesson_engaged_with',
        {
          classroom_name: 'math',
          topic_name: 'Fractions',
          chapter_name: 'ch1',
          exploration_id: '123',
          chapter_number: '2',
          chapter_card_count: '3',
          exploration_language: 'en'
        }
      );
    });

    it('should register classroom header click event', () => {
      sas.registerClassroomHeaderClickEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click', {
        event_category: 'ClassroomEngagement',
        event_label: 'ClickOnClassroom'
      });
    });

    it('should register community lesson completed event', () => {
      sas.registerCommunityLessonCompleted('exp_id');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'community_lesson_completed',
        {
          exploration_id: 'exp_id'
        }
      );
    });

    it('should register community lesson started event', () => {
      sas.registerCommunityLessonStarted('exp_id');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'community_lesson_started',
        {
          exploration_id: 'exp_id'
        }
      );
    });

    it('should register audio play event', () => {
      sas.registerStartAudioPlayedEvent('exp_id', 0);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'audio_played',
        {
          exploration_id: 'exp_id',
          card_number: 0
        }
      );
    });

    it('should register practice session start event', () => {
      sas.registerPracticeSessionStartEvent('math', 'topic', '1,2,3');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'practice_session_start',
        {
          classroom_name: 'math',
          topic_name: 'topic',
          practice_session_id: '1,2,3'
        }
      );
    });

    it('should register practice session end event', () => {
      sas.registerPracticeSessionEndEvent(
        'math', 'topic', '1,2,3', 10, 10);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'practice_session_complete',
        {
          classroom_name: 'math',
          topic_name: 'topic',
          practice_session_id: '1,2,3',
          questions_answered: 10,
          total_score: 10
        }
      );
    });

    it('should register search results viewed event', () => {
      sas.registerSearchResultsViewedEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'view_search_results', {}
      );
    });

    it('should register homepage start learning button click event', () => {
      sas.registerClickHomePageStartLearningButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'discovery_start_learning', {}
      );
    });

    it('should register submitted answer', () => {
      const answerIsCorrect = true;
      sas.registerAnswerSubmitted(explorationId, answerIsCorrect);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event', 'answer_submitted', {
          exploration_id: explorationId,
          answer_is_correct: answerIsCorrect,
        }
      );
    });
  });
});
