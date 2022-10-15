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

"""Unit tests for jobs.io.ndb_io."""

from __future__ import annotations

from core.jobs import job_test_utils
from core.jobs.io import ndb_io
from core.platform import models

import apache_beam as beam

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class NdbIoTests(job_test_utils.PipelinedTestBase):

    def get_base_models(self) -> List[base_models.BaseModel]:
        """Returns all models in the datastore.

        Returns:
            list(Model). All of the models in the datastore.
        """
        return list(base_models.BaseModel.get_all())

    def put_multi(self, model_list: List[base_models.BaseModel]) -> None:
        """Puts the given models into the datastore.

        Args:
            model_list: list(Model). The models to put into the datastore.
        """
        datastore_services.update_timestamps_multi(
            model_list, update_last_updated_time=False)
        datastore_services.put_multi(model_list)

    def test_read_from_datastore(self) -> None:
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.put_multi(model_list)

        self.assertItemsEqual(self.get_base_models(), model_list)

        model_pcoll = (
            self.pipeline | ndb_io.GetModels(base_models.BaseModel.get_all())
        )

        self.assert_pcoll_equal(model_pcoll, model_list)

    def test_write_to_datastore(self) -> None:
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]

        self.assertItemsEqual(self.get_base_models(), [])

        self.assert_pcoll_empty(
            self.pipeline | beam.Create(model_list) | ndb_io.PutModels())
        self.assertItemsEqual(self.get_base_models(), model_list)

    def test_delete_from_datastore(self) -> None:
        model_list = [
            self.create_model(base_models.BaseModel, id='a'),
            self.create_model(base_models.BaseModel, id='b'),
            self.create_model(base_models.BaseModel, id='c'),
        ]
        self.put_multi(model_list)

        self.assertItemsEqual(self.get_base_models(), model_list)

        self.assert_pcoll_empty(
            self.pipeline
            | beam.Create([model.key for model in model_list])
            | ndb_io.DeleteModels())

        self.assertItemsEqual(self.get_base_models(), [])
