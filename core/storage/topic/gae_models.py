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

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.platform import models

from typing import Dict, List, Mapping, Optional, Sequence, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()


class TopicSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a topic snapshot."""

    pass


class TopicSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a topic snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class TopicCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to topics.

    A new instance of this model is created and saved every time a commit to
    TopicModel occurs.

    The id for this model is of the form 'topic-[topic_id]-[version]'.
    """

    # The id of the topic being edited.
    topic_id = datastore_services.StringProperty(indexed=True, required=True)

    @classmethod
    def get_instance_id(cls, topic_id: str, version: int) -> str:
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
            'topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class TopicModel(base_models.VersionedModel):
    """Model for storing Topics.

    This class should only be imported by the topic services file and the topic
    model test file.
    """

    SNAPSHOT_METADATA_CLASS = TopicSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TopicSnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = TopicCommitLogEntryModel
    ALLOW_REVERT = False

    # The name of the topic.
    name = datastore_services.StringProperty(required=True, indexed=True)
    # The canonical name of the topic, created by making `name` lowercase.
    canonical_name = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The abbreviated name of the topic.
    abbreviated_name = (
        datastore_services.StringProperty(indexed=True, default=''))
    # The thumbnail filename of the topic.
    thumbnail_filename = datastore_services.StringProperty(indexed=True)
    # The thumbnail background color of the topic.
    thumbnail_bg_color = datastore_services.StringProperty(indexed=True)
    # The thumbnail size in bytes of the topic.
    thumbnail_size_in_bytes = (
        datastore_services.IntegerProperty(indexed=True))
    # The description of the topic.
    description = datastore_services.TextProperty(indexed=False)
    # This consists of the list of objects referencing canonical stories that
    # are part of this topic.
    canonical_story_references = (
        datastore_services.JsonProperty(repeated=True, indexed=False))
    # This consists of the list of objects referencing additional stories that
    # are part of this topic.
    additional_story_references = (
        datastore_services.JsonProperty(repeated=True, indexed=False))
    # The schema version for the story reference object on each of the above 2
    # lists.
    story_reference_schema_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # This consists of the list of uncategorized skill ids that are not part of
    # any subtopic.
    uncategorized_skill_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # The list of subtopics that are part of the topic.
    subtopics = datastore_services.JsonProperty(repeated=True, indexed=False)
    # The schema version of the subtopic dict.
    subtopic_schema_version = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The id for the next subtopic.
    next_subtopic_id = datastore_services.IntegerProperty(required=True)
    # The ISO 639-1 code for the language this topic is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The url fragment of the topic.
    url_fragment = (
        datastore_services.StringProperty(required=True, indexed=True))
    # Whether to show practice tab in the Topic viewer page.
    practice_tab_is_displayed = datastore_services.BooleanProperty(
        required=True, default=False)
    # The content of the meta tag in the Topic viewer page.
    meta_tag_content = datastore_services.StringProperty(
        indexed=True, default='')
    # The page title fragment used in the Topic viewer web page.
    # For example, if the full Topic viewer web page title is
    # 'Learn Fractions | Add, Subtract, Multiply and Divide | Oppia'
    # the page title fragment field represents the middle value 'Add, Subtract,
    # Multiply and Divide'.
    page_title_fragment_for_web = datastore_services.StringProperty(
        required=True, indexed=True)
    # A diagnostic test contains a set of questions covering multiple topics and
    # based on the user's performance in the test, a topic is recommended to
    # them. Now, this field is used for listing the skill IDs from which the
    # questions should be fetched for the diagnostic test.
    skill_ids_for_diagnostic_test = datastore_services.StringProperty(
        repeated=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    # We expect Mapping because we want to allow models that inherit
    # from BaseModel as the values, if we used Dict this wouldn't be allowed.
    def _prepare_additional_models(self) -> Mapping[str, base_models.BaseModel]:
        """Prepares additional models needed for the commit process.

        Returns:
            dict(str, BaseModel). Additional models needed for
            the commit process. Contains the TopicRightsModel.
        """
        return {
            'rights_model': TopicRightsModel.get_by_id(self.id)
        }

    def compute_models_to_commit(
        self,
        committer_id: str,
        commit_type: str,
        commit_message: Optional[str],
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
            commit_message: str|None. The commit description message, for
                unpublished topics, it may be equal to None.
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

        # Here we use cast because we are narrowing down the type from
        # BaseModel to TopicRightsModel.
        topic_rights = cast(
            TopicRightsModel, additional_models['rights_model']
        )
        if topic_rights.topic_is_published:
            status = constants.ACTIVITY_STATUS_PUBLIC
        else:
            status = constants.ACTIVITY_STATUS_PRIVATE

        topic_commit_log_entry = TopicCommitLogEntryModel.create(
            self.id, self.version, committer_id, commit_type,
            commit_message, commit_cmds, status, False
        )
        topic_commit_log_entry.topic_id = self.id
        return {
            'snapshot_metadata_model': models_to_put['snapshot_metadata_model'],
            'snapshot_content_model': models_to_put['snapshot_content_model'],
            'commit_log_model': topic_commit_log_entry,
            'versioned_model': models_to_put['versioned_model'],
        }

    @classmethod
    def get_by_name(cls, topic_name: str) -> Optional[TopicModel]:
        """Gets TopicModel by topic_name. Returns None if the topic with
        name topic_name doesn't exist.

        Args:
            topic_name: str. The name of the topic.

        Returns:
            TopicModel|None. The topic model of the topic or None if not
            found.
        """
        return cls.get_all().filter(
            cls.canonical_name == topic_name.lower()
        ).get()

    @classmethod
    def get_by_url_fragment(cls, url_fragment: str) -> Optional[TopicModel]:
        """Gets TopicModel by url_fragment. Returns None if the topic with
        name url_fragment doesn't exist.

        Args:
            url_fragment: str. The url fragment of the topic.

        Returns:
            TopicModel|None. The topic model of the topic or None if not
            found.
        """
        # TODO(#10210): Make fetching by URL fragment faster.
        return cls.get_all().filter(cls.url_fragment == url_fragment).get()

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'canonical_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'abbreviated_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_size_in_bytes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'canonical_story_references':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'additional_story_references':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'story_reference_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'uncategorized_skill_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subtopics': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subtopic_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'next_subtopic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'meta_tag_content': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'page_title_fragment_for_web': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'practice_tab_is_displayed':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_ids_for_diagnostic_test':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class TopicSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia Topic.

    This should be used whenever the content blob of the topic is not
    needed (e.g. search results, etc).

    The key of each instance is the topic id.
    """

    # The name of the topic.
    name = datastore_services.StringProperty(required=True, indexed=True)
    # The canonical name of the topic, created by making `name` lowercase.
    canonical_name = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The ISO 639-1 code for the language this topic is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The description of the topic.
    description = datastore_services.TextProperty(indexed=False)
    # The url fragment of the topic.
    url_fragment = (
        datastore_services.StringProperty(required=True, indexed=True))

    # Time when the topic model was last updated (not to be
    # confused with last_updated, which is the time when the
    # topic *summary* model was last updated).
    topic_model_last_updated = (
        datastore_services.DateTimeProperty(required=True, indexed=True))
    # Time when the topic model was created (not to be confused
    # with created_on, which is the time when the topic *summary*
    # model was created).
    topic_model_created_on = (
        datastore_services.DateTimeProperty(required=True, indexed=True))
    # The number of canonical stories that are part of this topic.
    canonical_story_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The number of additional stories that are part of this topic.
    additional_story_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The total number of skills in the topic (including those that are
    # uncategorized).
    total_skill_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The total number of published chapters in the topic.
    total_published_node_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The number of skills that are not part of any subtopic.
    uncategorized_skill_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The number of subtopics of the topic.
    subtopic_count = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The thumbnail filename of the topic.
    thumbnail_filename = datastore_services.StringProperty(indexed=True)
    # The thumbnail background color of the topic.
    thumbnail_bg_color = datastore_services.StringProperty(indexed=True)
    version = datastore_services.IntegerProperty(required=True)
    # A dict that maps published story ids to lists of exploration ids.
    # Each list represents the story's published chapters' linked
    # exploration ids and each list of exploration ids is in the same
    # order as the story's published chapters. This dict is regenerated
    # whenever a story in this topic is updated, which occurs
    # in `topic_services.compute_summary_of_topic()`.
    published_story_exploration_mapping = datastore_services.JsonProperty(
        required=True)

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
            'name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'canonical_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_model_last_updated':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_model_created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'canonical_story_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'additional_story_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'total_skill_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'total_published_node_count':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'uncategorized_skill_count':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subtopic_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_filename': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'thumbnail_bg_color': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'published_story_exploration_mapping':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class TopicRightsSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a topic rights snapshot."""

    pass


class TopicRightsSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a topic rights snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data corresponding to a user: inside the content field
        there is a manager_ids field.

        The pseudonymization of this model is handled in the wipeout_service
        in the _pseudonymize_activity_models_with_associated_rights_models(),
        based on the content_user_ids field of the
        TopicRightsSnapshotMetadataModel.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether TopicRightsSnapshotContentModel references the given
        user. The manager_ids field is checked through content_user_ids field in
        the TopicRightsSnapshotMetadataModel.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return TopicRightsSnapshotMetadataModel.query(
            TopicRightsSnapshotMetadataModel.content_user_ids == user_id
        ).get(keys_only=True) is not None


class TopicRightsModel(base_models.VersionedModel):
    """Storage model for rights related to a topic.

    The id of each instance is the id of the corresponding topic.
    """

    SNAPSHOT_METADATA_CLASS = TopicRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TopicRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of the managers of this topic.
    manager_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    # Whether this topic is published.
    topic_is_published = datastore_services.BooleanProperty(
        indexed=True, required=True, default=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: manager_ids field.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether TopicRightsModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.manager_ids == user_id
        ).get(keys_only=True) is not None

    @classmethod
    def get_by_user(cls, user_id: str) -> Sequence[TopicRightsModel]:
        """Retrieves the rights object for all topics assigned to given user

        Args:
            user_id: str. ID of user.

        Returns:
            list(TopicRightsModel). The list of TopicRightsModel objects in
            which the given user is a manager.
        """
        return cls.query(cls.manager_ids == user_id).fetch()

    def compute_models_to_commit(
        self,
        committer_id: str,
        commit_type: str,
        commit_message: Optional[str],
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
            commit_message: str|None. The commit description message, for
                unpublished topic, it may be equal to None.
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

        if self.topic_is_published:
            status = constants.ACTIVITY_STATUS_PUBLIC
        else:
            status = constants.ACTIVITY_STATUS_PRIVATE

        topic_commit_log = TopicCommitLogEntryModel(
            id=('rights-%s-%s' % (self.id, self.version)),
            user_id=committer_id,
            topic_id=self.id,
            commit_type=commit_type,
            commit_message=commit_message,
            commit_cmds=commit_cmds,
            version=None,
            post_commit_status=status,
            post_commit_community_owned=False,
            post_commit_is_private=not self.topic_is_published
        )

        snapshot_metadata_model = models_to_put['snapshot_metadata_model']
        snapshot_metadata_model.content_user_ids = list(sorted(set(
            self.manager_ids)))

        commit_cmds_user_ids = set()
        for commit_cmd in commit_cmds:
            user_id_attribute_names = next(
                cmd['user_id_attribute_names']
                for cmd in feconf.TOPIC_RIGHTS_CHANGE_ALLOWED_COMMANDS
                if cmd['name'] == commit_cmd['cmd']
            )
            for user_id_attribute_name in user_id_attribute_names:
                user_id_attribute = commit_cmd[user_id_attribute_name]
                # Ruling out the possibility of Any other type for mypy type
                # checking.
                assert isinstance(user_id_attribute, str)
                commit_cmds_user_ids.add(user_id_attribute)
        snapshot_metadata_model.commit_cmds_user_ids = list(
            sorted(commit_cmds_user_ids))

        return {
            'snapshot_metadata_model': models_to_put['snapshot_metadata_model'],
            'snapshot_content_model': models_to_put['snapshot_content_model'],
            'commit_log_model': topic_commit_log,
            'versioned_model': models_to_put['versioned_model'],
        }

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance shared across users since multiple
        users contribute to topics and their rights.
        """
        return (
            base_models
            .MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS)

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'manager_ids': base_models.EXPORT_POLICY.EXPORTED,
            'topic_is_published': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_field_name_mapping_to_takeout_keys(cls) -> Dict[str, str]:
        """Defines the mapping of field names to takeout keys since this model
        is exported as one instance shared across users.
        """
        return {
            'manager_ids': 'managed_topic_ids'
        }

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, List[str]]:
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
