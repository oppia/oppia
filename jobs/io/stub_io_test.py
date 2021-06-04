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

"""Unit tests for jobs.io.stub_io."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
import feconf
from jobs import job_test_utils
from jobs import job_utils
from jobs.io import stub_io

import apache_beam as beam

datastore_services = models.Registry.import_datastore_services()

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class DatastoreioStubTests(job_test_utils.PipelinedTestBase):

    def setUp(self):
        super(DatastoreioStubTests, self).setUp()
        self.stub = stub_io.DatastoreioStub()

    def get_everything(self):
        """Returns all models in the datastore.

        Returns:
            list(Model). All of the models in the datastore.
        """
        return list(datastore_services.query_everything().iter())

    def put_multi(self, model_list, update_last_updated_time=False):
        """Puts the given models into the datastore.

        Args:
            model_list: list(Model). The models to put into the datastore.
            update_last_updated_time: bool. Whether to update the last updated
                time before putting the model into storage.
        """
        datastore_services.update_timestamps_multi(
            model_list, update_last_updated_time=update_last_updated_time)
        datastore_services.put_multi(model_list)

    def test_stub_is_initially_empty(self):
        query_everything = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())

        self.assertItemsEqual(self.get_everything(), [])

        with self.stub.context():
            self.assert_pcoll_empty(
                self.pipeline | self.stub.ReadFromDatastore(query_everything))

    def test_read_from_datastore(self):
        query_everything = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.put_multi(model_list)

        with self.stub.context():
            model_pcoll = (
                self.pipeline
                | self.stub.ReadFromDatastore(query_everything)
            )

            self.assert_pcoll_equal(model_pcoll, [
                job_utils.get_beam_entity_from_ndb_model(m) for m in model_list
            ])

    def test_write_to_datastore(self):
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.put_multi(model_list)

        self.assertItemsEqual(self.get_everything(), model_list)

        with self.stub.context():
            model_pcoll = (
                self.pipeline
                | beam.Create([
                    job_utils.get_beam_key_from_ndb_key(m.key)
                    for m in model_list
                ])
            )

            self.assert_pcoll_empty(
                model_pcoll
                | self.stub.DeleteFromDatastore(feconf.OPPIA_PROJECT_ID)
            )

        self.assertItemsEqual(self.get_everything(), [])

    def test_delete_from_datastore(self):
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.put_multi(model_list)

        self.assertItemsEqual(self.get_everything(), model_list)

        with self.stub.context():
            model_pcoll = (
                self.pipeline
                | beam.Create([
                    job_utils.get_beam_key_from_ndb_key(m.key)
                    for m in model_list
                ])
            )

            self.assert_pcoll_empty(
                model_pcoll
                | self.stub.DeleteFromDatastore(feconf.OPPIA_PROJECT_ID)
            )

        self.assertItemsEqual(self.get_everything(), [])

    def test_read_from_datastore_without_acquiring_context_raises_error(self):
        query_everything = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())
        with self.assertRaisesRegexp(RuntimeError, 'Must enter context'):
            self.stub.ReadFromDatastore(query_everything)

    def test_write_to_datastore_without_acquiring_context_raises_error(self):
        with self.assertRaisesRegexp(RuntimeError, 'Must enter context'):
            self.stub.WriteToDatastore(feconf.OPPIA_PROJECT_ID)

    def test_delete_from_datastore_without_acquiring_context_raises_error(self):
        with self.assertRaisesRegexp(RuntimeError, 'Must enter context'):
            self.stub.DeleteFromDatastore(feconf.OPPIA_PROJECT_ID)

    def test_read_after_write_raises_error(self):
        query_everything = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())

        with self.stub.context():
            empty_pcoll = self.pipeline | beam.Create([])

            self.assert_pcoll_empty(
                empty_pcoll
                | self.stub.WriteToDatastore(feconf.OPPIA_PROJECT_ID)
            )

            self.assertRaisesRegexp(
                RuntimeError, 'Cannot read from datastore after a mutation',
                lambda: (
                    self.pipeline
                    | self.stub.ReadFromDatastore(query_everything)
                ))

    def test_read_after_delete_raises_error(self):
        query_everything = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())

        with self.stub.context():
            empty_pcoll = self.pipeline | beam.Create([])

            self.assert_pcoll_empty(
                empty_pcoll
                | self.stub.DeleteFromDatastore(feconf.OPPIA_PROJECT_ID)
            )

            self.assertRaisesRegexp(
                RuntimeError, 'Cannot read from datastore after a mutation',
                lambda: (
                    self.pipeline
                    | self.stub.ReadFromDatastore(query_everything)
                ))
