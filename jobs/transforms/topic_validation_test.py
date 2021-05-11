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

"""Unit tests for jobs.transforms.topic_validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
from jobs import job_test_utils
from jobs.transforms import topic_validation
from jobs.types import topic_validation_errors

import apache_beam as beam

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class ValidateCanonicalNameMatchesNameInLowercaseTests(
        job_test_utils.PipelinedTestBase):

    NOW = datetime.datetime.utcnow()

    def test_process_for_not_matching_canonical_name(self):
        model_with_different_name = topic_models.TopicModel(
            id='123',
            name='name',
            created_on=self.NOW,
            last_updated=self.NOW,
            url_fragment='name-two',
            canonical_name='canonical_name',
            next_subtopic_id=1,
            language_code='en',
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        output = (
            self.pipeline
            | beam.Create([model_with_different_name])
            | beam.ParDo(
                topic_validation.ValidateCanonicalNameMatchesNameInLowercase())
        )
        self.assert_pcoll_equal(output, [
            topic_validation_errors.ModelCanonicalNameMismatchError(
                model_with_different_name)
        ])

    def test_process_for_matching_canonical_name(self):
        model_with_same_name = topic_models.TopicModel(
            id='123',
            name='SOMEthing',
            created_on=self.NOW,
            last_updated=self.NOW,
            url_fragment='name-two',
            canonical_name='something',
            next_subtopic_id=1,
            language_code='en',
            subtopic_schema_version=0,
            story_reference_schema_version=0
        )
        output = (
            self.pipeline
            | beam.Create([model_with_same_name])
            | beam.ParDo(
                topic_validation.ValidateCanonicalNameMatchesNameInLowercase())
        )
        self.assert_pcoll_equal(output, [])
