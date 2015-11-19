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

"""Models for events.

WARNING: NOT MEANT FOR MERGE INTO DEVELOP.
"""

__author__ = 'Sean Lip'

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])

from google.appengine.ext import ndb


EVENT_TYPE_VISIT_PAGE = 'visit_page'
EVENT_TYPE_COMPLETE_ACTIVITY = 'complete_activity'
EVENT_TYPE_SUBMIT_ANSWER = 'submit_answer'
EVENT_TYPE_CLICK = 'click'
EVENT_TYPE_ENTER_KEYPRESS = 'enter_keypress'

ALL_EVENT_TYPES = [
    EVENT_TYPE_VISIT_PAGE,
    EVENT_TYPE_COMPLETE_ACTIVITY,
    EVENT_TYPE_SUBMIT_ANSWER,
    EVENT_TYPE_CLICK,
    EVENT_TYPE_ENTER_KEYPRESS]


class ResearchEventModel(base_models.BaseModel):
    """Append-only model for recorded research events."""
    user_id = ndb.StringProperty(required=True)
    page_url = ndb.StringProperty(required=True)
    time_msec = ndb.FloatProperty(required=True)
    event_type = ndb.StringProperty(required=True, choices=ALL_EVENT_TYPES)
    event_data = ndb.JsonProperty()

    @classmethod
    def create(cls, user_id, page_url, time_msec, event_type, event_data):
        prefix = '.'.join([user_id, page_url, str(int(time_msec))])
        new_id = cls.get_new_id('event', prefix=prefix)
        cls(
            id=new_id, user_id=user_id, page_url=page_url, time_msec=time_msec,
            event_type=event_type, event_data=event_data).put()
