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
    # The class which stores the commit history of the metadata snapshots.
    SNAPSHOT_METADATA_CLASS = FileMetadataSnapshotMetadataModel
    # The class which stores the content of the metadata snapshots.
    SNAPSHOT_CONTENT_CLASS = FileMetadataSnapshotContentModel

    # The size of the file.
    size = ndb.IntegerProperty(indexed=False)

    @classmethod
    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def get_undeleted(cls):
        """Returns a list of undeleted FileMetadataModel instances. At most
        feconf.DEFAULT_QUERY_LIMIT results are returned.

        Returns:
            list(FileMetadataModel). Contains all undeleted instances of
            this class.
        """
        return cls.get_all().filter(cls.deleted == False).fetch(  # pylint: disable=singleton-comparison
            feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        """Constructs and returns an id string uniquely identifying the given
        exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the
                exploration.

        Returns:
            str. Uniquely identifying string for the given exploration and
            filepath (concatenation of exploration id and filepath).
        """
        return utils.vfs_construct_path('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        """Creates and returns a FileMetadataModel instance describing the given
        exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            FileMetadataModel. An instance of this class.
        """
        model_id = cls._construct_id(exploration_id, filepath)
        return cls(id=model_id, deleted=False)

    @classmethod
    def get_model(cls, exploration_id, filepath, strict=False):
        """Returns the newest version of an existing FileMetadataModel instance
        describing the given exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            FileMetadataModel. An instance of this class, uniquely
            identified by exploration_id and filepath.
        """
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileMetadataModel, cls).get(model_id, strict=strict)

    @classmethod
    def get_version(cls, exploration_id, filepath, version_number):
        """Returns the specified version of an existing FileMetadataModel
        instance describing the given exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the exploration.
            version_number: int. The version number of the instance to
                be returned.

        Returns:
            FileMetadataModel. An instance of this class, uniquely identified
            by exploration_id, filepath, and version_number.
        """
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileMetadataModel, cls).get_version(
            model_id, version_number)

    def commit(self, committer_id, commit_cmds):
        """Saves a version snapshot of a FileMetadataModel instance and updates
        the instance.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_cmds: list(dict). A list of commands describing changes made
                in this instance. Must give sufficient information to
                reconstruct the commit. Dict always contains:
                    cmd: str. Unique command.
                followed by additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number'
                 'version_number': 4}
        """
        super(FileMetadataModel, self).commit(
            committer_id, '', commit_cmds)


class FileSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Class for storing the file snapshot commit history."""
    pass


class FileSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Class for storing the content of the file snapshots (where the content
    is an uninterpreted bytestring).
    """

    # Overwrite the superclass member to use a BlobProperty for raw strings.
    content = ndb.BlobProperty(indexed=False)


class FileModel(base_models.VersionedModel):
    """File data model, keyed by exploration id and absolute file name."""

    # The class which stores the commit history of the file snapshots.
    SNAPSHOT_METADATA_CLASS = FileSnapshotMetadataModel
    # The class which stores the content of the file snapshots.
    SNAPSHOT_CONTENT_CLASS = FileSnapshotContentModel

    # The contents of the file.
    content = ndb.BlobProperty(indexed=False)

    def _reconstitute(self, snapshot_blob):
        """Overrides the superclass method. Reconstitutes a FileModel
        instance from a snapshot.

        Args:
            snapshot_blob: str. A bytestring to which this instance's content
                field will be set.

        Returns:
            FileModel. An instance of this class, with content set to
            snapshot_blob.
        """
        self.content = snapshot_blob
        return self

    def _compute_snapshot(self):
        """Manually overwrite the superclass method. Returns the content of
        this FileModel instance.

        Returns:
            str. A bytestring snapshot of this instance's content.
        """
        return self.content

    @classmethod
    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        """Constructs and returns an id string uniquely identifying the given
        exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            str. Uniquely identifying string for the given exploration and
            filepath.
        """
        return utils.vfs_construct_path('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        """Creates and returns a FileModel instance specified by the given
        exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            FileModel. An instance of this class.
        """
        model_id = cls._construct_id(exploration_id, filepath)
        return cls(id=model_id, deleted=False)

    @classmethod
    def get_model(cls, exploration_id, filepath, strict=False):
        """Returns the newest version of an existing FileModel instance
        specified by the given exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the exploration.

        Returns:
            FileModel. An instance of this class, uniquely
            identified by exploration_id and filepath.
        """
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileModel, cls).get(model_id, strict=strict)

    def commit(self, committer_id, commit_cmds):
        """Saves a version snapshot of a FileModel instance and updates the
        instance.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_cmds: list(dict). A list of commands describing changes made
                in this instance. Must give sufficient information to
                reconstruct the commit. Dict always contains:
                    cmd: str. Unique command.
                followed by additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number'
                 'version_number': 4}
        """
        super(FileModel, self).commit(committer_id, '', commit_cmds)

    @classmethod
    def get_version(cls, exploration_id, filepath, version_number):
        """Returns the chosen version of an existing FileModel instance
        specified by the given exploration and filepath.

        Args:
            exploration_id: str. The id of the exploration.
            filepath: str. The path to the relevant file within the exploration.
            version_number: int. The version number of the instance to
                be returned.

        Returns:
            FileModel. An instance of this class, uniquely
                identified by exploration_id, filepath, and version_number.
        """
        model_id = cls._construct_id(exploration_id, filepath)
        return super(FileModel, cls).get_version(model_id, version_number)
