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

"""Provides stub implementations for io-based PTransforms."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils

import apache_beam as beam


class ModelIoStub(python_utils.OBJECT):
    """Stubs datastore operations by reading from/writing to a simple dict."""

    def __init__(self):
        self._models_by_id = {}

    @property
    def get_models_ptransform(self):
        """Returns a PTransform for getting the models stored in the stub.

        Returns:
            PTransform. A PTransform that returns the models stored in the stub.
        """
        stub = self

        class GetModels(beam.PTransform):
            """PTransform for getting the models stored in the stub."""

            def expand(self, pcoll):
                """Returns a PCollection of the models stored in the stub.

                Args:
                    pcoll: PCollection. Used to hook into the underlying
                        pipeline.

                Returns:
                    PCollection. The models stored in the stub.
                """
                return (
                    pcoll | beam.Create(m for m in stub._models_by_id.values())) # pylint: disable=protected-access

        return GetModels

    def put_multi(self, models):
        """Puts multiple models into the stub.

        Args:
            models: list(datastore_services.Model). The models to put.
        """
        self._models_by_id.update({model.id: model for model in models})

    def clear(self):
        """Clears the models in the stub."""
        self._models_by_id.clear()
