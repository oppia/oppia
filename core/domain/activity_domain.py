# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Domain object for a reference to an activity."""

import feconf


class ActivityReference(object):
    """Domain object for an activity reference.

    An activity is a piece of learning material that can be created in Oppia.
    Currently, the only available types of activities are explorations and
    collections.
    """

    def __init__(self, activity_type, activity_id):
        self.type = activity_type
        self.id = activity_id

    def get_hash(self):
        return '%s:%s' % (self.type, self.id)

    def validate(self):
        if self.type not in feconf.ALL_ACTIVITY_TYPES:
            raise Exception('Invalid activity type: %s' % self.type)

    def to_dict(self):
        return {
            'type': self.type,
            'id': self.id,
        }
