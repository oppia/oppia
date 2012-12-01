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

"""Oppia base handlers."""

__author__ = 'Sean Lip'

import json
import logging

import webapp2


class BaseHandler(webapp2.RequestHandler):
  """Base class for all Oppia handlers."""

  def error(self, code):  # pylint: disable-msg=C6409
    super(BaseHandler, self).error(code)
    self.response.out.write('Resource not found.')
    return

  def JsonError(self, error_message, code=404):
    """Used to handle error messages in JSON returns."""
    super(BaseHandler, self).error(code)
    logging.error('%s: %s', code, error_message)
    self.response.out.write(json.dumps({'error': str(error_message)}))
    return

