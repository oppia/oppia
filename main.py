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
from controllers import base, editor, gallery, pages, reader, resources, stats, widgets

import webapp2


class Error404Handler(base.BaseHandler):
    """Handles 404 errors."""

    def get(self):  # pylint: disable-msg=C6409
        self.error(404)


# Regex for base64 hash_id encoding
r = '[A-Za-z0-9=_-]+'

# Register the URL with the responsible classes
urls = [
    (r'/?', pages.MainPage),
    (r'/about/?', pages.AboutPage),
    (r'/terms/?', pages.TermsPage),

    (r'/lib/(%s)/?' % r, resources.LibHandler),
    (r'/templates/(%s)/?' % r, resources.TemplateHandler),
    (r'/imagehandler/?', resources.ImageHandler),
    (r'/imagehandler/(%s)/?' % r, resources.ImageHandler),

    (r'/gallery/?', gallery.GalleryPage),
    (r'/gallery/data/?', gallery.GalleryHandler),

    (r'/learn/(%s)/?' % r, reader.ExplorationPage),
    (r'/learn/(%s)/data/?' % r, reader.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/learn/(%s)/(%s)/?' % (r, r), reader.ExplorationHandler),
    (r'/learn_random/?', reader.RandomExplorationPage),

    (r'/create_new/?', editor.NewExploration),
    (r'/create/download/(%s)/?' % r, editor.ExplorationDownloadHandler),
    (r'/create/(%s)/?' % r, editor.ExplorationPage),
    (r'/create/(%s)/data/?' % r, editor.ExplorationHandler),
    # TODO(sll): there is a potential collision here if the state_id is 'data'.
    (r'/create/(%s)/(%s)/?' % (r, r), editor.StatePage),
    (r'/create/(%s)/(%s)/data/?' % (r, r), editor.StateHandler),

    (r'/widgets/?', widgets.Widget),
    (r'/widgets/(%s)/?' % r, widgets.Widget),
    (r'/widgetrepository/?', widgets.WidgetRepositoryPage),
    (r'/widgetrepository/data/?', widgets.WidgetRepositoryHandler),
    (r'/interactive_widgets/(%s)/?' % r, widgets.InteractiveWidget),

    (r'/stats/(%s)/?' % r, stats.StatsHandler),

    # 404 error handler.
    (r'/.*', Error404Handler),
]

app = webapp2.WSGIApplication(urls, debug=feconf.DEBUG)
