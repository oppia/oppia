# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Job for computation of exploration version history data."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Optional, Tuple, TypedDict, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])
datastore_services = models.Registry.import_datastore_services()


class UnformattedModelGroupForVerificationJobDict(TypedDict):
    """Dictionary representing an unformatted model group for the
    VerifyVersionHistoryModelsJob which verifies whether the version history
    models were created correctly.
    """

    all_exp_models: List[exp_domain.Exploration]
    exp_models_vlatest: List[exp_domain.Exploration]
    snapshot_metadata_models: List[Optional[
        exp_models.ExplorationSnapshotMetadataModel]]
    version_history_models: (
        List[Optional[exp_models.ExplorationVersionHistoryModel]]
    )


class FormattedModelGroupForVerificationJobDict(TypedDict):
    """Dictionary representing a formatted model group for the
    VerifyVersionHistoryModelsJob which verifies whether the version history
    models were created correctly.
    """

    exp_vlatest: exp_domain.Exploration
    all_explorations: List[exp_domain.Exploration]
    snapshot_metadata_models: List[Optional[
        exp_models.ExplorationSnapshotMetadataModel]]
    version_history_models: (
        List[Optional[exp_models.ExplorationVersionHistoryModel]]
    )


class UnformattedModelGroupForComputationJobDict(TypedDict):
    """Dictionary representing an unformatted model group for the
    ComputeExplorationVersionHistoryJob which verifies whether the version
    history models were created correctly.
    """

    all_exp_models: List[exp_models.ExplorationModel]
    exp_models_vlatest: List[exp_models.ExplorationModel]
    snapshot_metadata_models: List[Optional[
        exp_models.ExplorationSnapshotMetadataModel]]
    version_history_models: (
        List[Optional[exp_models.ExplorationVersionHistoryModel]]
    )


class FormattedModelGroupForComputationJobDict(TypedDict):
    """Dictionary representing a formatted model group for the
    ComputeExplorationVersionHistoryJob which verifies whether the version
    history models were created correctly.
    """

    exp_vlatest: exp_models.ExplorationModel
    all_explorations: List[exp_models.ExplorationModel]
    snapshot_metadata_models: List[Optional[
        exp_models.ExplorationSnapshotMetadataModel]]
    version_history_models: (
        List[Optional[exp_models.ExplorationVersionHistoryModel]]
    )


class VerifyVersionHistoryModelsJob(base_jobs.JobBase):
    """Verifies that the creation or modification of the version history
    models is correct. It does not consult those explorations for which
    version history could not be created due to many reasons such as invalid
    change list. It checks the correctness for those explorations for which the
    version histories were created successfully.
    """

    def generate_exploration_from_snapshot(
        self, snapshot_model: exp_models.ExplorationSnapshotContentModel
    ) -> Optional[exp_models.ExplorationModel]:
        """Generates exploration model from given snapshot content model.

        Args:
            snapshot_model: ExplorationSnapshotContentModel. The snapshot
                content model.

        Returns:
            ExplorationModel. The exploration model.
        """
        with datastore_services.get_ndb_context():
            try:
                snapshot_dict = snapshot_model.content
                exp_id = snapshot_model.get_unversioned_instance_id()
                model_class = exp_models.ExplorationModel
                reconstituted_model = model_class(id=exp_id)._reconstitute(  # pylint: disable=protected-access
                    snapshot_dict
                )
                reconstituted_model.created_on = snapshot_model.created_on
                reconstituted_model.last_updated = snapshot_model.last_updated
                return reconstituted_model
            except Exception:
                return None

    def convert_to_formatted_model_group(
        self, model_group: UnformattedModelGroupForVerificationJobDict
    ) -> Optional[FormattedModelGroupForVerificationJobDict]:
        """Converts the given unformatted model group into a formatted one.

        Args:
            model_group: UnformattedModelGroupForVerificationJobDict.
                The unformatted model group for the verification job which is
                to be converted into formatted model group.

        Returns:
            Optional[FormattedModelGroupForVerificationJobDict]. The formatted
            version of the given model group.
        """
        all_exp_models = model_group['all_exp_models']
        exp_models_vlatest = model_group['exp_models_vlatest']
        snapshot_metadata_models = model_group['snapshot_metadata_models']
        version_history_models = model_group['version_history_models']

        response_dict: Optional[
            FormattedModelGroupForVerificationJobDict] = None

        model_group_is_valid = len(exp_models_vlatest) == 1
        if model_group_is_valid: # pragma: no cover
            exp_model_vlatest = exp_models_vlatest[0]

            all_explorations: List[Optional[exp_domain.Exploration]] = (
                [None] * exp_model_vlatest.version
            )
            for exp_model in all_exp_models:
                if (
                    exp_model is not None and
                    exp_model.version >= 1 and
                    exp_model.version <= exp_model_vlatest.version
                ): # pragma: no cover
                    all_explorations[exp_model.version - 1] = exp_model
            model_group_is_valid = all_explorations.count(None) == 0

            if model_group_is_valid:
                all_snapshot_metadata_models: List[Optional[
                    exp_models.ExplorationSnapshotMetadataModel
                ]] = (
                    [None] * exp_model_vlatest.version
                )
                for snapshot_metadata in snapshot_metadata_models:
                    if (
                        snapshot_metadata is not None and
                        int(snapshot_metadata.get_version_string()) >= 1 and
                        int(snapshot_metadata.get_version_string()) <= (
                            exp_model_vlatest.version)
                    ):
                        version = int(snapshot_metadata.get_version_string())
                        all_snapshot_metadata_models[
                            version - 1] = snapshot_metadata
                model_group_is_valid = (
                    all_snapshot_metadata_models.count(None) == 0
                )

                if model_group_is_valid: # pragma: no cover
                    all_version_history_models: List[Optional[
                        exp_models.ExplorationVersionHistoryModel
                    ]] = [None] * exp_model_vlatest.version
                    for version_history in version_history_models:
                        if (
                            version_history is not None and
                            version_history.exploration_version is not None and
                            version_history.exploration_version >= 1 and
                            version_history.exploration_version <=
                                exp_model_vlatest.version
                        ): # pragma: no cover
                            all_version_history_models[
                                version_history.exploration_version - 1
                            ] = version_history
                    model_group_is_valid = (
                        all_version_history_models.count(None) == 0
                    )

                    # The following lists are just to fix the MyPy errors.
                    # No entity in the above lists are None if the model group
                    # is valid.
                    explorations_without_none: List[
                        exp_domain.Exploration] = []
                    for exploration in all_explorations:
                        if exploration is not None: # pragma: no cover
                            explorations_without_none.append(exploration)
                    if model_group_is_valid: # pragma: no cover
                        response_dict = {
                            'exp_vlatest': exp_model_vlatest,
                            'all_explorations': explorations_without_none,
                            'snapshot_metadata_models': (
                                all_snapshot_metadata_models),
                            'version_history_models': all_version_history_models
                        }
        return response_dict

    def verify_version_history_models(
        self, model_group: FormattedModelGroupForVerificationJobDict
    ) -> Tuple[str, bool]:
        """Verifies that the version history models were created correctly.

        Args:
            model_group: FormattedModelGroupForVerificationJobDict. The
                formatted model group for the computation job for which version
                history models are to be verified.

        Returns:
            Tuple[str, bool]. The pair of exploration id and whether the
            version history models were created correctly.
        """
        exp_vlatest = model_group['exp_vlatest']
        snapshot_metadata_models = model_group['snapshot_metadata_models']
        vh_models = model_group['version_history_models']
        exp_id = exp_vlatest.id
        latest_version = exp_vlatest.version
        verified = True

        for version in range(2, latest_version + 1):
            vh_model = vh_models[version - 1]
            assert vh_model is not None
            snapshot_metadata_model = snapshot_metadata_models[version - 1]
            assert snapshot_metadata_model is not None
            change_list: List[exp_domain.ExplorationChange] = []
            for change_dict in snapshot_metadata_model.commit_cmds:
                try:
                    change_list.append(exp_domain.ExplorationChange(
                        change_dict
                    ))
                except Exception:
                    continue

            exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)

            effective_old_to_new_state_names = {}
            for old_state_name, new_state_name in (
                exp_versions_diff.old_to_new_state_names.items()
            ):
                if old_state_name != new_state_name: # pragma: no cover
                    effective_old_to_new_state_names[
                        old_state_name] = new_state_name
            for old_state_name, new_state_name in (
                effective_old_to_new_state_names.items()
            ):
                if new_state_name not in vh_model.state_version_history:
                    verified = False
                    break
                state_vh = vh_model.state_version_history[new_state_name]
                if state_vh['previously_edited_in_version'] != version - 1:
                    verified = False
                    break
                if state_vh['state_name_in_previous_version'] != old_state_name:
                    verified = False
                    break

            for state_name in exp_versions_diff.added_state_names:
                if state_name not in vh_model.state_version_history:
                    verified = False
                    break
                state_vh = vh_model.state_version_history[state_name]
                if (
                    state_vh['previously_edited_in_version'] is not None or
                    state_vh['state_name_in_previous_version'] is not None
                ):
                    verified = False
                    break

            if not verified:
                break

        return (exp_id, verified)

    def get_exploration_from_model(
        self, exploration_model: exp_models.ExplorationModel
    ) -> Optional[exp_domain.Exploration]:
        """Gets Exploration domain object from exploration model.

        Args:
            exploration_model: ExplorationModel. The exploration model which is
                to be converted into Exploration domain object.

        Returns:
            Optional[exp_domain.Exploration]. The Exploration domain object
            for the given exploration model.
        """
        try:
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model
            )
            return exploration
        except Exception:
            return None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        all_explorations = (
            self.pipeline
            | 'Get all the exploration snapshot models' >> ndb_io.GetModels(
                exp_models.ExplorationSnapshotContentModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter the exploration snapshot models without None' >>
                beam.Filter(lambda model: model is not None)
            | 'Get reconstituted exploration models' >>
                beam.Map(self.generate_exploration_from_snapshot)
            | 'Get Exploration objects from models' >>
                beam.Map(self.get_exploration_from_model)
            | 'Filter explorations without None' >>
                beam.Filter(lambda x: x is not None)
            | 'Get id-model pair for exploration models' >>
                beam.Map(lambda exploration: (exploration.id, exploration))
        )

        all_explorations_vlatest = (
            self.pipeline
            | 'Get all the exploration models at latest version' >>
                ndb_io.GetModels(exp_models.ExplorationModel.get_all(
                        include_deleted=False
                ))
            | 'Get Exploration objects from exp models vlatest' >>
                beam.Map(self.get_exploration_from_model)
            | 'Filter the explorations without None' >>
                beam.Filter(lambda x: x is not None)
            | 'Get id-model pair for exploration models at vlatest' >>
                beam.Map(lambda exploration: (exploration.id, exploration))
        )

        all_snapshot_metadata = (
            self.pipeline
            | 'Get all ExplorationSnapshotMetadataModels' >> ndb_io.GetModels(
                exp_models.ExplorationSnapshotMetadataModel.get_all(
                    include_deleted=False
                )
            )
            | 'Create key-value pairs with id and metadata models' >>
                beam.Map(lambda model: (
                    model.get_unversioned_instance_id(), model
                )
            )
        )

        all_version_history_models = (
            self.pipeline
            | 'Get all ExplorationVersionHistoryModels' >>
                ndb_io.GetModels(
                    exp_models.ExplorationVersionHistoryModel.get_all(
                        include_deleted=False
                    )
                )
            | 'Create key-value pairs with id and version history models' >>
                beam.Map(lambda model: (model.exploration_id, model))
        )

        verification_results = (
            ({
                'all_exp_models': all_explorations,
                'exp_models_vlatest': all_explorations_vlatest,
                'snapshot_metadata_models': all_snapshot_metadata,
                'version_history_models': all_version_history_models
            })
            | 'Group by key' >> beam.CoGroupByKey()
            | 'Get rid of exploration id' >>
                beam.Values() # pylint: disable=no-value-for-parameter
            | 'Get formatted model groups' >> beam.Map(
                self.convert_to_formatted_model_group
            )
            | 'Filter valid model groups' >> beam.Filter(
                lambda x: x is not None
            )
            | 'Get the verification result for each model group' >>
                beam.Map(self.verify_version_history_models)
        )

        verification_success = (
            verification_results
            | 'Filter the verified explorations' >>
                beam.Filter(lambda x: x[1])
        )

        verification_failed = (
            verification_results
            | 'Filter the unverified explorations' >>
                beam.Filter(lambda x: not x[1])
        )

        report_number_of_explorations_queried = (
            all_explorations_vlatest
            | 'Count the number of explorations' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'ALL EXPLORATIONS'
                )
        )

        report_number_of_verified_explorations = (
            verification_success
            | 'Count the number of verified explorations' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'VERIFIED EXPLORATIONS'
                )
        )

        report_number_of_unverified_explorations = (
            verification_failed
            | 'Count the number of unverified explorations' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'UNVERIFIED EXPLORATIONS'
                )
        )

        report_details_of_unverified_explorations = (
            verification_failed
            | 'Save info on the unverified explorations' >> beam.Map(
                lambda x: job_run_result.JobRunResult.as_stderr(
                    'Version history for exploration with ID %s was not '
                    'created correctly' % (x[0])
                )
            )
        )

        return (
            (
                report_number_of_explorations_queried,
                report_number_of_verified_explorations,
                report_number_of_unverified_explorations,
                report_details_of_unverified_explorations
            )
            | 'Flatten' >> beam.Flatten()
        )


class DeleteExplorationVersionHistoryModelsJob(base_jobs.JobBase):
    """Job that deletes ExplorationVersionHistoryModels."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        deleting ExplorationVersionHistoryModel.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            deleting ExplorationVersionHistoryModel.
        """
        version_history_models = (
            self.pipeline
            | 'Get all ExplorationVersionHistoryModels' >>
                ndb_io.GetModels(
                    exp_models.ExplorationVersionHistoryModel.get_all(
                        include_deleted=False
                    )
                )
        )

        unused_delete_result = (
            version_history_models
            | beam.Map(lambda model: model.key)
            | 'Delete all models' >> ndb_io.DeleteModels()
        )

        return (
            version_history_models
            | 'Create job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )


class ComputeExplorationVersionHistoryJob(base_jobs.JobBase):
    """Computes and populates the version history data for an exploration."""

    def convert_to_formatted_model_group(
        self, model_group: UnformattedModelGroupForComputationJobDict
    ) -> Optional[FormattedModelGroupForComputationJobDict]:
        """Converts the given unformatted model group into a formatted one.

        Args:
            model_group: UnformattedModelGroupForComputationJobDict.
                The unformatted model group for the computation job which is
                to be converted into formatted model group.

        Returns:
            Optional[FormattedModelGroupForComputationJobDict]. The formatted
            version of the given model group.
        """
        all_exp_models = model_group['all_exp_models']
        exp_models_vlatest = model_group['exp_models_vlatest']
        snapshot_metadata_models = model_group['snapshot_metadata_models']
        version_history_models = model_group['version_history_models']

        response_dict: Optional[
            FormattedModelGroupForComputationJobDict] = None

        model_group_is_valid = len(exp_models_vlatest) == 1
        if model_group_is_valid: # pragma: no cover
            exp_model_vlatest = exp_models_vlatest[0]

            all_explorations: List[Optional[exp_models.ExplorationModel]] = (
                [None] * exp_model_vlatest.version
            )
            for exp_model in all_exp_models:
                if (
                    exp_model is not None and
                    exp_model.version >= 1 and
                    exp_model.version <= exp_model_vlatest.version
                ):
                    all_explorations[exp_model.version - 1] = exp_model
            model_group_is_valid = all_explorations.count(None) == 0

            if model_group_is_valid:
                all_snapshot_metadata_models: List[Optional[
                    exp_models.ExplorationSnapshotMetadataModel
                ]] = (
                    [None] * exp_model_vlatest.version
                )
                for snapshot_metadata in snapshot_metadata_models:
                    if (
                        snapshot_metadata is not None and
                        int(snapshot_metadata.get_version_string()) >= 1 and
                        int(snapshot_metadata.get_version_string()) <= (
                            exp_model_vlatest.version)
                    ):
                        version = int(snapshot_metadata.get_version_string())
                        all_snapshot_metadata_models[
                            version - 1] = snapshot_metadata
                model_group_is_valid = (
                    all_snapshot_metadata_models.count(None) == 0
                )

                if model_group_is_valid:
                    all_version_history_models: List[Optional[
                        exp_models.ExplorationVersionHistoryModel
                    ]] = [None] * exp_model_vlatest.version
                    for version_history in version_history_models:
                        if (
                            version_history is not None and
                            version_history.exploration_version is not None and
                            version_history.exploration_version >= 1 and
                            version_history.exploration_version <=
                                exp_model_vlatest.version
                        ): # pragma: no cover
                            all_version_history_models[
                                version_history.exploration_version - 1
                            ] = version_history

                    # The following lists are just to fix the MyPy errors.
                    # No entity in the above lists are None if the model group
                    # is valid.
                    explorations_without_none: List[
                        exp_models.ExplorationModel] = []
                    for exploration in all_explorations:
                        if exploration is not None:
                            explorations_without_none.append(exploration)
                    response_dict = {
                        'exp_vlatest': exp_model_vlatest,
                        'all_explorations': explorations_without_none,
                        'snapshot_metadata_models': (
                            all_snapshot_metadata_models
                        ),
                        'version_history_models': all_version_history_models
                    }
        return response_dict

    def get_updated_version_history_model(
        self,
        vh_model: Optional[exp_models.ExplorationVersionHistoryModel],
        exp_id: str,
        current_version: int,
        committer_id: str,
        updated_states_vh: Dict[str, state_domain.StateVersionHistory],
        updated_metadata_vh: exp_domain.MetadataVersionHistory,
        updated_committer_ids: List[str]
    ) -> exp_models.ExplorationVersionHistoryModel:
        """Updates the version history model or creates one for the given
        version of the exploration.

        Args:
            vh_model: Optional[ExplorationVersionHistoryModel]. The version
                history model for the given version of the exploration. It is
                None if the model does not exist.
            exp_id: str. The id of the exploration.
            current_version: int. The version number for which we want to
                create the version history model.
            committer_id: str. The user id of the user who committed the
                changes in the exploration from versions (current_version - 1)
                to (current_version).
            updated_states_vh: dict(str, StateVersionHistory). The updated
                states version history data for the given version of the
                exploration.
            updated_metadata_vh: MetadataVersionHistory. The updated metadata
                version history data for the given version of the exploration.
            updated_committer_ids: list[str]. A list of user ids who made the
                'previous commit' on each state and the exploration metadata.

        Returns:
            ExplorationVersionHistoryModel. The updated version history model.
        """
        # If the model is not already existing, then create it.
        if vh_model is None:
            vh_model = exp_models.ExplorationVersionHistoryModel(
                id=exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    exp_id, current_version
                ),
                exploration_id=exp_id,
                exploration_version=current_version,
                state_version_history={},
                metadata_last_edited_version_number=None,
                metadata_last_edited_committer_id=committer_id,
                committer_ids=[committer_id]
            )
        # Update the required fields in the model.
        vh_model.state_version_history = {
            state_name: vh.to_dict()
            for state_name, vh in updated_states_vh.items()
        }
        vh_model.metadata_last_edited_version_number = (
            updated_metadata_vh.last_edited_version_number
        )
        vh_model.metadata_last_edited_committer_id = (
            updated_metadata_vh.last_edited_committer_id
        )
        vh_model.committer_ids = updated_committer_ids
        return vh_model

    def get_reverted_version_history_model(
        self,
        revert_to_vh_model: exp_models.ExplorationVersionHistoryModel,
        current_vh_model: Optional[exp_models.ExplorationVersionHistoryModel],
        exp_id: str,
        current_version: int
    ) -> exp_models.ExplorationVersionHistoryModel:
        """Updates the version history model for the current version of the
        exploration with the model data of the reverted version.

        Args:
            revert_to_vh_model: ExplorationVersionHistoryModel. The exploration
                version history model at the version to which the exploration
                is reverted.
            current_vh_model: Optional[ExplorationVersionHistoryModel]. The
                version history model for the current version of the
                exploration. It is None if the model does not exist.
            exp_id: str. The id of the exploration.
            current_version: int. The version number for which we want to
                create the version history model.

        Returns:
            ExplorationVersionHistoryModel. The updated version history model.
        """
        # If the model does not exist, create it with the data from the
        # reverted model. Otherwise, just update the data of the already
        # existing model with the data from the reverted model.
        if current_vh_model is None:
            current_vh_model = exp_models.ExplorationVersionHistoryModel(
                id=exp_models.ExplorationVersionHistoryModel.get_instance_id(
                    exp_id, current_version
                ),
                exploration_id=exp_id,
                exploration_version=current_version,
                state_version_history=revert_to_vh_model.state_version_history,
                metadata_last_edited_version_number=(
                    revert_to_vh_model.metadata_last_edited_version_number
                ),
                metadata_last_edited_committer_id=(
                    revert_to_vh_model.metadata_last_edited_committer_id
                ),
                committer_ids=revert_to_vh_model.committer_ids
            )
        else:
            current_vh_model.state_version_history = (
                revert_to_vh_model.state_version_history
            )
            current_vh_model.metadata_last_edited_version_number = (
                revert_to_vh_model.metadata_last_edited_version_number
            )
            current_vh_model.metadata_last_edited_committer_id = (
                revert_to_vh_model.metadata_last_edited_committer_id
            )
            current_vh_model.committer_ids = revert_to_vh_model.committer_ids

        return current_vh_model

    def check_for_revert_commit(
        self, change_list: List[exp_domain.ExplorationChange]
    ) -> Optional[int]:
        """Checks if revert commit is present in the change list and returns
        the version number (if present).

        Args:
            change_list: list(ExplorationChange). The list of changes to check.

        Returns:
            Optional[int]. The revert version number (if present) or None.
        """
        for change in change_list:
            if change.cmd == feconf.CMD_REVERT_COMMIT:
                return int(change.version_number)
        return None

    def create_version_history_models(
        self, model_group: FormattedModelGroupForComputationJobDict
    ) -> Union[
        Tuple[str, List[exp_models.ExplorationVersionHistoryModel]],
        Tuple[
            str,
            List[exp_models.ExplorationVersionHistoryModel],
            Union[Exception, str],
            int
        ]
    ]:
        """Creates the version history models for a particular exploration.

        Args:
            model_group: FormattedModelGroupForComputationJobDict.
                The formatted model group for the computation job for which
                version history models are to be created.

        Returns:
            Union[
                Tuple[str, List[exp_models.ExplorationVersionHistoryModel]],
                Tuple[
                    str,
                    List[exp_models.ExplorationVersionHistoryModel],
                    Union[Exception, str],
                    int
                ]
            ]. The tuple of exploration id along with the created version
            history or the tuple of exploration id along with error message
            and version number of the exploration in case of any error.
        """
        with datastore_services.get_ndb_context():
            exp_vlatest = model_group['exp_vlatest']
            versioned_explorations = model_group['all_explorations']
            snapshot_metadata_models = model_group['snapshot_metadata_models']
            version_history_models = model_group['version_history_models']

            exp_version = exp_vlatest.version
            exp_id = exp_vlatest.id

            snapshot_model_at_v1 = snapshot_metadata_models[0]
            assert snapshot_model_at_v1 is not None
            committer_id_v1 = snapshot_model_at_v1.committer_id
            states_vh_at_v1 = {
                state_name: state_domain.StateVersionHistory(
                    None, None, committer_id_v1
                )
                for state_name in versioned_explorations[0].states
            }
            metadata_vh_at_v1 = exp_domain.MetadataVersionHistory(
                None, committer_id_v1
            )
            committer_ids_at_v1 = [committer_id_v1]
            vh_model_at_v1 = self.get_updated_version_history_model(
                version_history_models[0],
                versioned_explorations[0].id, 1, committer_id_v1,
                states_vh_at_v1, metadata_vh_at_v1, committer_ids_at_v1
            )
            vh_model_at_v1.update_timestamps()
            version_history_models[0] = vh_model_at_v1

            for version in range(2, exp_version + 1):
                snapshot_metadata_model = snapshot_metadata_models[version - 1]
                assert snapshot_metadata_model is not None
                committer_id: str = snapshot_metadata_model.committer_id
                change_list: List[exp_domain.ExplorationChange] = []
                for change_dict in snapshot_metadata_model.commit_cmds:
                    try:
                        change_list.append(exp_domain.ExplorationChange(
                            change_dict
                        ))
                    except Exception:
                        continue

                old_exploration = versioned_explorations[version - 2]
                new_exploration = versioned_explorations[version - 1]
                revert_to_version = self.check_for_revert_commit(
                    change_list
                )
                if revert_to_version is not None:
                    if (
                        revert_to_version <= 0 or
                        revert_to_version >= version
                    ):
                        return (
                            exp_id, [],
                            'Reverting to the version %d which is out of the '
                            'range [1, %d]' % (revert_to_version, version - 1),
                            version
                        )
                    revert_to_vh_model = (
                        version_history_models[revert_to_version - 1]
                    )
                    assert revert_to_vh_model is not None
                    new_vh_model = self.get_reverted_version_history_model(
                        revert_to_vh_model,
                        version_history_models[version - 1],
                        exp_id, version
                    )
                    new_vh_model.update_timestamps()
                    version_history_models[version - 1] = new_vh_model
                else:
                    old_states_dict = old_exploration.states
                    new_states_dict = new_exploration.states
                    old_metadata_dict: exp_domain.ExplorationMetadataDict = {
                        'title': old_exploration.title,
                        'category': old_exploration.category,
                        'objective': old_exploration.objective,
                        'language_code': old_exploration.language_code,
                        'tags': old_exploration.tags,
                        'blurb': old_exploration.blurb,
                        'author_notes': old_exploration.author_notes,
                        'states_schema_version': (
                            old_exploration.states_schema_version
                        ),
                        'init_state_name': old_exploration.init_state_name,
                        'param_specs': old_exploration.param_specs,
                        'param_changes': old_exploration.param_changes,
                        'auto_tts_enabled': old_exploration.auto_tts_enabled,
                        'edits_allowed': old_exploration.edits_allowed
                    }
                    new_metadata_dict: exp_domain.ExplorationMetadataDict = {
                        'title': new_exploration.title,
                        'category': new_exploration.category,
                        'objective': new_exploration.objective,
                        'language_code': new_exploration.language_code,
                        'tags': new_exploration.tags,
                        'blurb': new_exploration.blurb,
                        'author_notes': new_exploration.author_notes,
                        'states_schema_version': (
                            new_exploration.states_schema_version
                        ),
                        'init_state_name': new_exploration.init_state_name,
                        'param_specs': new_exploration.param_specs,
                        'param_changes': new_exploration.param_changes,
                        'auto_tts_enabled': new_exploration.auto_tts_enabled,
                        'edits_allowed': new_exploration.edits_allowed
                    }

                    old_vh_model = version_history_models[version - 2]
                    assert old_vh_model is not None
                    old_states_vh = {
                        state_name: (
                            state_domain.StateVersionHistory.from_dict(
                                state_vh_dict
                            )
                        )
                        for state_name, state_vh_dict in
                        old_vh_model.state_version_history.items()
                    }
                    old_metadata_vh = exp_domain.MetadataVersionHistory(
                        old_vh_model.metadata_last_edited_version_number,
                        old_vh_model.metadata_last_edited_committer_id
                    )

                    try:
                        new_states_vh = (
                            exp_services.update_states_version_history(
                                old_states_vh, change_list, old_states_dict,
                                new_states_dict, version, committer_id
                            )
                        )
                        new_metadata_vh = (
                            exp_services.update_metadata_version_history(
                                old_metadata_vh, change_list, old_metadata_dict,
                                new_metadata_dict, version, committer_id
                            )
                        )
                        new_committer_ids = (
                            exp_services.get_updated_committer_ids(
                                new_states_vh,
                                new_metadata_vh.last_edited_committer_id
                            )
                        )
                        new_vh_model = self.get_updated_version_history_model(
                            version_history_models[version - 1],
                            exp_id, version, committer_id,
                            new_states_vh, new_metadata_vh, new_committer_ids
                        )
                        new_vh_model.update_timestamps()
                        version_history_models[version - 1] = new_vh_model
                    except Exception as e:
                        return (exp_id, [], e, version)

            # The following block is used to prevent MyPy errors.
            vh_models_without_none: List[
                exp_models.ExplorationVersionHistoryModel] = []
            for vh_model in version_history_models:
                if vh_model is not None: # pragma: no cover
                    vh_models_without_none.append(vh_model)
            return (exp_id, vh_models_without_none)

    def generate_exploration_from_snapshot(
        self, snapshot_model: exp_models.ExplorationSnapshotContentModel
    ) -> Optional[exp_models.ExplorationModel]:
        """Generates exploration model from given snapshot content model.

        Args:
            snapshot_model: ExplorationSnapshotContentModel. The snapshot
                content model.

        Returns:
            ExplorationModel. The exploration model.
        """
        with datastore_services.get_ndb_context():
            try:
                snapshot_dict = snapshot_model.content
                exp_id = snapshot_model.get_unversioned_instance_id()
                model_class = exp_models.ExplorationModel
                reconstituted_model = model_class(id=exp_id)._reconstitute(  # pylint: disable=protected-access
                    snapshot_dict
                )
                reconstituted_model.created_on = snapshot_model.created_on
                reconstituted_model.last_updated = snapshot_model.last_updated
                return reconstituted_model
            except Exception:
                return None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        all_explorations = (
            self.pipeline
            | 'Get all the exploration snapshot models' >> ndb_io.GetModels(
                exp_models.ExplorationSnapshotContentModel.get_all(
                    include_deleted=False
                )
            )
            | 'Filter the exploration snapshot models without None' >>
                beam.Filter(lambda model: model is not None)
            | 'Get reconstituted exploration models' >>
                beam.Map(self.generate_exploration_from_snapshot)
            | 'Filter explorations without None' >>
                beam.Filter(lambda x: x is not None)
            | 'Get id-model pair for exploration models' >>
                beam.Map(lambda exploration: (exploration.id, exploration))
        )

        all_explorations_vlatest = (
            self.pipeline
            | 'Get all the exploration models at latest version' >>
                ndb_io.GetModels(exp_models.ExplorationModel.get_all(
                        include_deleted=False
                ))
            | 'Filter the explorations without None' >>
                beam.Filter(lambda x: x is not None)
            | 'Get id-model pair for exploration models at vlatest' >>
                beam.Map(lambda exploration: (exploration.id, exploration))
        )

        all_snapshot_metadata = (
            self.pipeline
            | 'Get all ExplorationSnapshotMetadataModels' >> ndb_io.GetModels(
                exp_models.ExplorationSnapshotMetadataModel.get_all(
                    include_deleted=False
                )
            )
            | 'Create key-value pairs with id and metadata models' >>
                beam.Map(lambda model: (
                    model.get_unversioned_instance_id(), model
                )
            )
        )

        all_version_history_models = (
            self.pipeline
            | 'Get already existing ExplorationVersionHistoryModels' >>
                ndb_io.GetModels(
                    exp_models.ExplorationVersionHistoryModel.get_all(
                        include_deleted=False
                    )
                )
            | 'Create key-value pairs with id and version history models' >>
                beam.Map(lambda model: (model.exploration_id, model))
        )

        model_groups = (
            ({
                'all_exp_models': all_explorations,
                'exp_models_vlatest': all_explorations_vlatest,
                'snapshot_metadata_models': all_snapshot_metadata,
                'version_history_models': all_version_history_models
            })
            | 'Group by key' >> beam.CoGroupByKey()
        )

        valid_model_groups = (
            model_groups
            | 'Get rid of exploration id' >>
                beam.Values() # pylint: disable=no-value-for-parameter
            | 'Get formatted model groups' >> beam.Map(
                self.convert_to_formatted_model_group
            )
            | 'Filter valid model groups' >> beam.Filter(
                lambda x: x is not None
            )
        )

        version_history_models = (
            valid_model_groups
            | 'Create the version history models for each valid exploration' >>
                beam.Map(self.create_version_history_models)
        )

        exps_having_invalid_change_list = (
            version_history_models
            | 'Filter exps having invalid change list' >>
                beam.Filter(lambda models: len(models[1]) == 0)
            | 'Extract the exp ids having invalid change list' >>
                beam.Map(lambda models: (models[0], models[2], models[3]))
        )

        exps_for_which_version_history_was_computed = (
            version_history_models
            | 'Filter exps for which version history was computed' >>
                beam.Filter(lambda models: len(models[1]) > 0)
            | 'Extract the exp ids for which version history was computed' >>
                beam.Map(lambda models: models[0])
        )

        flattened_vh_models = (
            version_history_models
            | 'Drop the exploration ids' >>
                beam.Map(lambda models: models[1])
            | 'Flatten the models' >> beam.FlatMap(lambda x: x)
        )

        unused_put_result = (
            flattened_vh_models
            | 'Save the models to the datastore' >> ndb_io.PutModels()
        )

        report_number_of_exps_queried = (
            all_explorations_vlatest
            | 'Count queried explorations' >>
                job_result_transforms.CountObjectsToJobRunResult('ALL EXPS')
        )

        report_exps_count_for_which_version_history_can_be_computed = (
            valid_model_groups
            | 'Count exps for which version history can be computed' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED'
                )
        )

        report_number_of_exps_with_invalid_change_list = (
            exps_having_invalid_change_list
            | 'Count explorations having invalid change list' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS HAVING INVALID CHANGE LIST'
                )
        )

        report_details_of_exps_having_invalid_change_list = (
            exps_having_invalid_change_list
            | 'Save info on explorations having invalid change list' >>
                beam.Map(lambda error: job_run_result.JobRunResult.as_stderr(
                    'Exploration %s has invalid change list. '
                    'Error: %s. Version: %s' % (error[0], error[1], error[2])
                ))
        )

        report_number_of_exps_for_which_version_history_was_computed = (
            exps_for_which_version_history_was_computed
            | 'Count explorations for which version history was computed' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS FOR WHICH VERSION HISTORY CAN WAS COMPUTED'
                )
        )

        report_number_of_models_modified = (
            flattened_vh_models
            | 'Count number of models created' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'CREATED OR MODIFIED VERSION HISTORY MODELS'
                )
        )

        return (
            (
                report_number_of_exps_queried,
                report_exps_count_for_which_version_history_can_be_computed,
                report_number_of_exps_with_invalid_change_list,
                report_details_of_exps_having_invalid_change_list,
                report_number_of_exps_for_which_version_history_was_computed,
                report_number_of_models_modified
            )
            | 'Flatten' >> beam.Flatten()
        )
