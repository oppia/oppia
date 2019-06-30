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
# limitations under the License.

"""Domain objects for models relating to emails."""


class FeedbackThreadReplyInfo(object):
    """Domain object for email reply-to-id objects.

    Attributes:
        id: str. The id of the datastore instance.
        reply_to_id: str. The reply-to-id used in the reply-to field of the
            email.
    """

    def __init__(self, instance_id, reply_to_id):
        self.id = instance_id
        self.reply_to_id = reply_to_id

    @property
    def user_id(self):
        """Returns the user id corresponding to this FeedbackThreadReplyInfo
        instance.

        Returns:
            str. The user id.
        """
        return self.id.split('.')[0]

    @property
    def entity_type(self):
        """Returns the entity type extracted from the instance id.

        Returns:
            str. The entity type.
        """
        return self.id.split('.')[1]

    @property
    def entity_id(self):
        """Returns the entity id extracted from the instance id.

        Returns:
            str. The entity id.
        """
        return self.id.split('.')[2]

    @property
    def thread_id(self):
        """Returns the thread id extracted from the instance id.

        Returns:
            str. The thread id.
        """
        return '.'.join(
            [self.entity_type, self.entity_id, self.id.split('.')[3]])
