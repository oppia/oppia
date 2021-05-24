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

    def test_stub_is_initially_empty(self):
        query = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())

        self.assertItemsEqual(self.stub.get(query), [])

        with self.stub.context():
            self.assert_pcoll_empty(
                self.pipeline | self.stub.ReadFromDatastore(query))

    def test_read_from_datastore(self):
        query = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.stub.put_multi(model_list)

        with self.stub.context():
            model_pcoll = self.pipeline | self.stub.ReadFromDatastore(query)

            self.assert_pcoll_equal(model_pcoll, model_list)

    def test_write_to_datastore(self):
        query = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.stub.put_multi(model_list)

        self.assertItemsEqual(self.stub.get(query), model_list)

        with self.stub.context():
            model_pcoll = self.pipeline | beam.Create(model_list)

            self.assert_pcoll_empty(
                model_pcoll | self.stub.DeleteFromDatastore())

        self.assertItemsEqual(self.stub.get(query), [])

    def test_delete_from_datastore(self):
        query = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.stub.put_multi(model_list)

        self.assertItemsEqual(self.stub.get(query), model_list)

        with self.stub.context():
            model_pcoll = self.pipeline | beam.Create(model_list)

            self.assert_pcoll_empty(
                model_pcoll | self.stub.DeleteFromDatastore())

        self.assertItemsEqual(self.stub.get(query), [])

    def test_read_from_datastore_without_acquiring_context_raises_error(self):
        query = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())
        with self.assertRaisesRegexp(RuntimeError, 'Must acquire context'):
            self.stub.ReadFromDatastore(query)

    def test_write_to_datastore_without_acquiring_context_raises_error(self):
        with self.assertRaisesRegexp(RuntimeError, 'Must acquire context'):
            self.stub.WriteToDatastore()

    def test_delete_from_datastore_without_acquiring_context_raises_error(self):
        with self.assertRaisesRegexp(RuntimeError, 'Must acquire context'):
            self.stub.DeleteFromDatastore()

    def test_read_after_write_raises_error(self):
        query = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())

        with self.stub.context():
            empty_pcoll = self.pipeline | beam.Create([])

            self.assert_pcoll_empty(
                empty_pcoll | self.stub.WriteToDatastore())

            self.assertRaisesRegexp(
                RuntimeError,
                'Cannot read from datastore after a mutation',
                lambda: self.pipeline | self.stub.ReadFromDatastore(query))

    def test_read_after_delete_raises_error(self):
        query = job_utils.get_beam_query_from_ndb_query(
            datastore_services.query_everything())

        with self.stub.context():
            empty_pcoll = self.pipeline | beam.Create([])

            self.assert_pcoll_empty(
                empty_pcoll | self.stub.DeleteFromDatastore())

            self.assertRaisesRegexp(
                RuntimeError,
                'Cannot read from datastore after a mutation',
                lambda: self.pipeline | self.stub.ReadFromDatastore(query))

    def test_write_after_write_raises_error(self):
        with self.stub.context():
            empty_pcoll = self.pipeline | beam.Create([])

            self.assert_pcoll_empty(empty_pcoll | self.stub.WriteToDatastore())

            self.assertRaisesRegexp(
                RuntimeError,
                'At most one WriteToDatastore may be executed',
                lambda: empty_pcoll | self.stub.WriteToDatastore())

    def test_delete_after_delete_raises_error(self):
        with self.stub.context():
            empty_pcoll = self.pipeline | beam.Create([])

            self.assert_pcoll_empty(
                empty_pcoll | self.stub.DeleteFromDatastore())

            self.assertRaisesRegexp(
                RuntimeError,
                'At most one DeleteFromDatastore may be executed',
                lambda: empty_pcoll | self.stub.DeleteFromDatastore())
