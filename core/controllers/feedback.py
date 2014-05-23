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


class ThreadListHandler(base.BaseHandler):
    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_user
    def get(self, exploration_id):
        threads = feedback_services.get_threadlist(exploration_id)
        self.values.update({'threads': threads})
        self.render_json(self.values)


class ThreadCreateHandler(base.BaseHandler):
    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_user
    def post(self, exploration_id):
        feedback_services.create_thread(
            exploration_id,
            self.payload.get('state_id'),
            self.user_id,
            self.payload.get('subject'),
            self.payload.get('text'))


class ThreadHandler(base.BaseHandler):
    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_user
    def get(self, thread_id):
        messages = feedback_services.get_thread(thread_id)
        self.values.update({'messages': messages})
        self.render_json(self.values)


class MessageCreateHandler(base.BaseHandler):
    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_user
    def post(self, thread_id):
        feedback_services.create_message(
            self.payload.get('exploration_id'),
            thread_id,
            self.user_id,
            self.payload.get('updated_status'),
            self.payload.get('updated_subject'),
            self.payload.get('text'))
