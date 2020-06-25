# coding: utf-8
#
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

"""Python file with valid syntax, used by scripts/linters/
python_linter_test. This file contains valid one_off_jobs.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import collection_services
from core.platform import models

(base_models, collection_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection])


class CollectionMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate collection schema
    versions. This job will load all existing collections from the data store
    and immediately store them back into the data store. The loading process of
    a collection in collection_services automatically performs schema updating.
    This job persists that conversion work, keeping collections up-to-date and
    improving the load time of new collections.
    """

    _DELETED_KEY = 'collection_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'collection_migrated'
