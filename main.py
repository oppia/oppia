# Copyright 2012 Google Inc. All Rights Reserved.
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
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

from core.controllers import admin
from core.controllers import base
from core.controllers import editor
from core.controllers import gallery
from core.controllers import pages
from core.controllers import profile
from core.controllers import reader
from core.controllers import resources
from core.controllers import widgets

import webapp2
from webapp2_extras.routes import RedirectRoute


class Error404Handler(base.BaseHandler):
    """Handles 404 errors."""

    def get(self):
        """Redirects users to the main gallery if an invalid URL is entered.

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

# Register the URL with the responsible classes
urls = [
    webapp2.Route(r'/', pages.MainPage, name="home"),
    RedirectRoute(r'/about', pages.AboutPage, name="about_page", strict_slash=True),
    RedirectRoute(r'/terms', pages.TermsPage, name="terms_page", strict_slash=True),
    RedirectRoute(r'/feedback', pages.FeedbackPage, name="feedback_page", strict_slash=True),

    RedirectRoute(r'/admin', admin.AdminPage, name="admin_page", strict_slash=True),

    RedirectRoute(r'/editor_views/<view_type>', resources.EditorViewHandler,
        name="edit_view_handler", strict_slash=True),
    RedirectRoute(r'/templates/<template_type>', resources.TemplateHandler,
        name="template_handler", strict_slash=True),
    RedirectRoute(r'/imagehandler', resources.ImageUploadHandler,
        name="image_upload_handler", strict_slash=True),
    RedirectRoute(r'/imagehandler/<image_id>', resources.ImageHandler,
        name="image_handler", strict_slash=True),

    RedirectRoute(r'/gallery', gallery.GalleryPage,
        name="gallery_page", strict_slash=True),
    RedirectRoute(r'/gallery/data', gallery.GalleryHandler,
        name="gallery_handler", strict_slash=True),

    RedirectRoute(r'/profile', profile.ProfilePage,
        name="profile_page", strict_slash=True),
    RedirectRoute(r'/profile/data', profile.ProfileHandler,
        name="profile_handler", strict_slash=True),

    RedirectRoute(
        r'/learn/<exploration_id>', reader.ExplorationPage,
        name="exploration_page", strict_slash=True
        ),
    RedirectRoute(
        r'/learn/<exploration_id>/data', reader.ExplorationHandler,
        name="exploration_handler", strict_slash=True),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    RedirectRoute(
        r'/learn/<exploration_id>/<state_id>',
        reader.FeedbackHandler, name="feedback_handler", strict_slash=True),
    RedirectRoute(
        r'/learn_random', reader.RandomExplorationPage,
        name="random_exploration_page", strict_slash=True
        ),

    RedirectRoute(r'/create_new', editor.NewExploration,
        name="new_exploration", strict_slash=True),
    RedirectRoute(r'/fork', editor.ForkExploration,
        name="fork_exploration", strict_slash=True),
    RedirectRoute(r'/create/download/<exploration_id>', editor.ExplorationDownloadHandler,
        name="exploration_download_helper", strict_slash=True),
    RedirectRoute(r'/create/<exploration_id>', editor.ExplorationPage,
        name="editor_exploration_page", strict_slash=True),
    RedirectRoute(r'/create/<exploration_id>/data', editor.ExplorationHandler,
        name="editor_exploration_handler", strict_slash=True),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    RedirectRoute(r'/create/<exploration_id>/<state_id>/data', editor.StateHandler,
        name="state_handler", strict_slash=True),

    RedirectRoute(r'/widgetrepository', widgets.WidgetRepositoryPage,
        name="widget_repository_page", strict_slash=True),
    RedirectRoute(r'/widgetrepository/data', widgets.WidgetRepositoryHandler,
        name="widget_repository_handler", strict_slash=True),
    RedirectRoute(r'/widgets/<widget_type>/<widget_id>', widgets.WidgetHandler,
        name="widget_handler", strict_slash=True, defaults={'widget_type': 'noninteractive'}),
    RedirectRoute(r'/widgets/interactive/<widget_id>', widgets.WidgetHandler,
        name="widget_handler", strict_slash=True, defaults={'widget_type': 'interactive'}),
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
    from paste import httpserver
    httpserver.serve(app, host='127.0.0.1', port='8080')

if __name__ == '__main__':
    main()
