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

"""Main package for URL routing."""

__author__ = 'Sean Lip'

import jinja2
import webapp2

import base
import editor
import feconf
import os
import reader
import utils
import widgets


jinja_env = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), feconf.TEMPLATE_DIR)))


class Error404Handler(base.BaseHandler):
  """Handles 404 errors."""

  def get(self):  # pylint: disable-msg=C6409
    self.error(404)


class MainPage(base.BaseHandler):
  """Oppia's main page."""

  def get(self):  # pylint: disable-msg=C6409
    """Handles GET requests."""

    values = {
        'css': utils.GetCssFile('oppia'),
        'debug': feconf.DEBUG,
        'js': utils.GetJsFile('indexNew'),
    }
    self.response.out.write(
        jinja_env.get_template('index_new.html').render(values))


# Regex for base64 hash_id encoding
r = '[A-Za-z0-9=_-]+'

# Register the URL with the responsible classes
urls = [
    # Handlers for the new version of Oppia
    # TODO(sll): Use the URL r'/?' instead.
    (r'/index/?', MainPage),
    (r'/learn/?', reader.MainPage),
    (r'/learn/(%s)/?' % r, reader.ExplorationPage),
    (r'/create/?', editor.MainPage),
    (r'/create/(%s)/?' % r, editor.ExplorationPage),
    # Reader handlers
    (r'/?', reader.HomePage),
    (r'/reader/profile/?', reader.ProfilePage),
    (r'/reader/(%s)/?' % r, reader.StoryInitPage),
    (r'/reader/(%s)/data/?' % r, reader.StoryHandler),
    (r'/reader/(%s)/data/(%s)/?' % (r, r), reader.StoryHandler),
    (r'/reader/(%s)/data/(%s)/(%s)/?' % (r, r, r), reader.StoryHandler),
    # Editor handlers
    (r'/editor/?', editor.HomePage),
    (r'/editor/images/?', editor.Image),
    (r'/editor/images/(%s)/?' % r, editor.Image),
    (r'/editor/(%s)/structure/?' % r, editor.StoryPage),
    (r'/editor/(%s)/structure/(%s)/?' % (r, r), editor.ChapterPage),
    (r'/editor/(%s)/structure/(%s)/data/?' % (r, r), editor.ChapterHandler),
    (r'/editor/(%s)/structure/(%s)/g/(%s)/?' % (r, r, r),
     editor.QuestionGroupHandler),
    (r'/editor/(%s)/qneditor/(%s)/(%s)/?' % (r, r, r), editor.QuestionPage),
    (r'/editor/(%s)/qneditor/(%s)/(%s)/data/?' % (r, r, r),
     editor.QuestionHandler),
    (r'/editor/(%s)/qneditor/(%s)/(%s)/(%s)/?' % (r, r, r, r),
     editor.StatePage),
    (r'/editor/(%s)/qneditor/(%s)/(%s)/(%s)/data/?' % (r, r, r, r),
     editor.StateHandler),
    # Widget repository handlers
    (r'/widgets/?', widgets.Widget),
    (r'/widgets/repository/?', widgets.WidgetRepositoryPage),
    (r'/widgets/(%s)/?' % r, widgets.Widget),
    (r'/widgets/repository/data/?', widgets.WidgetRepositoryHandler),
    # 404 error handler.
    (r'/.*', Error404Handler),
]

app = webapp2.WSGIApplication(urls, debug=feconf.DEBUG)
