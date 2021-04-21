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

"""Tests for machine translation models validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils

datastore_services = models.Registry.import_datastore_services()

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


class MachineTranslationModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(MachineTranslationModelValidatorTests, self).setUp()
        translation_models.MachineTranslationModel.create(
            'en', 'es', 'hello world', 'hola mundo')
        self.job_class = (
            prod_validation_jobs_one_off
            .MachineTranslationModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated MachineTranslationModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)
