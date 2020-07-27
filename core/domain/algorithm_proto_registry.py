# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Registry for proto model corresponding to ML classifiers."""

from __future__ import absolute_import # pylint: disable=import-only-modules
from __future__ import unicode_literals # pylint: disable=import-only-modules

from core.domain.proto import text_classifier_pb2

import python_utils


class Registry(python_utils.OBJECT):
    """Registry of all classifier classes."""

    CLASSIFIER_TO_PROTO_MAPPING = {
        u'TextClassifier': {
            1: {
                u'attribute_name': u'text_classifier',
                u'attribute_type': text_classifier_pb2.TextClassifierFrozenModel
            }
        }
    }

    @classmethod
    def get_proto_attribute_name_for_algorithm(
            cls, algorithm_id, algorithm_version):
        """Returns protobuf attribute name corresponding to algorithm_id.

        Args:
            algorithm_id: str. ID of the algorithm.
            algorithm_version: int. Version of the algorithm.

        Returns:
            str|None, Protobuf attribute name correspondig to algorithm_id and
            algorithm_version. None if algorithm_id or algorithm_version is
            not found in mapping.
        """
        if algorithm_id not in cls.CLASSIFIER_TO_PROTO_MAPPING:
            return None
        if algorithm_version not in cls.CLASSIFIER_TO_PROTO_MAPPING[
                algorithm_id]:
            return None

        return cls.CLASSIFIER_TO_PROTO_MAPPING[
            algorithm_id][algorithm_version]['attribute_name']

    @classmethod
    def get_proto_attribute_type_for_algorithm(
            cls, algorithm_id, algorithm_version):
        """Returns protobuf class corresponding to algorithm_id.

        Args:
            algorithm_id: str. ID of the algorithm.
            algorithm_version: int. Version of the algorithm.

        Returns:
            cls|None. Protobuf class correspondig to algorithm_id and
            algorithm_version. None if algorithm_id or algorithm_version is
            not found in mapping.
        """
        if algorithm_id not in cls.CLASSIFIER_TO_PROTO_MAPPING:
            return None
        if algorithm_version not in cls.CLASSIFIER_TO_PROTO_MAPPING[
                algorithm_id]:
            return None

        return cls.CLASSIFIER_TO_PROTO_MAPPING[
            algorithm_id][algorithm_version]['attribute_type']
