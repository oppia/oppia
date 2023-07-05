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

from __future__ import annotations

import argparse
from core import feconf

from apache_beam.options import pipeline_options

from typing import List, Optional


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PipelineOptions class is of type Any. Thus to avoid MyPy's
# error (Class cannot subclass 'PipelineOptions' (has type 'Any')), we
# added an ignore here.
class JobOptions(pipeline_options.PipelineOptions): # type: ignore[misc]
    """Option class for configuring the behavior of Oppia jobs."""

    JOB_OPTIONS = {
        'namespace': (
            str, 'Namespace for isolating the NDB operations during tests.'),
    }

    def __init__(
        self,
        flags: Optional[List[str]] = None,
        **job_options: Optional[str]
    ) -> None:
        """Initializes a new JobOptions instance.

        Args:
            flags: list(str)|None. Command-line flags for customizing a
                pipeline. Although Oppia doesn't use command-line flags to
                control jobs or pipelines, we still need to pass the value
                (unmodified) because PipelineOptions, a parent class, needs it.
            **job_options: dict(str: *). One of the options defined in the class
                JOB_OPTIONS dict.

        Raises:
            ValueError. Unsupported job option(s).
        """
        unsupported_options = set(job_options).difference(self.JOB_OPTIONS)
        if unsupported_options:
            joined_unsupported_options = ', '.join(sorted(unsupported_options))
            raise ValueError(
                'Unsupported option(s): %s' % joined_unsupported_options)
        super().__init__(
            # Needed by PipelineOptions.
            flags=flags,
            # Needed by GoogleCloudOptions.
            project=feconf.OPPIA_PROJECT_ID,
            region=feconf.GOOGLE_APP_ENGINE_REGION,
            temp_location=feconf.DATAFLOW_TEMP_LOCATION,
            staging_location=feconf.DATAFLOW_STAGING_LOCATION,
            # The 'use_runner_v2' is used since some of our jobs require
            # the v2 of the runner. See the docs:
            # https://cloud.google.com/dataflow/docs/guides/deploying-a-pipeline#dataflow-runner-v2
            # The 'enable_recommendations' is used since we want to receive
            # recommendations for our jobs. These can be viewed through
            # the Dataflow dashboard that is available to the Oppia admins.
            experiments=['use_runner_v2', 'enable_recommendations'],
            extra_packages=[feconf.OPPIA_PYTHON_PACKAGE_PATH],
            **job_options)

    @classmethod
    def _add_argparse_args(cls, parser: argparse.ArgumentParser) -> None:
        """Adds Oppia's job-specific arguments to the parser.

        Args:
            parser: argparse.ArgumentParser. An ArgumentParser instance.
        """
        for option_name, (option_type, option_doc) in cls.JOB_OPTIONS.items():
            parser.add_argument(
                '--%s' % option_name, help=option_doc, type=option_type)
