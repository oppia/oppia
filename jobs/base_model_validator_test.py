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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import unittest

import apache_beam as beam
from apache_beam.runners.direct import direct_runner
from apache_beam.testing import util as beam_testing_util
from apache_beam.testing import test_pipeline


from core.platform import models
from jobs import base_model_validator
from jobs import base_model_validator_errors as errors

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class MockModel(base_models.BaseModel):
    pass


class BaseValidatorErrorTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime.datetime.utcnow()
        self.year_ago = self.now - datetime.timedelta(weeks=52)
        self.year_later = self.now + datetime.timedelta(weeks=52)

    def test_model_timestamp_relationship_error(self):
        model = MockModel(
            id='123',
            created_on=self.now,
            last_updated=self.year_ago
        )
        error = errors.ModelTimestampRelationshipError(model)

        msg = (
            'Entity ID %s: The created_on field has a value %s which '
            'is greater than the value %s of last_updated field'
            % (model.id, model.created_on, model.last_updated))
        assert error.message == msg

    def test_model_mutated_during_job_error(self):
        model = MockModel(
            id='124',
            created_on=self.now,
            last_updated=self.year_later
        )
        error = errors.ModelMutatedDuringJobError(model)

        msg = (
            'Entity id %s: The last_updated field has a value %s which '
            'is greater than the time when the job was run'
            % (model.id, model.last_updated))

        assert error.message == msg

    def test_model_invalid_id_error(self):
        model = MockModel(
            id='123@?!*',
            created_on=self.year_ago,
            last_updated=self.now
        )
        error = errors.ModelInvalidIdError(model)

        msg = (
            'Entity id %s: Entity id does not match regex pattern'
            % (model.id))

        assert error.message == msg

    def test_model_expired_error(self):
        model = MockModel(
            id='123',
            deleted=True,
            created_on=self.year_ago,
            last_updated=self.year_ago
        )

        error = errors.ModelExpiredError(model)

        msg = (
            'Entity id %s: model marked as deleted is older than %s days'
            % (model.id, errors.PERIOD_TO_HARD_DELETE_MODEL_IN_DAYS))

        assert error.message == msg


class BaseValidatorDoFnTests(unittest.TestCase):
    def setUp(self):
        self.base_validator_fn = base_model_validator.BaseValidatorDoFn()

    def test_clone_model(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = self.base_validator_fn.clone_model(model)

        self.assertEqual(model.id, clone.id)
        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)

    def test_clone_with_changes(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = self.base_validator_fn.clone_model(model, deleted=False)

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)
        self.assertTrue(model.deleted)
        self.assertFalse(clone.deleted)

    def test_clone_sub_class(self):
        class DerivedModel(base_models.BaseModel):
            """Simple model with an extra 'field' string property."""

            field = datastore_services.StringProperty()

        model = DerivedModel(id='123', field='original')
        clone = self.base_validator_fn.clone_model(model)

        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, DerivedModel)
        self.assertEqual(model.field, 'original')
        self.assertEqual(clone.field, 'original')

    def test_clone_sub_class_with_changes(self):
        class DerivedModel(base_models.BaseModel):
            """Simple model with an extra 'field' string property."""

            field = datastore_services.StringProperty()

        model = DerivedModel(id='123', field='original')
        clone = self.base_validator_fn.clone_model(model, field='updated')

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, DerivedModel)
        self.assertEqual(model.field, 'original')
        self.assertEqual(clone.field, 'updated')


class BaseModelValidatorTests(unittest.TestCase):

    def setUp(self):
        self.now = datetime.datetime.utcnow()
        self.year_ago = self.now - datetime.timedelta(weeks=52)
        self.year_later = self.now + datetime.timedelta(weeks=52)

    def test_validate_deleted_reports_error_for_old_deleted_model(self):

        with test_pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            test_model = MockModel(
                id='123',
                deleted=True,
                created_on=self.year_ago,
                last_updated=self.year_ago
            )
            pcoll = p | beam.Create([test_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateDeleted()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelExpiredError(test_model)
                ])
            )

    def test_validate_model_time_field_check(self):
        with test_pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            test_model = MockModel(
                id='123',
                created_on=self.now,
                last_updated=self.year_ago
            )
            pcoll = p | beam.Create([test_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelTimestampRelationshipError(test_model)
                ])
            )

    def test_validate_model_current_time_check(self):
        with test_pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            test_model = MockModel(
                id='124',
                created_on=self.now,
                last_updated=self.year_later
            )
            pcoll = p | beam.Create([test_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelMutatedDuringJobError(test_model)
                ])
            )

    def test_validate_model_id(self):
        with test_pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            test_model = MockModel(
                id='123@?!*',
                created_on=self.year_ago,
                last_updated=self.now
            )
            pcoll = p | beam.Create([test_model])

            output = (
                pcoll
                | beam.ParDo(
                    base_model_validator.ValidateModelIdWithRegex(
                        '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH)))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidIdError(test_model)
                ])
            )

    def test_base_model_validator_ptransform(self):
        with test_pipeline.TestPipeline(runner=direct_runner.DirectRunner()) as p:
            invalid_id = MockModel(
                id='123@?!*',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now
            )
            invalid_time_check = MockModel(
                id='124',
                deleted=False,
                created_on=self.now,
                last_updated=self.year_later
            )
            stale_deletion = MockModel(
                id='123',
                deleted=True,
                created_on=self.year_ago,
                last_updated=self.year_ago
            )
            valid_model = MockModel(
                id='123',
                deleted=False,
                created_on=self.year_ago,
                last_updated=self.now
            )
            pcoll = (
                p
                | beam.Create([
                    invalid_id, invalid_time_check, stale_deletion, valid_model
                ])
            )

            output = pcoll | base_model_validator.BaseModelValidator()

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.ModelInvalidIdError(invalid_id),
                    errors.ModelMutatedDuringJobError(invalid_time_check),
                    errors.ModelExpiredError(stale_deletion)
                ]),
            )
