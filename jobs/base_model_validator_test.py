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
from apache_beam.runners.direct.direct_runner import DirectRunner
from apache_beam.testing import util as beam_testing_util
from apache_beam.testing.test_pipeline import TestPipeline


from core.platform import models
from jobs import base_model_validator
from jobs import base_model_validator_errors as errors

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class MockModel(base_models.BaseModel):
    pass


class BaseValidatorDoFnTests(unittest.TestCase):
    def setUp(self):
        self.base_validator_fn = base_model_validator.BaseValidatorDoFn()

    def test_clone(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = self.base_validator_fn.clone(model)

        self.assertEqual(model.id, clone.id)
        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)

    def test_clone_with_changes(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = self.base_validator_fn.clone(model, deleted=False)

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
        clone = self.base_validator_fn.clone(model)

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
        clone = self.base_validator_fn.clone(model, field='updated')

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, DerivedModel)
        self.assertEqual(model.field, 'original')
        self.assertEqual(clone.field, 'updated')


class BaseModelValidatorTests(unittest.TestCase):

    def setUp(self):
        self.now = datetime.datetime.utcnow()
        self.year_ago = (
            datetime.datetime.utcnow() - datetime.timedelta(weeks=52))
        self.year_later = (
            datetime.datetime.utcnow() + datetime.timedelta(weeks=52))

    def test_validate_deleted_reports_error_for_old_deleted_model(self):

        with TestPipeline(runner=DirectRunner()) as p:
            test_model = MockModel(
                id='123',
                deleted=True,
                created_on=self.year_ago,
                last_updated=self.year_ago
            )
            pcoll = p | beam.Create([test_model])

            output = (pcoll | beam.ParDo(
                base_model_validator.ValidateDeleted()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.StaleDeletedModelValidationError(test_model)
                ])
            )

    def test_validate_model_time_field_check(self):
        with TestPipeline(runner=DirectRunner()) as p:
            test_model = MockModel(
                id='123',
                created_on=self.now,
                last_updated=self.year_ago
            )
            pcoll = p | beam.Create([test_model])

            output = (pcoll | beam.ParDo(
                base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.TimeFieldModelValidationError(test_model)
                ])
            )

    def test_validate_model_current_time_check(self):
        with TestPipeline(runner=DirectRunner()) as p:
            test_model = MockModel(
                id='124',
                created_on=self.now,
                last_updated=self.year_later
            )
            pcoll = p | beam.Create([test_model])

            output = (pcoll | beam.ParDo(
                base_model_validator.ValidateModelTimeFields()))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.CurrentTimeModelValidationError(test_model)
                ])
            )

    def test_validate_model_id(self):
        with TestPipeline(runner=DirectRunner()) as p:
            test_model = MockModel(
                id='123@?!*',
                created_on=self.year_ago,
                last_updated=self.now
            )
            pcoll = p | beam.Create([test_model])

            output = (pcoll | beam.ParDo(
                base_model_validator.ValidateModelIdWithRegex(
                    '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH)))

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.IdModelValidationError(test_model)
                ])
            )

    def test_base_model_validator_ptransform(self):
        with TestPipeline(runner=DirectRunner()) as p:
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
            pcoll = p | beam.Create([
                invalid_id, invalid_time_check, stale_deletion, valid_model
            ])

            output = pcoll | base_model_validator.BaseModelValidator()

            beam_testing_util.assert_that(
                output,
                beam_testing_util.equal_to([
                    errors.IdModelValidationError(invalid_id),
                    errors.CurrentTimeModelValidationError(invalid_time_check),
                    errors.StaleDeletedModelValidationError(stale_deletion)
                ]),
                label='CheckOutput'
            )
