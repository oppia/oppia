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
    """Option class for configuring the behavior of Oppia jobs."""

    def __init__(
            self,
            project=feconf.OPPIA_PROJECT_ID,
            region=feconf.GOOGLE_CLOUD_DATAFLOW_REGION,
            **kwargs):
        """Initializes a new JobOptions instance.

        Args:
            project: str. Name of the Cloud project owning the Dataflow job.
            region: str. The Google Compute Engine region for creating Dataflow
                job.
            **kwargs: dict(str: *). Downstream arguments for PipelineOptions.
        """
        super(JobOptions, self).__init__(
            # TODO(#11475): Figure out what these values should be. We can't run
            # unit tests on DataflowRunner unless they're a valid GCS path.
            temp_location='gs://todo/todo', staging_location='gs://todo/todo',
            project=project, region=region, **kwargs)

    @classmethod
    def _add_argparse_args(cls, parser):
        """Adds Oppia's job-specific arguments to the parser.

        Args:
            parser: argparse.ArgumentParser. An ArgumentParser instance.
        """
        parser.add_argument(
            '--model_getter',
            help='PTransform responsible for getting storage models',
            default=None, type=beam.PTransform)
