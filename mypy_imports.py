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

"""Files having imports from storage and platform for mypy checks."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.datastore import gae_datastore_services as datastore_services
from core.platform.transactions import gae_transaction_services as transaction_services # pylint: disable=line-too-long

from core.storage.activity import gae_models as activity_models
from core.storage.app_feedback_report import gae_models as app_feedback_report_models # pylint: disable=line-too-long
from core.storage.audit import gae_models as audit_models
from core.storage.auth import gae_models as auth_models
from core.storage.base_model import gae_models as base_models
from core.storage.blog import gae_models as blog_models
from core.storage.user import gae_models as user_models

__all__ = [
    b'activity_models',
    b'app_feedback_report_models',
    b'audit_models',
    b'auth_models',
    b'base_models',
    b'blog_models',
    b'datastore_services',
    b'transaction_services',
    b'user_models'
]
