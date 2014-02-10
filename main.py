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

"""Main package for URL routing and the index page."""

__author__ = 'Sean Lip'

import feconf
import os
if feconf.PLATFORM == 'django':
    os.environ["DJANGO_SETTINGS_MODULE"] = "core.settings"

from core.controllers import admin
from core.controllers import base
from core.controllers import editor
from core.controllers import galleries
from core.controllers import pages
from core.controllers import profile
from core.controllers import reader
from core.controllers import resources
from core.controllers import services
from core.controllers import widgets

import webapp2
from webapp2_extras.routes import RedirectRoute


class Error404Handler(base.BaseHandler):
    """Handles 404 errors."""

    def get(self):
        """Raises a PageNotFoundException if an invalid URL is entered.

        For robots.txt requests, returns an empty response so that the error
        does not show up in the logs.
        """
        if not self.request.uri.endswith('robots.txt'):
            raise self.PageNotFoundException


# Regex for base64 id encoding
r = '[A-Za-z0-9=_-]+'


def generate_static_url_tuples():
    static_urls = []
    url_tuples = []
    for url in feconf.PATH_MAP:
        static_urls.append(url+'.+')
    for url in static_urls:
        url_tuples.append((url, resources.StaticFileHandler))
    return url_tuples


def get_redirect_route(regex_route, handler, name, defaults=None):
    """Returns a route that redirects /foo/ to /foo.

    Warning: this method strips off parameters after the trailing slash. URLs
    with parameters should be formulated without the trailing slash.
    """
    if defaults is None:
        defaults = {}
    return RedirectRoute(
        regex_route, handler, name, strict_slash=True, defaults=defaults)


# Register the URL with the responsible classes
urls = [
    webapp2.Route(
        r'%s' % feconf.SPLASH_PAGE_URL, pages.SplashPage, 'splash_page'),
    get_redirect_route(r'/about', pages.AboutPage, 'about_page'),
    get_redirect_route(r'/contact', pages.ContactPage, 'contact_page'),

    get_redirect_route(r'/admin', admin.AdminPage, 'admin_page'),
    get_redirect_route(r'/adminhandler', admin.AdminHandler, 'admin_handler'),

    get_redirect_route(
        r'/imagehandler/<exploration_id>/<encoded_filepath>',
        resources.ImageHandler, 'image_handler'),
    get_redirect_route(
        r'/object_editor_template/<obj_type>',
        resources.ObjectEditorTemplateHandler, 'object_editor_template'),
    get_redirect_route(
        r'/value_generator_handler/<generator_id>',
        resources.ValueGeneratorHandler, 'value_generator_handler'),

    get_redirect_route(
        r'%s' % feconf.LEARN_GALLERY_URL, galleries.LearnPage,
        'learn_gallery_page'),
    get_redirect_route(
        r'%s' % feconf.LEARN_GALLERY_DATA_URL, galleries.LearnHandler,
        'learn_gallery_handler'),

    get_redirect_route(
        r'%s' % feconf.CONTRIBUTE_GALLERY_URL, galleries.ContributePage,
        'contribute_gallery_page'),
    get_redirect_route(
        r'%s' % feconf.CONTRIBUTE_GALLERY_DATA_URL,
        galleries.ContributeHandler, 'contribute_gallery_handler'),
    get_redirect_route(
        r'%s' % feconf.NEW_EXPLORATION_URL,
        galleries.NewExploration, 'new_exploration'),
    get_redirect_route(
        r'%s' % feconf.UPLOAD_EXPLORATION_URL,
        galleries.UploadExploration, 'upload_exploration'),
    get_redirect_route(
        r'%s' % feconf.CLONE_EXPLORATION_URL,
        galleries.CloneExploration, 'clone_exploration'),

    get_redirect_route(r'/profile', profile.ProfilePage, 'profile_page'),
    get_redirect_route(
        r'/profilehandler/data', profile.ProfileHandler, 'profile_handler'),
    get_redirect_route(
        r'%s' % feconf.EDITOR_PREREQUISITES_URL,
        profile.EditorPrerequisitesPage, 'editor_prerequisites_page'),
    get_redirect_route(
        r'%s' % feconf.EDITOR_PREREQUISITES_DATA_URL,
        profile.EditorPrerequisitesHandler, 'editor_prerequisites_handler'),

    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_URL_PREFIX,
        reader.ExplorationPage, 'exploration_page'),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_INIT_URL_PREFIX,
        reader.ExplorationHandler, 'exploration_handler'),
    get_redirect_route(
        (r'%s/<exploration_id>/<escaped_state_name>'
         % feconf.EXPLORATION_TRANSITION_URL_PREFIX),
        reader.FeedbackHandler, 'feedback_handler'),
    get_redirect_route(
        r'/explorehandler/give_feedback/<exploration_id>/<escaped_state_name>',
        reader.ReaderFeedbackHandler, 'reader_feedback_handler'),

    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EDITOR_URL_PREFIX,
        editor.ExplorationPage, 'editor_exploration_page'),
    get_redirect_route(
        r'/createhandler/data/<exploration_id>', editor.ExplorationHandler,
        'editor_exploration_handler'),
    get_redirect_route(
        r'/createhandler/change_list_summary/<exploration_id>',
        editor.ChangeListSummaryHandler, 'change_list_summary'),
    get_redirect_route(
        r'/createhandler/download/<exploration_id>',
        editor.ExplorationDownloadHandler, 'exploration_download_handler'),
    get_redirect_route(
        r'/createhandler/imageupload/<exploration_id>',
        editor.ImageUploadHandler, 'image_upload_handler'),
    get_redirect_route(
        r'/createhandler/new_state_template/<exploration_id>',
        editor.NewStateTemplateHandler, 'new_state_template'),
    get_redirect_route(
        r'/createhandler/resolved_answers/<exploration_id>/<escaped_state_name>',
        editor.ResolvedAnswersHandler, 'resolved_answers_handler'),
    get_redirect_route(
        r'/createhandler/resolved_feedback/<exploration_id>/<escaped_state_name>',
        editor.ResolvedFeedbackHandler, 'resolved_feedback_handler'),
    get_redirect_route(
        r'/createhandler/resource_list/<exploration_id>',
        editor.ExplorationResourcesHandler, 'exploration_resources_handler'),
    get_redirect_route(
        r'/createhandler/revert/<exploration_id>',
        editor.ExplorationRevertHandler, 'exploration_revert_handler'),
    get_redirect_route(
        r'%s/<exploration_id>' % feconf.EXPLORATION_RIGHTS_PREFIX,
        editor.ExplorationRightsHandler, 'exploration_rights_handler'),
    get_redirect_route(
        r'/createhandler/snapshots/<exploration_id>',
        editor.ExplorationSnapshotsHandler, 'exploration_snapshots_handler'),
    get_redirect_route(
        r'/createhandler/statistics/<exploration_id>',
        editor.ExplorationStatisticsHandler, 'exploration_statistics_handler'),
    get_redirect_route(
        r'/createhandler/state_rules_stats/<exploration_id>/<escaped_state_name>',
        editor.StateRulesStatsHandler, 'state_rules_stats_handler'),

    get_redirect_route(
        r'/widgetrepository', widgets.WidgetRepositoryPage,
        'widget_repository_page'),
    get_redirect_route(
        r'/widgetrepository/data/<widget_type>',
        widgets.WidgetRepositoryHandler, 'widget_repository_handler'),
    get_redirect_route(
        r'/widgets/<widget_type>/<widget_id>', widgets.WidgetHandler,
        'widget_handler'),
    get_redirect_route(
        r'/widgettemplate/<widget_type>/<widget_id>',
        widgets.WidgetTemplateHandler, 'widget_template_handler'),

    get_redirect_route(
        r'/filereadhandler', services.FileReadHandler, 'file_read_handler'),
]

# 404 error handler.
error404_handler = [webapp2.Route(r'/.*', Error404Handler)]

if feconf.PLATFORM != 'gae':
    urls = urls + generate_static_url_tuples() + error404_handler
else:
    urls = urls + error404_handler


app = webapp2.WSGIApplication(urls, debug=feconf.DEBUG)


# Called on non-GAE platforms to start the development server.
def main():
    from werkzeug.wsgi import DispatcherMiddleware
    from core.platform.auth.wsgi import application as auth

    application = DispatcherMiddleware(app, {
        '/auth': auth
    })
    from werkzeug.serving import run_simple
    run_simple('localhost', 8080, application, use_reloader=True, use_debugger=True)

if __name__ == '__main__':
    main()
