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

from core.platform import models
import feconf

from google.appengine.ext import ndb

(base_models, user_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.user])


class StorySnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a story snapshot."""
    pass


class StorySnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a story snapshot."""
    pass


class StoryModel(base_models.VersionedModel):
    """Model for storing stories.

    This class should only be imported by the story services file
    and the story model test file.
    """
    SNAPSHOT_METADATA_CLASS = StorySnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = StorySnapshotContentModel
    ALLOW_REVERT = False

    # The title of the story.
    title = ndb.StringProperty(required=True, indexed=True)
    # A high-level description of the story.
    description = ndb.StringProperty(indexed=False)
    # A set of notes, that describe the characters, main storyline, and setting.
    notes = ndb.TextProperty(indexed=False)
    # The ISO 639-1 code for the language this story is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # The schema version for the story_contents.
    schema_version = (
        ndb.IntegerProperty(required=True, default=1, indexed=True))
    # The story contents dict specifying the list of story nodes and the
    # connection between them. Modelled by class StoryContents
    # (see story_domain.py for its current schema).
    story_contents = ndb.JsonProperty(default={}, indexed=False)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
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
        """
        super(StoryModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        story_commit_log_entry = StoryCommitLogEntryModel.create(
            self.id, self.version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds,
            feconf.ACTIVITY_STATUS_PUBLIC, False
        )
        story_commit_log_entry.story_id = self.id
        story_commit_log_entry.put_async()


class StoryCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to stories.

    A new instance of this model is created and saved every time a commit to
    StoryModel occurs.

    The id for this model is of the form
    'story-{{STORY_ID}}-{{STORY_VERSION}}'.
    """
    # The id of the story being edited.
    story_id = ndb.StringProperty(indexed=True, required=True)

    @classmethod
    def _get_instance_id(cls, story_id, version):
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            story_id: str. The id of the story being edited.
            version: int. The version number of the story after the commit.

        Returns:
            str. The commit id with the story id and version number.
        """
        return 'story-%s-%s' % (story_id, version)


class StorySummaryModel(base_models.BaseModel):
    """Summary model for an Oppia Story.

    This should be used whenever the content blob of the story is not
    needed (e.g. search results, etc).

    A StorySummaryModel instance stores the following information:

        id, description, language_code, last_updated, created_on, version.

    The key of each instance is the story id.
    """

    # The title of the story.
    title = ndb.StringProperty(required=True, indexed=True)
    # The ISO 639-1 code for the language this story is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # Time when the story model was last updated (not to be
    # confused with last_updated, which is the time when the
    # story *summary* model was last updated).
    story_model_last_updated = ndb.DateTimeProperty(required=True, indexed=True)
    # Time when the story model was created (not to be confused
    # with created_on, which is the time when the story *summary*
    # model was created).
    story_model_created_on = ndb.DateTimeProperty(required=True, indexed=True)
    # The number of nodes that are part of this story.
    node_count = ndb.IntegerProperty(required=True, indexed=True)
    version = ndb.IntegerProperty(required=True)
