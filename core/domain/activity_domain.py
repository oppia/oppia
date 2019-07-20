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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from constants import constants

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
import builtins  # isort:skip
import past.builtins  # isort:skip
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class ActivityReference(builtins.object):
    """Domain object for an activity reference.

    An activity is a piece of learning material that can be created in Oppia.
    Currently, the only available types of activities are explorations and
    collections.

    Attributes:
        type: str. The activity type.
        id: str. The activity id.
    """

    def __init__(self, activity_type, activity_id):
        """Constructs an ActivityReference domain object.

        Args:
            activity_type: str. The activity type.
            activity_id: str. The activity id.
        """
        self.type = activity_type
        self.id = activity_id

    def get_hash(self):
        """Returns a unique string for this ActivityReference domain object."""
        return '%s:%s' % (self.type, self.id)

    def validate(self):
        """Checks that all fields of this ActivityReference domain object
        are valid.

        Raises:
            Exception: The activity type is invalid.
        """
        if (self.type != constants.ACTIVITY_TYPE_EXPLORATION and
                self.type != constants.ACTIVITY_TYPE_COLLECTION):
            raise Exception('Invalid activity type: %s' % self.type)
        if not isinstance(self.id, past.builtins.past.builtins.basestring):
            raise Exception(
                'Expected id to be a string but found %s' % self.id)

    def to_dict(self):
        """Returns a dict representing this ActivityReference domain object.

        Returns:
            A dict, mapping type and id of a ActivityReference
            instance to corresponding keys 'type' and 'id'.
        """
        return {
            'type': self.type,
            'id': self.id,
        }


class ActivityReferences(builtins.object):
    """Domain object for a list of activity references.

    Attributes:
        activity_reference_list: list(ActivityReference). A list of
            ActivityReference domain objects.
    """

    def __init__(self, activity_reference_list):
        """Constructs an ActivityReferences domain object.

        Args:
            activity_reference_list: list(ActivityReference). A list of
                ActivityReference domain objects.
        """
        self.activity_reference_list = activity_reference_list

    def validate(self):
        """Checks that all ActivityReference domain object in
        self.activity_reference_list are valid.

        Raises:
            Exception: Any ActivityReference in self.activity_reference_list
                is invalid.
        """
        for reference in self.activity_reference_list:
            reference.validate()
