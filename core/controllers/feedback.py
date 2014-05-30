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

"""Controllers for the feedback thread page."""

__author__ = 'kashida@google.com (Koji Ashida)'

from core.controllers import base
from core.domain import feedback_services
from core.domain import user_services
import feconf


class ThreadListHandler(base.BaseHandler):
    PAGE_NAME_FOR_CSRF = 'editor'

    def get(self, exploration_id):
        if not feconf.SHOW_FEEDBACK_TAB:
            raise Exception('Unlaunched feature.')

        threads = feedback_services.get_threadlist(exploration_id)
        self.values.update({'threads': threads})
        self.render_json(self.values)

    @base.require_user
    def post(self, exploration_id):
        if not feconf.SHOW_FEEDBACK_TAB:
            raise Exception('Unlaunched feature.')

        feedback_services.create_thread(
            exploration_id,
            self.payload.get('state_name'),
            self.user_id,
            self.payload['subject'],
            self.payload['text'])
        self.render_json(self.values)


class ThreadHandler(base.BaseHandler):
    PAGE_NAME_FOR_CSRF = 'editor'

    def get(self, thread_id):
        if not feconf.SHOW_FEEDBACK_TAB:
            raise Exception('Unlaunched feature.')

        messages = feedback_services.get_thread(thread_id)
        for message in messages:
            message['author_username'] = user_services.get_username(
                message['author_id'])
            del message['author_id']
        self.values.update({'messages': messages})
        self.render_json(self.values)

    @base.require_user
    def post(self, thread_id):
        if not feconf.SHOW_FEEDBACK_TAB:
            raise Exception('Unlaunched feature.')

        feedback_services.create_message(
            self.payload.get('exploration_id'),
            thread_id,
            self.user_id,
            self.payload.get('updated_status'),
            self.payload.get('updated_subject'),
            self.payload.get('text'))
        self.render_json(self.values)
