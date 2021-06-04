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
from jobs.io import stub_io

from apache_beam.options import pipeline_options


def validate_datastoreio_stub(obj):
    """Asserts that the given object is an instance of DatastoreioStub.

    Args:
        obj: *. The object to validate.

    Returns:
        DatastoreioStub. The validated object, unchanged.

    Raises:
        TypeError. The object is not an instance of DatastoreioStub.
    """
    if not isinstance(obj, stub_io.DatastoreioStub):
        raise TypeError('obj=%r is not an instance of DatastoreioStub' % obj)
    return obj


class JobOptions(pipeline_options.GoogleCloudOptions):
    """Option class for configuring the behavior of Oppia jobs."""

    JOB_OPTIONS = {
        # TODO(#11475): Delete this option once we're able to use the real
        # datastoreio module once we've finished migrating to Python 3.
        'datastoreio_stub': (
            validate_datastoreio_stub,
            'Source of datastore operations for the pipeline to depend upon'),
    }

    def __init__(self, flags=None, **job_options):
        """Initializes a new JobOptions instance.

        Args:
            flags: dict(str:str)|None. Command-line flags for customizing a
                pipeline. Although Oppia doesn't use command-line flags to
                control jobs or pipelines, we still need to pass the value
                (unmodified) because PipelineOptions, a parent class, needs it.
            **job_options: dict(str: *). One of the options defined in the class
                JOB_OPTIONS dict.
        """
        unsupported_options = set(job_options).difference(self.JOB_OPTIONS)
        if unsupported_options:
            unsupported_options = ', '.join(sorted(unsupported_options))
            raise ValueError('Unsupported option(s): %s' % unsupported_options)
        super(JobOptions, self).__init__(
            # Needed by PipelineOptions superclass.
            flags=flags,
            # Needed by GoogleCloudOptions superclass.
            project=feconf.OPPIA_PROJECT_ID,
            region=feconf.GOOGLE_APP_ENGINE_REGION,
            # TODO(#11475): Figure out what these values should be. We can't run
            # unit tests on DataflowRunner unless they have a valid GCS path.
            temp_location='gs://todo/todo', staging_location='gs://todo/todo',
            **job_options)

    @classmethod
    def _add_argparse_args(cls, parser):
        """Adds Oppia's job-specific arguments to the parser.

        Args:
            parser: argparse.ArgumentParser. An ArgumentParser instance.
        """
        for option_name, (option_type, option_doc) in cls.JOB_OPTIONS.items():
            parser.add_argument(
                '--%s' % option_name, help=option_doc, type=option_type)
