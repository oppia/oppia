# coding: utf-8
#
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

"""Models for topics and related constructs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.platform import models
import feconf

from google.appengine.ext import ndb

(base_models, user_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.user])


class TopicSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a topic snapshot."""
    pass


class TopicSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a topic snapshot."""
    pass


class TopicModel(base_models.VersionedModel):
    """Model for storing Topics.

    This class should only be imported by the topic services file
    and the topic model test file.
    """
    SNAPSHOT_METADATA_CLASS = TopicSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TopicSnapshotContentModel
    ALLOW_REVERT = False

    # The name of the topic.
    name = ndb.StringProperty(required=True, indexed=True)
    # The canonical name of the topic, created by making `name` lowercase.
    canonical_name = ndb.StringProperty(required=True, indexed=True)
    # The abbreviated name of the topic.
    abbreviated_name = ndb.StringProperty(indexed=True, default='')
    # The thumbnail filename of the topic.
    thumbnail_filename = ndb.StringProperty(indexed=True)
    # The thumbnail background color of the topic.
    thumbnail_bg_color = ndb.StringProperty(indexed=True)
    # The description of the topic.
    description = ndb.TextProperty(indexed=False)
    # This consists of the list of objects referencing canonical stories that
    # are part of this topic.
    canonical_story_references = ndb.JsonProperty(repeated=True, indexed=False)
    # This consists of the list of objects referencing additional stories that
    # are part of this topic.
    additional_story_references = ndb.JsonProperty(repeated=True, indexed=False)
    # The schema version for the story reference object on each of the above 2
    # lists.
    story_reference_schema_version = ndb.IntegerProperty(
        required=True, indexed=True)
    # This consists of the list of uncategorized skill ids that are not part of
    # any subtopic.
    uncategorized_skill_ids = ndb.StringProperty(repeated=True, indexed=True)
    # The list of subtopics that are part of the topic.
    subtopics = ndb.JsonProperty(repeated=True, indexed=False)
    # The schema version of the subtopic dict.
    subtopic_schema_version = ndb.IntegerProperty(required=True, indexed=True)
    # The id for the next subtopic.
    next_subtopic_id = ndb.IntegerProperty(required=True)
    # The ISO 639-1 code for the language this topic is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Topic should be kept if it is published."""
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether TopicModel snapshots references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.SNAPSHOT_METADATA_CLASS.exists_for_user_id(user_id)

    @staticmethod
    def get_user_id_migration_policy():
        """TopicModel doesn't have any field with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE

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
        super(TopicModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        topic_rights = TopicRightsModel.get_by_id(self.id)
        status = ''
        if topic_rights.topic_is_published:
            status = constants.ACTIVITY_STATUS_PUBLIC
        else:
            status = constants.ACTIVITY_STATUS_PRIVATE

        topic_commit_log_entry = TopicCommitLogEntryModel.create(
            self.id, self.version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds,
            status, False
        )
        topic_commit_log_entry.topic_id = self.id
        topic_commit_log_entry.put()

    @classmethod
    def get_by_name(cls, topic_name):
        """Gets TopicModel by topic_name. Returns None if the topic with
        name topic_name doesn't exist.

        Args:
            topic_name: str. The name of the topic.

        Returns:
            TopicModel|None. The topic model of the topic or None if not
            found.
        """
        return TopicModel.query().filter(
            cls.canonical_name == topic_name.lower()).filter(
                cls.deleted == False).get() #pylint: disable=singleton-comparison

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE


class TopicCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to topics.

    A new instance of this model is created and saved every time a commit to
    TopicModel occurs.

    The id for this model is of the form
    'topic-{{TOPIC_ID}}-{{TOPIC_VERSION}}'.
    """
    # The id of the topic being edited.
    topic_id = ndb.StringProperty(indexed=True, required=True)

    @staticmethod
    def get_deletion_policy():
        """Topic commit log is deleted only if the correspondingm topic is not
        public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @classmethod
    def _get_instance_id(cls, topic_id, version):
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            topic_id: str. The id of the topic being edited.
            version: int. The version number of the topic after the commit.

        Returns:
            str. The commit id with the topic id and version number.
        """
        return 'topic-%s-%s' % (topic_id, version)

    @staticmethod
    def get_export_policy():
        """This model is only stored for archive purposes. The commit log of
        entities is not related to personal user data.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE


class TopicSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia Topic.

    This should be used whenever the content blob of the topic is not
    needed (e.g. search results, etc).

    A TopicSummaryModel instance stores the following information:

        id, description, language_code, last_updated, created_on, version.

    The key of each instance is the topic id.
    """

    # The name of the topic.
    name = ndb.StringProperty(required=True, indexed=True)
    # The canonical name of the topic, created by making `name` lowercase.
    canonical_name = ndb.StringProperty(required=True, indexed=True)
    # The ISO 639-1 code for the language this topic is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # The description of the topic.
    description = ndb.TextProperty(indexed=False)

    # Time when the topic model was last updated (not to be
    # confused with last_updated, which is the time when the
    # topic *summary* model was last updated).
    topic_model_last_updated = ndb.DateTimeProperty(required=True, indexed=True)
    # Time when the topic model was created (not to be confused
    # with created_on, which is the time when the topic *summary*
    # model was created).
    topic_model_created_on = ndb.DateTimeProperty(required=True, indexed=True)
    # The number of canonical stories that are part of this topic.
    canonical_story_count = ndb.IntegerProperty(required=True, indexed=True)
    # The number of additional stories that are part of this topic.
    additional_story_count = ndb.IntegerProperty(required=True, indexed=True)
    # The total number of skills in the topic (including those that are
    # uncategorized).
    total_skill_count = ndb.IntegerProperty(required=True, indexed=True)
    # The number of skills that are not part of any subtopic.
    uncategorized_skill_count = ndb.IntegerProperty(required=True, indexed=True)
    # The number of subtopics of the topic.
    subtopic_count = ndb.IntegerProperty(required=True, indexed=True)
    version = ndb.IntegerProperty(required=True)

    @staticmethod
    def get_deletion_policy():
        """Topic summary should be kept if associated topic is published."""
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @classmethod
    def has_reference_to_user_id(cls, unused_user_id):
        """Check whether TopicSummaryModel references the given user.

        Args:
            unused_user_id: str. The (unused) ID of the user whose data should
            be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return False

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """TopicSummaryModel doesn't have any field with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE


class SubtopicPageSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a subtopic page snapshot."""
    pass


class SubtopicPageSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a subtopic page snapshot."""
    pass


class SubtopicPageModel(base_models.VersionedModel):
    """Model for storing Subtopic pages.

    This stores the HTML data for a subtopic page.
    """
    SNAPSHOT_METADATA_CLASS = SubtopicPageSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = SubtopicPageSnapshotContentModel
    ALLOW_REVERT = False

    # The topic id that this subtopic is a part of.
    topic_id = ndb.StringProperty(required=True, indexed=True)
    # The json data of the subtopic consisting of subtitled_html,
    # recorded_voiceovers and written_translations fields.
    page_contents = ndb.JsonProperty(required=True)
    # The schema version for the page_contents field.
    page_contents_schema_version = ndb.IntegerProperty(
        required=True, indexed=True)
    # The ISO 639-1 code for the language this subtopic page is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Subtopic should be kept if associated topic is published."""
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether SubtopicPageModel snapshots references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.SNAPSHOT_METADATA_CLASS.exists_for_user_id(user_id)

    @staticmethod
    def get_user_id_migration_policy():
        """SubtopicPageModel doesn't have any field with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE

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
        super(SubtopicPageModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)
        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        subtopic_page_commit_log_entry = SubtopicPageCommitLogEntryModel.create(
            self.id, self.version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds,
            constants.ACTIVITY_STATUS_PUBLIC, False
        )
        subtopic_page_commit_log_entry.subtopic_page_id = self.id
        subtopic_page_commit_log_entry.put()

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE


class SubtopicPageCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to subtopic pages.

    A new instance of this model is created and saved every time a commit to
    SubtopicPageModel occurs.

    The id for this model is of the form
    'subtopicpage-{{SUBTOPIC_PAGE_ID}}-{{SUBTOPIC_PAGE_VERSION}}'.
    """
    # The id of the subtopic page being edited.
    subtopic_page_id = ndb.StringProperty(indexed=True, required=True)

    @staticmethod
    def get_deletion_policy():
        """Subtopic page commit log is deleted only if the corresponding
        topic is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @classmethod
    def _get_instance_id(cls, subtopic_page_id, version):
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            subtopic_page_id: str. The id of the subtopic page being edited.
            version: int. The version number of the subtopic page after the
                commit.

        Returns:
            str. The commit id with the subtopic page id and version number.
        """
        return 'subtopicpage-%s-%s' % (subtopic_page_id, version)

    @staticmethod
    def get_export_policy():
        """This model is only stored for archive purposes. The commit log of
        entities is not related to personal user data.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE


class TopicRightsSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a topic rights snapshot."""
    pass


class TopicRightsSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a topic rights snapshot."""
    pass


class TopicRightsModel(base_models.VersionedModel):
    """Storage model for rights related to a topic.

    The id of each instance is the id of the corresponding topic.
    """

    SNAPSHOT_METADATA_CLASS = TopicRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TopicRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of the managers of this topic.
    manager_ids = ndb.StringProperty(indexed=True, repeated=True)
    # Whether this topic is published.
    topic_is_published = ndb.BooleanProperty(
        indexed=True, required=True, default=False)

    @staticmethod
    def get_deletion_policy():
        """Topic rights should be kept if associated topic is published."""
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether TopicRightsModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        more_results = True
        cursor = None
        while more_results:
            snapshot_content_models, cursor, more_results = (
                cls.SNAPSHOT_CONTENT_CLASS.query().fetch_page(
                    base_models.FETCH_BATCH_SIZE, start_cursor=cursor))
            for snapshot_content_model in snapshot_content_models:
                reconstituted_model = cls(**snapshot_content_model.content)
                if user_id in reconstituted_model.manager_ids:
                    return True
        return (cls.query(cls.manager_ids == user_id).get(
            keys_only=True) is not None or
                cls.SNAPSHOT_METADATA_CLASS.exists_for_user_id(user_id))

    @staticmethod
    def get_user_id_migration_policy():
        """TopicRightsModel has one field that contains multiple user IDs."""
        return base_models.USER_ID_MIGRATION_POLICY.CUSTOM

    @classmethod
    def migrate_model(cls, old_user_id, new_user_id):
        """Migrate model to use the new user ID in the manager_ids.

        Args:
            old_user_id: str. The old user ID.
            new_user_id: str. The new user ID.
        """
        migrated_models = []
        for model in cls.query(cls.manager_ids == old_user_id).fetch():
            model.manager_ids = [
                new_user_id if manager_id == old_user_id else manager_id
                for manager_id in model.manager_ids]
            migrated_models.append(model)
        cls.put_multi(
            migrated_models, update_last_updated_time=False)

    @classmethod
    def get_by_user(cls, user_id):
        """Retrieves the rights object for all topics assigned to given user

        Args:
            user_id: str. ID of user.

        Returns:
            list(TopicRightsModel). The list of TopicRightsModel objects in
                which the given user is a manager.
        """
        topic_rights_models = cls.query(
            cls.manager_ids == user_id
        )
        return topic_rights_models

    def verify_model_user_ids_exist(self):
        """Check if UserSettingsModel exists for all the ids in manager_ids."""
        user_ids = [user_id for user_id in self.manager_ids
                    if user_id not in feconf.SYSTEM_USERS]
        user_settings_models = user_models.UserSettingsModel.get_multi(
            user_ids, include_deleted=True)
        return all(model is not None for model in user_settings_models)

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
        super(TopicRightsModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        topic_rights = TopicRightsModel.get_by_id(self.id)
        status = ''
        if topic_rights.topic_is_published:
            status = constants.ACTIVITY_STATUS_PUBLIC
        else:
            status = constants.ACTIVITY_STATUS_PRIVATE

        TopicCommitLogEntryModel(
            id=('rights-%s-%s' % (self.id, self.version)),
            user_id=committer_id,
            username=committer_username,
            topic_id=self.id,
            commit_type=commit_type,
            commit_message=commit_message,
            commit_cmds=commit_cmds,
            version=None,
            post_commit_status=status,
            post_commit_community_owned=False,
            post_commit_is_private=not topic_rights.topic_is_published
        ).put()

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Export user-relevant properties of TopicRightsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. The user-relevant properties of TopicRightsModel in a dict
            format. In this case, we are returning all the ids of the topics
            this user manages.
        """
        managed_topics = cls.get_all().filter(cls.manager_ids == user_id)
        managed_topic_ids = [right.id for right in managed_topics]

        return {
            'managed_topic_ids': managed_topic_ids
        }
