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

import logging

# pylint: disable=relative-import
from constants import constants
from core.controllers import admin
from core.controllers import base
from core.controllers import classifier
from core.controllers import collection_editor
from core.controllers import collection_viewer
from core.controllers import creator_dashboard
from core.controllers import custom_landing_pages
from core.controllers import editor
from core.controllers import email_dashboard
from core.controllers import feedback
from core.controllers import learner_dashboard
from core.controllers import learner_playlist
from core.controllers import library
from core.controllers import moderator
from core.controllers import pages
from core.controllers import profile
from core.controllers import question_editor
from core.controllers import reader
from core.controllers import recent_commits
from core.controllers import resources
from core.controllers import skill_editor
from core.controllers import story_editor
from core.controllers import subscriptions
from core.controllers import suggestion
from core.controllers import topic_editor
from core.controllers import topics_and_skills_dashboard
from core.controllers import translator
from core.domain import acl_decorators
from core.domain import user_services
from core.platform import models
import feconf

from mapreduce import main as mapreduce_main
from mapreduce import parameters as mapreduce_parameters
import webapp2
from webapp2_extras import routes

# pylint: enable=relative-import


current_user_services = models.Registry.import_current_user_services()
transaction_services = models.Registry.import_transaction_services()


class FrontendErrorHandler(base.BaseHandler):
    """Handles errors arising from the frontend."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    @acl_decorators.open_access
    def post(self):
        """Records errors reported by the frontend."""
        logging.error('Frontend error: %s' % self.payload.get('error'))
        self.render_json(self.values)


class WarmupHandler(base.BaseHandler):
    """Handles warmup requests."""

    @acl_decorators.open_access
    def get(self):
        """Handles GET warmup requests."""
        pass


class HomePageRedirectHandler(base.BaseHandler):
    """When a request is made to '/', check the user's login status, and
    redirect them appropriately.
    """

    @acl_decorators.open_access
    def get(self):
        if self.user_id and user_services.has_fully_registered(self.user_id):
            user_settings = user_services.get_user_settings(
                self.user_id)
            default_dashboard = user_settings.default_dashboard
            if default_dashboard == constants.DASHBOARD_TYPE_CREATOR:
                self.redirect(feconf.CREATOR_DASHBOARD_URL)
            else:
                self.redirect(feconf.LEARNER_DASHBOARD_URL)
        else:
            self.redirect(feconf.SPLASH_URL)


def get_redirect_route(regex_route, handler, defaults=None):
    """Returns a route that redirects /foo/ to /foo.

    Warning: this method strips off parameters after the trailing slash. URLs
    with parameters should be formulated without the trailing slash.
    """
    if defaults is None:
        defaults = {}
    name = regex_route.replace('/', '_')
    return routes.RedirectRoute(
        regex_route, handler, name, strict_slash=True, defaults=defaults)


def authorization_wrapper(self, *args, **kwargs):
    # developers.google.com/appengine/docs/python/taskqueue/overview-push
    # promises that this header cannot be set by external callers. If this
    # is present, we can be certain that the request is internal and from
    # the task queue worker.
    if 'X-AppEngine-TaskName' not in self.request.headers:
        self.response.out.write('Forbidden')
        self.response.set_status(403)
        return
    self.real_dispatch(*args, **kwargs)


def ui_access_wrapper(self, *args, **kwargs):
    self.real_dispatch(*args, **kwargs)


MAPREDUCE_HANDLERS = []

for path, handler_class in mapreduce_main.create_handlers_map():
    if path.startswith('.*/pipeline'):
        if 'pipeline/rpc/' in path or path == '.*/pipeline(/.+)':
            path = path.replace('.*/pipeline', '/mapreduce/ui/pipeline')
        else:
            path = path.replace('.*/pipeline', '/mapreduce/worker/pipeline')
    else:
        if '_callback' in path:
            path = path.replace('.*', '/mapreduce/worker', 1)
        elif '/list_configs' in path:
            continue
        else:
            path = path.replace('.*', '/mapreduce/ui', 1)

    if '/ui/' in path or path.endswith('/ui'):
        if (hasattr(handler_class, 'dispatch') and
                not hasattr(handler_class, 'real_dispatch')):
            handler_class.real_dispatch = handler_class.dispatch
            handler_class.dispatch = ui_access_wrapper
        MAPREDUCE_HANDLERS.append((path, handler_class))
    else:
        if (hasattr(handler_class, 'dispatch') and
                not hasattr(handler_class, 'real_dispatch')):
            handler_class.real_dispatch = handler_class.dispatch
            handler_class.dispatch = authorization_wrapper
        MAPREDUCE_HANDLERS.append((path, handler_class))

# Tell map/reduce internals that this is now the base path to use.
mapreduce_parameters.config.BASE_PATH = '/mapreduce/worker'

# Register the URLs with the classes responsible for handling them.
URLS = MAPREDUCE_HANDLERS + [
    get_redirect_route(r'/_ah/warmup', WarmupHandler),
    get_redirect_route(r'/', HomePageRedirectHandler),

    get_redirect_route(feconf.SPLASH_URL, pages.SplashPage),
    get_redirect_route(r'/about', pages.AboutPage),
    get_redirect_route(r'/get_started', pages.GetStartedPage),
    get_redirect_route(r'/foundation', pages.FoundationRedirectPage),
    get_redirect_route(r'/credits', pages.AboutRedirectPage),
    get_redirect_route(r'/teach', pages.TeachPage),
    get_redirect_route(r'/participate', pages.TeachRedirectPage),
    get_redirect_route(r'/site_guidelines', pages.TeachRedirectPage),
    get_redirect_route(r'/console_errors', pages.ConsoleErrorPage),
    get_redirect_route(r'/contact', pages.ContactPage),

    get_redirect_route(r'/forum', pages.ForumPage),
    get_redirect_route(r'/donate', pages.DonatePage),
    get_redirect_route(r'/thanks', pages.ThanksPage),
    get_redirect_route(r'/terms', pages.TermsPage),
    get_redirect_route(r'/privacy', pages.PrivacyPage),

    get_redirect_route(r'%s' % feconf.ADMIN_URL, admin.AdminPage),
    get_redirect_route(r'/adminhandler', admin.AdminHandler),
    get_redirect_route(r'/adminrolehandler', admin.AdminRoleHandler),
    get_redirect_route(r'/adminjoboutput', admin.AdminJobOutput),
    get_redirect_route(
        r'/admintopicscsvdownloadhandler',
        admin.AdminTopicsCsvDownloadHandler),

    get_redirect_route(
        r'/notifications_dashboard',
        creator_dashboard.NotificationsDashboardPage),
    get_redirect_route(
        r'/notificationsdashboardhandler/data',
        creator_dashboard.NotificationsDashboardHandler),
    get_redirect_route(
        r'/notificationshandler', creator_dashboard.NotificationsHandler),
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
        r'%s' % feconf.NEW_SKILL_URL,
        topics_and_skills_dashboard.NewSkillHandler),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_EDITOR_STORY_URL,
        topic_editor.TopicEditorStoryHandler),
    get_redirect_route(
        r'%s' % feconf.NEW_TOPIC_URL,
        topics_and_skills_dashboard.NewTopicHandler),
    get_redirect_route(
        r'%s' % feconf.UPLOAD_EXPLORATION_URL,
        creator_dashboard.UploadExploration),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_URL,
        learner_dashboard.LearnerDashboardPage),
    get_redirect_route(
        r'%s' % feconf.LEARNER_DASHBOARD_DATA_URL,
        learner_dashboard.LearnerDashboardHandler),
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
        r'%s' % feconf.TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
        topics_and_skills_dashboard.TopicsAndSkillsDashboardPageDataHandler),

    get_redirect_route(
        r'%s/<activity_type>/<activity_id>' %
        feconf.LEARNER_INCOMPLETE_ACTIVITY_DATA_URL,
        reader.LearnerIncompleteActivityHandler),

    get_redirect_route(
        r'%s/<activity_type>/<activity_id>' % feconf.LEARNER_PLAYLIST_DATA_URL,
        learner_playlist.LearnerPlaylistHandler),

    get_redirect_route(
        r'/imagehandler/<exploration_id>/<encoded_filepath>',
        resources.ImageHandler),
    get_redirect_route(
        r'/audiohandler/<exploration_id>/audio/<filename>',
        resources.AudioHandler),
    get_redirect_route(
        r'/value_generator_handler/<generator_id>',
        resources.ValueGeneratorHandler),
    get_redirect_route(r'%s' % feconf.FRACTIONS_LANDING_PAGE_URL,
                       custom_landing_pages.FractionLandingPage),
    get_redirect_route(r'%s' % feconf.LIBRARY_INDEX_URL, library.LibraryPage),
    get_redirect_route(r'%s' % feconf.LIBRARY_INDEX_DATA_URL,
                       library.LibraryIndexHandler),
    get_redirect_route(r'%s' % feconf.LIBRARY_RECENTLY_PUBLISHED_URL,
                       library.LibraryGroupPage),
    get_redirect_route(r'%s' % feconf.LIBRARY_TOP_RATED_URL,
                       library.LibraryGroupPage),
    get_redirect_route(r'%s' % feconf.LIBRARY_GROUP_DATA_URL,
                       library.LibraryGroupIndexHandler),
    get_redirect_route(r'%s' % feconf.LIBRARY_SEARCH_URL, library.LibraryPage),
    get_redirect_route(
        r'%s' % feconf.LIBRARY_SEARCH_DATA_URL, library.SearchHandler),
    get_redirect_route(r'/gallery', library.LibraryRedirectPage),
    get_redirect_route(r'/contribute', library.LibraryRedirectPage),
    get_redirect_route(r'/learn', library.LibraryRedirectPage),
    get_redirect_route(r'/playtest', library.LibraryRedirectPage),
    get_redirect_route(
        feconf.EXPLORATION_SUMMARIES_DATA_URL,
        library.ExplorationSummariesHandler),
    get_redirect_route(
        feconf.COLLECTION_SUMMARIES_DATA_URL,
        library.CollectionSummariesHandler),

    get_redirect_route(r'/profile/<username>', profile.ProfilePage),
    get_redirect_route(
        r'/profilehandler/data/<username>', profile.ProfileHandler),
    get_redirect_route(r'/preferences', profile.PreferencesPage),
    get_redirect_route(
        feconf.PREFERENCES_DATA_URL, profile.PreferencesHandler),
    get_redirect_route(
        r'/preferenceshandler/profile_picture', profile.ProfilePictureHandler),
    get_redirect_route(
        r'/preferenceshandler/profile_picture_by_username/<username>',
        profile.ProfilePictureHandlerByUsername),
    get_redirect_route(r'%s' % feconf.SIGNUP_URL, profile.SignupPage),
    get_redirect_route(r'%s' % feconf.SIGNUP_DATA_URL, profile.SignupHandler),
    get_redirect_route(
        r'%s' % feconf.USERNAME_CHECK_DATA_URL, profile.UsernameCheckHandler),
    get_redirect_route(
        r'%s' % feconf.SITE_LANGUAGE_DATA_URL, profile.SiteLanguageHandler),

    get_redirect_route(r'/moderator', moderator.ModeratorPage),
    get_redirect_route(
        r'/moderatorhandler/featured', moderator.FeaturedActivitiesHandler),
    get_redirect_route(
        r'/moderatorhandler/email_draft', moderator.EmailDraftHandler),

    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_URL_PREFIX,
        reader.ExplorationPage),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_URL_EMBED_PREFIX,
        reader.ExplorationPageEmbed),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_INIT_URL_PREFIX,
        reader.ExplorationHandler),
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
        r'/explorehandler/state_hit_event/<exploration_id>',
        reader.StateHitEventHandler),
    get_redirect_route(
        r'/explorehandler/state_complete_event/<exploration_id>',
        reader.StateCompleteEventHandler),
    get_redirect_route(
        r'/explorehandler/leave_for_refresher_exp_event/<exploration_id>',
        reader.LeaveForRefresherExpEventHandler),
    get_redirect_route(
        r'/explorehandler/answer_submitted_event/<exploration_id>',
        reader.AnswerSubmittedEventHandler),
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
        r'%s/<question_id>' % feconf.QUESTION_EDITOR_URL_PREFIX,
        question_editor.QuestionEditorPage),
    get_redirect_route(
        r'%s/<question_id>' % feconf.QUESTION_DATA_URL,
        question_editor.EditableQuestionDataHandler),

    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EDITOR_URL_PREFIX,
        editor.ExplorationPage),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_DATA_PREFIX,
        editor.ExplorationHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.TRANSLATION_DATA_PREFIX,
        translator.ExplorationTranslationHandler),
    get_redirect_route(
        r'/createhandler/download/<exploration_id>',
        editor.ExplorationDownloadHandler),
    get_redirect_route(
        r'/createhandler/imageupload/<exploration_id>',
        editor.ImageUploadHandler),
    get_redirect_route(
        r'/createhandler/audioupload/<exploration_id>',
        translator.AudioUploadHandler),
    get_redirect_route(
        r'/createhandler/state_yaml/<exploration_id>',
        editor.StateYamlHandler),
    get_redirect_route(
        r'/createhandler/resource_list/<exploration_id>',
        editor.ExplorationResourcesHandler),
    get_redirect_route(
        r'/createhandler/revert/<exploration_id>',
        editor.ExplorationRevertHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_RIGHTS_PREFIX,
        editor.ExplorationRightsHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_STATUS_PREFIX,
        editor.ExplorationStatusHandler),
    get_redirect_route(
        r'/createhandler/moderatorrights/<exploration_id>',
        editor.ExplorationModeratorRightsHandler),
    get_redirect_route(
        r'/createhandler/notificationpreferences/<exploration_id>',
        editor.UserExplorationEmailsHandler),
    get_redirect_route(
        r'/createhandler/snapshots/<exploration_id>',
        editor.ExplorationSnapshotsHandler),
    get_redirect_route(
        r'/createhandler/statistics/<exploration_id>',
        editor.ExplorationStatisticsHandler),
    get_redirect_route(
        r'/createhandler/state_rules_stats/<exploration_id>/<escaped_state_name>',  # pylint: disable=line-too-long
        editor.StateRulesStatsHandler),
    get_redirect_route(
        r'/createhandler/state_answer_stats/<exploration_id>',
        editor.StateAnswerStatisticsHandler),
    get_redirect_route(
        r'/createhandler/started_tutorial_event/<exploration_id>',
        editor.StartedTutorialEventHandler),
    get_redirect_route(
        r'/createhandler/autosave_draft/<exploration_id>',
        editor.EditorAutosaveHandler),
    get_redirect_route(
        r'/createhandler/autosave_translation_draft/<exploration_id>',
        translator.TranslatorAutosaveHandler),
    get_redirect_route(
        r'/createhandler/get_top_unresolved_answers/<exploration_id>',
        editor.TopUnresolvedAnswersHandler),

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
        r'%s/<thread_id>' % feconf.FEEDBACK_THREAD_URL_PREFIX,
        feedback.ThreadHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.FEEDBACK_STATS_URL_PREFIX,
        feedback.FeedbackStatsHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.SUGGESTION_URL_PREFIX,
        feedback.SuggestionHandler),
    get_redirect_route(
        r'%s/<exploration_id>/<thread_id>' %
        feconf.SUGGESTION_ACTION_URL_PREFIX, feedback.SuggestionActionHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.SUGGESTION_LIST_URL_PREFIX,
        feedback.SuggestionListHandler),
    get_redirect_route(
        r'%s/' % feconf.GENERAL_SUGGESTION_URL_PREFIX,
        suggestion.SuggestionHandler),
    get_redirect_route(
        r'%s/exploration/<exploration_id>/<suggestion_id>' %
        feconf.GENERAL_SUGGESTION_ACTION_URL_PREFIX,
        suggestion.SuggestionToExplorationActionHandler),
    get_redirect_route(
        r'%s' % feconf.GENERAL_SUGGESTION_LIST_URL_PREFIX,
        suggestion.SuggestionListHandler),
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
        r'%s/<topic_id>/<assignee_id>' % feconf.TOPIC_MANAGER_RIGHTS_URL_PREFIX,
        topic_editor.TopicManagerRightsHandler),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_RIGHTS_URL_PREFIX,
        topic_editor.TopicRightsHandler),
    get_redirect_route(
        r'%s/<topic_id>' % feconf.TOPIC_STATUS_URL_PREFIX,
        topic_editor.TopicPublishHandler),

    get_redirect_route(
        r'%s/<skill_id>' % feconf.SKILL_EDITOR_URL_PREFIX,
        skill_editor.SkillEditorPage),
    get_redirect_route(
        r'%s/<skill_id>' % feconf.SKILL_EDITOR_DATA_URL_PREFIX,
        skill_editor.EditableSkillDataHandler),

    get_redirect_route(
        r'%s/<topic_id>/<story_id>' % feconf.STORY_EDITOR_URL_PREFIX,
        story_editor.StoryEditorPage),
    get_redirect_route(
        r'%s/<topic_id>/<story_id>' % feconf.STORY_EDITOR_DATA_URL_PREFIX,
        story_editor.EditableStoryDataHandler),

    get_redirect_route(r'/emaildashboard', email_dashboard.EmailDashboardPage),
    get_redirect_route(
        r'/emaildashboarddatahandler',
        email_dashboard.EmailDashboardDataHandler),
    get_redirect_route(
        r'/querystatuscheck', email_dashboard.QueryStatusCheck),
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
    get_redirect_route(r'/frontend_errors', FrontendErrorHandler),
    get_redirect_route(r'/logout', base.LogoutPage),
    get_redirect_route(
        r'/exploration_editor_logout', editor.EditorLogoutHandler),

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

    # 404 error handler.
    get_redirect_route(r'/<:.*>', base.Error404Handler),
]

URLS_TO_SERVE = []

if (feconf.ENABLE_MAINTENANCE_MODE and
        not current_user_services.is_current_user_super_admin()):
    # Show only the maintenance mode page.
    URLS_TO_SERVE = [
        get_redirect_route(r'%s' % feconf.ADMIN_URL, admin.AdminPage),
        get_redirect_route(r'/adminhandler', admin.AdminHandler),
        get_redirect_route(r'/adminrolehandler', admin.AdminRoleHandler),
        get_redirect_route(r'/adminjoboutput', admin.AdminJobOutput),
        get_redirect_route(
            r'/admintopicscsvdownloadhandler',
            admin.AdminTopicsCsvDownloadHandler),
        get_redirect_route(r'/<:.*>', pages.MaintenancePage)]
else:
    URLS_TO_SERVE = URLS

app = transaction_services.toplevel_wrapper(  # pylint: disable=invalid-name
    webapp2.WSGIApplication(URLS_TO_SERVE, debug=feconf.DEBUG))
