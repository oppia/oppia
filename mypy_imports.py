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
datastore and transaction services. So this will be imported in every file
which uses storage models and platform services. This file will be imported only
in mypy checks not during runtime.
"""

from __future__ import annotations

from core.platform.app_identity import (
    gae_app_identity_services as app_identity_services)
from core.platform.auth import firebase_auth_services as platform_auth_services
from core.platform.bulk_email import (
    dev_mode_bulk_email_services as bulk_email_services)
from core.platform.cache import redis_cache_services as memory_cache_services
from core.platform.datastore import (
    cloud_datastore_services as datastore_services)
from core.platform.email import dev_mode_email_services as email_services
from core.platform.search import elastic_search_services as search_services
from core.platform.secrets import cloud_secrets_services as secrets_services
from core.platform.storage import dev_mode_storage_services as storage_services
from core.platform.taskqueue import (
    dev_mode_taskqueue_services as platform_taskqueue_services)
from core.platform.transactions import (
    cloud_transaction_services as transaction_services)
from core.platform.translate import (
    dev_mode_translate_services as translate_services)
from core.storage.activity import gae_models as activity_models
from core.storage.app_feedback_report import (
    gae_models as app_feedback_report_models)
from core.storage.audit import gae_models as audit_models
from core.storage.auth import gae_models as auth_models
from core.storage.base_model import gae_models as base_models
from core.storage.beam_job import gae_models as beam_job_models
from core.storage.blog import gae_models as blog_models
from core.storage.blog_statistics import gae_models as blog_stats_models
from core.storage.classifier import gae_models as classifier_models
from core.storage.classroom import gae_models as classroom_models
from core.storage.collection import gae_models as collection_models
from core.storage.config import gae_models as config_models
from core.storage.email import gae_models as email_models
from core.storage.exploration import gae_models as exp_models
from core.storage.feedback import gae_models as feedback_models
from core.storage.improvements import gae_models as improvements_models
from core.storage.job import gae_models as job_models
from core.storage.learner_group import gae_models as learner_group_models
from core.storage.opportunity import gae_models as opportunity_models
from core.storage.question import gae_models as question_models
from core.storage.recommendations import gae_models as recommendations_models
from core.storage.skill import gae_models as skill_models
from core.storage.statistics import gae_models as stats_models
from core.storage.story import gae_models as story_models
from core.storage.subtopic import gae_models as subtopic_models
from core.storage.suggestion import gae_models as suggestion_models
from core.storage.topic import gae_models as topic_models
from core.storage.translation import gae_models as translation_models
from core.storage.user import gae_models as user_models
from core.storage.voiceover import gae_models as voiceover_models

__all__ = [
    'activity_models',
    'app_feedback_report_models',
    'app_identity_services',
    'audit_models',
    'auth_models',
    'base_models',
    'beam_job_models',
    'blog_models',
    'blog_stats_models',
    'bulk_email_services',
    'classifier_models',
    'classroom_models',
    'collection_models',
    'config_models',
    'datastore_services',
    'email_models',
    'email_services',
    'exp_models',
    'feedback_models',
    'improvements_models',
    'job_models',
    'learner_group_models',
    'memory_cache_services',
    'opportunity_models',
    'platform_auth_services',
    'platform_taskqueue_services',
    'question_models',
    'recommendations_models',
    'search_services',
    'secrets_services',
    'skill_models',
    'stats_models',
    'story_models',
    'storage_services',
    'subtopic_models',
    'suggestion_models',
    'topic_models',
    'translation_models',
    'translate_services',
    'transaction_services',
    'user_models',
    'voiceover_models'
]
