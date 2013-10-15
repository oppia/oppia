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

"""Models relating to files and their metadata."""

__author__ = 'Sean Lip'

import os

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])

from google.appengine.ext import ndb

QUERY_LIMIT = 1000


class FileMetadataModel(base_models.BaseModel):
    """File metadata model, keyed by absolute file name."""
    # The size of the file.
    size = ndb.IntegerProperty(indexed=False)

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def get_all(cls):
        return super(FileMetadataModel, cls).get_all().fetch(QUERY_LIMIT)

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return os.path.join('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model_id = cls._construct_id(exploration_id, filepath)
        return cls(id=model_id)

    @classmethod
    def get(cls, exploration_id, filepath, strict=False):
        return super(FileMetadataModel, cls).get(
            cls._construct_id(exploration_id, filepath),
            strict=strict)


class FileDataModel(base_models.BaseModel):
    """File data model, keyed by absolute file name."""
    # The contents of the file.
    data = ndb.BlobProperty()

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return os.path.join('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model_id = cls._construct_id(exploration_id, filepath)
        return cls(id=model_id)

    @classmethod
    def get(cls, exploration_id, filepath, strict=False):
        return super(FileDataModel, cls).get(
            cls._construct_id(exploration_id, filepath),
            strict=strict)
