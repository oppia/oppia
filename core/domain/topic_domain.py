# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
# limitations under the License.]

"""Domain objects for topics, and related models."""

from core.domain import user_services
from core.platform import models

(topic_models,) = models.Registry.import_models([models.NAMES.topic])

CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'

ROLE_MANAGER = 'manager'
ROLE_NONE = 'none'


class TopicRights(object):
    """Domain object for topic rights."""

    def __init__(self, topic_id, manager_ids):
        self.id = topic_id
        self.manager_ids = manager_ids

    def to_dict(self):
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict version of TopicRights suitable for use by the
                frontend.
        """
        return {
            'topic_id': self.id,
            'manager_names': user_services.get_human_readable_user_ids(
                self.manager_ids)
        }

    def is_manager(self, user_id):
        """Checks whether given user is a manager of the topic.

        Args:
            user_id: str or None. Id of the user.

        Returns:
            bool. Whether user is a topic manager of this topic.
        """
        return bool(user_id in self.manager_ids)
