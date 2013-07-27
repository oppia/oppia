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

import oppia.storage.base_model.models as base_models

from django.db import models

from oppia.django_utils import JSONField


class Counter(base_models.IdModel):
    """An integer-valued counter."""
    # The value of the property.
    value = models.IntegerField(default=0, blank=True)
    # When this counter was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this counter was last incremented.
    last_updated = models.DateTimeField(auto_now=True)

    @classmethod
    def get_value_by_id(cls, cid):
        counter = cls.get(cid, strict=False)
        return counter.value if counter is not None else 0

    @classmethod
    def delete_all(cls):
        for item in cls.get_all():
            item.delete()


class Journal(base_models.IdModel):
    """A list of values."""
    # The list of values
    values = JSONField(default=[], schema=[basestring], primitivelist=True)
    # When this counter was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this counter was last updated.
    last_updated = models.DateTimeField(auto_now=True)

    @classmethod
    def get_value_count_by_id(cls, jid):
        journal = cls.get(jid, strict=False)
        return len(journal.values) if journal is not None else 0

    @classmethod
    def delete_all(cls):
        for item in cls.get_all():
            item.delete()


class Tally(base_models.IdModel):
    """A tally."""
    # The value of the property.
    value = JSONField(default={}, isdict=True, blank=True)
    # When this entity was first created.
    created = models.DateTimeField(auto_now_add=True)
    # When this entity was last incremented.
    last_updated = models.DateTimeField(auto_now=True)

    @classmethod
    def get_value_by_id(cls, tid):
        tally = cls.get(tid, strict=False)
        return tally.value if tally is not None else {}

    @classmethod
    def delete_all(cls):
        for item in cls.get_all():
            item.delete()
