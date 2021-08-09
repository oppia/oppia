# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Files having imports from storage and platform for mypy checks.
Mypy is not good with handling module imports as variable like we do using
datastore and transaction services. So this will will be imported in every file
which uses storage models and platform services. This file will be imported only
in mypy checks not during runtime.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.datastore import (
    cloud_datastore_services as datastore_services)
from core.platform.transactions import (
    cloud_transaction_services as transaction_services)
from core.storage.activity import gae_models as activity_models
from core.storage.app_feedback_report import (
    gae_models as app_feedback_report_models)
from core.storage.audit import gae_models as audit_models
from core.storage.auth import gae_models as auth_models
from core.storage.base_model import gae_models as base_models
from core.storage.blog import gae_models as blog_models
from core.storage.classifier import gae_models as classifier_models
from core.storage.collection import gae_models as collection_models
from core.storage.config import gae_models as config_models
from core.storage.email import gae_models as email_models
from core.storage.exploration import gae_models as exp_models
from core.storage.feedback import gae_models as feedback_models
from core.storage.improvements import gae_models as improvements_models
from core.storage.job import gae_models as job_models
from core.storage.opportunity import gae_models as opportunity_models
from core.storage.question import gae_models as question_models
from core.storage.recommendations import gae_models as recommendations_models
from core.storage.skill import gae_models as skill_models
from core.storage.statistics import gae_models as stats_models
from core.storage.story import gae_models as story_models
from core.storage.subtopic import gae_models as subtopic_models
from core.storage.suggestion import gae_models as suggestion_models
from core.storage.topic import gae_models as topic_models
from core.storage.translation import gae_models as translation_models # pylint: disable=line-too-long
from core.storage.user import gae_models as user_models

__all__ = [
    'activity_models',
    'app_feedback_report_models',
    'audit_models',
    'auth_models',
    'base_models',
    'blog_models',
    'classifier_models',
    'collection_models',
    'config_models',
    'datastore_services',
    'email_models',
    'exp_models',
    'feedback_models',
    'improvements_models',
    'job_models',
    'opportunity_models',
<<<<<<< HEAD
    'question_models',
    'recommendations_models',
=======
>>>>>>> f7a5746a80730753b32b555306f20c55d4023822
    'skill_models',
    'stats_models',
    'story_models',
    'subtopic_models',
    'suggestion_models',
    'topic_models',
    'translation_models',
    'transaction_services',
    'user_models'
]
