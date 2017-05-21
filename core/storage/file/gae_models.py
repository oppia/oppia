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

"""Models relating to the per-exploration file system."""

from core.platform import models
import feconf
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class FileMetadataSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Class for storing the file metadata snapshot commit history."""
    pass


class FileMetadataSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Class for storing the content of the file metadata snapshots."""
    pass


class FileMetadataModel(base_models.VersionedModel):
    """File metadata model, keyed by exploration id and absolute file name."""
    SNAPSHOT_METADATA_CLASS = FileMetadataSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = FileMetadataSnapshotContentModel

    # The size of the file.
    size = ndb.IntegerProperty(indexed=False)

    @classmethod
    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def get_undeleted(cls):
        return cls.get_all().filter(cls.deleted == False).fetch(  # pylint: disable=singleton-comparison
            feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return utils.vfs_construct_path('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model_id = cls._construct_id(exploration_id, filepath)
        return cls(id=model_id, deleted=False)

    @classmethod
    def get_model(cls, exploration_id, filepath, strict=False):
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileMetadataModel, cls).get(model_id, strict=strict)

    @classmethod
    def get_version(cls, exploration_id, filepath, version_number):
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileMetadataModel, cls).get_version(
            model_id, version_number)

    def commit(self, committer_id, commit_cmds):
        return super(FileMetadataModel, self).commit(
            committer_id, '', commit_cmds)


class FileSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Class for storing the file snapshot commit history."""
    pass


class FileSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Class for storing the content of the file snapshots."""

    # Overwrite the superclass member to use a BlobProperty for raw strings.
    content = ndb.BlobProperty(indexed=False)


class FileModel(base_models.VersionedModel):
    """File data model, keyed by exploration id and absolute file name."""
    SNAPSHOT_METADATA_CLASS = FileSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = FileSnapshotContentModel

    # The contents of the file.
    content = ndb.BlobProperty(indexed=False)

    def _reconstitute(self, snapshot_blob):
        """Manually overwrite the superclass method."""
        self.content = snapshot_blob
        return self

    def _compute_snapshot(self):
        """Manually overwrite the superclass method."""
        return self.content

    @classmethod
    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return utils.vfs_construct_path('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model_id = cls._construct_id(exploration_id, filepath)
        return cls(id=model_id, deleted=False)

    @classmethod
    def get_model(cls, exploration_id, filepath, strict=False):
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileModel, cls).get(model_id, strict=strict)

    def commit(self, committer_id, commit_cmds):
        return super(FileModel, self).commit(committer_id, '', commit_cmds)

    @classmethod
    def get_version(cls, exploration_id, filepath, version_number):
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileModel, cls).get_version(model_id, version_number)
