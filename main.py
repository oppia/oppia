# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""URL routing definitions, and some basic error/warmup handlers."""

from __future__ import annotations

import logging

from core import android_validation_constants
from core import feconf
from core.constants import constants
from core.controllers import access_validators
from core.controllers import acl_decorators
from core.controllers import admin
from core.controllers import android_e2e_config
from core.controllers import base
from core.controllers import beam_jobs
from core.controllers import blog_admin
from core.controllers import blog_dashboard
from core.controllers import blog_homepage
from core.controllers import classifier
from core.controllers import classroom
from core.controllers import collection_editor
from core.controllers import collection_viewer
from core.controllers import concept_card_viewer
from core.controllers import contributor_dashboard
from core.controllers import contributor_dashboard_admin
from core.controllers import creator_dashboard
from core.controllers import cron
from core.controllers import custom_landing_pages
from core.controllers import editor
from core.controllers import email_dashboard
from core.controllers import features
from core.controllers import feedback
from core.controllers import improvements
from core.controllers import incoming_app_feedback_report
from core.controllers import learner_dashboard
from core.controllers import learner_goals
from core.controllers import learner_group
from core.controllers import learner_playlist
from core.controllers import library
from core.controllers import moderator
from core.controllers import oppia_root
from core.controllers import pages
from core.controllers import platform_feature
from core.controllers import practice_sessions
from core.controllers import profile
from core.controllers import question_editor
from core.controllers import questions_list
from core.controllers import reader
from core.controllers import recent_commits
from core.controllers import release_coordinator
from core.controllers import resources
from core.controllers import review_tests
from core.controllers import skill_editor
from core.controllers import skill_mastery
from core.controllers import story_editor
from core.controllers import story_viewer
from core.controllers import subscriptions
from core.controllers import subtopic_viewer
from core.controllers import suggestion
from core.controllers import tasks
from core.controllers import topic_editor
from core.controllers import topic_viewer
from core.controllers import topics_and_skills_dashboard
from core.controllers import voice_artist
from core.platform import models
from core.platform.auth import firebase_auth_services

import google.cloud.logging
from typing import Any, Dict, Optional, Type, TypeVar
import webapp2
from webapp2_extras import routes

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import memory_cache_services as cache_services

T = TypeVar('T')  # pylint: disable=invalid-name

cache_services = models.Registry.import_cache_services()
datastore_services = models.Registry.import_datastore_services()

# Cloud Logging is disabled in emulator mode, since it is unnecessary and
# creates a lot of noise.
if not constants.EMULATOR_MODE:
    # Instantiates a client and rtrieves a Cloud Logging handler based on the
    # environment you're running in and integrates the handler with the Python
    # logging module.
    client = google.cloud.logging.Client()
    client.setup_logging()

# Suppress debug logging for chardet. See https://stackoverflow.com/a/48581323.
# Without this, a lot of unnecessary debug logs are printed in error logs,
# which makes it tiresome to identify the actual error.
logging.getLogger(name='chardet.charsetprober').setLevel(logging.INFO)


class InternetConnectivityHandler(base.BaseHandler):
    """Handles the get request to the server from the
    frontend to check for internet connection."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    # Here we use type Any because this class inherits this attribute
    # from core.controllers.base.BaseModel.
    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}
    # Here we use type Any because this class inherits this attribute
    # from core.controllers.base.BaseModel.
    HANDLER_ARGS_SCHEMAS: Dict[str, Any] = {'GET': {}}

    # Here we use MyPy ignore because untyped decorator makes function
    # "get" also untyped.
    @acl_decorators.open_access # type: ignore[misc]
    def get(self) -> None:
        """Handles GET requests."""
        self.render_json({'is_internet_connected': True})


class FrontendErrorHandler(base.BaseHandler):
    """Handles errors arising from the frontend."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    # Here we use MyPy ignore because untyped decorator makes function
    # "post" also untyped.
    @acl_decorators.open_access # type: ignore[misc]
    def post(self) -> None:
        """Records errors reported by the frontend."""
        logging.error('Frontend error: %s' % self.payload.get('error'))
        self.render_json(self.values)


class WarmupPage(base.BaseHandler):
    """Handles warmup requests."""

    # Here we use MyPy ignore because untyped decorator makes function
    # "get" also untyped.
    @acl_decorators.open_access # type: ignore[misc]
    def get(self) -> None:
        """Handles GET warmup requests."""
        pass


class SplashRedirectPage(base.BaseHandler):
    """Redirect the old splash URL, '/splash' to the new one, '/'."""

    # Here we use MyPy ignore because untyped decorator makes function
    # "get" also untyped.
    @acl_decorators.open_access  # type: ignore[misc]
    def get(self) -> None:
        self.redirect('/')


# Type for `defaults` is set to Dict[str, str] based on the usage in our
# backend. Should be changed in future as per the requirements.
def get_redirect_route(
        regex_route: str,
        handler: Type[base.BaseHandler],
        defaults: Optional[Dict[str, str]] = None
) -> routes.RedirectRoute:
    """Returns a route that redirects /foo/ to /foo.

    Warning: this method strips off parameters after the trailing slash. URLs
    with parameters should be formulated without the trailing slash.

    Args:
        regex_route: unicode. A raw string representing a route.
        handler: BaseHandler. A callable to handle the route.
        defaults: dict. Optional defaults parameter to be passed
            into the RedirectRoute object.

    Returns:
        RedirectRoute. A RedirectRoute object for redirects.
    """
    if defaults is None:
        defaults = {}
    name = regex_route.replace('/', '_')
    return routes.RedirectRoute(
        regex_route, handler, name, strict_slash=True, defaults=defaults)


# Register the URLs with the classes responsible for handling them.
URLS = [
    get_redirect_route(r'/_ah/warmup', WarmupPage),
    get_redirect_route(r'/splash', SplashRedirectPage),
    get_redirect_route(
        r'/internetconnectivityhandler', InternetConnectivityHandler),
    get_redirect_route(r'/foundation', pages.FoundationRedirectPage),
    get_redirect_route(r'/credits', pages.AboutRedirectPage),
    get_redirect_route(r'/participate', pages.TeachRedirectPage),
    get_redirect_route(r'/site_guidelines', pages.TeachRedirectPage),
    get_redirect_route(r'/console_errors', pages.ConsoleErrorPage),

    get_redirect_route(r'/forum', pages.ForumRedirectPage),

    # Access Validators.
    get_redirect_route(
        r'%s/can_access_classroom_page' %
        feconf.ACCESS_VALIDATION_HANDLER_PREFIX,
        access_validators.ClassroomAccessValidationHandler),

    get_redirect_route(
        r'%s/can_manage_own_account' % feconf.ACCESS_VALIDATION_HANDLER_PREFIX,
        access_validators.ManageOwnAccountValidationHandler),

    get_redirect_route(
        r'%s/does_profile_exist/<username>' %
        feconf.ACCESS_VALIDATION_HANDLER_PREFIX,
        access_validators.ProfileExistsValidationHandler),

    get_redirect_route(
        r'%s/can_access_release_coordinator_page' %
        feconf.ACCESS_VALIDATION_HANDLER_PREFIX,
        access_validators.ReleaseCoordinatorAccessValidationHandler
    ),

    get_redirect_route(r'%s' % feconf.ADMIN_URL, admin.AdminPage),
    get_redirect_route(r'/adminhandler', admin.AdminHandler),
    get_redirect_route(r'/adminrolehandler', admin.AdminRoleHandler),
    get_redirect_route(r'/bannedusershandler', admin.BannedUsersHandler),
    get_redirect_route(
        r'/topicmanagerrolehandler', admin.TopicManagerRoleHandler),
    get_redirect_route(
        r'/adminsuperadminhandler', admin.AdminSuperAdminPrivilegesHandler),
    get_redirect_route(
        r'/admintopicscsvdownloadhandler',
        admin.AdminTopicsCsvFileDownloader),
    get_redirect_route(
        r'/updateblogpostdatahandler', admin.UpdateBlogPostHandler),
    get_redirect_route(
        r'/contributionrightshandler/<category>',
        contributor_dashboard_admin.ContributionRightsHandler),
    get_redirect_route(
        r'/getcontributorusershandler/<category>',
        contributor_dashboard_admin.ContributorUsersListHandler),
    get_redirect_route(
        r'/contributionrightsdatahandler',
        contributor_dashboard_admin.ContributionRightsDataHandler),
    get_redirect_route(
        r'%s' % feconf.CONTRIBUTOR_DASHBOARD_ADMIN_URL,
        contributor_dashboard_admin.ContributorDashboardAdminPage),
    get_redirect_route(
        r'/translationcontributionstatshandler',
        contributor_dashboard_admin.TranslationContributionStatsHandler),
    get_redirect_route(
        r'%s' % feconf.CONTRIBUTOR_DASHBOARD_URL,
        contributor_dashboard.ContributorDashboardPage),
    get_redirect_route(
        r'%s/<contribution_type>/<contribution_subtype>/<username>' % (
            feconf.CONTRIBUTOR_STATS_SUMMARIES_URL),
        contributor_dashboard.ContributorStatsSummariesHandler),
    get_redirect_route(
        r'%s/<username>' % feconf.CONTRIBUTOR_ALL_STATS_SUMMARIES_URL,
        contributor_dashboard.ContributorAllStatsSummariesHandler),
    get_redirect_route(
        '/contributor_dashboard',
        creator_dashboard.OldContributorDashboardRedirectPage),
    get_redirect_route(
        '/creator_dashboard',
        creator_dashboard.OldCreatorDashboardRedirectPage),
    get_redirect_route(
        r'%s' % feconf.CREATOR_DASHBOARD_URL,
        creator_dashboard.CreatorDashboardPage),
    get_redirect_route(
        r'%s' % feconf.CREATOR_DASHBOARD_DATA_URL,
        creator_dashboard.CreatorDashboardHandler),
    get_redirect_route(
        r'%s' % feconf.NEW_EXPLORATION_URL,
        creator_dashboard.NewExplorationHandler),
    get_redirect_route(
        r'%s' % feconf.NEW_COLLECTION_URL,
        creator_dashboard.NewCollectionHandler),
    get_redirect_route(
        r'%s' % feconf.FRACTIONS_LANDING_PAGE_URL,
        custom_landing_pages.FractionLandingRedirectPage),
    get_redirect_route(
        r'/learn/maths/<topic>', custom_landing_pages.TopicLandingRedirectPage),
    get_redirect_route(
        r'%s/<opportunity_type>' % feconf.CONTRIBUTOR_OPPORTUNITIES_DATA_URL,
        contributor_dashboard.ContributionOpportunitiesHandler),
    get_redirect_route(
        r'/preferredtranslationlanguage',
        contributor_dashboard.TranslationPreferenceHandler),
    get_redirect_route(
        r'%s' % feconf.REVIEWABLE_OPPORTUNITIES_URL,
        contributor_dashboard.ReviewableOpportunitiesHandler),
    get_redirect_route(
        r'/gettranslatabletexthandler',
        contributor_dashboard.TranslatableTextHandler),
    get_redirect_route(
        r'%s' % feconf.MACHINE_TRANSLATION_DATA_URL,
        contributor_dashboard.MachineTranslationStateTextsHandler),
    get_redirect_route(
        r'/usercontributionrightsdatahandler',
        contributor_dashboard.UserContributionRightsDataHandler),
    get_redirect_route(
        r'/retrivefeaturedtranslationlanguages',
        contributor_dashboard.FeaturedTranslationLanguagesHandler),
    get_redirect_route(
        r'/gettranslatabletopicnames',
        contributor_dashboard.TranslatableTopicNamesHandler),
    get_redirect_route(
        r'%s' % feconf.NEW_SKILL_URL,
        topics_and_skills_dashboard.NewSkillHandler),
    get_redirect_route(
        r'%s' % feconf.NEW_QUESTION_URL,
        question_editor.QuestionCreationHandler),
    get_redirect_route(
        r'%s/<comma_separated_skill_ids>' % feconf.QUESTIONS_LIST_URL_PREFIX,
        questions_list.QuestionsListHandler),
    get_redirect_route(
        r'%s/<comma_separated_skill_ids>' % feconf.QUESTION_COUNT_URL_PREFIX,
        questions_list.QuestionCountDataHandler),
    get_redirect_route(
        r'%s/practice/session' % feconf.TOPIC_VIEWER_URL_PREFIX,
        practice_sessions.PracticeSessionsPage),
    get_redirect_route(
        r'%s/<classroom_url_fragment>/<topic_url_fragment>' %
        feconf.PRACTICE_SESSION_DATA_URL_PREFIX,
        practice_sessions.PracticeSessionsPageDataHandler),
    get_redirect_route(
        r'%s/<classroom_url_fragment>/<topic_url_fragment>'
        r'/<story_url_fragment>' % feconf.REVIEW_TEST_DATA_URL_PREFIX,
        review_tests.ReviewTestsPageDataHandler),
    get_redirect_route(
        r'%s/review-test/<story_url_fragment>'
        % feconf.TOPIC_VIEWER_URL_PREFIX,
        review_tests.ReviewTestsPage),
    get_redirect_route(
        r'%s/<classroom_url_fragment>/<topic_url_fragment>'
        r'/<story_url_fragment>' % feconf.STORY_DATA_HANDLER,
        story_viewer.StoryPageDataHandler),
    get_redirect_route(
        r'%s/<story_url_fragment>' % feconf.STORY_URL_FRAGMENT_HANDLER,
        story_editor.StoryUrlFragmentHandler),
    get_redirect_route(
        r'%s/<topic_name>' % feconf.TOPIC_NAME_HANDLER,
        topic_editor.TopicNameHandler),
    get_redirect_route(
        r'%s/<topic_url_fragment>' % feconf.TOPIC_URL_FRAGMENT_HANDLER,
        topic_editor.TopicUrlFragmentHandler),
    get_redirect_route(
        r'%s/<skill_description>' % feconf.SKILL_DESCRIPTION_HANDLER,
        skill_editor.SkillDescriptionHandler),
    get_redirect_route(
        r'%s/<skill_id>' % feconf.DIAGNOSTIC_TEST_SKILL_ASSIGNMENT_HANDLER,
        skill_editor.DiagnosticTestSkillAssignmentHandler),
    get_redirect_route(
        r'%s/' %
        feconf.TOPIC_ID_TO_DIAGNOSTIC_TEST_SKILL_IDS_HANDLER,
        topics_and_skills_dashboard.TopicIdToDiagnosticTestSkillIdsHandler),
    get_redirect_route(
        r'%s/story' % feconf.TOPIC_VIEWER_URL_PREFIX,
        topic_viewer.TopicViewerPage),
    get_redirect_route(
        r'%s' % feconf.CLASSROOM_ADMIN_PAGE_URL,
        classroom.ClassroomAdminPage),
    get_redirect_route(
        r'%s' % feconf.CLASSROOM_ADMIN_DATA_HANDLER_URL,
        classroom.ClassroomAdminDataHandler),
    get_redirect_route(
        r'%s' % feconf.CLASSROOM_ID_HANDLER_URL,
        classroom.NewClassroomIdHandler),
    get_redirect_route(
        r'%s/<classroom_id>' % feconf.CLASSROOM_HANDLER_URL,
        classroom.ClassroomHandler),
    get_redirect_route(
        r'%s/<classroom_url_fragment>' % feconf.CLASSROOM_URL_FRAGMENT_HANDLER,
        classroom.ClassroomUrlFragmentHandler),

    get_redirect_route(
        r'%s/<classroom_url_fragment>/<topic_url_fragment>'
        r'/<story_url_fragment>/<node_id>' % feconf.STORY_PROGRESS_URL_PREFIX,
        story_viewer.StoryProgressHandler),
    get_redirect_route(
        r'%s/<classroom_url_fragment>/<topic_url_fragment>'
        r'/<subtopic_url_fragment>' % feconf.SUBTOPIC_DATA_HANDLER,
        subtopic_viewer.SubtopicPageDataHandler),
    get_redirect_route(
        r'%s/revision' % feconf.TOPIC_VIEWER_URL_PREFIX,
        topic_viewer.TopicViewerPage),
    get_redirect_route(
        r'%s/revision/<subtopic_url_fragment>' %
        feconf.TOPIC_VIEWER_URL_PREFIX, subtopic_viewer.SubtopicViewerPage),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_EDITOR_STORY_URL,
        topic_editor.TopicEditorStoryHandler),
    get_redirect_route(
        r'%s' % feconf.TOPIC_VIEWER_URL_PREFIX,
        topic_viewer.TopicViewerPage),
    get_redirect_route(
        r'%s/practice' % feconf.TOPIC_VIEWER_URL_PREFIX,
        topic_viewer.TopicViewerPage),
    get_redirect_route(
        r'%s/<classroom_url_fragment>/<topic_url_fragment>'
        % feconf.TOPIC_DATA_HANDLER,
        topic_viewer.TopicPageDataHandler),
    get_redirect_route(
        r'%s/<classroom_url_fragment>' % feconf.CLASSROOM_DATA_HANDLER,
        classroom.ClassroomDataHandler),
    get_redirect_route(
        r'%s' % feconf.NEW_TOPIC_URL,
        topics_and_skills_dashboard.NewTopicHandler),
    get_redirect_route(
        r'%s' % feconf.UPLOAD_EXPLORATION_URL,
        creator_dashboard.UploadExplorationHandler),
    get_redirect_route(
        '/learner_dashboard',
        learner_dashboard.OldLearnerDashboardRedirectPage),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_URL,
        learner_dashboard.LearnerDashboardPage),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL,
        learner_dashboard.LearnerDashboardTopicsAndStoriesProgressHandler),
    get_redirect_route(
        r'%s' % feconf.LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL,
        learner_dashboard.LearnerCompletedChaptersCountHandler),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_COLLECTION_DATA_URL,
        learner_dashboard.LearnerDashboardCollectionsProgressHandler),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_EXPLORATION_DATA_URL,
        learner_dashboard.LearnerDashboardExplorationsProgressHandler),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL,
        learner_dashboard.LearnerDashboardFeedbackUpdatesHandler),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_IDS_DATA_URL,
        learner_dashboard.LearnerDashboardIdsHandler),
    get_redirect_route(
        r'%s/<thread_id>' %
        feconf.LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL,
        learner_dashboard.LearnerDashboardFeedbackThreadHandler),
    get_redirect_route(
        r'%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_URL,
        topics_and_skills_dashboard.TopicsAndSkillsDashboardPage),
    get_redirect_route(
        r'%s' % feconf.MERGE_SKILLS_URL,
        topics_and_skills_dashboard.MergeSkillHandler),
    get_redirect_route(
        r'%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
        topics_and_skills_dashboard.TopicsAndSkillsDashboardPageDataHandler),
    get_redirect_route(
        r'%s/<skill_id>' % feconf.UNASSIGN_SKILL_DATA_HANDLER_URL,
        topics_and_skills_dashboard.TopicAssignmentsHandler),
    get_redirect_route(
        r'%s' % feconf.SKILL_DASHBOARD_DATA_URL,
        topics_and_skills_dashboard.SkillsDashboardPageDataHandler),

    get_redirect_route(
        r'%s/<activity_type>/<activity_id>' %
        feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
        reader.LearnerIncompleteActivityHandler),

    get_redirect_route(
        r'%s/<activity_type>/<topic_id>' % feconf.LEARNER_GOALS_DATA_URL,
        learner_goals.LearnerGoalsHandler),

    get_redirect_route(
        r'%s/<activity_type>/<activity_id>' % feconf.LEARNER_PLAYLIST_DATA_URL,
        learner_playlist.LearnerPlaylistHandler),

    get_redirect_route(
        r'%s/<author_username>' %
        feconf.AUTHOR_SPECIFIC_BLOG_POST_PAGE_URL_PREFIX,
        blog_homepage.AuthorsPageHandler),
    get_redirect_route(
        r'%s/<blog_post_url>' % feconf.BLOG_HOMEPAGE_URL,
        blog_homepage.BlogPostHandler),
    get_redirect_route(
        r'%s' % feconf.BLOG_HOMEPAGE_DATA_URL,
        blog_homepage.BlogHomepageDataHandler),
    get_redirect_route(
        r'%s' % feconf.BLOG_SEARCH_DATA_URL,
        blog_homepage.BlogPostSearchHandler),

    get_redirect_route(
        r'/assetsdevhandler/<page_context>/<page_identifier>/'
        'assets/<asset_type:(image|audio|thumbnail)>/<encoded_filename>',
        resources.AssetDevHandler),
    get_redirect_route(
        r'/value_generator_handler/<generator_id>',
        resources.ValueGeneratorHandler),
    get_redirect_route(r'/promo_bar_handler', resources.PromoBarHandler),
    get_redirect_route('/library', library.OldLibraryRedirectPage),
    get_redirect_route(
        r'%s' % feconf.LIBRARY_INDEX_DATA_URL, library.LibraryIndexHandler),
    get_redirect_route(
        r'%s' % feconf.LIBRARY_GROUP_DATA_URL,
        library.LibraryGroupIndexHandler),
    get_redirect_route(
        r'%s' % feconf.LIBRARY_SEARCH_DATA_URL, library.SearchHandler),
    get_redirect_route(r'/gallery', library.LibraryRedirectPage),
    get_redirect_route(r'/contribute', library.LibraryRedirectPage),
    get_redirect_route(r'/learn', classroom.DefaultClassroomRedirectPage),
    get_redirect_route(r'/playtest', library.LibraryRedirectPage),
    get_redirect_route(
        feconf.EXPLORATION_SUMMARIES_DATA_URL,
        library.ExplorationSummariesHandler),
    get_redirect_route(
        feconf.COLLECTION_SUMMARIES_DATA_URL,
        library.CollectionSummariesHandler),

    get_redirect_route(
        r'/profilehandler/data/<username>', profile.ProfileHandler),
    get_redirect_route(
        r'%s/<secret>' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT,
        profile.BulkEmailWebhookEndpoint),
    get_redirect_route(
        feconf.PREFERENCES_DATA_URL, profile.PreferencesHandler),
    get_redirect_route(
        r'/preferenceshandler/profile_picture', profile.ProfilePictureHandler),
    get_redirect_route(
        r'/preferenceshandler/profile_picture_by_username/<username>',
        profile.ProfilePictureHandlerByUsernameHandler),
    get_redirect_route(r'%s' % feconf.SIGNUP_URL, profile.SignupPage),
    get_redirect_route(r'%s' % feconf.SIGNUP_DATA_URL, profile.SignupHandler),
    get_redirect_route(
        feconf.DELETE_ACCOUNT_HANDLER_URL, profile.DeleteAccountHandler),
    get_redirect_route(
        feconf.EXPORT_ACCOUNT_HANDLER_URL, profile.ExportAccountHandler),
    get_redirect_route(
        r'%s' % feconf.USERNAME_CHECK_DATA_URL, profile.UsernameCheckHandler),
    get_redirect_route(
        r'%s' % feconf.SITE_LANGUAGE_DATA_URL, profile.SiteLanguageHandler),
    get_redirect_route(r'/userinfohandler', profile.UserInfoHandler),
    get_redirect_route(r'/userinfohandler/data', profile.UserInfoHandler),
    get_redirect_route(r'/url_handler', profile.UrlHandler),
    get_redirect_route(r'/moderator', moderator.ModeratorPage),
    get_redirect_route(
        r'/moderatorhandler/featured', moderator.FeaturedActivitiesHandler),
    get_redirect_route(
        r'/moderatorhandler/email_draft', moderator.EmailDraftHandler),

    get_redirect_route(
        r'/memorycachehandler', release_coordinator.MemoryCacheHandler),

    get_redirect_route(
        '/checkpoints_feature_status_handler',
        reader.CheckpointsFeatureStatusHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_URL_PREFIX,
        reader.ExplorationPage),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_URL_EMBED_PREFIX,
        reader.ExplorationEmbedPage),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_INIT_URL_PREFIX,
        reader.ExplorationHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_PRETESTS_URL_PREFIX,
        reader.PretestHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_FEATURES_PREFIX,
        features.ExplorationFeaturesHandler),
    get_redirect_route(
        '/explorehandler/exploration_start_event/<exploration_id>',
        reader.ExplorationStartEventHandler),
    get_redirect_route(
        '/explorehandler/exploration_actual_start_event/<exploration_id>',
        reader.ExplorationActualStartEventHandler),
    get_redirect_route(
        '/explorehandler/solution_hit_event/<exploration_id>',
        reader.SolutionHitEventHandler),
    get_redirect_route(
        '/sync_logged_out_and_logged_in_progress/<exploration_id>',
        reader.SyncLoggedOutLearnerProgressHandler),
    get_redirect_route(
        r'/explorehandler/state_hit_event/<exploration_id>',
        reader.StateHitEventHandler),
    get_redirect_route(
        r'/explorehandler/state_complete_event/<exploration_id>',
        reader.StateCompleteEventHandler),
    get_redirect_route(
        r'/explorehandler/checkpoint_reached_by_logged_out_user/<exploration_id>', # pylint: disable=line-too-long
        reader.SaveTransientCheckpointProgressHandler),
    get_redirect_route(
        '/progress/<unique_progress_url_id>',
        reader.TransientCheckpointUrlPage),
    get_redirect_route(
        r'/explorehandler/leave_for_refresher_exp_event/<exploration_id>',
        reader.LeaveForRefresherExpEventHandler),
    get_redirect_route(
        r'/explorehandler/answer_submitted_event/<exploration_id>',
        reader.AnswerSubmittedEventHandler),
    get_redirect_route(
        r'/explorehandler/checkpoint_reached/<exploration_id>',
        reader.CheckpointReachedEventHandler),
    get_redirect_route(
        r'/explorehandler/restart/<exploration_id>',
        reader.ExplorationRestartEventHandler),
    get_redirect_route(
        r'/explorehandler/give_feedback/<exploration_id>',
        reader.ReaderFeedbackHandler),
    get_redirect_route(
        r'/explorehandler/exploration_complete_event/<exploration_id>',
        reader.ExplorationCompleteEventHandler),
    get_redirect_route(
        r'/explorehandler/exploration_maybe_leave_event/<exploration_id>',
        reader.ExplorationMaybeLeaveHandler),
    get_redirect_route(
        r'/explorehandler/stats_events/<exploration_id>',
        reader.StatsEventsHandler),
    get_redirect_route(
        r'/explorehandler/store_playthrough/<exploration_id>',
        reader.StorePlaythroughHandler),
    get_redirect_route(
        r'/explorehandler/rating/<exploration_id>', reader.RatingHandler),
    get_redirect_route(
        r'/explorehandler/recommendations/<exploration_id>',
        reader.RecommendationsHandler),
    get_redirect_route(
        r'%s/<entity_type>/<entity_id>' % (
            feconf.LEARNER_ANSWER_DETAILS_SUBMIT_URL),
        reader.LearnerAnswerDetailsSubmissionHandler),
    get_redirect_route(
        r'%s/<exploration_id>/<state_name>/<version>' % (
            feconf.STATE_VERSION_HISTORY_URL_PREFIX
        ), reader.StateVersionHistoryHandler),
    get_redirect_route(
        r'%s/<exploration_id>/<version>' % (
            feconf.METADATA_VERSION_HISTORY_URL_PREFIX
        ), reader.MetadataVersionHistoryHandler),

    get_redirect_route(
        r'%s/<question_id>' % feconf.QUESTION_EDITOR_DATA_URL_PREFIX,
        question_editor.EditableQuestionDataHandler),

    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EDITOR_URL_PREFIX,
        editor.ExplorationPage),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_DATA_PREFIX,
        editor.ExplorationHandler),
    get_redirect_route(
        r'/editsallowedhandler/<exploration_id>',
        editor.ExplorationEditsAllowedHandler),
    get_redirect_route(
        r'/createhandler/download/<exploration_id>',
        editor.ExplorationFileDownloader),
    get_redirect_route(
        r'%s/<entity_type>/<entity_id>' % (
            feconf.EXPLORATION_IMAGE_UPLOAD_PREFIX),
        editor.ImageUploadHandler),
    get_redirect_route(
        r'/createhandler/audioupload/<exploration_id>',
        voice_artist.AudioUploadHandler),
    get_redirect_route(
        r'/createhandler/state_yaml/<exploration_id>',
        editor.StateYamlHandler),
    get_redirect_route(
        r'/createhandler/check_revert_valid/<exploration_id>/<version>',
        editor.ExplorationCheckRevertValidHandler),
    get_redirect_route(
        r'/createhandler/revert/<exploration_id>',
        editor.ExplorationRevertHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_RIGHTS_PREFIX,
        editor.ExplorationRightsHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.USER_PERMISSIONS_URL_PREFIX,
        editor.UserExplorationPermissionsHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_STATUS_PREFIX,
        editor.ExplorationStatusHandler),
    get_redirect_route(
        r'/createhandler/moderatorrights/<exploration_id>',
        editor.ExplorationModeratorRightsHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.USER_EXPLORATION_EMAILS_PREFIX,
        editor.UserExplorationEmailsHandler),
    get_redirect_route(
        r'/createhandler/snapshots/<exploration_id>',
        editor.ExplorationSnapshotsHandler),
    get_redirect_route(
        r'/createhandler/statistics/<exploration_id>',
        editor.ExplorationStatisticsHandler),
    get_redirect_route(
        r'/createhandler/state_interaction_stats/<exploration_id>/<state_name>',
        editor.StateInteractionStatsHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_STATE_ANSWER_STATS_PREFIX,
        editor.StateAnswerStatisticsHandler),
    get_redirect_route(
        r'/createhandler/started_tutorial_event/<exploration_id>',
        editor.StartedTutorialEventHandler),
    get_redirect_route(
        r'/createhandler/started_translation_tutorial_event/<exploration_id>',
        voice_artist.StartedTranslationTutorialEventHandler),
    get_redirect_route(
        r'/createhandler/autosave_draft/<exploration_id>',
        editor.EditorAutosaveHandler),
    get_redirect_route(
        r'/createhandler/get_top_unresolved_answers/<exploration_id>',
        editor.TopUnresolvedAnswersHandler),
    get_redirect_route(
        r'%s/<entity_type>/<entity_id>' %
        feconf.LEARNER_ANSWER_INFO_HANDLER_URL,
        editor.LearnerAnswerInfoHandler),

    get_redirect_route(
        r'%s' % feconf.RECENT_COMMITS_DATA_URL,
        recent_commits.RecentCommitsHandler),
    get_redirect_route(
        r'%s' % feconf.RECENT_FEEDBACK_MESSAGES_DATA_URL,
        feedback.RecentFeedbackMessagesHandler),

    get_redirect_route(
        r'%s/<thread_id>' % feconf.FEEDBACK_THREAD_VIEW_EVENT_URL,
        feedback.FeedbackThreadViewEventHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.FEEDBACK_THREADLIST_URL_PREFIX,
        feedback.ThreadListHandler),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.FEEDBACK_THREADLIST_URL_PREFIX_FOR_TOPICS,
        feedback.ThreadListHandlerForTopicsHandler),
    get_redirect_route(
        r'%s/<thread_id>' % feconf.FEEDBACK_THREAD_URL_PREFIX,
        feedback.ThreadHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.FEEDBACK_STATS_URL_PREFIX,
        feedback.FeedbackStatsHandler),
    get_redirect_route(
        r'%s/' % feconf.SUGGESTION_URL_PREFIX,
        suggestion.SuggestionHandler),
    get_redirect_route(
        r'%s/<suggestion_id>' % feconf.UPDATE_TRANSLATION_SUGGESTION_URL_PREFIX,
        suggestion.UpdateTranslationSuggestionHandler),
    get_redirect_route(
        r'%s/<suggestion_id>' % feconf.UPDATE_QUESTION_SUGGESTION_URL_PREFIX,
        suggestion.UpdateQuestionSuggestionHandler),
    get_redirect_route(
        r'%s' % feconf.QUESTIONS_URL_PREFIX,
        reader.QuestionPlayerHandler),
    get_redirect_route(
        r'%s/exploration/<target_id>/<suggestion_id>' %
        feconf.SUGGESTION_ACTION_URL_PREFIX,
        suggestion.SuggestionToExplorationActionHandler),
    get_redirect_route(
        r'%s/resubmit/<suggestion_id>' % feconf.SUGGESTION_ACTION_URL_PREFIX,
        suggestion.ResubmitSuggestionHandler),
    get_redirect_route(
        r'%s/skill/<target_id>/<suggestion_id>' %
        feconf.SUGGESTION_ACTION_URL_PREFIX,
        suggestion.SuggestionToSkillActionHandler),
    get_redirect_route(
        r'%s' % feconf.SUGGESTION_LIST_URL_PREFIX,
        suggestion.SuggestionListHandler),
    get_redirect_route(
        r'/getreviewablesuggestions/<target_type>/<suggestion_type>',
        suggestion.ReviewableSuggestionsHandler),
    get_redirect_route(
        r'/getsubmittedsuggestions/<target_type>/<suggestion_type>',
        suggestion.UserSubmittedSuggestionsHandler),
    get_redirect_route(
        r'%s' % feconf.SUBSCRIBE_URL_PREFIX,
        subscriptions.SubscribeHandler),
    get_redirect_route(
        r'%s' % feconf.UNSUBSCRIBE_URL_PREFIX,
        subscriptions.UnsubscribeHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.FLAG_EXPLORATION_URL_PREFIX,
        reader.FlagExplorationHandler),
    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_URL_PREFIX,
        collection_viewer.CollectionPage),
    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_DATA_URL_PREFIX,
        collection_viewer.CollectionDataHandler),

    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_EDITOR_URL_PREFIX,
        collection_editor.CollectionEditorPage),
    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_EDITOR_DATA_URL_PREFIX,
        collection_editor.EditableCollectionDataHandler),
    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_RIGHTS_PREFIX,
        collection_editor.CollectionRightsHandler),
    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_PUBLISH_PREFIX,
        collection_editor.CollectionPublishHandler),
    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_UNPUBLISH_PREFIX,
        collection_editor.CollectionUnpublishHandler),

    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_EDITOR_URL_PREFIX,
        topic_editor.TopicEditorPage),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_EDITOR_DATA_URL_PREFIX,
        topic_editor.EditableTopicDataHandler),
    get_redirect_route(
        r'%s/<topic_id>/<subtopic_id>' %
        feconf.SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX,
        topic_editor.EditableSubtopicPageDataHandler),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_RIGHTS_URL_PREFIX,
        topic_editor.TopicRightsHandler),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_STATUS_URL_PREFIX,
        topic_editor.TopicPublishHandler),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_SEND_MAIL_URL_PREFIX,
        topic_editor.TopicPublishSendMailHandler),
    get_redirect_route(
        r'%s/' % feconf.TOPIC_ID_TO_TOPIC_NAME,
        topic_editor.TopicIdToTopicNameHandler),

    get_redirect_route(
        r'%s/<selected_skill_ids>' % feconf.CONCEPT_CARD_DATA_URL_PREFIX,
        concept_card_viewer.ConceptCardDataHandler),
    get_redirect_route(
        r'%s/<question_id>' % feconf.QUESTION_SKILL_LINK_URL_PREFIX,
        question_editor.QuestionSkillLinkHandler),
    get_redirect_route(
        r'%s/<comma_separated_skill_ids>' % feconf.SKILL_DATA_URL_PREFIX,
        skill_editor.SkillDataHandler),
    get_redirect_route(
        r'%s' % feconf.FETCH_SKILLS_URL_PREFIX,
        skill_editor.FetchSkillsHandler),
    get_redirect_route(
        r'%s/<skill_id>' % feconf.SKILL_EDITOR_URL_PREFIX,
        skill_editor.SkillEditorPage),
    get_redirect_route(
        r'%s/<skill_id>' % feconf.SKILL_EDITOR_DATA_URL_PREFIX,
        skill_editor.EditableSkillDataHandler),
    get_redirect_route(
        r'%s' % feconf.SKILL_MASTERY_DATA_URL,
        skill_mastery.SkillMasteryDataHandler),
    get_redirect_route(
        r'%s/<skill_id>' % feconf.SKILL_RIGHTS_URL_PREFIX,
        skill_editor.SkillRightsHandler),

    get_redirect_route(
        r'%s' % feconf.SUBTOPIC_MASTERY_DATA_URL,
        skill_mastery.SubtopicMasteryDataHandler),

    get_redirect_route(
        r'%s/<story_id>' % feconf.STORY_EDITOR_URL_PREFIX,
        story_editor.StoryEditorPage),
    get_redirect_route(
        r'%s/<story_id>' % feconf.STORY_EDITOR_DATA_URL_PREFIX,
        story_editor.EditableStoryDataHandler),
    get_redirect_route(
        r'%s/<story_id>' % feconf.STORY_PUBLISH_HANDLER,
        story_editor.StoryPublishHandler),
    get_redirect_route(
        r'%s/<story_id>' %
        feconf.VALIDATE_STORY_EXPLORATIONS_URL_PREFIX,
        story_editor.ValidateExplorationsHandler),

    get_redirect_route(
        '/classroom_promos_status_handler',
        classroom.ClassroomPromosStatusHandler),

    get_redirect_route(r'/emaildashboard', email_dashboard.EmailDashboardPage),
    get_redirect_route(
        r'/emaildashboarddatahandler',
        email_dashboard.EmailDashboardDataHandler),
    get_redirect_route(
        r'/querystatuscheck', email_dashboard.QueryStatusCheckHandler),
    get_redirect_route(
        r'/emaildashboardresult/<query_id>',
        email_dashboard.EmailDashboardResultPage),
    get_redirect_route(
        r'/emaildashboardcancelresult/<query_id>',
        email_dashboard.EmailDashboardCancelEmailHandler),
    get_redirect_route(
        r'/emaildashboardtestbulkemailhandler/<query_id>',
        email_dashboard.EmailDashboardTestBulkEmailHandler),
    get_redirect_route(
        r'%s' % feconf.EXPLORATION_METADATA_SEARCH_URL,
        collection_editor.ExplorationMetadataSearchHandler),
    get_redirect_route(
        r'/explorationdataextractionhandler', admin.DataExtractionQueryHandler),
    get_redirect_route(
        r'/senddummymailtoadminhandler', admin.SendDummyMailToAdminHandler),
    get_redirect_route(r'/updateusernamehandler', admin.UpdateUsernameHandler),
    get_redirect_route(
        r'/numberofdeletionrequestshandler',
        admin.NumberOfDeletionRequestsHandler),
    get_redirect_route(
        r'/verifyusermodelsdeletedhandler',
        admin.VerifyUserModelsDeletedHandler),
    get_redirect_route(r'/deleteuserhandler', admin.DeleteUserHandler),
    get_redirect_route(r'/frontend_errors', FrontendErrorHandler),

    get_redirect_route(r'/session_begin', base.SessionBeginHandler),
    get_redirect_route(r'/session_end', base.SessionEndHandler),

    get_redirect_route(
        r'%s/%s/<exploration_id>' % (
            feconf.IMPROVEMENTS_URL_PREFIX,
            constants.TASK_ENTITY_TYPE_EXPLORATION),
        improvements.ExplorationImprovementsHandler),
    get_redirect_route(
        r'%s/%s/<exploration_id>' % (
            feconf.IMPROVEMENTS_HISTORY_URL_PREFIX,
            constants.TASK_ENTITY_TYPE_EXPLORATION),
        improvements.ExplorationImprovementsHistoryHandler),
    get_redirect_route(
        r'%s/%s/<exploration_id>' % (
            feconf.IMPROVEMENTS_CONFIG_URL_PREFIX,
            constants.TASK_ENTITY_TYPE_EXPLORATION),
        improvements.ExplorationImprovementsConfigHandler),

    get_redirect_route(
        r'%s' % feconf.BLOG_ADMIN_PAGE_URL, blog_admin.BlogAdminPage),
    get_redirect_route(
        r'%s' % feconf.BLOG_ADMIN_ROLE_HANDLER_URL,
        blog_admin.BlogAdminRolesHandler),
    get_redirect_route(
        r'/blogadminhandler', blog_admin.BlogAdminHandler),

    get_redirect_route('/beam_job', beam_jobs.BeamJobHandler),
    get_redirect_route('/beam_job_run', beam_jobs.BeamJobRunHandler),
    get_redirect_route(
        '/beam_job_run_result', beam_jobs.BeamJobRunResultHandler),

    get_redirect_route(
        r'%s/<blog_post_id>' % feconf.BLOG_EDITOR_DATA_URL_PREFIX,
        blog_dashboard.BlogPostHandler),
    get_redirect_route(
        r'%s' % feconf.BLOG_DASHBOARD_DATA_URL,
        blog_dashboard.BlogDashboardDataHandler),
    get_redirect_route(
        r'%s' % feconf.BLOG_DASHBOARD_URL, blog_dashboard.BlogDashboardPage),

    get_redirect_route(
        r'/issuesdatahandler/<exploration_id>', editor.FetchIssuesHandler),

    get_redirect_route(
        r'/ml/trainedclassifierhandler', classifier.TrainedClassifierHandler),
    get_redirect_route(
        r'/ml/nextjobhandler', classifier.NextJobHandler),

    get_redirect_route(
        r'/playthroughdatahandler/<exploration_id>/<playthrough_id>',
        editor.FetchPlaythroughHandler),

    get_redirect_route(
        r'/resolveissuehandler/<exploration_id>', editor.ResolveIssueHandler),

    get_redirect_route(
        r'%s' % feconf.CSRF_HANDLER_URL, base.CsrfTokenHandler),

    get_redirect_route(
        r'/platform_features_evaluation_handler',
        platform_feature.PlatformFeaturesEvaluationHandler),
    get_redirect_route(
        r'/platform_feature_dummy_handler',
        platform_feature.PlatformFeatureDummyHandler),

    get_redirect_route(
        r'%s' % (
            android_validation_constants.INCOMING_ANDROID_FEEDBACK_REPORT_URL),
        incoming_app_feedback_report.IncomingAndroidFeedbackReportHandler),

    get_redirect_route(
        r'/voice_artist_management_handler/<entity_type>/<entity_id>',
        voice_artist.VoiceArtistManagementHandler),

    get_redirect_route(
        r'/topics_and_skills_dashboard/categorized_and_untriaged_skills_data',
        topics_and_skills_dashboard
            .CategorizedAndUntriagedSkillsDataHandler),

    get_redirect_route(
        r'/create_learner_group_handler',
        learner_group.CreateLearnerGroupHandler),
    get_redirect_route(
        r'/update_learner_group_handler/<learner_group_id>',
        learner_group.LearnerGroupHandler),
    get_redirect_route(
        r'/delete_learner_group_handler/<learner_group_id>',
        learner_group.LearnerGroupHandler),
    get_redirect_route(
        r'%s' % feconf.FACILITATOR_DASHBOARD_HANDLER,
        learner_group.FacilitatorDashboardHandler),
    get_redirect_route(
        r'/facilitator_view_of_learner_group_handler/<learner_group_id>',
        learner_group.FacilitatorLearnerGroupViewHandler),
    get_redirect_route(
        r'/learner_group_search_syllabus_handler',
        learner_group.LearnerGroupSearchSyllabusHandler),
    get_redirect_route(
        r'/learner_group_syllabus_handler/<learner_group_id>',
        learner_group.LearnerGroupSyllabusHandler),
    get_redirect_route(
        r'/learner_group_user_progress_handler/<learner_group_id>',
        learner_group.LearnerGroupLearnerProgressHandler),
    get_redirect_route(
        r'%s' % feconf.FACILITATOR_DASHBOARD_PAGE_URL,
        learner_group.FacilitatorDashboardPage),
    get_redirect_route(
        r'%s' % feconf.CREATE_LEARNER_GROUP_PAGE_URL,
        learner_group.CreateLearnerGroupPage),
    get_redirect_route(
        r'/learner_group_search_learner_handler',
        learner_group.LearnerGroupSearchLearnerHandler),
    get_redirect_route(
        r'/learner_group_learners_info_handler/<learner_group_id>',
        learner_group.LearnerGroupLearnersInfoHandler),
    get_redirect_route(
        r'/learner_group_learner_invitation_handler/<learner_group_id>',
        learner_group.LearnerGroupLearnerInvitationHandler),
    get_redirect_route(
        r'/edit-learner-group/<group_id>', learner_group.EditLearnerGroupPage),
    get_redirect_route(
        r'/user_progress_in_stories_chapters_handler/<username>',
        learner_group.LearnerStoriesChaptersProgressHandler)
]

# Adding redirects for topic landing pages.
for subject, topics in constants.AVAILABLE_LANDING_PAGES.items():
    for topic in topics:
        URLS.append(
            get_redirect_route(
                r'/%s/%s' % (subject, topic),
                oppia_root.OppiaRootPage))

if constants.DEV_MODE:
    URLS.append(
        get_redirect_route(
            r'/initialize_android_test_data',
            android_e2e_config.InitializeAndroidTestDataHandler))

# Adding redirects for all stewards landing pages.
for stewards_route in constants.STEWARDS_LANDING_PAGE['ROUTES']:
    URLS.append(
        get_redirect_route(
            r'/%s' % stewards_route, oppia_root.OppiaRootPage))

# Redirect all routes handled using angular router to the oppia root page.
for page in constants.PAGES_REGISTERED_WITH_FRONTEND.values():
    if not 'MANUALLY_REGISTERED_WITH_BACKEND' in page:
        if 'LIGHTWEIGHT' in page:
            URLS.append(
                get_redirect_route(
                    r'/%s' % page['ROUTE'],
                    oppia_root.OppiaLightweightRootPage
                )
            )
        else:
            URLS.append(
                get_redirect_route(
                    r'/%s' % page['ROUTE'], oppia_root.OppiaRootPage))

# Manually redirect routes with url fragments to the oppia root page.
URLS.extend((
    get_redirect_route(r'/profile/<username>', oppia_root.OppiaRootPage),
    get_redirect_route(
        r'%s/story/<story_url_fragment>' % feconf.TOPIC_VIEWER_URL_PREFIX,
        oppia_root.OppiaRootPage),
    get_redirect_route(
        r'/learn/<classroom_url_fragment>',
        oppia_root.OppiaLightweightRootPage
    ),
))

# Add cron urls. Note that cron URLs MUST start with /cron for them to work
# in production (see dispatch() in base.py).
URLS.extend((
    get_redirect_route(
        r'/cron/models/cleanup', cron.CronModelsCleanupHandler),
    get_redirect_route(
        r'/cron/users/user_deletion', cron.CronUserDeletionHandler),
    get_redirect_route(
        r'/cron/users/fully_complete_user_deletion',
        cron.CronFullyCompleteUserDeletionHandler),
    get_redirect_route(
        r'/cron/mail/admins/contributor_dashboard_bottlenecks',
        cron.CronMailAdminContributorDashboardBottlenecksHandler),
    get_redirect_route(
        r'/cron/mail/reviewers/contributor_dashboard_suggestions',
        cron.CronMailReviewersContributorDashboardSuggestionsHandler),
    get_redirect_route(
        r'/cron/app_feedback_report/scrub_expiring_reports',
        cron.CronAppFeedbackReportsScrubberHandlerPage),
    get_redirect_route(
        r'/cron/explorations/recommendations',
        cron.CronExplorationRecommendationsHandler),
    get_redirect_route(
        r'/cron/explorations/search_rank', cron.CronActivitySearchRankHandler),
    get_redirect_route(
        r'/cron/blog_posts/search_rank', cron.CronBlogPostSearchRankHandler),
    get_redirect_route(
        r'/cron/users/dashboard_stats', cron.CronDashboardStatsHandler),
    get_redirect_route(
        r'/cron/suggestions/translation_contribution_stats',
        cron.CronTranslationContributionStatsHandler),
))

# Add tasks urls.
URLS.extend((
    get_redirect_route(
        r'%s' % feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS,
        tasks.UnsentFeedbackEmailHandler),
    get_redirect_route(
        r'%s' % feconf.TASK_URL_SUGGESTION_EMAILS,
        tasks.SuggestionEmailHandler),
    get_redirect_route(
        r'%s' % (
            feconf
            .TASK_URL_CONTRIBUTOR_DASHBOARD_ACHIEVEMENT_NOTIFICATION_EMAILS),
        tasks.ContributorDashboardAchievementEmailHandler),
    get_redirect_route(
        r'%s' % feconf.TASK_URL_FLAG_EXPLORATION_EMAILS,
        tasks.FlagExplorationEmailHandler),
    get_redirect_route(
        r'%s' % feconf.TASK_URL_INSTANT_FEEDBACK_EMAILS,
        tasks.InstantFeedbackMessageEmailHandler),
    get_redirect_route(
        r'%s' % feconf.TASK_URL_FEEDBACK_STATUS_EMAILS,
        tasks.FeedbackThreadStatusChangeEmailHandler),
    get_redirect_route(
        r'%s' % feconf.TASK_URL_DEFERRED, tasks.DeferredTasksHandler),
))

# 404 error handler (Needs to be at the end of the URLS list).
URLS.append(get_redirect_route(r'/<:.*>', base.Error404Handler))


class NdbWsgiMiddleware:
    """Wraps the WSGI application into the NDB client context."""

    def __init__(self, wsgi_app: webapp2.WSGIApplication) -> None:
        self.wsgi_app = wsgi_app

    def __call__(
        self,
        environ: Dict[str, str],
        start_response: webapp2.Response
    ) -> webapp2.Response:
        global_cache = datastore_services.RedisCache(
            cache_services.CLOUD_NDB_REDIS_CLIENT)
        with datastore_services.get_ndb_context(global_cache=global_cache):
            return self.wsgi_app(environ, start_response)


app_without_context = webapp2.WSGIApplication(URLS, debug=feconf.DEBUG)
app = NdbWsgiMiddleware(app_without_context)
firebase_auth_services.establish_firebase_connection()
