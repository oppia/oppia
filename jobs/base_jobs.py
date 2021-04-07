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

Pipelines manage a DAG (directed acyclic graph) of PValues and the PTransforms
that compute them. Conceptually, PValues are the DAG's nodes and PTransforms are
the edges.

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
including unbounded/continuous datasets. They are the primary input and output
types used by PTransforms.

Runners provide a run() method for visiting every node (PValue) in the
pipeline's DAG by executing the edges (PTransforms) to compute their values. At
Oppia, we use DataflowRunner() to have our Pipelines run on the Google Cloud
Dataflow service: https://cloud.google.com/dataflow.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs import job_options
import python_utils


class JobMetaclass(type):
    """Metaclass for all of Oppia's Apache Beam jobs.

    This class keeps track of the complete list of jobs. The list can be read
    with the JobMetaclass.get_jobs() class method.
    """

    _JOB_REGISTRY = {}

    def __new__(mcs, name, bases, namespace):
        """Creates a new class with type `AuditDoFnMetaclass`.

        https://docs.python.org/3/reference/datamodel.html#customizing-class-creation

        This metaclass adds jobs to the job registry as they are created to
        ensure there are no jobs with duplicate names and to provide a
        convenient place to query for the full list of all jobs:
        JobMetaclass.get_jobs().

        Args:
            mcs: JobMetaclass. The metaclass.
            name: str. The name of the class.
            bases: tuple(type). The sequence of base classes for the new class.
            namespace: dict(str: *). The namespace of the class. This is where
                the methods, functions, and attributes of the class are kept.

        Returns:
            class. The new class instance.
        """
        job_cls = super(JobMetaclass, mcs).__new__(mcs, name, bases, namespace)
        if name in mcs._JOB_REGISTRY:
            collision = mcs._JOB_REGISTRY[name]
            raise TypeError('%s name is already used by %s.%s' % (
                name, collision.__module__, name))
        if not name.endswith('Base'):
            mcs._JOB_REGISTRY[job_cls.__name__] = job_cls
        return job_cls

    @classmethod
    def get_jobs(mcs):
        """Returns all jobs that have inherited from the JobBase class.

        Args:
            mcs: JobMetaclass. The metaclass.

        Returns:
            dict(str: class). The classes that have been created with this
            metaclass, keyed by their name.
        """
        return dict(mcs._JOB_REGISTRY)


class JobBase(python_utils.with_metaclass(JobMetaclass)):
    """The base class for all of Oppia's Apache Beam jobs."""

    def __init__(self, pipeline):
        """Initializes a new job.

        Args:
            pipeline: beam.Pipeline. The pipeline that manages the job.
        """
        self.pipeline = pipeline
        self.job_options = self.pipeline.options.view_as(job_options.JobOptions)

    def run(self):
        """Runs PTransforms with self.pipeline to compute/process PValues.

        Raises:
            NotImplementedError. Needs to be overridden by a subclass.
        """
        raise NotImplementedError('Subclasses must implement the run() method')
