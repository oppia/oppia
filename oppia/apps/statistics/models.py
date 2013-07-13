# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Models for Oppia statistics."""

__author__ = 'Sean Lip'

from oppia.apps.base_model.models import IdModel

from google.appengine.ext import ndb


class Counter(IdModel):
    """An integer-valued counter."""
    # The value of the property.
    value = ndb.IntegerProperty(default=0)
    # When this counter was first created.
    created = ndb.DateTimeProperty(auto_now_add=True)
    # When this counter was last incremented.
    last_updated = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def get_value_by_id(cls, cid):
        counter = Counter.get(cid, strict=False)
        return counter.value if counter else 0


class Journal(IdModel):
    """A list of values."""
    # The list of values
    values = ndb.StringProperty(repeated=True)
    # When this counter was first created.
    created = ndb.DateTimeProperty(auto_now_add=True)
    # When this counter was last updated.
    last_updated = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def get_value_count_by_id(cls, jid):
        journal = Journal.get(jid, strict=False)
        return len(journal.values) if journal else 0
