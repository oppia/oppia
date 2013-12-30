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

"""Models relating to the per-exploration file system."""

__author__ = 'Sean Lip'

import base64
import os

import core.storage.base_model.models as base_models

from django.db import models


QUERY_LIMIT = 1000


class FileMetadataSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Class for storing the file metadata snapshot commit history."""
    pass


class FileMetadataSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Class for storing the content of the file metadata snapshots."""
    pass


class FileMetadataModel(base_models.BaseModel):
    """File metadata model, keyed by exploration id and absolute file name."""
    # The size of the file.
    size = models.IntegerField()

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def get_undeleted(cls):
        # TODO(sunu0000): Impose a limit of QUERY_LIMIT on the number of
        # results.
        return cls.get_all().filter(deleted=False)

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return os.path.join('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model = cls.get(exploration_id, filepath)
        if model is not None:
            model.deleted = False
        else:
            model_id = cls._construct_id(exploration_id, filepath)
            model = cls(id=model_id, deleted=False)
        return model

    @classmethod
    def get(cls, exploration_id, filepath, strict=False):
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileMetadataModel, cls).get(model_id, strict=strict)

    @classmethod
    def get_version(cls, exploration_id, filepath, version_number):
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileMetadataModel, cls).get_version(
            model_id, version_number)

    def save(self, committer_id, commit_cmds):
        return super(FileMetadataModel, self).save(
            committer_id, '', commit_cmds)


class FileSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Class for storing the file snapshot commit history."""
    pass


class FileSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Class for storing the content of the file snapshots."""
    pass


class FileModel(base_models.BaseModel):
    """File data model, keyed by exploration id and absolute file name."""
    # The contents of the file.
    content = models.TextField()

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return os.path.join('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model = cls.get(exploration_id, filepath)
        if model is not None:
            model.deleted = False
        else:
            model_id = cls._construct_id(exploration_id, filepath)
            model = cls(id=model_id, deleted=False)
        return model

    @classmethod
    def get(cls, exploration_id, filepath, strict=False):
        model_id = cls._construct_id(exploration_id, filepath)
        result = super(FileModel, cls).get(model_id, strict=strict)
        if result is not None:
            result.content = base64.decodestring(result.content)
        return result

    def save(self, committer_id, commit_cmds):
        # Django does not accept raw byte strings, so we need to encode them.
        # Internally, it stores strings as unicode.
        self.content = base64.encodestring(self.content)
        return super(FileModel, self).save(committer_id, '', commit_cmds)

    @classmethod
    def get_version(cls, exploration_id, filepath, version_number):
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileModel, cls).get_version(model_id, version_number)
