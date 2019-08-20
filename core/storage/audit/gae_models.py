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

from core.platform import models
import feconf

from google.appengine.ext import ndb

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
