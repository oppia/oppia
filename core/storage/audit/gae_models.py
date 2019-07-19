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

"""Models for storing the audit logs."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.platform import models
import feconf

from google.appengine.ext import ndb

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class RoleQueryAuditModel(base_models.BaseModel):
    """Records the data for query made to the role structure using admin
    interface.

    Instances of this class are keyed by a custom Id.
    [user_id].[timestamp_in_sec].[intent].[random_number]
    """
    # The user_id of the user making query.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The intent of making query (viewing (by role or username)
    # or updating role).
    intent = ndb.StringProperty(required=True, choices=[
        feconf.ROLE_ACTION_UPDATE,
        feconf.ROLE_ACTION_VIEW_BY_ROLE,
        feconf.ROLE_ACTION_VIEW_BY_USERNAME
    ], indexed=True)
    # The role being queried for.
    role = ndb.StringProperty(default=None, indexed=True)
    # The username in the query.
    username = ndb.StringProperty(default=None, indexed=True)
