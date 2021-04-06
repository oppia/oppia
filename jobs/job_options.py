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

"""Option class for configuring the behavior of Oppia jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import feconf

import apache_beam as beam
from apache_beam.options import pipeline_options


class JobOptions(pipeline_options.GoogleCloudOptions):
    """Option class for configuring the behavior of Oppia jobs.

    Instances of this class should only change the arguments created in the
    `_add_argparse_args` method:
        model_getter: type(PTransform). The type of PTransform the pipeline
            should use to fetch models from the datastore.
    """

    def __init__(self, model_getter=None, **kwargs):
        """Initializes a new JobOptions instance.

        Args:
            model_getter: type(PTransform). The type of PTransform the pipeline
                should use to fetch models from the datastore.
            **kwargs: dict(str: *). Downstream arguments for the base classes.
        """
        super(JobOptions, self).__init__(
            project=feconf.OPPIA_PROJECT_ID,
            region=feconf.GOOGLE_APP_ENGINE_REGION,
            # TODO(#11475): Figure out what these values should be. We can't run
            # unit tests on DataflowRunner unless they have a valid GCS path.
            temp_location='gs://todo/todo', staging_location='gs://todo/todo',
            project=project, region=region, **kwargs)

    @classmethod
    def _add_argparse_args(cls, parser):
        """Adds Oppia's job-specific arguments to the parser.

        Args:
            parser: argparse.ArgumentParser. An ArgumentParser instance.
        """
        parser.add_argument(
            '--model_getter', help=(
                'The type of PTransform the pipeline should use to fetch '
                'models from the datastore.'),
            # TODO(#11475): Assign a proper default value after we have access
            # to Cloud NDB PTransforms.
            type=beam.PTransform)
