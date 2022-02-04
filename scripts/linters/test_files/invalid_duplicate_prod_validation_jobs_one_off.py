# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Python file with invalid syntax, used by scripts/linters/
python_linter_test. This file contain duplicate prod one validation job.
"""

from __future__ import annotations

import collections

from core.platform import models

(user_models,) = (models.Registry.import_models([models.Names.USER]))
datastore_services = models.Registry.import_datastore_services()


class BaseModelValidator:
    errors = collections.defaultdict(list)
    external_instance_details = {}


class BaseUserModelValidator(BaseModelValidator):
    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^\\d+$'


class PendingDeletionRequestModelValidator(BaseUserModelValidator):
    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}


MODEL_TO_VALIDATOR_MAPPING = {
    user_models.PendingDeletionRequestModel: (
        PendingDeletionRequestModelValidator)
}


class ProdValidationAuditOneOffJobMetaClass(type):
    _MODEL_AUDIT_ONE_OFF_JOB_NAMES = set()
