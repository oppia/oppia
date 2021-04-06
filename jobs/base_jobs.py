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

"""Base classes for all of Oppia's Apache Beam jobs.

Jobs are composed of the following components:
    - Pipelines
    - PTransforms
    - PValues/PCollections
    - Runners

Pipelines manage a DAG (directed acyclic graph) of PValues and the
PTransforms that compute them. Conceptually, PValues are the DAG's nodes and
PTransforms are the edges.

For example:

    .------------. io.ReadFromText(fname) .-------. FlatMap(str.split)
    | Input File | ---------------------> | Lines | -----------------.
    '------------'                        '-------'                  |
                                                                     |
       .----------------. combiners.Count.PerElement() .-------.     |
    .- | (word, count)s | <--------------------------- | Words | <---'
    |  '----------------'                              '-------'
    |
    | MapTuple(lambda word, count: '%s: %d' % (word, count)) .------------.
    '------------------------------------------------------> | "word: #"s |
                                                             '------------'
                                                                    |
                             .-------------. io.WriteToText(ofname) |
                             | Output File | <----------------------'
                             '-------------'

PCollections are PValues that represent a dataset of (virtually) any size,
including unbounded/continuous datasets. They are the primary input and
output types used by PTransforms.

Runners provide a run() method for visiting every node (PValue) in the
pipeline's DAG by executing the edges (PTransforms) to compute their values.
At Oppia, we use DataflowRunner() to have our Pipelines run on the Google
Cloud Dataflow service: https://cloud.google.com/dataflow.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import functools

from jobs import job_options
import python_utils


class JobMetaclass(type):
    """Metaclass for all of Oppia's Apache Beam jobs.

    This class keeps track of the complete list of jobs. The list can be read
    with the JobMetaclass.get_jobs() class method.
    """

    _JOB_REGISTRY = []

    def __new__(mcs, name, bases, namespace):
        """Creates a new class with type: AuditDoFnMetaclass.

        https://docs.python.org/3/reference/datamodel.html#customizing-class-creation

        Args:
            mcs: JobMetaclass. The metaclass.
            name: str. The name of the class.
            bases: tuple(type). The sequence of base classes for the new class.
            namespace: dict(str: *). The namespace of the class. This is where
                methods, functions, and attributes on the class are stored.

        Returns:
            class. A new class with type: JobMetaclass.

        Raises:
            TypeError. If the new would-be class does not have a run() method.
        """
        run_impl = namespace.pop('run', None)
        if run_impl is None:
            raise TypeError('Jobs must define run() method')

        @functools.wraps(run_impl)
        def run_with_pipeline_context(self, *args, **kwargs):
            """Decorates run() to enter the pipeline context before starting."""
            with self.pipeline:
                return run_impl(self, *args, **kwargs)
        namespace['run'] = run_with_pipeline_context

        # NOTE: type.__new__ is a static function.
        job_cls = type.__new__(mcs, name, bases, namespace)
        if not name.endswith('Base'):
            mcs._JOB_REGISTRY.append(job_cls)
        return job_cls

    @classmethod
    def get_jobs(mcs):
        """Returns all jobs that have inherited from the JobBase class.

        Args:
            mcs: JobMetaclass. The metaclass.

        Returns:
            list(class). The classes that have been created with this metaclass.
        """
        return list(mcs._JOB_REGISTRY)


class JobBase(python_utils.with_metaclass(JobMetaclass)):
    """The base class for all of Oppia's Apache Beam jobs."""

    def __init__(self, pipeline, runner, options):
        """Initializes a new job.

        Args:
            pipeline: type(beam.Pipeline). The type of pipeline that will be
                used to manage the job.
            runner: type(PipelineRunner). The type of runner that will be used
                to execute the pipeline.
            options: JobOptions. Configuration options for the job.
        """
        self.pipeline = pipeline(runner=runner, options=options)
        self.job_options = options.view_as(job_options.JobOptions)

    def run(self):
        """Runs PTransforms with self.pipeline to compute/process PValues.

        Raises:
            NotImplementedError. Needs to be overridden by a subclass.
        """
        raise NotImplementedError('Subclasses must implement the run() method')
