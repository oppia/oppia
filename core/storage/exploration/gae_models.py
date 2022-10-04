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

from __future__ import annotations

import datetime
import random
import string

from core import feconf
from core import utils
from core.constants import constants
from core.platform import models
import core.storage.base_model.gae_models as base_models

from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services  # pylint: disable=unused-import

datastore_services = models.Registry.import_datastore_services()


class ExplorationSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for an exploration snapshot."""

    pass


class ExplorationSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of an exploration snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


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
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: user_id field.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

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
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.get_multi().
    @classmethod
    def get_multi( # type: ignore[override]
        cls, exp_id: str, exp_versions: List[int]
    ) -> List[Optional[ExplorationCommitLogEntryModel]]:
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
        instance_ids = [cls.get_instance_id(exp_id, exp_version)
                        for exp_version in exp_versions]

        return super(ExplorationCommitLogEntryModel, cls).get_multi(
            instance_ids)

    @classmethod
    def get_instance_id(cls, exp_id: str, exp_version: int) -> str:
        """Returns ID of the exploration commit log entry model.

        Args:
            exp_id: str. The exploration id whose states are mapped.
            exp_version: int. The version of the exploration.

        Returns:
            str. A string containing exploration ID and
            exploration version.
        """
        return 'exploration-%s-%s' % (exp_id, exp_version)

    # TODO(#13523): Change the return value of the function below from
    # tuple(list, str|None, bool)  to a domain object.
    @classmethod
    def get_all_non_private_commits(
        cls,
        page_size: int,
        urlsafe_start_cursor: Optional[str],
        max_age: Optional[datetime.timedelta] = None
    ) -> Tuple[Sequence[ExplorationCommitLogEntryModel], Optional[str], bool]:
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

        Raises:
            ValueError. If the max age is other than datetime.timedelta
                instance or None.
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


class ExplorationModel(base_models.VersionedModel):
    """Versioned storage model for an Oppia exploration.

    This class should only be imported by the exploration services file
    and the exploration model test file.
    """

    SNAPSHOT_METADATA_CLASS = ExplorationSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ExplorationSnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = ExplorationCommitLogEntryModel
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
    # An boolean indicating whether further edits can be made to the
    # exploration.
    edits_allowed = datastore_services.BooleanProperty(
        default=True, indexed=True)

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
            'edits_allowed': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_exploration_count(cls) -> int:
        """Returns the total number of explorations."""
        return cls.get_all().count()

    # We expect Mapping because we want to allow models that inherit
    # from BaseModel as the values, if we used Dict this wouldn't be allowed.
    def _prepare_additional_models(self) -> Mapping[str, base_models.BaseModel]:
        """Prepares additional models needed for the commit process.

        Returns:
            dict(str, BaseModel). Additional models needed for
            the commit process. Contains the ExplorationRightsModel.
        """
        return {
            'rights_model': ExplorationRightsModel.get_by_id(self.id)
        }

    # Here we use MyPy ignore because super class (VersionedModel)
    # defines this 'additional_models' argument as broader type but
    # here we are sure that in this sub-class (ExplorationModel) argument
    # 'additional_models' is always going to be of type Dict[str,
    # ExplorationRightsModel]. So, due to this conflict in argument types,
    # a conflict in signatures occurred which causes MyPy to throw an
    # error. Thus, to avoid the error, we used ignore here.
    def compute_models_to_commit(  # type: ignore[override]
        self,
        committer_id: str,
        commit_type: str,
        commit_message: Optional[str],
        commit_cmds: base_models.AllowedCommitCmdsListType,
        additional_models: Mapping[str, ExplorationRightsModel]
    ) -> base_models.ModelsToPutDict:
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str|None. The commit description message or None for
                unpublished explorations.
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

        exploration_rights_model = additional_models['rights_model']
        exploration_commit_log = ExplorationCommitLogEntryModel.create(
            self.id, self.version,
            committer_id,
            commit_type,
            commit_message,
            commit_cmds,
            exploration_rights_model.status,
            exploration_rights_model.community_owned
        )
        exploration_commit_log.exploration_id = self.id
        return {
            'snapshot_metadata_model': models_to_put['snapshot_metadata_model'],
            'snapshot_content_model': models_to_put['snapshot_content_model'],
            'commit_log_model': exploration_commit_log,
            'versioned_model': models_to_put['versioned_model'],
        }

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.delete_multi().
    @classmethod
    def delete_multi( # type: ignore[override]
        cls,
        entity_ids: List[str],
        committer_id: str,
        commit_message: str,
        force_deletion: bool = False
    ) -> None:
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
        versioned_exp_models = cls.get_multi(entity_ids, include_deleted=True)

        super(ExplorationModel, cls).delete_multi(
            entity_ids, committer_id,
            commit_message, force_deletion=force_deletion)

        if not force_deletion:
            commit_log_models = []
            exp_rights_models = ExplorationRightsModel.get_multi(
                entity_ids, include_deleted=True)

            versioned_and_exp_rights_models = zip(
                versioned_exp_models, exp_rights_models)
            for model, rights_model in versioned_and_exp_rights_models:
                # Ruling out the possibility of None for mypy type checking.
                assert model is not None
                assert rights_model is not None
                exploration_commit_log = ExplorationCommitLogEntryModel.create(
                    model.id, model.version, committer_id,
                    feconf.COMMIT_TYPE_DELETE,
                    commit_message, [{'cmd': cls.CMD_DELETE_COMMIT}],
                    rights_model.status, rights_model.community_owned
                )
                exploration_commit_log.exploration_id = model.id
                commit_log_models.append(exploration_commit_log)
            ExplorationCommitLogEntryModel.update_timestamps_multi(
                commit_log_models)
            datastore_services.put_multi(commit_log_models)
        else:
            # Delete the ExplorationVersionHistoryModels if force_deletion is
            # True.
            versioned_exp_models_without_none = [
                model for model in versioned_exp_models
                if model is not None
            ]
            version_history_keys = []
            for model in versioned_exp_models_without_none:
                for version in range(1, model.version + 1):
                    version_history_id = (
                        ExplorationVersionHistoryModel.get_instance_id(
                            model.id, version
                        )
                    )
                    version_history_keys.append(datastore_services.Key(
                        ExplorationVersionHistoryModel, version_history_id))
            datastore_services.delete_multi(version_history_keys)

    # TODO(#15911): Here we use type Any because 'convert_to_valid_dict' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from here.
    @staticmethod
    def convert_to_valid_dict(snapshot_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Replace invalid fields and values in the ExplorationModel dict.
        Some old ExplorationModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a ExplorationModel from
        them. We need to remove or replace these fields and values.

        Args:
            snapshot_dict: dict. The content of the model. Some fields and field
                values might no longer exist in the ExplorationModel
                schema.

        Returns:
            dict. The content of the model. Only valid fields and values are
            present.
        """

        if 'skill_tags' in snapshot_dict:
            del snapshot_dict['skill_tags']
        if 'default_skin' in snapshot_dict:
            del snapshot_dict['default_skin']
        if 'skin_customizations' in snapshot_dict:
            del snapshot_dict['skin_customizations']

        return snapshot_dict

    # TODO(#15911): Here we use type Any because this '_reconstitute' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from the argument of '_reconstitute' method.
    def _reconstitute(
        self,
        snapshot_dict: Dict[str, Any]
    ) -> ExplorationModel:
        """Populates the model instance with the snapshot.
        Some old ExplorationSnapshotContentModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a ExplorationModel from
        them. We need to remove or replace these fields and values.

        Args:
            snapshot_dict: dict(str, *). The snapshot with the model
                property values.

        Returns:
            VersionedModel. The instance of the VersionedModel class populated
            with the snapshot.
        """

        self.populate(
            **ExplorationModel.convert_to_valid_dict(snapshot_dict))
        return self


class ExplorationContextModel(base_models.BaseModel):
    """Model for storing Exploration context.

    The ID of instances of this class is the ID of the exploration itself.
    """

    # The ID of the story that the exploration is a part of.
    story_id = datastore_services.StringProperty(required=True, indexed=True)

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
    def get_deletion_policy() -> base_models.DELETION_POLICY:
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
    def has_reference_to_user_id(cls, user_id: str) -> bool:
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

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: viewer_ids, voice_artist_ids, editor_ids,
        and owner_ids fields.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance shared across users since multiple
        users contribute to an exploration and have varying rights.
        """
        return (
            base_models
            .MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS)

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
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
            'status': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_field_name_mapping_to_takeout_keys(cls) -> Dict[str, str]:
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
    def has_reference_to_user_id(cls, user_id: str) -> bool:
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

    def save(
        self,
        committer_id: str,
        commit_message: str,
        commit_cmds: base_models.AllowedCommitCmdsListType
    ) -> None:
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
        super().commit(committer_id, commit_message, commit_cmds)

    # TODO(#15911): Here we use type Any because 'convert_to_valid_dict' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from here.
    @staticmethod
    def convert_to_valid_dict(model_dict: Dict[str, Any]) -> Dict[str, Any]:
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

        # The all_viewer_ids field was previously used in some versions of the
        # model, we need to remove it.
        if 'all_viewer_ids' in model_dict:
            del model_dict['all_viewer_ids']
        if 'translator_ids' in model_dict:
            del model_dict['translator_ids']

        # We need to remove pseudonymous IDs from all the fields that contain
        # user IDs.
        for field_name in (
                'owner_ids', 'editor_ids', 'voice_artist_ids', 'viewer_ids'):
            model_dict[field_name] = [
                user_id for user_id in model_dict[field_name]
                if not utils.is_pseudonymous_id(user_id)
            ]

        return model_dict

    # TODO(#15911): Here we use type Any because this '_reconstitute' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from the argument of '_reconstitute' method.
    def _reconstitute(
        self,
        snapshot_dict: Dict[str, Any]
    ) -> ExplorationRightsModel:
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
            commit_message: str|None. The commit description message or None for
                unpublished explorations.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
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

        snapshot_metadata_model = models_to_put['snapshot_metadata_model']
        snapshot_metadata_model.content_user_ids = list(sorted(
            set(self.owner_ids) |
            set(self.editor_ids) |
            set(self.voice_artist_ids) |
            set(self.viewer_ids)
        ))

        commit_cmds_user_ids = set()
        for commit_cmd in commit_cmds:
            user_id_attribute_names = next(
                cmd['user_id_attribute_names']
                for cmd in feconf.EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS
                if cmd['name'] == commit_cmd['cmd']
            )
            for user_id_attribute_name in user_id_attribute_names:
                user_id_name_value = commit_cmd[user_id_attribute_name]
                # Ruling out the possibility of any other type for mypy type
                # checking.
                assert isinstance(user_id_name_value, str)
                commit_cmds_user_ids.add(user_id_name_value)
        snapshot_metadata_model.commit_cmds_user_ids = list(
            sorted(commit_cmds_user_ids))

        # Create and delete events will already be recorded in the
        # ExplorationModel.
        if commit_type not in ['create', 'delete']:
            exploration_commit_log = ExplorationCommitLogEntryModel(
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
            )

            return {
                'snapshot_metadata_model': (
                    models_to_put['snapshot_metadata_model']),
                'snapshot_content_model': (
                    models_to_put['snapshot_content_model']),
                'commit_log_model': exploration_commit_log,
                'versioned_model': models_to_put['versioned_model'],
            }

        return models_to_put

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, List[str]]:
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


class TransientCheckpointUrlModel(base_models.BaseModel):
    """Model for storing the progress of a logged-out user."""

    # The exploration id.
    exploration_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The state name of the furthest reached checkpoint.
    furthest_reached_checkpoint_state_name = datastore_services.StringProperty(
        default=None)
    # The exploration version of the furthest reached checkpoint.
    furthest_reached_checkpoint_exp_version = (
        datastore_services.IntegerProperty(default=None))
    # The state name of the most recently reached checkpoint.
    most_recently_reached_checkpoint_state_name = (
        datastore_services.StringProperty(default=None))
    # The exploration version of the most recently reached checkpoint.
    most_recently_reached_checkpoint_exp_version = (
        datastore_services.IntegerProperty(default=None))

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
            'exploration_id':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'furthest_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'furthest_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'most_recently_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'most_recently_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def create(
        cls,
        exploration_id: str,
        unique_progress_url_id: str
    ) -> TransientCheckpointUrlModel:
        """Creates a new TransientCheckpointUrlModel instance and returns it.

        Note that the client is responsible for actually saving this entity to
        the datastore.

        Args:
            exploration_id: str. The ID of the exploration.
            unique_progress_url_id: str. The 6 digit long unique id
                assigned to the progress made by a logged-out user.

        Returns:
            TransientCheckpointUrlModel. The newly created
            TransientCheckpointUrlModel instance.
        """
        entity = cls(
            id=unique_progress_url_id,
            exploration_id=exploration_id)

        entity.update_timestamps()
        entity.put()
        return entity

    @classmethod
    def get_new_progress_id(cls) -> str:
        """Gets a new unique progress url id for the logged-out user.

        The returned id is guaranteed to be unique among all instances of this
        entity.

        Returns:
            str. New unique progress url id.

        Raises:
            Exception. An ID cannot be generated within a reasonable number
                of attempts.
        """
        for _ in range(base_models.MAX_RETRIES):
            new_id = '%s' % ''.join(
                random.choice(string.ascii_letters)
                for _ in range(constants.MAX_PROGRESS_URL_ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception('New id generator is producing too many collisions.')


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
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: viewer_ids, voice_artist_ids, editor_ids, owner_ids,
        contributor_ids, and contributors_summary fields.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
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
    def get_non_private(cls) -> Sequence[ExpSummaryModel]:
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
    def get_top_rated(cls, limit: int) -> Sequence[ExpSummaryModel]:
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
    def get_private_at_least_viewable(
        cls, user_id: str
    ) -> Sequence[ExpSummaryModel]:
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
    def get_at_least_editable(cls, user_id: str) -> Sequence[ExpSummaryModel]:
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
    def get_recently_published(cls, limit: int) -> Sequence[ExpSummaryModel]:
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
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model data has already been exported as a part of the
        ExplorationModel and thus does not need a separate export.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because noteworthy details that belong to this model have
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


class ExplorationVersionHistoryModel(base_models.BaseModel):
    """Version history model for an oppia exploration.

    Version history means some information about the previous commit on each
    state and the exploration metadata at a particular version of the
    exploration. The information about each state includes the version
    number of the exploration on which the state was previously edited,
    the name of the state at the previous version and the id of the user who
    committed those changes. For metadata, the information includes the
    version number of the exploration on which the metadata was previously
    edited and the id of the user who committed those changes.

    A new instance of this model is created each time a new exploration
    is created or some changes are saved in an exploration.

    The id of the model is generated as follows:
    {exploration_id}-{exploration_version}
    """

    # The id of the corresponding exploration.
    exploration_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The version of the corresponding exploration.
    exploration_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The details of the previous commit on each state at a particular
    # version of the exploration. The json structure will look like the
    # following:
    # {
    #   [state_name: str]: {
    #     "previously_edited_in_version": int,
    #     "state_name_in_previous_version": str,
    #     "committer_id": str
    #   }
    # }
    # The json object can have multiple keys in this case depending on
    # the number of states.
    state_version_history = datastore_services.JsonProperty(
        default={}, indexed=False)
    # The exploration version on which the metadata was previously edited.
    # If its value is v, then it will indicate that the metadata was modified
    # when the exploration was updated from version v -> v + 1.
    # Its value will be None during the creation of an exploration. The value
    # None indicates that the metadata was not modified after the creation of
    # the exploration.
    metadata_last_edited_version_number = datastore_services.IntegerProperty(
        indexed=True)
    # The user id of the user who committed the latest changes to the
    # exploration metadata.
    metadata_last_edited_committer_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The user ids of the users who did the 'previous commit' on each state
    # in this version of the exploration. It is required during the
    # wipeout process to query for the models efficiently.
    committer_ids = datastore_services.StringProperty(
        indexed=True, repeated=True)

    @classmethod
    def get_instance_id(cls, exp_id: str, exp_version: int) -> str:
        """Returns ID of the exploration version history model.

        Args:
            exp_id: str. The ID of the exploration.
            exp_version: int. The version of the exploration.

        Returns:
            str. A string containing exploration ID and
            exploration version.
        """
        return '%s.%s' % (exp_id, exp_version)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether ExplorationVersionHistoryModel references
        the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return ExplorationVersionHistoryModel.query(
            ExplorationVersionHistoryModel.committer_ids == user_id
        ).get(keys_only=True) is not None

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize corresponding to a user:
        committer_ids field, metadata_last_edited_committer_id field and the
        user ids stored in state_version_history field.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """All the noteworthy data in this model which are related to a
        user's contributions to an exploration is already contained in various
        user models such as UserContributionsModel which fall under Takeout.
        Hence, this model will not export any data.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because the all the noteworthy data related to a user's contributions
        to an exploration is already contained in various user models such
        as UserContributionsModel which fall under Takeout.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_version_history': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'metadata_last_edited_version_number': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'metadata_last_edited_committer_id': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'committer_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
