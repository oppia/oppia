# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.base_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs_registry
from core.domain import base_validators
from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class MockModel(base_models.BaseModel):
    pass


class MockSnapshotModel(base_models.BaseModel):
    commit_type = 'edit'
    commit_cmds = []


class MockBaseModelValidator(base_validators.BaseModelValidator):
    pass


class MockSummaryModelValidator(
        base_validators.BaseSummaryModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []


class MockSnapshotContentModelValidator(
        base_validators.BaseSnapshotContentModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []


class MockSnapshotMetadataModelValidator(
        base_validators.BaseSnapshotMetadataModelValidator):

    EXTERNAL_MODEL_NAME = 'external model'
    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_validators.ExternalModelFetcherDetails(
                'external_model_ids', MockModel, [])]


class MockBaseUserModelValidator(
        base_validators.BaseUserModelValidator):

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class BaseValidatorTests(test_utils.GenericTestBase):

    def setUp(self):
        super(BaseValidatorTests, self).setUp()
        self.item = MockModel(id='mockmodel')
        self.item.put()

    def test_error_is_raised_if_fetch_external_properties_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            r'The _get_external_id_relationships\(\) method is missing from the'
            ' derived class. It should be implemented in the derived class.'):
            MockBaseModelValidator().validate(self.item)

    def test_error_is_get_external_model_properties_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            r'The _get_external_model_properties\(\) method is missing from the'
            ' derived class. It should be implemented in the derived class.'):
            MockSummaryModelValidator().validate(self.item)

    def test_error_is_raised_if_external_model_name_is_undefined(self):
        with self.assertRaisesRegexp(
            Exception, 'External model name should be specified'):
            MockSnapshotContentModelValidator().validate(self.item)

    def test_error_is_raised_if_get_change_domain_class_is_undefined(self):
        with self.assertRaisesRegexp(
            NotImplementedError,
            r'The _get_change_domain_class\(\) method is missing from the '
            'derived class. It should be implemented in the derived class.'):
            snapshot_model = MockSnapshotModel(id='mockmodel')
            snapshot_model.put()
            MockSnapshotMetadataModelValidator().validate(snapshot_model)

    def test_error_is_raised_if_entity_classes_to_map_over_is_undefined(self):
        job_class = (
            prod_validation_jobs_one_off.ProdValidationAuditOneOffJob)
        with self.assertRaisesRegexp(
            NotImplementedError,
            r'The entity_classes_to_map_over\(\) method is missing from the '
            'derived class. It should be implemented in the derived class.'):
            with self.swap(jobs_registry, 'ONE_OFF_JOB_MANAGERS', [job_class]):
                job_id = job_class.create_new()
                job_class.enqueue(job_id)

    def test_no_error_is_raised_for_base_user_model(self):
        user = MockModel(id='12345')
        user.put()
        MockBaseUserModelValidator().validate(user)
