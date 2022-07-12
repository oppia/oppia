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

import copy

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
from typing import Dict, List, Optional, Tuple
from typing_extensions import TypedDict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])
datastore_services = models.Registry.import_datastore_services()


class UnformattedModelGroupDict(TypedDict):
    """Dictionary representing an unformatted model group."""

    exp_models_v1: List[exp_models.ExplorationModel]
    exp_models_vlatest: List[exp_models.ExplorationModel]
    commit_log_models: List[exp_models.ExplorationCommitLogEntryModel]
    version_history_models: (
        List[Optional[exp_models.ExplorationVersionHistoryModel]]
    )


class FormattedModelGroupDict(TypedDict):
    """Dictionary representing a formatted model group."""

    exp_v1: exp_domain.Exploration
    exp_vlatest: exp_domain.Exploration
    commit_log_models: List[exp_models.ExplorationCommitLogEntryModel]
    version_history_models: (
        List[Optional[exp_models.ExplorationVersionHistoryModel]]
    )


class ComputeExplorationVersionHistoryJob(base_jobs.JobBase):
    """Computes and populates the version history data for an exploration."""

    def _filter_valid_model_group(
        self, model_group: UnformattedModelGroupDict
    ) -> bool:
        """Returns True if the given model group is valid.

        Args:
            model_group: UnformattedModelGroupDict. The model group to be
                checked.

        Returns:
            bool. Whether the given model group is valid or not.
        """
        exp_models_v1 = model_group['exp_models_v1']
        exp_models_vlatest = model_group['exp_models_vlatest']
        commit_log_models = model_group['commit_log_models']

        model_group_is_valid = (
            len(exp_models_v1) == 1 and len(exp_models_vlatest) == 1
        )
        if model_group_is_valid:
            exp_model_vlatest = exp_models_vlatest[0]
            model_group_is_valid = (
                len(commit_log_models) == exp_model_vlatest.version
            )
        return model_group_is_valid

    def _convert_to_formatted_model_group_dict(
        self, model_group: UnformattedModelGroupDict
    ) -> FormattedModelGroupDict:
        """Returns a formatted version of the given valid model group.

        Args:
            model_group: UnformattedModelGroupDict. The model group to be
                formatted.

        Returns:
            FormattedModelGroupDict. The formatted version of the given valid
            model group dict.
        """
        exp_v1 = exp_fetchers.get_exploration_from_model(
            model_group['exp_models_v1'][0]
        )
        exp_vlatest = exp_fetchers.get_exploration_from_model(
            model_group['exp_models_vlatest'][0]
        )

        # Rearranging the commit log models in sorted manner as they might
        # not be sorted while using CoGroupByKey.
        commit_log_models: List[exp_models.ExplorationCommitLogEntryModel] = (
            [None] * exp_vlatest.version
        )
        for commit_log in model_group['commit_log_models']:
            commit_log_models[commit_log.version - 1] = commit_log

        # Rearranging the already existing version history models for the
        # given exploration.
        version_history_models: List[Optional[
            exp_models.ExplorationVersionHistoryModel
        ]] = [None] * exp_vlatest.version
        for version_history in list(model_group['version_history_models']):
            version_history_models[version_history.exploration_version - 1] = (
              version_history
            )

        return {
            'exp_v1': exp_v1,
            'exp_vlatest': exp_vlatest,
            'commit_log_models': commit_log_models,
            'version_history_models': version_history_models
        }

    def _get_updated_version_history_model(
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

    def _get_reverted_version_history_model(
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

    def _check_for_revert_commit(
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
                return change.version_number
        return None

    def _create_version_history_models(
        self, model_group: FormattedModelGroupDict
    ) -> Tuple[str, List[exp_models.ExplorationVersionHistoryModel]]:
        """Creates the version history models for a particular exploration.

        Args:
            model_group: FormattedModelGroupDict. The formatted model group.

        Returns:
            Tuple[str, List[exp_models.ExplorationVersionHistoryModel]].
            The exploration id along with the created version history models.
        """
        with datastore_services.get_ndb_context():
            exp_v1 = model_group['exp_v1']
            exp_vlatest = model_group['exp_vlatest']
            commit_log_models = model_group['commit_log_models']
            version_history_models = model_group['version_history_models']

            exp_version = exp_vlatest.version
            exp_id = exp_vlatest.id

            versioned_explorations: List[exp_domain.Exploration] = (
                [None] * exp_version
            )
            versioned_explorations[0] = exp_v1
            versioned_explorations[exp_version - 1] = exp_vlatest

            for version in range(1, exp_version + 1):
                commit_log_model = commit_log_models[version - 1]
                committer_id: str = commit_log_model.user_id
                change_list: List[exp_domain.ExplorationChange] = []
                for change_dict in commit_log_model.commit_cmds:
                    change_list.append(exp_domain.ExplorationChange(
                        change_dict
                    ))

                if version == 1:
                    new_states_vh = {
                        state_name: state_domain.StateVersionHistory(
                            None, None, committer_id
                        )
                        for state_name in exp_v1.states
                    }
                    new_metadata_vh = exp_domain.MetadataVersionHistory(
                        None, committer_id
                    )
                    new_committer_ids = [committer_id]
                    new_vh_model = self._get_updated_version_history_model(
                        version_history_models[version - 1],
                        exp_id, version, committer_id,
                        new_states_vh, new_metadata_vh, new_committer_ids
                    )
                    new_vh_model.update_timestamps()
                    version_history_models[version - 1] = new_vh_model
                else:
                    old_exploration = versioned_explorations[version - 2]
                    # If the change list contains evert commit, we have to
                    # handle it separately.
                    revert_to_version = self._check_for_revert_commit(
                        change_list
                    )
                    if revert_to_version is not None:
                        # If the revert to version number is invalid, we cannot
                        # generate the further version history models
                        # correctly. Hence, an empty list is returned
                        # indicating that the version history of this
                        # exploration cannot be shown to the user.
                        if (
                            revert_to_version <= 0 or
                            revert_to_version >= version
                        ):
                            return (exp_id, [])
                        new_exploration = copy.deepcopy(
                            versioned_explorations[revert_to_version - 1]
                        )
                        new_exploration.version = version
                        revert_to_vh_model = (
                            version_history_models[revert_to_version - 1]
                        )
                        new_vh_model = self._get_reverted_version_history_model(
                            revert_to_vh_model,
                            version_history_models[version - 1],
                            exp_id, version
                        )
                        new_vh_model.update_timestamps()
                        version_history_models[version - 1] = new_vh_model
                        versioned_explorations[version - 1] = new_exploration
                    else:
                        # The generation of the new exploration is placed under
                        # a try/except block because sometimes the change list
                        # may be invalid for some explorations and in those
                        # cases, we cannot compute the version history for
                        # those explorations. If we have an invalid change list
                        # in any version of the exploration, we cannot show its
                        # version history to the users.
                        try:
                            new_exploration = (
                                exp_services.apply_change_list_to_exploration(
                                    old_exploration, version - 1, change_list
                                )
                            )
                            new_exploration.version = version
                        except Exception:
                            # If any error is thrown while applying the change
                            # list, we just return an empty array indicating
                            # that no models were created for this exploration.
                            return (exp_id, [])

                        old_states = old_exploration.states
                        new_states = new_exploration.states
                        old_metadata = old_exploration.get_metadata()
                        new_metadata = new_exploration.get_metadata()

                        old_vh_model = version_history_models[version - 2]
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

                        new_states_vh = (
                            exp_services.update_states_version_history(
                                old_states_vh, change_list, old_states,
                                new_states, version, committer_id
                            )
                        )
                        new_metadata_vh = (
                            exp_services.update_metadata_version_history(
                                old_metadata_vh, change_list, old_metadata,
                                new_metadata, version, committer_id
                            )
                        )
                        new_committer_ids = (
                            exp_services.get_updated_committer_ids(
                                new_states_vh,
                                new_metadata_vh.last_edited_committer_id
                            )
                        )

                        new_vh_model = self._get_updated_version_history_model(
                            version_history_models[version - 1],
                            exp_id, version, committer_id,
                            new_states_vh, new_metadata_vh, new_committer_ids
                        )
                        new_vh_model.update_timestamps()
                        version_history_models[version - 1] = new_vh_model
                        versioned_explorations[version - 1] = new_exploration

            return (exp_id, version_history_models)

    def _get_exploration_model_at_v1(
        self, exp_id: str
    ) -> exp_models.ExplorationModel:
        """Returns the exploration model with given id at version 1.

        Args:
            exp_id: str. The id of the exploration.

        Returns:
            ExplorationModel. The exploration model at version 1.
        """
        with datastore_services.get_ndb_context():
            exp_model_at_v1 = exp_models.ExplorationModel.get_version(
                exp_id, 1, strict=False
            )
            return exp_model_at_v1

    def filter_valid_exploration_models_at_v1(
        self, exp_model: exp_models.ExplorationModel
    ) -> bool:
        """Returns true if the exploration model at v1 is valid for calculation
        of version history.

        Args:
            exp_model: The exploration model at version 1.

        Returns:
            bool. Whether the exploration model at v1 can be used for
            calculation of version history.
        """
        try:
            exp_fetchers.get_exploration_from_model(exp_model)
            return True
        except Exception:
            return False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        all_explorations_vlatest = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Create key-value pairs with id and exp models' >>
                beam.Map(lambda model: (model.id, model))
        )

        explorations_at_v1 = (
            all_explorations_vlatest
            | 'Get the exploration ids' >>
                beam.Map(lambda model: model[0])
            | 'Get the ExplorationModels at v1' >>
                beam.Map(self._get_exploration_model_at_v1)
        )

        valid_explorations_v1 = (
            explorations_at_v1
            | 'Filter the valid exploration models at v1' >> beam.Filter(
                self.filter_valid_exploration_models_at_v1
            )
            | 'Create key-value pairs with id and exp models at v1' >>
                beam.Map(lambda model: (model.id, model))
        )

        invalid_explorations_v1 = (
            explorations_at_v1
            | 'Filter the invalid exploration models at v1' >> beam.Filter(
                lambda model: (
                    not self.filter_valid_exploration_models_at_v1(model)
                )
            )
        )

        all_commit_logs = (
            all_explorations_vlatest
            | 'Get all ExplorationCommitLogEntryModels' >> ndb_io.GetModels(
                exp_models.ExplorationCommitLogEntryModel.get_all(
                    include_deleted=False
                )
            )
            | 'Create key-value pairs with id and commit log models' >>
                beam.Map(lambda model: (model.exploration_id, model))
        )

        all_version_history_models = (
            all_commit_logs
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
                'exp_models_v1': valid_explorations_v1,
                'exp_models_vlatest': all_explorations_vlatest,
                'commit_log_models': all_commit_logs,
                'version_history_models': all_version_history_models
            })
            | 'Group by key' >> beam.CoGroupByKey()
            | 'Get rid of exploration id' >>
                beam.Values() # pylint: disable=no-value-for-parameter
            | 'Filter valid model groups' >> beam.Filter(
                self._filter_valid_model_group
            )
            | 'Format valid model groups' >> beam.Map(
                self._convert_to_formatted_model_group_dict
            )
        )

        version_history_models = (
            model_groups
            | 'Create the version history models for each valid exploration' >>
                beam.Map(self._create_version_history_models)
        )

        exps_having_invalid_change_list = (
            version_history_models
            | 'Filter exps having invalid change list' >>
                beam.Filter(lambda models: len(models[1]) == 0)
            | 'Extract the exp ids having invalid change list' >>
                beam.Map(lambda models: models[0])
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

        # The following are explorations which have outdated state schema
        # version and cannot be converted from older schema versions to the
        # latest one which is required while calculating version histories.
        # Due to this, their version histories cannot be calculated.
        report_number_of_invalid_exps = (
            invalid_explorations_v1
            | 'Count invalid queried explorations' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS HAVING OUTDATED STATES SCHEMA'
                )
        )

        report_details_of_invalid_exps = (
            invalid_explorations_v1
            | 'Save info on invalid explorations' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stderr(
                    'Version history cannot be calculated for %s' % (model.id)
                )
            )
        )

        # The below count gives the number of explorations which have complete
        # commit logs of all versions and have supported states schema version.
        # However, it also includes the explorations having invalid change
        # list.
        report_exps_count_for_which_version_history_can_be_computed = (
            model_groups
            | 'Count exps for which version history can be computed' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS FOR WHICH VERSION HISTORY CAN BE COMPUTED'
                )
        )

        # The following are explorations which have complete commit logs for
        # all versions but the change list in one or multiple versions are
        # invalid. We cannot calculate version histories of these explorations
        # either.
        report_number_of_exps_with_invalid_change_list = (
            exps_having_invalid_change_list
            | 'Count explorations having invalid change list' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS HAVING INVALID CHANGE LIST'
                )
        )

        # The below count is the number of explorations for which version
        # history was computed. It is clear that this count will be equal to
        # (exps_count_for_which_version_history_can_be_computed) -
        # (number_of_exps_with_invalid_change_list).
        report_number_of_exps_for_which_version_history_was_computed = (
            exps_for_which_version_history_was_computed
            | 'Count explorations for which version history was computed' >>
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPS FOR WHICH VERSION HISTORY CAN WAS COMPUTED'
                )
        )

        report_details_of_exps_having_invalid_change_list = (
            exps_having_invalid_change_list
            | 'Save info on explorations having invalid change list' >>
                beam.Map(lambda exp_id: job_run_result.JobRunResult.as_stderr(
                    'Exploration %s has invalid change list' % (exp_id)
                ))
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
                report_number_of_invalid_exps,
                report_details_of_invalid_exps,
                report_exps_count_for_which_version_history_can_be_computed,
                report_number_of_exps_with_invalid_change_list,
                report_details_of_exps_having_invalid_change_list,
                report_number_of_exps_for_which_version_history_was_computed,
                report_number_of_models_modified
            )
            | 'Flatten' >> beam.Flatten()
        )
