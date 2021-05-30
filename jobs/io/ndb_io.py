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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import feconf
from jobs import job_utils

import apache_beam as beam


class _DatastoreioStubPTransform(beam.PTransform):
    """Base class that sets up the datastoreio stub with Python 2 compatibility.

    TODO(#11475): Delete this base class once we can use the real datastoreio
    module with Cloud NDB and Python 3.
    """

    def __init__(self, datastoreio_stub, label=None):
        """Initializes a new instance of _DatastoreioStubPTransform.

        Args:
            datastoreio_stub: stubio.DatastoreioStub. A stub implementation of
                the datastoreio module.
            label: str|None. The label associated with the PTransform.
        """
        super(_DatastoreioStubPTransform, self).__init__(label=label)
        self._datastoreio_stub = datastoreio_stub

    @property
    def datastoreio(self):
        """Returns a datastoreio module capable of interacting with NDB models.

        Returns:
            stubio.DatastoreioStub. A stub implementation of the datastoreio
            module.
        """
        return self._datastoreio_stub


class GetModels(_DatastoreioStubPTransform):
    """Reads NDB models from the datastore using a query."""

    def __init__(self, query, datastoreio_stub, label=None):
        super(GetModels, self).__init__(datastoreio_stub, label=label)
        self._query = job_utils.get_beam_query_from_ndb_query(query)

    def expand(self, pbegin):
        """Returns a PCollection containing the queried models.

        Args:
            pbegin: PCollection. The initial PValue of the pipeline. Used as an
                anchor for attatching to the rest of the pipeline.

        Returns:
            PCollection. The PCollection of models.
        """
        return (
            pbegin
            | ('Reading %r from the datastore' % self._query) >> (
                self.datastoreio.ReadFromDatastore(self._query))
            | ('Transforming %r into NDB models' % self._query) >> (
                beam.Map(job_utils.get_model_from_beam_entity))
        )


class PutModels(_DatastoreioStubPTransform):
    """Writes NDB models to the datastore."""

    def expand(self, model_pcoll):
        """Writes the given models to the datastore.

        Args:
            model_pcoll: PCollection. A PCollection of NDB models.

        Returns:
            PCollection. An empty PCollection.
        """
        return (
            model_pcoll
            | 'Transforming the NDB models into Apache Beam entities' >> (
                beam.Map(job_utils.get_beam_entity_from_model))
            | 'Writing the NDB models to the datastore' >> (
                self.datastoreio.WriteToDatastore(feconf.OPPIA_PROJECT_ID))
        )


class DeleteModels(_DatastoreioStubPTransform):
    """Deletes NDB models from the datastore."""

    def expand(self, model_pcoll):
        """Deletes the given models from the datastore.

        Args:
            model_pcoll: PCollection. The PCollection of NDB models to delete.

        Returns:
            PCollection. An empty PCollection.
        """
        return (
            model_pcoll
            | 'Transforming the NDB keys into Apache Beam keys' >> (
                beam.Map(job_utils.get_beam_key_from_ndb_key))
            | 'Deleting the NDB keys from the datastore' >> (
                self.datastoreio.DeleteFromDatastore(feconf.OPPIA_PROJECT_ID))
        )
