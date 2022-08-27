# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for topic model validator errors."""

from __future__ import annotations

from core.jobs.types import base_validation_errors_test
from core.jobs.types import topic_validation_errors
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import topic_models

(topic_models,) = models.Registry.import_models([models.Names.TOPIC])

datastore_services = models.Registry.import_datastore_services()


class ModelCanonicalNameMismatchErrorTests(
        base_validation_errors_test.AuditErrorsTestBase):

    def test_message(self) -> None:
        model = topic_models.TopicModel(
            id='test',
            name='name',
            url_fragment='name-two',
            canonical_name='canonical_name',
            next_subtopic_id=1,
            language_code='en',
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        error = topic_validation_errors.ModelCanonicalNameMismatchError(model)

        self.assertEqual(
            error.stderr,
            'ModelCanonicalNameMismatchError in TopicModel(id="test"): '
            'Entity name %s in lowercase does not match canonical name %s' %
            (model.name, model.canonical_name))
