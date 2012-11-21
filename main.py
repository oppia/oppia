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

import webapp2

import editor
import feconf
import reader
import widgets


class BaseHandler(webapp2.RequestHandler):
  """This base class allows 404 errors to be handled easily."""

  def error(self, code):  # pylint: disable-msg=C6409
    super(BaseHandler, self).error(code)
    self.response.out.write('Resource not found.')
    return


class Error404Handler(BaseHandler):
  """Handles 404 errors."""

  def get(self):  # pylint: disable-msg=C6409
    self.error(404)

# Regex for base64 hash_id encoding
r = '[A-Za-z0-9=_-]+'

# Register the URL with the responsible classes
urls = [
    # Reader handlers
    (r'/?', reader.MainPage),
    (r'/reader/profile/?', reader.ProfilePage),
    (r'/reader/(%s)/?' % r, reader.StoryInitPage),
    (r'/reader/(%s)/data/?' % r, reader.StoryHandler),
    (r'/reader/(%s)/data/(%s)/?' % (r, r), reader.StoryHandler),
    (r'/reader/(%s)/data/(%s)/(%s)/?' % (r, r, r), reader.StoryHandler),
    # Editor handlers
    (r'/editor/?', editor.MainPage),
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
