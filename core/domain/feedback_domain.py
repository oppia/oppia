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

"""Domain objects for feedback models"""

class FeedbackThread(object):
    """Domain object for a feedback thread."""
    def __init__(self, thread_id, exploration_id, state_name,
                 original_author_id, status, subject, summary, has_suggestion,
                 created_on, last_updated):
        self.id = thread_id
        self.exploration_id = exploration_id
        self.state_name = state_name
        self.original_author_id = original_author_id
        self.status = status
        self.subject = subject
        self.summary = summary
        self.has_suggestion = has_suggestion

        self.created_on = created_on
        self.last_updated = last_updated
