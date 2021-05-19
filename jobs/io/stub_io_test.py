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
from jobs.io import stub_io

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class ModelIoStubTests(job_test_utils.PipelinedTestBase):

    def test_get_models_returns_nothing_when_stub_is_empty(self):
        stub = stub_io.ModelIoStub()

        self.assert_pcoll_empty(self.pipeline | stub.get_models_ptransform())

    def test_get_models_ptransform(self):
        stub = stub_io.ModelIoStub()
        test_models = [
            base_models.BaseModel(
                id='a', created_on=self.NOW, last_updated=self.NOW),
            base_models.BaseModel(
                id='b', created_on=self.NOW, last_updated=self.NOW),
            base_models.BaseModel(
                id='c', created_on=self.NOW, last_updated=self.NOW),
        ]

        stub.put_multi(test_models)

        self.assert_pcoll_equal(
            self.pipeline | stub.get_models_ptransform(), test_models)
