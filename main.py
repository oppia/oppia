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
from core.controllers import admin
from core.controllers import base
from core.controllers import collection_editor
from core.controllers import collection_viewer
from core.controllers import dashboard
from core.controllers import email_dashboard
from core.controllers import editor
from core.controllers import feedback
from core.controllers import library
from core.controllers import moderator
from core.controllers import pages
from core.controllers import profile
from core.controllers import reader
from core.controllers import recent_commits
from core.controllers import resources
from core.domain import user_services
from core.platform import models
import feconf
# pylint: enable=relative-import

from mapreduce import main as mapreduce_main
from mapreduce import parameters as mapreduce_parameters
import webapp2
from webapp2_extras.routes import RedirectRoute

transaction_services = models.Registry.import_transaction_services()


class FrontendErrorHandler(base.BaseHandler):
    """Handles errors arising from the frontend."""

    REQUIRE_PAYLOAD_CSRF_CHECK = False

    def post(self):
        """Records errors reported by the frontend."""
        logging.error('Frontend error: %s' % self.payload.get('error'))
        self.render_json(self.values)


class WarmupHandler(base.BaseHandler):
    """Handles warmup requests."""

    def get(self):
        """Handles GET warmup requests."""
        pass


class HomePageRedirectHandler(base.BaseHandler):
    """When a request is made to '/', check the user's login status, and
    redirect them appropriately.
    """
    def get(self):
        if self.user_id and user_services.has_fully_registered(self.user_id):
            self.redirect(feconf.DASHBOARD_URL)
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
    return RedirectRoute(
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
    get_redirect_route(r'/foundation', pages.AboutRedirectPage),
    get_redirect_route(r'/credits', pages.AboutRedirectPage),
    get_redirect_route(r'/teach', pages.TeachPage),
    get_redirect_route(r'/participate', pages.TeachRedirectPage),
    get_redirect_route(r'/site_guidelines', pages.TeachRedirectPage),
    get_redirect_route(r'/console_errors', pages.ConsoleErrorPage),
    get_redirect_route(r'/contact', pages.ContactPage),

    get_redirect_route(r'/blog', pages.BlogPage),
    get_redirect_route(r'/forum', pages.ForumPage),
    get_redirect_route(r'/donate', pages.DonatePage),
    get_redirect_route(r'/thanks', pages.ThanksPage),
    get_redirect_route(r'/terms', pages.TermsPage),
    get_redirect_route(r'/privacy', pages.PrivacyPage),

    get_redirect_route(r'%s' % feconf.ADMIN_URL, admin.AdminPage),
    get_redirect_route(r'/adminhandler', admin.AdminHandler),
    get_redirect_route(r'/adminjoboutput', admin.AdminJobOutput),
    get_redirect_route(
        r'/admintopicscsvdownloadhandler',
        admin.AdminTopicsCsvDownloadHandler),

    get_redirect_route(
        r'/notifications_dashboard', dashboard.NotificationsDashboardPage),
    get_redirect_route(
        r'/notificationsdashboardhandler/data',
        dashboard.NotificationsDashboardHandler),
    get_redirect_route(
        r'/notificationshandler', dashboard.NotificationsHandler),
    get_redirect_route(
        r'%s' % feconf.DASHBOARD_URL, dashboard.DashboardPage),
    get_redirect_route(
        r'%s' % feconf.DASHBOARD_DATA_URL, dashboard.DashboardHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.DASHBOARD_EXPLORATION_STATS_PREFIX,
        dashboard.ExplorationDashboardStatsHandler),
    get_redirect_route(
        r'%s' % feconf.NEW_EXPLORATION_URL, dashboard.NewExploration),
    get_redirect_route(
        r'%s' % feconf.NEW_COLLECTION_URL, dashboard.NewCollection),
    get_redirect_route(
        r'%s' % feconf.UPLOAD_EXPLORATION_URL, dashboard.UploadExploration),
    get_redirect_route(
        r'/my_explorations', dashboard.DashboardRedirectPage),

    get_redirect_route(
        r'/imagehandler/<exploration_id>/<encoded_filepath>',
        resources.ImageHandler),
    get_redirect_route(
        r'/object_editor_template/<obj_type>',
        resources.ObjectEditorTemplateHandler),
    get_redirect_route(
        r'/value_generator_handler/<generator_id>',
        resources.ValueGeneratorHandler),

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
        r'/preferenceshandler/data', profile.PreferencesHandler),
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
        r'/moderatorhandler/email_draft/<action>', moderator.EmailDraftHandler),

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
        r'/explorehandler/state_hit_event/<exploration_id>',
        reader.StateHitEventHandler),
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
        r'/explorehandler/classify/<exploration_id>', reader.ClassifyHandler),
    get_redirect_route(
        r'/explorehandler/rating/<exploration_id>', reader.RatingHandler),
    get_redirect_route(
        r'/explorehandler/recommendations/<exploration_id>',
        reader.RecommendationsHandler),

    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EDITOR_URL_PREFIX,
        editor.ExplorationPage),
    get_redirect_route(
        r'/createhandler/data/<exploration_id>', editor.ExplorationHandler),
    get_redirect_route(
        r'/createhandler/download/<exploration_id>',
        editor.ExplorationDownloadHandler),
    get_redirect_route(
        r'/createhandler/imageupload/<exploration_id>',
        editor.ImageUploadHandler),
    get_redirect_route(
        r'/createhandler/resolved_answers/<exploration_id>/<escaped_state_name>',  # pylint: disable=line-too-long
        editor.ResolvedAnswersHandler),
    get_redirect_route(r'/createhandler/state_yaml', editor.StateYamlHandler),
    get_redirect_route(
        r'/createhandler/training_data/<exploration_id>/<escaped_state_name>',
        editor.UntrainedAnswersHandler),
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
        r'/createhandler/moderatorrights/<exploration_id>',
        editor.ExplorationModeratorRightsHandler),
    get_redirect_route(
        r'/createhandler/snapshots/<exploration_id>',
        editor.ExplorationSnapshotsHandler),
    get_redirect_route(
        r'/createhandler/statisticsversion/<exploration_id>',
        editor.ExplorationStatsVersionsHandler),
    get_redirect_route(
        r'/createhandler/statistics/<exploration_id>/<exploration_version>',
        editor.ExplorationStatisticsHandler),
    get_redirect_route(
        r'/createhandler/state_rules_stats/<exploration_id>/<escaped_state_name>',  # pylint: disable=line-too-long
        editor.StateRulesStatsHandler),
    get_redirect_route(
        r'/createhandler/started_tutorial_event',
        editor.StartedTutorialEventHandler),
    get_redirect_route(
        r'/createhandler/autosave_draft/<exploration_id>',
        editor.EditorAutosaveHandler),

    get_redirect_route(
        r'%s' % feconf.RECENT_COMMITS_DATA_URL,
        recent_commits.RecentCommitsHandler),
    get_redirect_route(
        r'%s' % feconf.RECENT_FEEDBACK_MESSAGES_DATA_URL,
        feedback.RecentFeedbackMessagesHandler),

    get_redirect_route(
        r'%s' % feconf.FEEDBACK_THREAD_VIEW_EVENT_URL,
        feedback.FeedbackThreadViewEventHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.FEEDBACK_THREADLIST_URL_PREFIX,
        feedback.ThreadListHandler),
    get_redirect_route(
        r'%s/<exploration_id>/<thread_id>' % feconf.FEEDBACK_THREAD_URL_PREFIX,
        feedback.ThreadHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.FEEDBACK_STATS_URL_PREFIX,
        feedback.FeedbackStatsHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.SUGGESTION_URL_PREFIX,
        feedback.SuggestionHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.FLAG_EXPLORATION_URL_PREFIX,
        reader.FlagExplorationHandler),
    get_redirect_route(
        r'%s/<exploration_id>/<thread_id>' %
        feconf.SUGGESTION_ACTION_URL_PREFIX,
        feedback.SuggestionActionHandler),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.SUGGESTION_LIST_URL_PREFIX,
        feedback.SuggestionListHandler),

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
        r'%s/<collection_id>' % feconf.EDITABLE_COLLECTION_DATA_URL_PREFIX,
        collection_editor.EditableCollectionDataHandler),
    get_redirect_route(
        r'%s/<collection_id>' % feconf.COLLECTION_RIGHTS_PREFIX,
        collection_editor.CollectionRightsHandler),

    get_redirect_route(r'/emaildashboard', email_dashboard.EmailDashboardPage),
    get_redirect_route(
        r'/emaildashboarddatahandler',
        email_dashboard.EmailDashboardDataHandler),
    get_redirect_route(
        r'/querystatuscheck', email_dashboard.QueryStatusCheck),
    get_redirect_route(
        r'%s' % feconf.EXPLORATION_METADATA_SEARCH_URL,
        collection_editor.ExplorationMetadataSearchHandler),

    get_redirect_route(r'/frontend_errors', FrontendErrorHandler),
    get_redirect_route(r'/logout', base.LogoutPage),

    # 404 error handler.
    get_redirect_route(r'/<:.*>', base.Error404Handler),
]

app = transaction_services.toplevel_wrapper(  # pylint: disable=invalid-name
    webapp2.WSGIApplication(URLS, debug=feconf.DEBUG))
