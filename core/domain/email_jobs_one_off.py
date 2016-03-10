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

"""Jobs for Sent Email Model."""

from core import jobs
from core.domain import email_manager
from core.platform import models

(email_models,) = models.Registry.import_models([models.NAMES.email])


class SentEmailUpdateHashOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for updating hash for all Sent Email Models."""
    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.SentEmailModel]

    @staticmethod
    def map(email_model):
        if not email_model.email_hash:
            # pylint: disable=protected-access
            email_hash = email_manager._generate_hash(
                email_model.recipient_id, email_model.subject,
                email_model.html_body)
            # pylint: enable=protected-access
            email_model.email_hash = email_hash
            email_model.put()

    @staticmethod
    def reduce(email_model_id, value):
        pass
