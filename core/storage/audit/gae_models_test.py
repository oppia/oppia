# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Test for audit models."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.platform import models
from core.tests import test_utils
import feconf

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

(audit_models,) = models.Registry.import_models([models.NAMES.audit])


class RoleQueryAuditModelUnitTests(test_utils.GenericTestBase):
    """Unit tests for the RoleQueryAuditModel class."""

    def test_create_and_get_model(self):
        audit_models.RoleQueryAuditModel(
            id='a', user_id='b', intent=feconf.ROLE_ACTION_UPDATE,
            role='c', username='d').put()
        audit_model = audit_models.RoleQueryAuditModel.get('a')

        self.assertEqual(audit_model.id, 'a')
        self.assertEqual(audit_model.intent, feconf.ROLE_ACTION_UPDATE)
        self.assertEqual(audit_model.user_id, 'b')
        self.assertEqual(audit_model.role, 'c')
        self.assertEqual(audit_model.username, 'd')
