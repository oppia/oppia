# coding: utf-8
#
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

"""Models for data stored to populate the library page."""

import core.storage.base_model.gae_models as base_models

from google.appengine.ext import ndb


# The IDs for the list of featured explorations in the datastore. This value
# should not be changed.
ACTIVITY_LIST_FEATURED = 'featured'
ALL_ACTIVITY_LISTS = [ACTIVITY_LIST_FEATURED]


class ActivityListModel(base_models.BaseModel):
    """Storage model for a list of activities.

    The only instances of this model in the datastore should be those whose ids
    are in ALL_ACTIVITY_LISTS.
    """
    # The ids of activities to show in the library page.
    # An activity id takes the form e:{{EXPLORATION_ID}} or c:{{COLLECTION_ID}}
    # depending on the type of the activity.
    activity_ids = ndb.StringProperty(repeated=True)

    @classmethod
    def get(cls, entity_id):
        """This creates the relevant model instance, if it does not already
        exist.
        """
        if entity_id not in ALL_ACTIVITY_LISTS:
            raise Exception(
                'Invalid ActivityListModel id: %s' % entity_id)

        entity = super(ActivityListModel, cls).get(entity_id, strict=False)
        if entity is None:
            entity = cls(id=entity_id)
            entity.put()

        return entity
