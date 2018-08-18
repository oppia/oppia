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

from core.platform import models
from core.tests import test_utils
import feconf

(audit_models,) = models.Registry.import_models([models.NAMES.audit])


class RoleQueryAuditModelUnitTests(test_utils.GenericTestBase):
    """Records the data for query made to the role structure using admin
    interface.

    Instances of this class are keyed by a custom Id.
    [user_id].[timestamp_in_sec].[intent].[random_number]
    """

    def test_create_and_get_model(self):
        audit_models.RoleQueryAuditModel(
            id='a', user_id='b', intent=feconf.ROLE_ACTION_UPDATE,
            role='c', username='d').put()
        a = audit_models.RoleQueryAuditModel.get('a')

        self.assertEqual(a.id, 'a')
        self.assertEqual(a.intent, feconf.ROLE_ACTION_UPDATE)
        self.assertEqual(a.user_id, 'b')
        self.assertEqual(a.role, 'c')
        self.assertEqual(a.username, 'd')
