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

"""Error classes for topic model audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs.types import base_validation_errors


class ModelCanonicalNameMismatchError(base_validation_errors.BaseAuditError):
    """Error class for models that have mismatching names."""

    def __init__(self, model):
        super(ModelCanonicalNameMismatchError, self).__init__(model)
        self.message = (
            'Entity name %s in lowercase does not match '
            'canonical name %s' % (model.name, model.canonical_name))
