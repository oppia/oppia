# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core/domain/cron_services.py."""

from __future__ import annotations

import datetime

from core import feconf
from core.tests import test_utils
from core.domain import cron_services
from core.platform import models

(base_models,) = models.Registry.import_models([
    models.NAMES.base_model])

class CronServicesTests(test_utils.GenericTestBase):
    """Unit tests for core/domain/cron_services.py."""

    def test_delete_models_marked_as_deleted(self) -> None:
        model1 = base_models.BaseModel()
        model1.created_on = datetime.datetime.utcnow() - (
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED)
        model1.last_updated = model1.created_on
        model1.deleted = True
        
        swap_get_all_storage_model_class = self.swap(
            models.Registry, 'get_all_storage_model_classes', lambda: [model1])
        with swap_get_all_storage_model_class:
            cron_services.delete_models_marked_as_deleted()

