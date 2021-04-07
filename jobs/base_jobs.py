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


class _JobMetaclass(type):
    """Metaclass for all of Oppia's Apache Beam jobs.

    This class keeps track of the complete list of jobs. The list can be read
    with the _JobMetaclass.get_all_jobs() class method.

    THIS CLASS IS AN IMPLEMENTATION DETAIL, DO NOT USE IT DIRECTLY. All user
    code should simply inherit from the JobBase class, found below.
    """

    _JOB_REGISTRY = {}

    def __new__(mcs, name, bases, namespace):
        """Creates a new job class with type `_JobMetaclass`.

        https://docs.python.org/3/reference/datamodel.html#customizing-class-creation

        This metaclass adds jobs to the _JOB_REGISTRY dict, keyed by name, as
        they are created. We use the registry to reject jobs with duplicate
        names and to provide the convenient: _JobMetaclass.get_all_jobs().

        We use a metaclass instead of other alternatives (like decorators or a
        manual list), because metaclasses cannot be forgotten to be used,
        whereas the other alternatives can, and because they do not need help
        from third party linters to be enforced.

        Args:
            mcs: _JobMetaclass. The metaclass.
            name: str. The name of the class.
            bases: tuple(type). The sequence of base classes for the new class.
            namespace: dict(str: *). The namespace of the class. This is where
                the methods, functions, and attributes of the class are kept.

        Returns:
            class. The new class instance.
        """
        job_cls = super(_JobMetaclass, mcs).__new__(mcs, name, bases, namespace)
        if name in mcs._JOB_REGISTRY:
            collision = mcs._JOB_REGISTRY[name]
            raise TypeError('%s name is already used by %s.%s' % (
                name, collision.__module__, name))
        if not name.endswith('Base'):
            mcs._JOB_REGISTRY[job_cls.__name__] = job_cls
        return job_cls

    @classmethod
    def get_all_jobs(mcs):
        """Returns all jobs that have inherited from the JobBase class.

        Args:
            mcs: _JobMetaclass. The metaclass.

        Returns:
            list(class). The classes that have inherited from JobBase.
        """
        return list(mcs._JOB_REGISTRY.values())


class JobBase(python_utils.with_metaclass(_JobMetaclass)):
    """The base class for all of Oppia's Apache Beam jobs.

    Example:
        class CountAllModelsJob(JobBase):
            def run(self):
                return (
                    self.pipeline
                    | self.job_options.model_getter()
                    | beam.GroupBy(job_utils.get_model_kind)
                    | beam.combiners.Count.PerElement()
                )

        options = job_options.JobOptions(model_getter=model_io.GetModels)
        with pipeline.Pipeline(options=options) as p:
            count_all_models_job = CountAllModelsJob(p)
            beam_testing_util.assert_that(
                count_all_models_job.run(),
                beam_testing_util.equal_to([
                    ('BaseModel', 1),
                ]))
    """

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
