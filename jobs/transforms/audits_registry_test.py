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

"""Unit tests for jobs.transforms.audits_registry."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils
from jobs.decorators import audit_decorators
from jobs.transforms import audits_registry


class GetAuditsByKindTests(test_utils.TestBase):

    def test_returns_value_from_decorator(self):
        unique_obj = object()

        @classmethod
        def get_audit_do_fn_types_by_kind_mock(unused_cls):
            """Returns the unique_obj."""
            return unique_obj

        get_audit_do_fn_types_by_kind_swap = self.swap(
            audit_decorators.AuditsExisting, 'get_audit_do_fn_types_by_kind',
            get_audit_do_fn_types_by_kind_mock)

        with get_audit_do_fn_types_by_kind_swap:
            self.assertIs(
                audits_registry.get_audit_do_fn_types_by_kind(), unique_obj)
