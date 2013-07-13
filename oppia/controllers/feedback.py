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

"""Controller for user feedback."""

__author__ = 'sll@google.com (Sean Lip)'

import urllib

from oppia.apps.statistics.services import EventHandler
from oppia.controllers.base import BaseHandler


class FeedbackPage(BaseHandler):
    """Page with feedback."""

    def get(self):
        """Handles GET requests."""
        self.values.update({
            'nav_mode': 'feedback',
        })
        self.render_template('feedback/feedback.html')

    def post(self):
        """Handles POST requests."""
        feedback = self.payload.get('feedback')
        url = self.payload.get('url_params').get('url')
        url = urllib.unquote_plus(url)

        EventHandler.record_feedback_submitted(url, feedback)
