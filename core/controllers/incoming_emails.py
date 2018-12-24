# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Controllers for incoming email handlers."""

from core.controllers import base
from core.domain import acl_decorators
from core.domain import email_services
from core.domain import feedback_services
from google.appengine.api import mail



class IncomingReplyEmailHandler(base.BaseHandler):
    """Handler for receiving incoming reply emails."""

    @acl_decorators.open_access
    def post(self, reply_to_id):
        incoming_mail = mail.InboundEmailMessage(self.request.body)
        feedback_thread_reply_info = (
            email_services.get_feedback_thread_reply_info_by_reply_to_id(
                reply_to_id))

        if feedback_thread_reply_info is None:
            raise self.PageNotFoundException

        user_id = feedback_thread_reply_info.user_id
        thread_id = feedback_thread_reply_info.thread_id

        # Get text message from email.
        msg = list(
            incoming_mail.bodies(content_type='text/plain'))[0][1].decode()

        # Add new feedback message to thread.
        feedback_services.create_message(
            thread_id, user_id, None, None, msg, received_via_email=True)
        self.render_json({})
