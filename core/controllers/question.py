# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Controller for Question object."""

from core.controllers import base
from core.domain import acl_decorators
from core.domain import question_services
import feconf

class QuestionsBatchHandler(base.BaseHandler):
    """This handler completes requests for questions batch."""

    @acl_decorators.open_access
    def get(self, collection_id):
        """Handles get requests."""
        skill_ids = self.request.get('skill_ids')
        skill_ids = skill_ids.split(",")
        user_id = self.request.get('user_id')
        batch_size = feconf.QUESTION_BATCH_SIZE
        questions_batch = (
            question_services.get_questions_batch(
                collection_id, skill_ids, user_id, batch_size))

        return self.render_json(questions_batch)
