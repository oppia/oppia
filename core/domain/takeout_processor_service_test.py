from core.tests import test_utils
from core.platform import models
from core.domain import takeout_processor_service
import feconf
import datetime

(user_models, collection_models, exploration_models, story_models,
 feedback_models, suggestion_models,
 email_models) = models.Registry.import_models([
    models.NAMES.user, models.NAMES.collection, models.NAMES.exploration,
    models.NAMES.story, models.NAMES.feedback, models.NAMES.suggestion,
    models.NAMES.email])

class TakeoutProcessorServiceTests(test_utils.GenericTestBase):
    """Tests for the takeout processor service."""

    USER_ID_1 = 1
    USER_1_ROLE = feconf.ROLE_ID_ADMIN
    USER_1_EMAIL = 'user1@example.com'
    GENERIC_USERNAME = 'user'
    GENERIC_DATE = datetime.datetime(2019, 5, 20)
    GENERIC_IMAGE_URL = 'www.example.com/example.png'
    GENERIC_USER_BIO = 'I am a user of Oppia!'
    GENERIC_SUBJECT_INTERESTS = ['Math', 'Science']
    GENERIC_LANGUAGE_CODES = ['en', 'es']
    USER_1_IMPACT_SCORE = 0.87
    USER_1_TOTAL_PLAYS = 33
    USER_1_AVERAGE_RATINGS = 4.37
    USER_1_NUM_RATINGS = 22
    USER_1_WEEKLY_CREATOR_STATS_LIST = [
        {
            ('2019-05-21'): {
                'average_ratings': 4.00,
                'total_plays': 5
            }
        },
        {
            ('2019-05-28'): {
                'average_ratings': 4.95,
                'total_plays': 10
            }
        }
    ]
    EXPLORATION_IDS = ['exp_1']
    CREATOR_IDS = ['4', '8', '16']
    COLLECTION_IDS = ['23', '42', '4']
    ACTIVITY_IDS = ['8', '16', '23']
    GENERAL_FEEDBACK_THREAD_IDS = ['42', '4', '8']
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    DEGREE_OF_MASTERY = 0.5

    def setUp(self):
        """Set up all models for use in testing"""

        # Setup for UserStatsModel.
        user_model_1 = user_models.UserStatsModel(id=self.USER_ID_1)
        user_model_1.impact_score = self.USER_1_IMPACT_SCORE
        user_model_1.total_plays = self.USER_1_TOTAL_PLAYS
        user_model_1.average_ratings = self.USER_1_AVERAGE_RATINGS
        user_model_1.num_ratings = self.USER_1_NUM_RATINGS
        user_model_1.weekly_creator_stats_list = (
            self.USER_1_WEEKLY_CREATOR_STATS_LIST)
        user_models.UserStatsModel.put(user_model_1)

        # Setup for UserSettingsModel.
        user_models.UserSettingsModel(
            id=self.USER_ID_1,
            email=self.USER_1_EMAIL,
            role=self.USER_1_ROLE,
            username=self.GENERIC_USERNAME,
            normalized_username=self.GENERIC_USERNAME,
            last_agreed_to_terms=self.GENERIC_DATE,
            last_started_state_editor_tutorial=self.GENERIC_DATE,
            last_started_state_translation_tutorial=self.GENERIC_DATE,
            last_logged_in=self.GENERIC_DATE,
            last_created_an_exploration=self.GENERIC_DATE,
            last_edited_an_exploration=self.GENERIC_DATE,
            profile_picture_data_url=self.GENERIC_IMAGE_URL,
            default_dashboard='learner', creator_dashboard_display_pref='card',
            user_bio=self.GENERIC_USER_BIO,
            subject_interests=self.GENERIC_SUBJECT_INTERESTS,
            first_contribution_msec=1,
            preferred_language_codes=self.GENERIC_LANGUAGE_CODES,
            preferred_site_language_code=(self.GENERIC_LANGUAGE_CODES[0]),
            preferred_audio_language_code=(self.GENERIC_LANGUAGE_CODES[0])
        ).put()

        # Setup for UserSubscriptionsModel.
        user_models.UserSubscriptionsModel(
            id=self.USER_ID_1, creator_ids=self.CREATOR_IDS,
            collection_ids=self.COLLECTION_IDS,
            activity_ids=self.ACTIVITY_IDS,
            general_feedback_thread_ids=self.GENERAL_FEEDBACK_THREAD_IDS).put()

        # Setup for UserContributionsModel.
        self.signup(self.USER_ID_1, self.GENERIC_USERNAME)
        self.save_new_valid_exploration(
            self.EXPLORATION_IDS[0], self.USER_ID_1, end_state_name='End')
        
        exp_services.update_exploration(
            self.user_a_id, self.EXPLORATION_IDS[0], [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        
        # Setup for ExplorationUserDataModel.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID_1, self.EXPLORATION_IDS[0]), user_id=self.USER_ID_1,
            exploration_id=self.EXPLORATION_IDS[0], rating=2,
            rated_on=self.GENERIC_DATE,
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=self.GENERIC_DATE,
            draft_change_list_exp_version=3,
            draft_change_list_id=1).put()
        
        # Setup for CompletedActivitiesModel.
        user_models.CompletedActivitiesModel(
            id=self.USER_ID_1,
            exploration_ids=self.EXPLORATION_IDS,
            collection_ids=self.COLLECTION_IDS).put()

        # Setup for IncompleteACtivitiesModel.
        user_models.IncompleteActivitiesModel(
            id=self.USER_ID_1,
            exploration_ids=self.EXPLORATION_IDS,
            collection_ids=self.COLLECTION_IDS).put()

    def test_export_data_nontrivial(self):
        takeout_processor_service.export_all_models(self.USER_ID_1)
        stats_expected_user_data = {
            'impact_score': self.USER_1_IMPACT_SCORE,
            'total_plays': self.USER_1_TOTAL_PLAYS,
            'average_ratings': self.USER_1_AVERAGE_RATINGS,
            'num_ratings': self.USER_1_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_1_WEEKLY_CREATOR_STATS_LIST
        }
        settings_expected_user_data = {
            'email': self.USER_1_EMAIL,
            'role': feconf.ROLE_ID_ADMIN,
            'username': self.GENERIC_USERNAME,
            'normalized_username': self.GENERIC_USERNAME,
            'last_agreed_to_terms': self.GENERIC_DATE,
            'last_started_state_editor_tutorial': self.GENERIC_DATE,
            'last_started_state_translation_tutorial': self.GENERIC_DATE,
            'last_logged_in': self.GENERIC_DATE,
            'last_edited_an_exploration': self.GENERIC_DATE,
            'profile_picture_data_url': self.GENERIC_IMAGE_URL,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': self.GENERIC_USER_BIO,
            'subject_interests': self.GENERIC_SUBJECT_INTERESTS,
            'first_contribution_msec': 1,
            'preferred_language_codes': self.GENERIC_LANGUAGE_CODES,
            'preferred_site_language_code': self.GENERIC_LANGUAGE_CODES[0],
            'preferred_audio_language_code': self.GENERIC_LANGUAGE_CODES[0]
        }
        user_subscriptions_expected_data = {
            'creator_ids': self.CREATOR_IDS,
            'collection_ids': self.COLLECTION_IDS,
            'activity_ids': self.ACTIVITY_IDS,
            'general_feedback_thread_ids': self.GENERAL_FEEDBACK_THREAD_IDS,
            'last_checked': None
        }
        skill_expected_data = {
            self.SKILL_ID_1: self.DEGREE_OF_MASTERY,
            self.SKILL_ID_2: self.DEGREE_OF_MASTERY
        }
        contributions_expected_data = {
            'created_exploration_ids': [self.EXPLORATION_IDS[0]],
            'edited_exploration_ids': [self.EXPLORATION_IDS[0]]
        }
        exploration_expected_data = {
            self.EXP_ID_ONE: {
                'rating': 2,
                'rated_on': self.DATETIME_OBJECT,
                'draft_change_list': {'new_content': {}},
                'draft_change_list_last_updated': self.DATETIME_OBJECT,
                'draft_change_list_exp_version': 3,
                'draft_change_list_id': 1,
                'mute_suggestion_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'mute_feedback_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
            }
        }
        completed_expected_data = {
            'completed_exploration_ids': self.EXPLORATION_IDS,
            'completed_collection_ids': self.COLLECTION_IDS
        }
        incomplete_expected_data = {
            'incomplete_exploration_ids': self.EXPLORATION_IDS,
            'incomplete_collection_ids': self.COLLECTION_IDS
        }



