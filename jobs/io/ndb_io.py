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

"""Provides an Apache Beam API for operating on NDB models."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core.platform import models
import feconf

import apache_beam as beam
from apache_beam.io.gcp.datastore.v1new import datastoreio

datastore_services = models.Registry.import_datastore_services()


@beam.typehints.with_input_types(beam.pvalue.PBegin)
@beam.typehints.with_output_types(datastore_services.Model)
class GetModels(beam.PTransform):
    """Reads NDB models from the datastore using a query."""

    def __init__(self, query, label=None):
        """Initializes the GetModels PTransform.

        Args:
            query: datastore_services.Query. The query used to fetch models.
            label: str|None. The label of the PTransform.
        """
        super(GetModels, self).__init__(label=label)
        self.query = query

    def expand(self, initial_pipeline):
        """Returns a PCollection with models matching the corresponding query.

        This overrides the expand() method from the parent class.

        Args:
            initial_pipeline: PValue. The initial pipeline. This pipeline
                is used to anchor the models to itself.

        Returns:
            PCollection. The PCollection of models.
        """
        from jobs import job_utils

        query = job_utils.get_beam_query_from_ndb_query(
            self.query, namespace=initial_pipeline.pipeline.options.namespace)
        return (
            initial_pipeline.pipeline
            | 'Reading %r from the datastore' % self.query >> (
                datastoreio.ReadFromDatastore(query))
            | 'Transforming %r into NDB models' % self.query >> (
                beam.Map(job_utils.get_ndb_model_from_beam_entity))
        )


@beam.typehints.with_input_types(datastore_services.Model)
@beam.typehints.with_output_types(beam.pvalue.PDone)
class PutModels(beam.PTransform):
    """Writes NDB models to the datastore."""

    @staticmethod
    def test(input):
        print(input)
        return input

    def expand(self, entities):
        """Writes the given models to the datastore.

        This overrides the expand() method from the parent class.

        Args:
            entities: PCollection. A PCollection of NDB models to write
                to the datastore. Can also contain just one model.

        Returns:
            PCollection. An empty PCollection. This is needed because all
            expand() methods need to return some PCollection.
        """
        from jobs import job_utils

        return (
            entities
            | 'Transforming the NDB models into Apache Beam entities' >> (
                beam.Map(job_utils.get_beam_entity_from_ndb_model))
            | 'Writing the NDB models to the datastore' >> (
                datastoreio.WriteToDatastore(feconf.OPPIA_PROJECT_ID))
        )


@beam.typehints.with_input_types(datastore_services.Key)
@beam.typehints.with_output_types(beam.pvalue.PDone)
class DeleteModels(beam.PTransform):
    """Deletes NDB models from the datastore."""

    def expand(self, entities):
        """Deletes the given models from the datastore.

        This overrides the expand() method from the parent class.

        Args:
            entities: PCollection. The PCollection of NDB keys to delete
                from the datastore. Can also contain just one model.

        Returns:
            PCollection. An empty PCollection. This is needed because all
            expand() methods need to return some PCollection.
        """
        from jobs import job_utils

        return (
            entities
            | 'Transforming the NDB keys into Apache Beam keys' >> (
                beam.Map(job_utils.get_beam_key_from_ndb_key))
            | 'Deleting the NDB keys from the datastore' >> (
                datastoreio.DeleteFromDatastore(feconf.OPPIA_PROJECT_ID))
        )
