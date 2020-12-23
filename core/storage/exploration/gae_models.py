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

"""Model for an Oppia exploration."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.platform import models
import core.storage.base_model.gae_models as base_models
import feconf
import python_utils
import utils

datastore_services = models.Registry.import_datastore_services()


class ExplorationSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for an exploration snapshot."""

    pass


class ExplorationSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of an exploration snapshot."""

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class ExplorationModel(base_models.VersionedModel):
    """Versioned storage model for an Oppia exploration.

    This class should only be imported by the exploration services file
    and the exploration model test file.
    """

    SNAPSHOT_METADATA_CLASS = ExplorationSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ExplorationSnapshotContentModel
    ALLOW_REVERT = True

    # What this exploration is called.
    title = datastore_services.StringProperty(required=True)
    # The category this exploration belongs to.
    category = datastore_services.StringProperty(required=True, indexed=True)
    # The objective of this exploration.
    objective = datastore_services.TextProperty(default='', indexed=False)
    # The ISO 639-1 code for the language this exploration is written in.
    language_code = datastore_services.StringProperty(
        default=constants.DEFAULT_LANGUAGE_CODE, indexed=True)
    # Tags (topics, skills, concepts, etc.) associated with this
    # exploration.
    tags = datastore_services.StringProperty(repeated=True, indexed=True)
    # A blurb for this exploration.
    blurb = datastore_services.TextProperty(default='', indexed=False)
    # 'Author notes' for this exploration.
    author_notes = datastore_services.TextProperty(default='', indexed=False)

    # The version of the states blob schema.
    states_schema_version = datastore_services.IntegerProperty(
        required=True, default=0, indexed=True)
    # The name of the initial state of this exploration.
    init_state_name = (
        datastore_services.StringProperty(required=True, indexed=True))
    # A dict representing the states of this exploration. This dict should
    # not be empty.
    states = datastore_services.JsonProperty(default={}, indexed=False)
    # The dict of parameter specifications associated with this exploration.
    # Each specification is a dict whose keys are param names and whose values
    # are each dicts with a single key, 'obj_type', whose value is a string.
    param_specs = datastore_services.JsonProperty(default={}, indexed=False)
    # The list of parameter changes to be performed once at the start of a
    # reader's encounter with an exploration.
    param_changes = (
        datastore_services.JsonProperty(repeated=True, indexed=False))
    # A boolean indicating whether automatic text-to-speech is enabled in
    # this exploration.
    auto_tts_enabled = (
        datastore_services.BooleanProperty(default=True, indexed=True))
    # A boolean indicating whether correctness feedback is enabled in this
    # exploration.
    correctness_feedback_enabled = datastore_services.BooleanProperty(
        default=False, indexed=True)

    # DEPRECATED in v2.0.0.rc.2. Do not use. Retaining it here because deletion
    # caused GAE to raise an error on fetching a specific version of the
    # exploration model.
    # TODO(sll): Fix this error and remove this property.
    skill_tags = datastore_services.StringProperty(repeated=True, indexed=True)
    # DEPRECATED in v2.0.1. Do not use.
    # TODO(sll): Remove this property from the model.
    default_skin = datastore_services.StringProperty(default='conversation_v1')
    # DEPRECATED in v2.5.4. Do not use.
    skin_customizations = datastore_services.JsonProperty(indexed=False)

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'category': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'objective': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'blurb': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'author_notes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'states_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'init_state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'states': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'param_specs': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'param_changes': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'auto_tts_enabled': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'correctness_feedback_enabled':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'default_skin': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skin_customizations': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_exploration_count(cls):
        """Returns the total number of explorations."""
        return cls.get_all().count()

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
        super(ExplorationModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        exp_rights = ExplorationRightsModel.get_by_id(self.id)

        # TODO(msl): Test if put_async() leads to any problems (make
        # sure summary dicts get updated correctly when explorations
        # are changed).
        exploration_commit_log = ExplorationCommitLogEntryModel.create(
            self.id, self.version, committer_id, commit_type, commit_message,
            commit_cmds, exp_rights.status, exp_rights.community_owned
        )
        exploration_commit_log.exploration_id = self.id
        exploration_commit_log.update_timestamps()
        exploration_commit_log.put()

    @classmethod
    def delete_multi(
            cls, entity_ids, committer_id, commit_message,
            force_deletion=False):
        """Deletes the given cls instances with the given entity_ids.

        Note that this extends the superclass method.

        Args:
            entity_ids: list(str). Ids of entities to delete.
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str. The commit description message.
            force_deletion: bool. If True these models are deleted completely
                from storage, otherwise there are only marked as deleted.
                Default is False.
        """
        super(ExplorationModel, cls).delete_multi(
            entity_ids, committer_id,
            commit_message, force_deletion=force_deletion)

        if not force_deletion:
            commit_log_models = []
            exp_rights_models = ExplorationRightsModel.get_multi(
                entity_ids, include_deleted=True)
            versioned_models = cls.get_multi(entity_ids, include_deleted=True)

            versioned_and_exp_rights_models = python_utils.ZIP(
                versioned_models, exp_rights_models)
            for model, rights_model in versioned_and_exp_rights_models:
                exploration_commit_log = ExplorationCommitLogEntryModel.create(
                    model.id, model.version, committer_id,
                    cls._COMMIT_TYPE_DELETE,
                    commit_message, [{'cmd': cls.CMD_DELETE_COMMIT}],
                    rights_model.status, rights_model.community_owned
                )
                exploration_commit_log.exploration_id = model.id
                commit_log_models.append(exploration_commit_log)
            ExplorationCommitLogEntryModel.update_timestamps_multi(
                commit_log_models)
            datastore_services.put_multi_async(commit_log_models)


class ExplorationContextModel(base_models.BaseModel):
    """Model for storing Exploration context.

    The ID of instances of this class is the ID of the exploration itself.
    """

    # The ID of the story that the exploration is a part of.
    story_id = datastore_services.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user():
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'story_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class ExplorationRightsSnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for an exploration rights snapshot."""

    pass


class ExplorationRightsSnapshotContentModel(
        base_models.BaseSnapshotContentModel):
    """Storage model for the content of an exploration rights snapshot."""

    @staticmethod
    def get_deletion_policy():
        """Model contains data to pseudonymize or delete corresponding
        to a user: inside the content field there are owner_ids, editor_ids,
        voice_artist_ids, and viewer_ids fields.

        The pseudonymization of this model is handled in the wipeout_service
        in the _pseudonymize_activity_models_with_associated_rights_models(),
        based on the content_user_ids field of the
        ExplorationRightsSnapshotMetadataModel.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExplorationRightsSnapshotContentModel references
        the given user. The owner_ids, editor_ids, voice_artist_ids,
        and viewer_ids fields are checked through content_user_ids field in
        the ExplorationRightsSnapshotMetadataModel.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return ExplorationRightsSnapshotMetadataModel.query(
            ExplorationRightsSnapshotMetadataModel.content_user_ids == user_id
        ).get(keys_only=True) is not None


class ExplorationRightsModel(base_models.VersionedModel):
    """Storage model for rights related to an exploration.

    The id of each instance is the id of the corresponding exploration.
    """

    SNAPSHOT_METADATA_CLASS = ExplorationRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ExplorationRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of owners of this exploration.
    owner_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this exploration.
    editor_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to voiceover this exploration.
    voice_artist_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))
    # The user_ids of users who are allowed to view this exploration.
    viewer_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    # Whether this exploration is owned by the community.
    community_owned = (
        datastore_services.BooleanProperty(indexed=True, default=False))
    # The exploration id which this exploration was cloned from. If None, this
    # exploration was created from scratch.
    cloned_from = datastore_services.StringProperty()
    # For private explorations, whether this exploration can be viewed
    # by anyone who has the URL. If the exploration is not private, this
    # setting is ignored.
    viewable_if_private = (
        datastore_services.BooleanProperty(indexed=True, default=False))
    # Time, in milliseconds, when the exploration was first published.
    first_published_msec = (
        datastore_services.FloatProperty(indexed=True, default=None))

    # The publication status of this exploration.
    status = datastore_services.StringProperty(
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
        ]
    )
    # DEPRECATED in v2.8.3. Do not use.
    translator_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))

    @staticmethod
    def get_deletion_policy():
        """Model contains data to pseudonymize or delete corresponding
        to a user: viewer_ids, voice_artist_ids, editor_ids,
        and owner_ids fields.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @staticmethod
    def get_model_association_to_user():
        """Model is exported as one instance shared across users since multiple
        users contribute to an exploration and have varying rights.
        """
        return (
            base_models
            .MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS)

    @classmethod
    def get_export_policy(cls):
        """Model contains data to export corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'owner_ids': base_models.EXPORT_POLICY.EXPORTED,
            'editor_ids': base_models.EXPORT_POLICY.EXPORTED,
            'voice_artist_ids': base_models.EXPORT_POLICY.EXPORTED,
            'viewer_ids': base_models.EXPORT_POLICY.EXPORTED,
            'community_owned': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'cloned_from': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'viewable_if_private': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'first_published_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            # DEPRECATED in v2.8.3., so translator_ids are not exported.
            'translator_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_field_name_mapping_to_takeout_keys(cls):
        """Defines the mapping of field names to takeout keys since this model
        is exported as one instance shared across users.
        """
        return {
            'owner_ids': 'owned_exploration_ids',
            'editor_ids': 'editable_exploration_ids',
            'viewer_ids': 'viewable_exploration_ids',
            'voice_artist_ids': 'voiced_exploration_ids'
        }

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExplorationRightsModel reference user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.owner_ids == user_id,
            cls.editor_ids == user_id,
            cls.voice_artist_ids == user_id,
            cls.viewer_ids == user_id
        )).get(keys_only=True) is not None

    def save(self, committer_id, commit_message, commit_cmds):
        """Saves a new version of the exploration, updating the Exploration
        datastore model.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. The type of the command. A full list of command
                        types can be found in core/domain/exp_domain.py.
                and then additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number',
                 'version_number': 4}
        """
        super(ExplorationRightsModel, self).commit(
            committer_id, commit_message, commit_cmds)

    @staticmethod
    def convert_to_valid_dict(model_dict):
        """Replace invalid fields and values in the ExplorationRightsModel dict.

        Some old ExplorationRightsSnapshotContentModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a ExplorationRightsModel from
        them. We need to remove or replace these fields and values.

        Args:
            model_dict: dict. The content of the model. Some fields and field
                values might no longer exist in the ExplorationRightsModel
                schema.

        Returns:
            dict. The content of the model. Only valid fields and values are
            present.
        """
        # The all_viewer_ids field was previously used in some versions of the
        # model, we need to remove it.
        if 'all_viewer_ids' in model_dict:
            del model_dict['all_viewer_ids']

        # The status field could historically take the value 'publicized', this
        # value is now equivalent to 'public'.
        if model_dict['status'] == 'publicized':
            model_dict['status'] = constants.ACTIVITY_STATUS_PUBLIC

        # The voice_artist_ids field was previously named translator_ids. We
        # need to move the values from translator_ids field to voice_artist_ids
        # and delete translator_ids.
        if 'translator_ids' in model_dict and model_dict['translator_ids']:
            model_dict['voice_artist_ids'] = model_dict['translator_ids']
            model_dict['translator_ids'] = []

        # We need to remove pseudonymous IDs from all the fields that contain
        # user IDs.
        for field_name in (
                'owner_ids', 'editor_ids', 'voice_artist_ids', 'viewer_ids'):
            model_dict[field_name] = [
                user_id for user_id in model_dict[field_name]
                if not utils.is_pseudonymous_id(user_id)
            ]

        return model_dict

    def _reconstitute(self, snapshot_dict):
        """Populates the model instance with the snapshot.

        Some old ExplorationRightsSnapshotContentModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a ExplorationRightsModel from
        them. We need to remove or replace these fields and values.

        Args:
            snapshot_dict: dict(str, *). The snapshot with the model
                property values.

        Returns:
            VersionedModel. The instance of the VersionedModel class populated
            with the the snapshot.
        """
        self.populate(
            **ExplorationRightsModel.convert_to_valid_dict(snapshot_dict))
        return self

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
                made in this model, should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """

        super(ExplorationRightsModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        # Create and delete events will already be recorded in the
        # ExplorationModel.
        if commit_type not in ['create', 'delete']:
            # TODO(msl): Test if put_async() leads to any problems (make
            # sure summary dicts get updated correctly when explorations
            # are changed).
            ExplorationCommitLogEntryModel(
                id=('rights-%s-%s' % (self.id, self.version)),
                user_id=committer_id,
                exploration_id=self.id,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=None,
                post_commit_status=self.status,
                post_commit_community_owned=self.community_owned,
                post_commit_is_private=(
                    self.status == constants.ACTIVITY_STATUS_PRIVATE)
            ).put_async()

        snapshot_metadata_model = self.SNAPSHOT_METADATA_CLASS.get(
            self.get_snapshot_id(self.id, self.version))
        snapshot_metadata_model.content_user_ids = list(sorted(
            set(self.owner_ids) |
            set(self.editor_ids) |
            set(self.voice_artist_ids) |
            set(self.viewer_ids)
        ))

        commit_cmds_user_ids = set()
        for commit_cmd in commit_cmds:
            user_id_attribute_names = python_utils.NEXT(
                cmd['user_id_attribute_names']
                for cmd in feconf.EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS
                if cmd['name'] == commit_cmd['cmd']
            )
            for user_id_attribute_name in user_id_attribute_names:
                commit_cmds_user_ids.add(commit_cmd[user_id_attribute_name])
        snapshot_metadata_model.commit_cmds_user_ids = list(
            sorted(commit_cmds_user_ids))

        snapshot_metadata_model.update_timestamps()
        snapshot_metadata_model.put()

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Export user-relevant properties of ExplorationRightsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict or None. The user-relevant properties of ExplorationRightsModel
            in a python dict format. In this case, we are returning all the
            ids of explorations that the user is connected to, so they either
            own, edit, voice, or have permission to view.
        """
        owned_explorations = cls.get_all().filter(cls.owner_ids == user_id)
        editable_explorations = cls.get_all().filter(cls.editor_ids == user_id)
        voiced_explorations = (
            cls.get_all().filter(cls.voice_artist_ids == user_id))
        viewable_explorations = cls.get_all().filter(cls.viewer_ids == user_id)

        owned_exploration_ids = [exp.key.id() for exp in owned_explorations]
        editable_exploration_ids = (
            [exp.key.id() for exp in editable_explorations])
        voiced_exploration_ids = [exp.key.id() for exp in voiced_explorations]
        viewable_exploration_ids = (
            [exp.key.id() for exp in viewable_explorations])

        return {
            'owned_exploration_ids': owned_exploration_ids,
            'editable_exploration_ids': editable_exploration_ids,
            'voiced_exploration_ids': voiced_exploration_ids,
            'viewable_exploration_ids': viewable_exploration_ids
        }


class ExplorationCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to explorations.

    A new instance of this model is created and saved every time a commit to
    ExplorationModel or ExplorationRightsModel occurs.

    The id for this model is of the form
    'exploration-[exploration_id]-[version]'.
    """

    # The id of the exploration being edited.
    exploration_id = (
        datastore_services.StringProperty(indexed=True, required=True))

    @staticmethod
    def get_deletion_policy():
        """Model contains data to pseudonymize or delete corresponding
        to a user: user_id field.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @staticmethod
    def get_model_association_to_user():
        """This model is only stored for archive purposes. The commit log of
        entities is not related to personal user data.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user. This
        model is only stored for archive purposes. The commit log of
        entities is not related to personal user data.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_multi(cls, exp_id, exp_versions):
        """Gets the ExplorationCommitLogEntryModels for the given exploration
        id and exploration versions.

        Args:
            exp_id: str. The id of the exploration.
            exp_versions: list(int). The versions of the exploration.

        Returns:
            list(ExplorationCommitLogEntryModel). The list of
            ExplorationCommitLogEntryModel instances which matches the given
            exp_id and exp_versions.
        """
        instance_ids = [cls._get_instance_id(exp_id, exp_version)
                        for exp_version in exp_versions]

        return super(ExplorationCommitLogEntryModel, cls).get_multi(
            instance_ids)

    @classmethod
    def _get_instance_id(cls, exp_id, exp_version):
        """Returns ID of the exploration commit log entry model.

        Args:
            exp_id: str. The exploration id whose states are mapped.
            exp_version: int. The version of the exploration.

        Returns:
            str. A string containing exploration ID and
            exploration version.
        """
        return 'exploration-%s-%s' % (exp_id, exp_version)

    @classmethod
    def get_all_non_private_commits(
            cls, page_size, urlsafe_start_cursor, max_age=None):
        """Fetches a list of all the non-private commits sorted by their
        last updated attribute.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.
            max_age: datetime.timedelta. The maximum time duration within which
                commits are needed.

        Returns:
            3-tuple of (results, cursor, more). Created no earlier than the
            max_age before the current time where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this will
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """

        if not isinstance(max_age, datetime.timedelta) and max_age is not None:
            raise ValueError(
                'max_age must be a datetime.timedelta instance or None.')

        query = cls.query(cls.post_commit_is_private == False)  # pylint: disable=singleton-comparison
        if max_age:
            query = query.filter(
                cls.last_updated >= datetime.datetime.utcnow() - max_age)
        return cls._fetch_page_sorted_by_last_updated(
            query, page_size, urlsafe_start_cursor)


class ExpSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia exploration.

    This should be used whenever the content blob of the exploration is not
    needed (e.g. in search results, etc).

    A ExpSummaryModel instance stores the following information:

        id, title, category, objective, language_code, tags,
        last_updated, created_on, status (private, public),
        community_owned, owner_ids, editor_ids,
        viewer_ids, version.

    The key of each instance is the exploration id.
    """

    # What this exploration is called.
    title = datastore_services.StringProperty(required=True)
    # The category this exploration belongs to.
    category = datastore_services.StringProperty(required=True, indexed=True)
    # The objective of this exploration.
    objective = datastore_services.TextProperty(required=True, indexed=False)
    # The ISO 639-1 code for the language this exploration is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # Tags associated with this exploration.
    tags = datastore_services.StringProperty(repeated=True, indexed=True)

    # Aggregate user-assigned ratings of the exploration.
    ratings = datastore_services.JsonProperty(default=None, indexed=False)

    # Scaled average rating for the exploration.
    scaled_average_rating = datastore_services.FloatProperty(indexed=True)

    # Time when the exploration model was last updated (not to be
    # confused with last_updated, which is the time when the
    # exploration *summary* model was last updated).
    exploration_model_last_updated = (
        datastore_services.DateTimeProperty(indexed=True))
    # Time when the exploration model was created (not to be confused
    # with created_on, which is the time when the exploration *summary*
    # model was created).
    exploration_model_created_on = (
        datastore_services.DateTimeProperty(indexed=True))
    # Time when the exploration was first published.
    first_published_msec = datastore_services.FloatProperty(indexed=True)

    # The publication status of this exploration.
    status = datastore_services.StringProperty(
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
        ]
    )

    # Whether this exploration is owned by the community.
    community_owned = (
        datastore_services.BooleanProperty(required=True, indexed=True))

    # The user_ids of owners of this exploration.
    owner_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this exploration.
    editor_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to voiceover this exploration.
    voice_artist_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))
    # The user_ids of users who are allowed to view this exploration.
    viewer_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who have contributed (humans who have made a
    # positive (not just a revert) change to the exploration's content).
    # NOTE TO DEVELOPERS: contributor_ids and contributors_summary need to be
    # synchronized, meaning that the keys in contributors_summary need be
    # equal to the contributor_ids list.
    contributor_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))
    # A dict representing the contributors of non-trivial commits to this
    # exploration. Each key of this dict is a user_id, and the corresponding
    # value is the number of non-trivial commits that the user has made.
    contributors_summary = (
        datastore_services.JsonProperty(default={}, indexed=False))
    # The version number of the exploration after this commit. Only populated
    # for commits to an exploration (as opposed to its rights, etc.).
    version = datastore_services.IntegerProperty()

    @staticmethod
    def get_deletion_policy():
        """Model contains data to pseudonymize or delete corresponding
        to a user: viewer_ids, voice_artist_ids, editor_ids, owner_ids,
        contributor_ids, and contributors_summary fields.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExpSummaryModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.owner_ids == user_id,
            cls.editor_ids == user_id,
            cls.voice_artist_ids == user_id,
            cls.viewer_ids == user_id,
            cls.contributor_ids == user_id
        )).get(keys_only=True) is not None

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private ExpSummary models.

        Returns:
            iterable. An iterable with non-private ExpSummary models.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status != constants.ACTIVITY_STATUS_PRIVATE
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_top_rated(cls, limit):
        """Fetches the top-rated exp summaries that are public in descending
        order of scaled_average_rating.

        Args:
            limit: int. The maximum number of results to return.

        Returns:
            iterable. An iterable with the top rated exp summaries that are
            public in descending order of scaled_average_rating.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == constants.ACTIVITY_STATUS_PUBLIC
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.scaled_average_rating
        ).fetch(limit)

    @classmethod
    def get_private_at_least_viewable(cls, user_id):
        """Fetches private exp summaries that are at least viewable by the
        given user.

        Args:
            user_id: str. The id of the given user.

        Returns:
            iterable. An iterable with private exp summaries that are at least
            viewable by the given user.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == constants.ACTIVITY_STATUS_PRIVATE
        ).filter(
            datastore_services.any_of(
                ExpSummaryModel.owner_ids == user_id,
                ExpSummaryModel.editor_ids == user_id,
                ExpSummaryModel.voice_artist_ids == user_id,
                ExpSummaryModel.viewer_ids == user_id)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_at_least_editable(cls, user_id):
        """Fetches exp summaries that are at least editable by the given user.

        Args:
            user_id: str. The id of the given user.

        Returns:
            iterable. An iterable with exp summaries that are at least
            editable by the given user.
        """
        return ExpSummaryModel.query().filter(
            datastore_services.any_of(
                ExpSummaryModel.owner_ids == user_id,
                ExpSummaryModel.editor_ids == user_id)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_recently_published(cls, limit):
        """Fetches exp summaries that are recently published.

        Args:
            limit: int. The maximum number of results to return.

        Returns:
            iterable. An iterable with exp summaries that are
            recently published. The returned list is sorted by the time of
            publication with latest being first in the list.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == constants.ACTIVITY_STATUS_PUBLIC
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.first_published_msec
        ).fetch(limit)

    @staticmethod
    def get_model_association_to_user():
        """Model data has already been exported as a part of the
        ExplorationModel and thus does not need a separate export.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user, but this isn't exported
        because because noteworthy details that belong to this model have
        already been exported as a part of the ExplorationModel.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'category': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'objective': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'ratings': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'scaled_average_rating': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_model_last_updated':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_model_created_on':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'first_published_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'community_owned': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'owner_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'editor_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'voice_artist_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'viewer_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'contributor_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'contributors_summary': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
