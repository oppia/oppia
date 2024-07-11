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

import {TestBed} from '@angular/core/testing';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';

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
        pathname,
      },
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
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

      expect(gtagSpy).toHaveBeenCalledWith('event', 'login', {
        source_element: 'LoginEventButton',
        page_path: pathname,
      });
    });

    it('should register new signup event', () => {
      sas.registerNewSignupEvent('srcElement');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'sign_up', {
        source_element: 'srcElement',
      });
    });

    it('should register click browse lessons event', () => {
      sas.registerClickBrowseLessonsButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'discovery_browse_lessons',
        {
          page_path: pathname,
        }
      );
    });

    it('should register click start learning button event', () => {
      sas.registerClickStartLearningButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'start_learning_button_click',
        {
          page_path: pathname,
        }
      );
    });

    it('should register click start contributing button event', () => {
      sas.registerClickStartContributingButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'start_contributing_button_click',
        {
          page_path: pathname,
        }
      );
    });

    it('should register go to donation site event', () => {
      const donationSite = 'https://donation.com';
      sas.registerGoToDonationSiteEvent(donationSite);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'go_to_donation_site', {
        donation_site_name: donationSite,
      });
    });

    it('should register apply to teach with oppia event', () => {
      sas.registerApplyToTeachWithOppiaEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'apply_to_teach_with_oppia',
        {}
      );
    });

    it('should register click create exploration button event', () => {
      sas.registerClickCreateExplorationButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'create_exploration_button_click',
        {
          page_path: pathname,
        }
      );
    });

    it('should register create new exploration event', () => {
      const explorationId = 'exp123';
      sas.registerCreateNewExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'create_new_exploration', {
        exploration_id: explorationId,
      });
    });

    it('should register create new exploration in collection event', () => {
      const explorationId = 'exp123';
      sas.registerCreateNewExplorationInCollectionEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'create_new_exploration_in_collection',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register new collection event', () => {
      const collectionId = 'abc1';
      sas.registerCreateNewCollectionEvent(collectionId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'create_new_collection', {
        collection_id: collectionId,
      });
    });

    it('should register commit changes to private exploration event', () => {
      const explorationId = 'exp123';
      sas.registerCommitChangesToPrivateExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'commit_changes_to_private_exploration',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register share exploration event', () => {
      const network = 'ShareExplorationNetwork';
      sas.registerShareExplorationEvent(network);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'share_exploration', {
        network: network,
        page_path: pathname,
      });
    });

    it('should register share collection event', () => {
      const network = 'ShareCollectionNetwork';
      sas.registerShareCollectionEvent(network);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'share_collection', {
        network: network,
        page_path: pathname,
      });
    });

    it('should register share blog post event', () => {
      const network = 'ShareBlogPostNetwork';
      sas.registerShareBlogPostEvent(network);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'share_blog_post', {
        network: network,
        page_path: pathname,
      });
    });

    it('should register open embed info event', () => {
      sas.registerOpenEmbedInfoEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'open_embed_info_modal', {
        exploration_id: explorationId,
      });
    });

    it('should register commit changes to public exploration event', () => {
      sas.registerCommitChangesToPublicExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'commit_changes_to_public_exploration',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register tutorial modal open event', () => {
      sas.registerTutorialModalOpenEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'tutorial_modal_open', {
        exploration_id: explorationId,
      });
    });

    it('should register decline tutorial modal event', () => {
      sas.registerDeclineTutorialModalEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'decline_tutorial_modal', {
        exploration_id: explorationId,
      });
    });

    it('should register accept tutorial modal event', () => {
      sas.registerAcceptTutorialModalEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'accept_tutorial_modal', {
        exploration_id: explorationId,
      });
    });

    it('should register click help button event', () => {
      sas.registerClickHelpButtonEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click_help_button', {
        exploration_id: explorationId,
      });
    });

    it('should register visit help center event', () => {
      sas.registerVisitHelpCenterEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'visit_help_center', {
        exploration_id: explorationId,
      });
    });

    it('should register open tutorial from help center event', () => {
      sas.registerOpenTutorialFromHelpCenterEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'open_tutorial_from_help_center',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register skip tutorial event', () => {
      sas.registerSkipTutorialEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'skip_tutorial', {
        exploration_id: explorationId,
      });
    });

    it('should register finish tutorial event', () => {
      sas.registerFinishTutorialEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'finish_tutorial', {
        exploration_id: explorationId,
      });
    });

    it('should register editor first entry event', () => {
      sas.registerEditorFirstEntryEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'editor_first_entry', {
        exploration_id: explorationId,
      });
    });

    it('should register first open content box event', () => {
      sas.registerFirstOpenContentBoxEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'first_open_content_box', {
        exploration_id: explorationId,
      });
    });

    it('should register first save content event', () => {
      sas.registerFirstSaveContentEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'first_save_content', {
        exploration_id: explorationId,
      });
    });

    it('should register first click add interaction event', () => {
      sas.registerFirstClickAddInteractionEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'first_click_add_interaction',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register select interaction type event', () => {
      sas.registerFirstSelectInteractionTypeEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'first_select_interaction_type',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register first save interaction event', () => {
      sas.registerFirstSaveInteractionEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'first_save_interaction', {
        exploration_id: explorationId,
      });
    });

    it('should register first save rule event', () => {
      sas.registerFirstSaveRuleEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'first_save_rule', {
        exploration_id: explorationId,
      });
    });

    it('should register first create second state event', () => {
      sas.registerFirstCreateSecondStateEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'first_create_second_state',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register save playable exploration event', () => {
      sas.registerSavePlayableExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'save_playable_exploration',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register open publish exploration modal event', () => {
      sas.registerOpenPublishExplorationModalEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'open_publish_exploration_modal',
        {
          exploration_id: explorationId,
        }
      );
    });

    it('should register publish exploration event', () => {
      sas.registerPublishExplorationEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'publish_exploration', {
        exploration_id: explorationId,
      });
    });

    it('should register visit oppia from iframe event', () => {
      sas.registerVisitOppiaFromIframeEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'visit_oppia_from_iframe', {
        exploration_id: explorationId,
      });
    });

    it('should register new card when card number is less than 10', () => {
      const cardNumber = 1;
      sas.registerNewCard(cardNumber, 'abc1');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'new_card_load', {
        exploration_id: 'abc1',
        card_number: cardNumber,
      });
    });

    it(
      'should register new card when card number is greather than 10 and' +
        " it's a multiple of 10",
      () => {
        const cardNumber = 20;
        sas.registerNewCard(cardNumber, 'abc1');

        expect(gtagSpy).toHaveBeenCalledWith('event', 'new_card_load', {
          exploration_id: 'abc1',
          card_number: cardNumber,
        });
      }
    );

    it('should not register new card', () => {
      const cardNumber = 35;
      sas.registerNewCard(cardNumber, 'abc1');

      expect(gtagSpy).not.toHaveBeenCalled();
    });

    it('should register finish exploration event', () => {
      sas.registerFinishExploration('123');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'lesson_completed', {
        exploration_id: '123',
      });
    });

    it('should register finish curated lesson event', () => {
      sas.registerCuratedLessonStarted('Fractions', '123');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'classroom_lesson_started',
        {
          topic_name: 'Fractions',
          exploration_id: '123',
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
          exploration_language: 'en',
        }
      );
    });

    it('should register open collection from landing page event', () => {
      const collectionId = 'abc1';
      sas.registerOpenCollectionFromLandingPageEvent(collectionId);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'open_fractions_from_landing_page',
        {
          collection_id: collectionId,
        }
      );
    });

    it('should register save recorded audio event', () => {
      sas.registerSaveRecordedAudioEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'save_recorded_audio', {
        exploration_id: explorationId,
      });
    });

    it('should register audio recording event', () => {
      sas.registerStartAudioRecordingEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'start_audio_recording', {
        exploration_id: explorationId,
      });
    });

    it('should register upload audio event', () => {
      sas.registerUploadAudioEvent(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'upload_recorded_audio', {
        exploration_id: explorationId,
      });
    });

    it('should register Contributor Dashboard suggest event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardSuggestEvent(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'contributor_dashboard_suggest',
        {
          contribution_type: contributionType,
        }
      );
    });

    it('should register Contributor Dashboard submit suggestion event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardSubmitSuggestionEvent(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'contributor_dashboard_submit_suggestion',
        {
          contribution_type: contributionType,
        }
      );
    });

    it('should register Contributor Dashboard view suggestion for review event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardViewSuggestionForReview(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'contributor_dashboard_view_suggestion_for_review',
        {
          contribution_type: contributionType,
        }
      );
    });

    it('should register Contributor Dashboard accept suggestion event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardAcceptSuggestion(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'contributor_dashboard_accept_suggestion',
        {
          contribution_type: contributionType,
        }
      );
    });

    it('should register Contributor Dashboard reject suggestion event', () => {
      const contributionType = 'Translation';
      sas.registerContributorDashboardRejectSuggestion(contributionType);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'contributor_dashboard_reject_suggestion',
        {
          contribution_type: contributionType,
        }
      );
    });

    it('should register active lesson usage', () => {
      sas.registerLessonActiveUse();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'active_user_start_and_saw_cards',
        {}
      );
    });

    it('should register exploration start', () => {
      sas.registerStartExploration(explorationId);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'lesson_started', {
        exploration_id: explorationId,
      });
    });

    it('should register classroom page viewed', () => {
      spyOn(sas, '_sendEventToGoogleAnalytics');

      sas.registerClassroomPageViewed();
      expect(sas._sendEventToGoogleAnalytics).toHaveBeenCalledWith(
        'view_classroom',
        {}
      );
    });

    it('should register active classroom lesson usage', () => {
      let explorationId = '123';
      sas.registerClassroomLessonEngagedWithEvent(
        'math',
        'Fractions',
        'ch1',
        explorationId,
        '2',
        '3',
        'en'
      );

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
          exploration_language: 'en',
        }
      );
    });

    it('should register classroom header click event', () => {
      sas.registerClassroomHeaderClickEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'click_on_classroom', {});
    });

    it('should register community lesson completed event', () => {
      sas.registerCommunityLessonCompleted('exp_id');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'community_lesson_completed',
        {
          exploration_id: 'exp_id',
        }
      );
    });

    it('should register community lesson started event', () => {
      sas.registerCommunityLessonStarted('exp_id');

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'community_lesson_started',
        {
          exploration_id: 'exp_id',
        }
      );
    });

    it('should register audio play event', () => {
      sas.registerStartAudioPlayedEvent('exp_id', 0);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'audio_played', {
        exploration_id: 'exp_id',
        card_number: 0,
      });
    });

    it('should register practice session start event', () => {
      sas.registerPracticeSessionStartEvent('math', 'topic', '1,2,3');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'practice_session_start', {
        classroom_name: 'math',
        topic_name: 'topic',
        practice_session_id: '1,2,3',
      });
    });

    it('should register practice session end event', () => {
      sas.registerPracticeSessionEndEvent('math', 'topic', '1,2,3', 10, 10);

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'practice_session_complete',
        {
          classroom_name: 'math',
          topic_name: 'topic',
          practice_session_id: '1,2,3',
          questions_answered: 10,
          total_score: 10,
        }
      );
    });

    it('should register search results viewed event', () => {
      sas.registerSearchResultsViewedEvent();

      expect(gtagSpy).toHaveBeenCalledWith('event', 'view_search_results', {});
    });

    it('should register homepage start learning button click event', () => {
      sas.registerClickHomePageStartLearningButtonEvent();

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'discovery_start_learning',
        {}
      );
    });

    it('should register submitted answer', () => {
      const answerIsCorrect = true;
      sas.registerAnswerSubmitted(explorationId, answerIsCorrect);

      expect(gtagSpy).toHaveBeenCalledWith('event', 'answer_submitted', {
        exploration_id: explorationId,
        answer_is_correct: answerIsCorrect,
      });
    });
  });
});
