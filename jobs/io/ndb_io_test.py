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

from core.platform import models
from jobs import job_test_utils
from jobs.io import ndb_io
from jobs.io import stub_io

import apache_beam as beam

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()


class NdbIoTests(job_test_utils.PipelinedTestBase):

    def setUp(self):
        super(NdbIoTests, self).setUp()
        self.datastoreio_stub = stub_io.DatastoreioStub()

    def tearDown(self):
        datastore_services.delete_multi(
            datastore_services.query_everything().iter(keys_only=True))
        super(NdbIoTests, self).tearDown()

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

    def test_read_from_datastore(self):
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.put_multi(model_list)

        self.assertItemsEqual(self.get_everything(), model_list)

        with self.datastoreio_stub.context():
            model_pcoll = (
                self.pipeline
                | ndb_io.GetModels(
                    datastore_services.query_everything(),
                    self.datastoreio_stub)
            )
            self.assert_pcoll_equal(model_pcoll, model_list)

    def test_write_to_datastore(self):
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]

        self.assertItemsEqual(self.get_everything(), [])

        with self.datastoreio_stub.context():
            self.assert_pcoll_empty(
                self.pipeline
                | beam.Create(model_list)
                | ndb_io.PutModels(self.datastoreio_stub)
            )

        self.assertItemsEqual(self.get_everything(), model_list)

    def test_delete_from_datastore(self):
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.put_multi(model_list)

        self.assertItemsEqual(self.get_everything(), model_list)

        with self.datastoreio_stub.context():
            self.assert_pcoll_empty(
                self.pipeline
                | beam.Create([model.key for model in model_list])
                | ndb_io.DeleteModels(self.datastoreio_stub)
            )

        self.assertItemsEqual(self.get_everything(), [])
