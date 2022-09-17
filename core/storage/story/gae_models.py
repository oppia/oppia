# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Models for storing the story data models."""

from __future__ import annotations

from core.constants import constants
from core.platform import models

from typing import Dict, Mapping, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models, user_models,) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER])

datastore_services = models.Registry.import_datastore_services()


class StorySnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a story snapshot."""

    pass


class StorySnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a story snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class StoryCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to stories.

    A new instance of this model is created and saved every time a commit to
    StoryModel occurs.

    The id for this model is of the form 'story-[story_id]-[version]'.
    """

    # The id of the story being edited.
    story_id = datastore_services.StringProperty(indexed=True, required=True)

    @classmethod
    def get_instance_id(cls, story_id: str, version: int) -> str:
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            story_id: str. The id of the story being edited.
            version: int. The version number of the story after the commit.

        Returns:
            str. The commit id with the story id and version number.
        """
        return 'story-%s-%s' % (story_id, version)

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The history of commits is not relevant for the purposes of Takeout
        since commits don't contain relevant data corresponding to users.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because the history of commits isn't deemed as useful for users since
        commit logs don't contain relevant data corresponding to those users.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'story_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class StoryModel(base_models.VersionedModel):
    """Model for storing stories.

    This class should only be imported by the story services file
    and the story model test file.
    """

    SNAPSHOT_METADATA_CLASS = StorySnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = StorySnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = StoryCommitLogEntryModel
    ALLOW_REVERT = False

    # The title of the story.
    title = datastore_services.StringProperty(required=True, indexed=True)
    # The thumbnail filename of the story.
    thumbnail_filename = datastore_services.StringProperty(indexed=True)
    # The thumbnail background color of the story.
    thumbnail_bg_color = datastore_services.StringProperty(indexed=True)
    # The thumbnail size of the story.
    thumbnail_size_in_bytes = datastore_services.IntegerProperty(indexed=True)
    # A high-level description of the story.
    description = datastore_services.TextProperty(indexed=False)
    # A set of notes, that describe the characters, main storyline, and setting.
    notes = datastore_services.TextProperty(indexed=False)
    # The ISO 639-1 code for the language this story is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The story contents dict specifying the list of story nodes and the
    # connection between them. Modelled by class StoryContents
    # (see story_domain.py for its current schema).
    story_contents = datastore_services.JsonProperty(default={}, indexed=False)
    # The schema version for the story_contents.
    story_contents_schema_version = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The topic id to which the story belongs.
    corresponding_topic_id = (
        datastore_services.StringProperty(indexed=True, required=True))
    # The url fragment for the story.
    url_fragment = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The content of the meta tag in the Story viewer page.
    meta_tag_content = datastore_services.StringProperty(
        indexed=True, default='')

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    # Here we use MyPy ignore because the signature of this method doesn't
    # match with VersionedModel.compute_models_to_commit(). Because argument
    # `commit_message` of super class can accept Optional[str] but this method
    # can only accept str.
    def compute_models_to_commit(  # type: ignore[override]
        self,
        committer_id: str,
        commit_type: str,
        commit_message: str,
        commit_cmds: base_models.AllowedCommitCmdsListType,
        # We expect Mapping because we want to allow models that inherit
        # from BaseModel as the values, if we used Dict this wouldn't
        # be allowed.
        additional_models: Mapping[str, base_models.BaseModel]
    ) -> base_models.ModelsToPutDict:
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
            additional_models: dict(str, BaseModel). Additional models that are
                needed for the commit process.

        Returns:
            ModelsToPutDict. A dict of models that should be put into
            the datastore.
        """
        models_to_put = super().compute_models_to_commit(
            committer_id,
            commit_type,
            commit_message,
            commit_cmds,
            additional_models
        )

        story_commit_log_entry = StoryCommitLogEntryModel.create(
            self.id, self.version, committer_id, commit_type, commit_message,
            commit_cmds, constants.ACTIVITY_STATUS_PUBLIC, False
        )
        story_commit_log_entry.story_id = self.id
        return {
            'snapshot_metadata_model': models_to_put['snapshot_metadata_model'],
            'snapshot_content_model': models_to_put['snapshot_content_model'],
            'commit_log_model': story_commit_log_entry,
            'versioned_model': models_to_put['versioned_model'],
        }

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_size_in_bytes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'notes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_contents': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_contents_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'corresponding_topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'meta_tag_content': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_by_url_fragment(cls, url_fragment: str) -> Optional[StoryModel]:
        """Gets StoryModel by url_fragment. Returns None if the story with
        name url_fragment doesn't exist.

        Args:
            url_fragment: str. The url fragment of the story.

        Returns:
            StoryModel|None. The story model of the story or None if not
            found.
        """
        return cls.get_all().filter(cls.url_fragment == url_fragment).get()


class StorySummaryModel(base_models.BaseModel):
    """Summary model for an Oppia Story.

    This should be used whenever the content blob of the story is not
    needed (e.g. search results, etc).

    A StorySummaryModel instance stores the following information:

        id, description, language_code, last_updated, created_on, version.

    The key of each instance is the story id.
    """

    # The title of the story.
    title = datastore_services.StringProperty(required=True, indexed=True)
    # The ISO 639-1 code for the language this story is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # A high-level description of the story.
    description = datastore_services.TextProperty(required=True, indexed=False)
    # Time when the story model was last updated (not to be
    # confused with last_updated, which is the time when the
    # story *summary* model was last updated).
    story_model_last_updated = (
        datastore_services.DateTimeProperty(required=True, indexed=True))
    # Time when the story model was created (not to be confused
    # with created_on, which is the time when the story *summary*
    # model was created).
    story_model_created_on = (
        datastore_services.DateTimeProperty(required=True, indexed=True))
    # The titles of the nodes in the story, in the same order as present there.
    node_titles = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # The thumbnail filename of the story.
    thumbnail_filename = datastore_services.StringProperty(indexed=True)
    # The thumbnail background color of the story.
    thumbnail_bg_color = datastore_services.StringProperty(indexed=True)
    version = datastore_services.IntegerProperty(required=True)
    # The url fragment for the story.
    url_fragment = (
        datastore_services.StringProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_model_last_updated':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_model_created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'node_titles': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
