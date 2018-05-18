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

from google.appengine.ext import ndb  # pylint: disable=relative-import

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

    This class should only be imported by the story domain file, the
    story services file, and the story model test file.
    """
    SNAPSHOT_METADATA_CLASS = StorySnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = StorySnapshotContentModel
    ALLOW_REVERT = True

    # The title of the story.
    title = ndb.StringProperty(required=True, indexed=True)
    # A high-level description of the story.
    description = ndb.StringProperty(indexed=False)
    # The topic id the story corresponds to.
    topic = ndb.StringProperty(indexed=False)
    # A set of notes, that describe the characters, main storyline, and setting.
    notes = ndb.StringProperty(indexed=False)
    # The schema version for the story.
    schema_version = (
        ndb.IntegerProperty(required=True, default=1, indexed=True))
    # The ISO 639-1 code for the language this question is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # The story graph specifying the connection between nodes.
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

        StoryCommitLogEntryModel(
            id=('story-%s-%s' % (self.id, self.version)),
            user_id=committer_id,
            username=committer_username,
            story_id=self.id,
            commit_type=commit_type,
            commit_message=commit_message,
            commit_cmds=commit_cmds,
            version=self.version
        ).put_async()


class StoryCommitLogEntryModel(base_models.BaseModel):
    """Log of commits to stories.

    A new instance of this model is created and saved every time a commit to
    StoryModel occurs.

    The id for this model is of the form
    'story-{{STORY_ID}}-{{STORY_VERSION}}'.
    """
    # Update superclass model to make these properties indexed.
    created_on = ndb.DateTimeProperty(auto_now_add=True, indexed=True)
    last_updated = ndb.DateTimeProperty(auto_now=True, indexed=True)

    # The id of the user.
    user_id = ndb.StringProperty(indexed=True, required=True)
    # The username of the user, at the time of the edit.
    username = ndb.StringProperty(indexed=True, required=True)
    # The id of the story being edited.
    story_id = ndb.StringProperty(indexed=True, required=True)
    # The type of the commit: 'create', 'revert', 'edit', 'delete'.
    commit_type = ndb.StringProperty(indexed=True, required=True)
    # The commit message.
    commit_message = ndb.TextProperty(indexed=False)
    # The commit_cmds dict for this commit.
    commit_cmds = ndb.JsonProperty(indexed=False, required=True)
    # The version number of the story after this commit.
    version = ndb.IntegerProperty()

    @classmethod
    def get_commit(cls, story_id, version):
        """Returns the commit corresponding to the given story id and
        version number.

        Args:
            story_id: str. The id of the story being edited.
            version: int. The version number of the story after the commit.

        Returns:
            The commit with the given story id and version number.
        """
        return cls.get_by_id('story-%s-%s' % (story_id, version))

    @classmethod
    def get_all_commits(cls, page_size, urlsafe_start_cursor):
        """Fetches a list of all the commits sorted by their last updated
        attribute.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.

        Returns:
            3-tuple of (results, cursor, more) as described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)


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
    # The topic id the story corresponds to.
    topic = ndb.StringProperty(indexed=False)
    # The ISO 639-1 code for the language this question is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # Time when the story model was last updated (not to be
    # confused with last_updated, which is the time when the
    # story *summary* model was last updated).
    story_model_last_updated = ndb.DateTimeProperty(indexed=True)
    # Time when the story model was created (not to be confused
    # with created_on, which is the time when the story *summary*
    # model was created).
    story_model_created_on = ndb.DateTimeProperty(indexed=True)
    # The number of nodes that are part of this story.
    node_count = ndb.IntegerProperty()
    version = ndb.IntegerProperty()
