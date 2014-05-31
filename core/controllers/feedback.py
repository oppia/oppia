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

        threadlist = feedback_services.get_threadlist(exploration_id)
        for thread in threadlist:
            thread['original_author_username'] = user_services.get_username(
                thread['original_author_id'])
            del thread['original_author_id']
        self.values.update({'threads': threadlist})
        self.render_json(self.values)

    @base.require_user
    def post(self, exploration_id):
        if not feconf.SHOW_FEEDBACK_TAB:
            raise Exception('Unlaunched feature.')

        subject = self.payload.get('subject')
        if not subject:
            raise self.InvalidInputException(
                'A thread subject must be specified.')

        text = self.payload.get('text')
        if not text:
            raise self.InvalidInputException(
                'Text for the first message in the thread must be specified.')

        feedback_services.create_thread(
            exploration_id,
            self.payload.get('state_name'),
            self.user_id,
            subject,
            text)
        self.render_json(self.values)


class ThreadHandler(base.BaseHandler):
    PAGE_NAME_FOR_CSRF = 'editor'

    def get(self, exploration_id, thread_id):
        if not feconf.SHOW_FEEDBACK_TAB:
            raise Exception('Unlaunched feature.')

        messages = feedback_services.get_messages(thread_id)
        for message in messages:
            message['author_username'] = user_services.get_username(
                message['author_id'])
            del message['author_id']
        self.values.update({'messages': messages})
        self.render_json(self.values)

    @base.require_user
    def post(self, exploration_id, thread_id):
        if not feconf.SHOW_FEEDBACK_TAB:
            raise Exception('Unlaunched feature.')

        text = self.payload.get('text')
        if not text:
            raise self.InvalidInputException(
                'Text for the message must be specified.')

        feedback_services.create_message(
            exploration_id,
            thread_id,
            self.user_id,
            self.payload.get('updated_status'),
            self.payload.get('updated_subject'),
            text)
        self.render_json(self.values)


class FeedbackLastUpdatedHandler(base.BaseHandler):
    """Returns the last time a thread for this exploration was updated."""

    def get(self, exploration_id):
        threadlist = feedback_services.get_threadlist(exploration_id)
        if threadlist:
            last_updated = max(
                [thread['last_updated'] for thread in threadlist])
        else:
            last_updated = None

        self.values.update({'last_updated': last_updated})
        self.render_json(self.values)
