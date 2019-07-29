# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers related to user subscriptions."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import subscription_services
from core.domain import user_services

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class SubscribeHandler(base.BaseHandler):
    """Handles operations relating to new subscriptions."""

    @acl_decorators.can_subscribe_to_users
    def post(self):
        creator_id = user_services.get_user_id_from_username(
            self.payload.get('creator_username'))
        subscription_services.subscribe_to_creator(self.user_id, creator_id)
        self.render_json(self.values)


class UnsubscribeHandler(base.BaseHandler):
    """Handles operations related to unsubscriptions."""

    @acl_decorators.can_subscribe_to_users
    def post(self):
        creator_id = user_services.get_user_id_from_username(
            self.payload.get('creator_username'))
        subscription_services.unsubscribe_from_creator(
            self.user_id, creator_id)
        self.render_json(self.values)
