# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Jobs for queries personalized to individual users."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import inspect

from core import jobs
from core.domain import rights_manager
from core.domain import topic_domain
from core.platform import models
import feconf
import python_utils

(
    base_models, collection_models,
    exp_models, question_models, skill_models,
    topic_models, user_models) = models.Registry.import_models(
        [models.NAMES.base_model, models.NAMES.collection,
         models.NAMES.exploration, models.NAMES.question, models.NAMES.skill,
         models.NAMES.topic, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

# These models have around hundred thousand datastore entries on production and
# need to be in a separate one-off job in order to make the one-off jobs more
# efficient.
SEPARATE_MODEL_CLASSES = [
    exp_models.ExplorationCommitLogEntryModel,
    exp_models.ExplorationSnapshotMetadataModel]


def replace_gae_ids(gae_ids):
    """Replace GAE IDs with user IDs in list.

    Args:
        gae_ids: list(str). GAE IDs which should be replaced.

    Returns:
        list(str). New user IDs.

    Raises:
        MissingUserException: UserSettingsModel with GAE ID doesn't exist.
    """
    new_ids = []
    for gae_id in gae_ids:
        if gae_id in feconf.SYSTEM_USERS:
            new_ids.append(gae_id)
        else:
            user_settings_model = (
                user_models.UserSettingsModel.get_by_gae_id(gae_id))
            if not user_settings_model:
                raise MissingUserException(gae_id)
            new_ids.append(user_settings_model.id)

    return new_ids


def replace_gae_id(gae_id):
    """Replace GAE ID with user ID.

    Args:
        gae_id: str. GAE ID which should be replaced.

    Returns:
        str. New user ID.

    Raises:
        MissingUserException: UserSettingsModel with GAE ID doesn't exist.
    """
    return replace_gae_ids([gae_id])


class MissingUserException(Exception):
    """Exception for cases when the user doesn't exist."""
    pass


class CreateNewUsersMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for creating new UserSettingsModels with new user ids set.
    This migration doesn't handle the replacement of old user ids in the other
    models, this is done by the UserIdMigrationJob. The UserIdMigrationJob needs
    to be run directly after this job to ensure data consistency.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over one type of entity class.
        super(CreateNewUsersMigrationJob, cls).enqueue(job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        if user_model.id != user_model.gae_id:
            yield ('ALREADY MIGRATED', (user_model.gae_id, user_model.id))
            return

        old_model = user_models.UserSettingsModel.get_by_id(user_model.gae_id)
        model_values = old_model.to_dict()
        model_values['id'] = user_models.UserSettingsModel.get_new_id('')
        new_model = user_models.UserSettingsModel(**model_values)

        def _replace_model():
            """Replace old model with new one."""
            new_model.put(update_last_updated_time=False)
            old_model.delete()

        transaction_services.run_in_transaction(_replace_model)
        yield ('SUCCESS', (new_model.gae_id, new_model.id))

    @staticmethod
    def reduce(key, old_new_user_id_tuples):
        """Implements the reduce function for this job."""
        yield (key, len(old_new_user_id_tuples))


class UserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for replacing the old user ids with new user ids in all
    the models according to the values in UserSettingsModel. This migration
    doesn't handle snapshot content models that can contain user ID, these are
    handled by SnapshotsUserIdMigrationJob. The SnapshotsUserIdMigrationJob
    needs to be run directly after this job to ensure data consistency.
    """

    @staticmethod
    def _copy_model_with_new_id(model_class, old_user_id, new_user_id):
        """Create new model with same values but new id.

        Args:
            model_class: class. The class of the migrated model.
            old_user_id: str. The old (GAE) ID of the user being migrated.
            new_user_id: str. The newly generated ID of the user being migrated.

        Returns:
            optional((str, (str, str)).
        """
        if model_class.get_by_id(new_user_id) is not None:
            # Some models can be already migrated and there is no need to
            # migrate them again.
            return ('ALREADY MIGRATED', (old_user_id, new_user_id))

        old_model = model_class.get_by_id(old_user_id)
        if not old_model:
            # Some models are defined only for some users (for example
            # UserSubscribersModel, is only defined for users who actually have
            # at least one subscriber) that is why we are okay with the fact
            # that model is None.
            return ('MISSING OLD MODEL', (old_user_id, new_user_id))
        model_values = old_model.to_dict()
        model_values['id'] = new_user_id
        new_model = model_class(**model_values)

        def _replace_model():
            """Replace old model with new one."""
            new_model.put(update_last_updated_time=False)
            old_model.delete()

        transaction_services.run_in_transaction(_replace_model)

    @staticmethod
    def _copy_model_with_new_id_and_user_id(
            model_class, old_user_id, new_user_id):
        """Create new model with same values but new id and user_id.

        Args:
            model_class: class. The class of the migrated model.
            old_user_id: str. The old (GAE) ID of the user being migrated.
            new_user_id: str. The newly generated ID of the user being migrated.
        """
        max_number_of_models_in_transaction = 10
        old_models = model_class.query(
            model_class.user_id == old_user_id).fetch()
        new_models = []
        for old_model in old_models:
            model_values = old_model.to_dict()
            model_values['id'] = old_model.id.replace(old_user_id, new_user_id)
            model_values['user_id'] = new_user_id
            new_models.append(model_class(**model_values))

        def _replace_models(new_models_sub, old_models_sub):
            """Replace old models with new ones.

            Args:
                new_models_sub: list(BaseModel). New models that should be
                    created.
                old_models_sub: list(BaseModel). Old models that should be
                    deleted.
            """
            model_class.put_multi(
                new_models_sub, update_last_updated_time=False)
            model_class.delete_multi(old_models_sub)

        # We limit the number of models in one transaction because there is
        # a limit on Google Cloud for the number of entity groups written to the
        # datastore in one transaction.
        for i in python_utils.RANGE(
                0, len(old_models), max_number_of_models_in_transaction):
            transaction_services.run_in_transaction(
                _replace_models,
                new_models[i:i + max_number_of_models_in_transaction],
                old_models[i:i + max_number_of_models_in_transaction])

    @staticmethod
    def _change_model_with_one_user_id_field(
            model_class, old_user_id, new_user_id):
        """Replace field in model with new user id.

        Args:
            model_class: class. The class of the migrated model.
            old_user_id: str. The old (GAE) ID of the user being migrated.
            new_user_id: str. The newly generated ID of the user being migrated.
        """
        migration_field = model_class.get_user_id_migration_field()
        found_models = model_class.query(
            migration_field == old_user_id).fetch()
        for model in found_models:
            # We need to get the name of the migration_field in order to
            # retrieve its value from the model_values. The migration_field
            # needs to be in the object format so that we are able to form
            # the model query easily (on one of the previous lines).
            setattr(model, migration_field._name, new_user_id)  # pylint: disable=protected-access
        model_class.put_multi(found_models, update_last_updated_time=False)

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over one type of entity class.
        super(UserIdMigrationJob, cls).enqueue(job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        old_user_id = user_model.gae_id
        new_user_id = user_model.id
        for model_class in models.Registry.get_all_storage_model_classes():
            output = None
            if (model_class.get_user_id_migration_policy() ==
                    base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE):
                continue
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.COPY):
                output = UserIdMigrationJob._copy_model_with_new_id(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.
                  COPY_AND_UPDATE_ONE_FIELD):
                UserIdMigrationJob._copy_model_with_new_id_and_user_id(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD):
                UserIdMigrationJob._change_model_with_one_user_id_field(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.CUSTOM):
                output = model_class.migrate_model(old_user_id, new_user_id)
            if output is not None:
                yield output
        yield ('SUCCESS', (old_user_id, new_user_id))

    @staticmethod
    def reduce(key, old_new_user_id_tuples):
        """Implements the reduce function for this job."""
        yield (key, len(old_new_user_id_tuples))


class SnapshotsContentUserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the snapshot content models that can
    contain user ID and replacing it with new user ID.
    """

    @staticmethod
    def _migrate_collection(rights_snapshot_model):
        """Migrate CollectionRightsSnapshotContentModel to use the new user ID
        in the owner_ids, editor_ids, voice_artist_ids and viewer_ids.

        Args:
            rights_snapshot_model: CollectionRightsSnapshotContentModel.
                The model that contains the old user IDs.
        """
        content_dict = (
            collection_models.CollectionRightsModel.convert_to_valid_dict(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            collection_models.CollectionRightsModel(**content_dict))
        reconstituted_rights_model.owner_ids = (
            replace_gae_ids(reconstituted_rights_model.owner_ids))
        reconstituted_rights_model.editor_ids = (
            replace_gae_ids(reconstituted_rights_model.editor_ids))
        reconstituted_rights_model.voice_artist_ids = (
            replace_gae_ids(reconstituted_rights_model.voice_artist_ids))
        reconstituted_rights_model.viewer_ids = (
            replace_gae_ids(reconstituted_rights_model.viewer_ids))

        rights_snapshot_model.content = reconstituted_rights_model.to_dict()
        rights_snapshot_model.put(update_last_updated_time=False)

    @staticmethod
    def _migrate_exploration(rights_snapshot_model):
        """Migrate ExplorationRightsSnapshotContentModel to use the new user ID
        in the owner_ids, editor_ids, voice_artist_ids and viewer_ids.

        Args:
            rights_snapshot_model: ExplorationRightsSnapshotContentModel.
                The model that contains the old user IDs.
        """
        content_dict = (
            exp_models.ExplorationRightsModel.convert_to_valid_dict(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            exp_models.ExplorationRightsModel(**content_dict))

        reconstituted_rights_model.owner_ids = (
            replace_gae_ids(reconstituted_rights_model.owner_ids))
        reconstituted_rights_model.editor_ids = (
            replace_gae_ids(reconstituted_rights_model.editor_ids))
        reconstituted_rights_model.voice_artist_ids = (
            replace_gae_ids(reconstituted_rights_model.voice_artist_ids))
        reconstituted_rights_model.viewer_ids = (
            replace_gae_ids(reconstituted_rights_model.viewer_ids))

        rights_snapshot_model.content = reconstituted_rights_model.to_dict()
        rights_snapshot_model.put(update_last_updated_time=False)

    @staticmethod
    def _migrate_topic(rights_snapshot_model):
        """Migrate TopicRightsSnapshotContentModel to use the new user ID in
        the owner_ids, editor_ids, voice_artist_ids and viewer_ids.

        Args:
            rights_snapshot_model: TopicRightsSnapshotContentModel. The model
            that contains the old user IDs.
        """
        reconstituted_rights_model = topic_models.TopicRightsModel(
            **rights_snapshot_model.content)
        reconstituted_rights_model.manager_ids = (
            replace_gae_ids(reconstituted_rights_model.manager_ids))
        rights_snapshot_model.content = reconstituted_rights_model.to_dict()
        rights_snapshot_model.put(update_last_updated_time=False)

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(SnapshotsContentUserIdMigrationJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotContentModel,
                exp_models.ExplorationRightsSnapshotContentModel,
                topic_models.TopicRightsSnapshotContentModel]

    @staticmethod
    def map(rights_snapshot_model):
        """Implements the map function for this job."""
        class_name = rights_snapshot_model.__class__.__name__
        try:
            if isinstance(
                    rights_snapshot_model,
                    collection_models.CollectionRightsSnapshotContentModel):
                SnapshotsContentUserIdMigrationJob._migrate_collection(
                    rights_snapshot_model)
            elif isinstance(
                    rights_snapshot_model,
                    exp_models.ExplorationRightsSnapshotContentModel):
                SnapshotsContentUserIdMigrationJob._migrate_exploration(
                    rights_snapshot_model)
            elif isinstance(
                    rights_snapshot_model,
                    topic_models.TopicRightsSnapshotContentModel):
                SnapshotsContentUserIdMigrationJob._migrate_topic(
                    rights_snapshot_model)
        except MissingUserException as e:
            yield ('FAILURE - %s' % class_name, e)
        else:
            yield ('SUCCESS - %s' % class_name, rights_snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(ids))
        else:
            yield (key, ids)


class SnapshotsMetadataUserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the snapshot metadata models that can
    contain user ID in the commit_cmnds and replacing all the user related
    fields in commit_cmnds with new user ID.
    """

    @staticmethod
    def _are_commit_cmds_role_change(commit_cmds):
        """Check if commit_cmds are of role_change type.

        Args:
            commit_cmds: list(dict(str, str)). List of commit commands.

        Returns:
            True when there is one command and it is of role_change type.
        """
        role_change_cmds = (
            rights_manager.CMD_CHANGE_ROLE,
            topic_domain.CMD_CHANGE_ROLE,
            topic_domain.CMD_REMOVE_MANAGER_ROLE)
        return (
            len(commit_cmds) == 1 and
            commit_cmds[0]['cmd'] in role_change_cmds)

    @staticmethod
    def _migrate_collection(snapshot_model):
        """Migrate CollectionRightsSnapshotMetadataModel to use the new user ID
        in the commit_cmds.

        Args:
            snapshot_model: CollectionRightsSnapshotMetadataModel. The model
                that contains the old user IDs.
        """
        if (SnapshotsMetadataUserIdMigrationJob
                ._are_commit_cmds_role_change(snapshot_model.commit_cmds)):
            commit_cmd = snapshot_model.commit_cmds[0]
            commit_cmd['assignee_id'] = (
                replace_gae_id(commit_cmd['assignee_id']))
            commit_log_model = (
                collection_models.CollectionCommitLogEntryModel.get_by_id(
                    'rights-%s-%s' % (
                        snapshot_model.get_unversioned_instance_id(),
                        snapshot_model.get_version_string)))
            commit_cmd = commit_log_model.commit_cmds[0]
            commit_cmd['assignee_id'] = (
                replace_gae_id(commit_cmd['assignee_id']))

            def _put_both_models():
                """Put both models into the datastore together."""
                snapshot_model.put(update_last_updated_time=False)
                commit_log_model.put(update_last_updated_time=False)

            transaction_services.run_in_transaction(_put_both_models)


    @staticmethod
    def _migrate_exploration(snapshot_model):
        """Migrate ExplorationRightsSnapshotMetadataModel to use the new user ID
        in the commit_cmds.

        Args:
            snapshot_model: ExplorationRightsSnapshotMetadataModel. The model
                that contains the old user IDs.
        """
        if (SnapshotsMetadataUserIdMigrationJob
                ._are_commit_cmds_role_change(snapshot_model.commit_cmds)):
            commit_cmd = snapshot_model.commit_cmds[0]
            commit_cmd['assignee_id'] = (
                replace_gae_id(commit_cmd['assignee_id']))
            commit_log_model = (
                exp_models.ExplorationCommitLogEntryModel.get_by_id(
                    'rights-%s-%s' % (
                        snapshot_model.get_unversioned_instance_id(),
                        snapshot_model.get_version_string)))
            commit_cmd = commit_log_model.commit_cmds[0]
            commit_cmd['assignee_id'] = (
                replace_gae_id(commit_cmd['assignee_id']))

            def _put_both_models():
                """Put both models into the datastore together."""
                snapshot_model.put(update_last_updated_time=False)
                commit_log_model.put(update_last_updated_time=False)

            transaction_services.run_in_transaction(_put_both_models)

    @staticmethod
    def _migrate_topic(snapshot_model):
        """Migrate TopicRightsSnapshotMetadataModel to use the new user ID
        in the commit_cmds.

        Args:
            snapshot_model: TopicRightsSnapshotMetadataModel. The model
                that contains the old user IDs.
        """
        if (SnapshotsMetadataUserIdMigrationJob
                ._are_commit_cmds_role_change(snapshot_model.commit_cmds)):
            commit_cmd = snapshot_model.commit_cmds[0]
            if commit_cmd['cmd'] == topic_domain.CMD_CHANGE_ROLE:
                commit_cmd['assignee_id'] = (
                    replace_gae_id(commit_cmd['assignee_id']))
            elif commit_cmd['cmd'] == topic_domain.CMD_REMOVE_MANAGER_ROLE:
                commit_cmd['removed_user_id'] = (
                    replace_gae_id(commit_cmd['removed_user_id']))
            commit_log_model = (
                topic_models.TopicCommitLogEntryModel.get_by_id(
                    'rights-%s-%s' % (
                        snapshot_model.get_unversioned_instance_id(),
                        snapshot_model.get_version_string)))
            commit_cmd = commit_log_model.commit_cmds[0]
            if commit_cmd['cmd'] == topic_domain.CMD_CHANGE_ROLE:
                commit_cmd['assignee_id'] = (
                    replace_gae_id(commit_cmd['assignee_id']))
            elif commit_cmd['cmd'] == topic_domain.CMD_REMOVE_MANAGER_ROLE:
                commit_cmd['removed_user_id'] = (
                    replace_gae_id(commit_cmd['removed_user_id']))

            def _put_both_models():
                """Put both models into the datastore together."""
                snapshot_model.put(update_last_updated_time=False)
                commit_log_model.put(update_last_updated_time=False)

            transaction_services.run_in_transaction(_put_both_models)

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(SnapshotsMetadataUserIdMigrationJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotMetadataModel,
                exp_models.ExplorationRightsSnapshotMetadataModel,
                topic_models.TopicRightsSnapshotMetadataModel]

    @staticmethod
    def map(rights_snapshot_model):
        """Implements the map function for this job."""
        class_name = rights_snapshot_model.__class__.__name__
        try:
            if isinstance(
                    rights_snapshot_model,
                    collection_models.CollectionRightsSnapshotMetadataModel):
                SnapshotsMetadataUserIdMigrationJob._migrate_collection(
                    rights_snapshot_model)
            elif isinstance(
                    rights_snapshot_model,
                    exp_models.ExplorationRightsSnapshotMetadataModel):
                SnapshotsMetadataUserIdMigrationJob._migrate_exploration(
                    rights_snapshot_model)
            elif isinstance(
                    rights_snapshot_model,
                    topic_models.TopicRightsSnapshotMetadataModel):
                SnapshotsMetadataUserIdMigrationJob._migrate_topic(
                    rights_snapshot_model)
        except MissingUserException as e:
            yield ('FAILURE - %s' % class_name, e)
        else:
            yield ('SUCCESS - %s' % class_name, rights_snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(ids))
        else:
            yield (key, ids)


class GaeIdNotInModelsVerificationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for going through all the UserSettingsModels and checking
    that the gae_id is not mentioned in any of the fields that should contain
    user_id, this job also checks that all the new user IDs are 32 lowercase
    chars long strings.
    """

    @staticmethod
    def verify_user_id_correct(user_id):
        """Verify that the user ID is in a correct format.

        Args:
            user_id: str. The user ID to be checked.

        Returns:
            bool. True when the ID is in a correct format, False otherwise.
        """
        return all((
            user_id.islower(),
            user_id.startswith('uid_'),
            len(user_id) == user_models.USER_ID_LENGTH))

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over one type of entity class.
        super(GaeIdNotInModelsVerificationJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        gae_id = user_model.gae_id
        if not (GaeIdNotInModelsVerificationJob
                .verify_user_id_correct(user_model.id)):
            yield ('FAILURE - WRONG ID FORMAT', (gae_id, user_model.id))
        success = True
        for model_class in models.Registry.get_all_storage_model_classes():
            base_classes = [
                base.__name__ for base in inspect.getmro(model_class)]
            # BaseSnapshotMetadataModel and models that inherit from it
            # are checked from the associated VersionedModel.
            if 'BaseSnapshotMetadataModel' in base_classes:
                continue
            # BaseSnapshotContentModel and models that inherit from it
            # are checked from the associated VersionedModel.
            if 'BaseSnapshotContentModel' in base_classes:
                continue
            if (model_class.get_deletion_policy() ==
                    base_models.DELETION_POLICY.NOT_APPLICABLE):
                continue
            if model_class.has_reference_to_user_id(gae_id):
                yield ('FAILURE - HAS REFERENCE TO GAE ID',
                       (gae_id, model_class.__name__))
                success = False

        if success:
            yield ('SUCCESS', (gae_id, user_model.id))

    @staticmethod
    def reduce(key, old_new_user_id_tuples):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(old_new_user_id_tuples))
        else:
            yield (key, old_new_user_id_tuples)


class BaseModelsUserIdsHaveUserSettingsVerificationJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Base one-off job for going through the models that contain user IDs. This
    job checks that all the user IDs used in the model have their corresponding
    UserSettingsModel defined.
    """

    @staticmethod
    def _does_user_settings_model_exist(user_id):
        """Check if UserSettingsModel exists for the user_id or that the user_id
        belongs to one of SYSTEM_USERS.

        Args:
            user_id: str. User ID that should have its UserSettingsModel.

        Returns:
            True if UserSettingsModel with id equal to user_id exists, False
            otherwise.
        """
        if user_id in feconf.SYSTEM_USERS:
            return True
        return user_models.UserSettingsModel.get_by_id(user_id) is not None

    @staticmethod
    def _check_id_and_user_id_exist(model_id, user_id):
        """Check if UserSettingsModel exists for user_id and model id contains
        user_id or that the user_id belongs to one of SYSTEM_USERS.

        Args:
            model_id: str. ID of the model that should contain the user_id.
            user_id: str. User ID that should have its UserSettingsModel.

        Returns:
            True if UserSettingsModel with id as user_id in model exists or
            user_id belongs to one of SYSTEM_USERS. False otherwise.
        """
        if user_id not in model_id:
            return False
        if user_id in feconf.SYSTEM_USERS:
            return True
        return user_models.UserSettingsModel.get_by_id(user_id) is not None

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over.

        Raises:
            NotImplementedError: The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError

    @staticmethod
    def map(model):
        """Implements the map function for this job."""
        model_class = model.__class__
        if (model_class.get_user_id_migration_policy() ==
                base_models.USER_ID_MIGRATION_POLICY.COPY):
            if (BaseModelsUserIdsHaveUserSettingsVerificationJob
                    ._does_user_settings_model_exist(model.id)):
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD):
            user_id = model.user_id
            if user_id is None:
                yield ('SUCCESS_NONE - %s' % model_class.__name__, model.id)
            elif (BaseModelsUserIdsHaveUserSettingsVerificationJob
                  ._check_id_and_user_id_exist(model.id, user_id)):
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD):
            # We need to get the name of the migration_field in order to
            # retrieve its value from the model.to_dict(). The migration_field
            # needs to be in the object format so that we are able to form
            # the model query easily
            # (in UserIdMigrationJob._change_model_with_one_user_id_field).
            user_id = model.to_dict()[
                model_class.get_user_id_migration_field()._name]  # pylint: disable=protected-access
            if user_id is None:
                yield ('SUCCESS_NONE - %s' % model_class.__name__, model.id)
            elif (BaseModelsUserIdsHaveUserSettingsVerificationJob
                  ._does_user_settings_model_exist(user_id)):
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)
        elif (model_class.get_user_id_migration_policy() ==
              base_models.USER_ID_MIGRATION_POLICY.CUSTOM):
            if model.verify_model_user_ids_exist():
                yield ('SUCCESS - %s' % model_class.__name__, model.id)
            else:
                yield ('FAILURE - %s' % model_class.__name__, model.id)

    @staticmethod
    def reduce(key, status):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(status))
        else:
            yield (key, status)


class ModelsUserIdsHaveUserSettingsVerificationJob(
        BaseModelsUserIdsHaveUserSettingsVerificationJob):
    """One-off job for going through all the models (except these listed in
    SEPARATE_MODEL_CLASSES) that contain user IDs. This job checks that all
    the user IDs used in the model have their corresponding UserSettingsModel
    defined.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We need to reduce the number of shards for this job, since it goes
        # over big number of model classes.
        super(ModelsUserIdsHaveUserSettingsVerificationJob, cls).enqueue(
            job_id, shard_count=2)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        model_classes = [model_class for model_class in
                         models.Registry.get_all_storage_model_classes()
                         if model_class.get_user_id_migration_policy() !=
                         base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE]
        return [model_class for model_class in model_classes if
                model_class not in SEPARATE_MODEL_CLASSES]


class ModelsUserIdsHaveUserSettingsExplorationsVerificationJob(
        BaseModelsUserIdsHaveUserSettingsVerificationJob):
    """One-off job for going through the models listed in SEPARATE_MODEL_CLASSES
    that contain user IDs. This job checks that all the user IDs used in
    the model have their corresponding UserSettingsModel defined.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return SEPARATE_MODEL_CLASSES


class AddAllUserIdsVerificationJob(jobs.BaseMapReduceOneOffJobManager):
    """For every rights model merge the data from all the user id fields
    together and put them in the all_user_ids field of an appropriate
    RightsAllUsersModel.
    """

    @staticmethod
    def _add_collection_user_ids(rights_model, all_users_model):
        """Compare the existing CollectionRightsAllUsersModel with the user IDs
        in the CollectionRightsModel, if some of the user IDs from snapshots are
        not in the parent rights model add them to the
        CollectionRightsAllUsersModel and return them.

        Args:
            rights_model: CollectionRightsModel. The current rights model.
            all_users_model: CollectionRightsAllUsersModel. The model with the
                user IDs collected from the snapshots.

        Returns:
            list(str). List of user IDs that are in snapshots but not in the
            parent rights model.
        """
        user_ids_only_in_snapshots = []
        all_user_ids = (
            set(rights_model.owner_ids) |
            set(rights_model.editor_ids) |
            set(rights_model.voice_artist_ids) |
            set(rights_model.viewer_ids))
        if not all_user_ids.issuperset(set(all_users_model.all_user_ids)):
            user_ids_only_in_snapshots = list(
                set(all_users_model.all_user_ids) - all_user_ids)
            all_user_ids = set(all_users_model.all_user_ids) | all_user_ids
        collection_models.CollectionRightsAllUsersModel(
            id=rights_model.id,
            all_user_ids=list(all_user_ids)
        ).put()
        return user_ids_only_in_snapshots

    @staticmethod
    def _add_exploration_user_ids(rights_model, all_users_model):
        """Compare the existing ExplorationRightsAllUsersModel with the user IDs
        in the ExplorationRightsModel, if some of the user IDs from snapshots
        are not in the parent rights model add them to the
        ExplorationRightsAllUsersModel and return them.

        Args:
            rights_model: ExplorationRightsModel. The current rights model.
            all_users_model: ExplorationRightsAllUsersModel. The model with the
                user IDs collected from the snapshots.

        Returns:
            list(str). List of user IDs that are in snapshots but not in the
            parent rights model.
        """
        user_ids_only_in_snapshots = []
        all_user_ids = (
            set(rights_model.owner_ids) |
            set(rights_model.editor_ids) |
            set(rights_model.voice_artist_ids) |
            set(rights_model.viewer_ids))
        if not all_user_ids.issuperset(set(all_users_model.all_user_ids)):
            user_ids_only_in_snapshots = list(
                set(all_users_model.all_user_ids) - all_user_ids)
            all_user_ids = set(all_users_model.all_user_ids) | all_user_ids
        exp_models.ExplorationRightsAllUsersModel(
            id=rights_model.id,
            all_user_ids=list(all_user_ids)
        ).put()
        return user_ids_only_in_snapshots

    @staticmethod
    def _add_topic_user_ids(rights_model, all_users_model):
        """Compare the existing TopicRightsAllUsersModel with the user IDs in
        the TopicRightsModel, if some of the user IDs from snapshots are not in
        the parent rights model add them to the TopicRightsAllUsersModel and
        return them.

        Args:
            rights_model: TopicRightsModel. The current rights model.
            all_users_model: TopicRightsAllUsersModel. The model with the
                user IDs collected from the snapshots.

        Returns:
            list(str). List of user IDs that are in snapshots but not in the
            parent rights model.
        """
        user_ids_only_in_snapshots = []
        all_user_ids = set(rights_model.manager_ids)
        if not all_user_ids.issuperset(set(all_users_model.all_user_ids)):
            user_ids_only_in_snapshots = list(
                set(all_users_model.all_user_ids) - all_user_ids)
            all_user_ids = set(all_users_model.all_user_ids) | all_user_ids
        topic_models.TopicRightsAllUsersModel(
            id=rights_model.id,
            all_user_ids=list(all_user_ids)
        ).put()
        return user_ids_only_in_snapshots

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(AddAllUserIdsVerificationJob, cls).enqueue(job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsModel,
                exp_models.ExplorationRightsModel,
                topic_models.TopicRightsModel]

    @staticmethod
    def map(rights_model):
        """Implements the map function for this job."""
        class_name = rights_model.__class__.__name__
        if isinstance(rights_model, collection_models.CollectionRightsModel):
            all_users_model = (
                collection_models.CollectionRightsAllUsersModel.get_by_id(
                    rights_model.id))
            if all_users_model is None:
                yield ('FAILURE-%s' % class_name, rights_model.id)
                return
            user_ids_only_in_snapshots = (
                AddAllUserIdsVerificationJob._add_collection_user_ids(
                    rights_model, all_users_model))

        elif isinstance(rights_model, exp_models.ExplorationRightsModel):
            all_users_model = (
                exp_models.ExplorationRightsAllUsersModel.get_by_id(
                    rights_model.id))
            if all_users_model is None:
                yield ('FAILURE-%s' % class_name, rights_model.id)
                return
            user_ids_only_in_snapshots = (
                AddAllUserIdsVerificationJob._add_exploration_user_ids(
                    rights_model, all_users_model))

        elif isinstance(rights_model, topic_models.TopicRightsModel):
            all_users_model = (
                topic_models.TopicRightsAllUsersModel.get_by_id(
                    rights_model.id))
            if all_users_model is None:
                yield ('FAILURE-%s' % class_name, rights_model.id)
                return
            user_ids_only_in_snapshots = (
                AddAllUserIdsVerificationJob._add_topic_user_ids(
                    rights_model, all_users_model))

        if user_ids_only_in_snapshots:
            yield (
                'SUCCESS-NOT_SUBSET-%s' % class_name,
                (rights_model.id, user_ids_only_in_snapshots))
        else:
            yield ('SUCCESS-SUBSET-%s' % class_name, rights_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(ids))
        else:
            yield (key, ids)


class AddAllUserIdsSnapshotsVerificationJob(jobs.BaseMapReduceOneOffJobManager):
    """For every snapshot of a rights model, merge the data from all the user id
    fields together and put them in the all_user_ids field of an appropriate
    RightsAllUsersModel.
    """

    @staticmethod
    def _add_collection_user_ids(rights_snapshot_model, all_users_model):
        """Merge the user ids from the snapshot and put them in the parent
        collection rights model.
        """
        content_dict = (
            collection_models.CollectionRightsModel.convert_to_valid_dict(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            collection_models.CollectionRightsModel(**content_dict))
        all_users_model.all_user_ids = list(
            set(all_users_model.all_user_ids) |
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids))
        all_users_model.put()

    @staticmethod
    def _add_exploration_user_ids(rights_snapshot_model, all_users_model):
        """Merge the user ids from the snapshot and put them in the parent
        exploration rights model.
        """
        content_dict = (
            exp_models.ExplorationRightsModel.convert_to_valid_dict(
                rights_snapshot_model.content))
        reconstituted_rights_model = (
            exp_models.ExplorationRightsModel(**content_dict))
        all_users_model.all_user_ids = list(
            set(all_users_model.all_user_ids) |
            set(reconstituted_rights_model.owner_ids) |
            set(reconstituted_rights_model.editor_ids) |
            set(reconstituted_rights_model.voice_artist_ids) |
            set(reconstituted_rights_model.viewer_ids))
        all_users_model.put()

    @staticmethod
    def _add_topic_user_ids(rights_snapshot_model, all_users_model):
        """Merge the user ids from the snapshot and put them in the parent
        topic rights model.
        """
        reconstituted_rights_model = topic_models.TopicRightsModel(
            **rights_snapshot_model.content)
        all_users_model.all_user_ids = list(
            set(all_users_model.all_user_ids) |
            set(reconstituted_rights_model.manager_ids))
        all_users_model.put()

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(AddAllUserIdsSnapshotsVerificationJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsSnapshotContentModel,
                exp_models.ExplorationRightsSnapshotContentModel,
                topic_models.TopicRightsSnapshotContentModel]

    @staticmethod
    def map(rights_snapshot_model):
        """Implements the map function for this job."""
        class_name = rights_snapshot_model.__class__.__name__
        rights_model_id = rights_snapshot_model.get_unversioned_instance_id()
        if isinstance(
                rights_snapshot_model,
                collection_models.CollectionRightsSnapshotContentModel):
            all_users_model = (
                collection_models.CollectionRightsAllUsersModel.get_by_id(
                    rights_model_id))
            if all_users_model is None:
                all_users_model = (
                    collection_models.CollectionRightsAllUsersModel(
                        id=rights_model_id,
                        all_user_ids=[]))
            AddAllUserIdsSnapshotsVerificationJob._add_collection_user_ids(
                rights_snapshot_model, all_users_model)
        elif isinstance(
                rights_snapshot_model,
                exp_models.ExplorationRightsSnapshotContentModel):
            all_users_model = (
                exp_models.ExplorationRightsAllUsersModel.get_by_id(
                    rights_model_id))
            if all_users_model is None:
                all_users_model = exp_models.ExplorationRightsAllUsersModel(
                    id=rights_model_id,
                    all_user_ids=[])
            AddAllUserIdsSnapshotsVerificationJob._add_exploration_user_ids(
                rights_snapshot_model, all_users_model)
        elif isinstance(
                rights_snapshot_model,
                topic_models.TopicRightsSnapshotContentModel):
            all_users_model = topic_models.TopicRightsAllUsersModel.get_by_id(
                rights_model_id)
            if all_users_model is None:
                all_users_model = topic_models.TopicRightsAllUsersModel(
                    id=rights_model_id,
                    all_user_ids=[])
            AddAllUserIdsSnapshotsVerificationJob._add_topic_user_ids(
                rights_snapshot_model, all_users_model)
        yield ('SUCCESS-%s' % class_name, rights_snapshot_model.id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, len(ids))


class DeleteAllUserIdsVerificationJob(jobs.BaseMapReduceOneOffJobManager):
    """Delete all RightsAllUsersModels from the datastore. This needs to be done
    so that the next testing run works correctly.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over three types of entity class.
        super(DeleteAllUserIdsVerificationJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [collection_models.CollectionRightsAllUsersModel,
                exp_models.ExplorationRightsAllUsersModel,
                topic_models.TopicRightsAllUsersModel]

    @staticmethod
    def map(rights_snapshot_model):
        """Implements the map function for this job."""
        deleted_model_id = rights_snapshot_model.id
        rights_snapshot_model.delete()
        yield ('SUCCESS', deleted_model_id)

    @staticmethod
    def reduce(key, ids):
        """Implements the reduce function for this job."""
        yield (key, len(ids))
