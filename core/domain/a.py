exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        try:
            to_param_domain = param_domain.ParamChange.from_dict
            for change in change_list:
                if change.cmd == exp_domain.CMD_ADD_STATE:
                    exploration.add_states([change.state_name])
                elif change.cmd == exp_domain.CMD_RENAME_STATE:
                    exploration.rename_state(
                        change.old_state_name, change.new_state_name)
                elif change.cmd == exp_domain.CMD_DELETE_STATE:
                    exploration.delete_state(change.state_name)
                elif change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY:
                    state = exploration.states[change.state_name]
                    if (change.property_name ==
                            exp_domain.STATE_PROPERTY_PARAM_CHANGES):
                        state.update_param_changes(
                            list(python_utils.MAP(
                                to_param_domain, change.new_value)))
                    elif change.property_name == exp_domain.STATE_PROPERTY_CONTENT:
                        content = (
                            state_domain.SubtitledHtml.from_dict(change.new_value))
                        content.validate()
                        state.update_content(content)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_ID):
                        state.update_interaction_id(change.new_value)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_NEXT_CONTENT_ID_INDEX):
                        state.update_next_content_id_index(change.new_value)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_LINKED_SKILL_ID):
                        state.update_linked_skill_id(change.new_value)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                        state.update_interaction_customization_args(
                            change.new_value)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_HANDLERS):
                        raise utils.InvalidInputException(
                            'Editing interaction handlers is no longer supported')
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                        new_answer_groups = [
                            state_domain.AnswerGroup.from_dict(answer_groups)
                            for answer_groups in change.new_value
                        ]
                        state.update_interaction_answer_groups(new_answer_groups)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_DEFAULT_OUTCOME):
                        new_outcome = None
                        if change.new_value:
                            new_outcome = state_domain.Outcome.from_dict(
                                change.new_value
                            )
                        state.update_interaction_default_outcome(new_outcome)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_UNCLASSIFIED_ANSWERS):
                        state.update_interaction_confirmed_unclassified_answers(
                            change.new_value)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_HINTS):
                        if not isinstance(change.new_value, list):
                            raise Exception(
                                'Expected hints_list to be a list,'
                                ' received %s' % change.new_value)
                        new_hints_list = [
                            state_domain.Hint.from_dict(hint_dict)
                            for hint_dict in change.new_value
                        ]
                        state.update_interaction_hints(new_hints_list)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_INTERACTION_SOLUTION):
                        new_solution = None
                        if change.new_value is not None:
                            new_solution = state_domain.Solution.from_dict(
                                state.interaction.id, change.new_value)
                        state.update_interaction_solution(new_solution)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_SOLICIT_ANSWER_DETAILS):
                        if not isinstance(change.new_value, bool):
                            raise Exception(
                                'Expected solicit_answer_details to be a ' +
                                'bool, received %s' % change.new_value)
                        state.update_solicit_answer_details(change.new_value)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_CARD_IS_CHECKPOINT):
                        if not isinstance(change.new_value, bool):
                            raise Exception(
                                'Expected card_is_checkpoint to be a ' +
                                'bool, received %s' % change.new_value)
                        state.update_card_is_checkpoint(change.new_value)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS):
                        if not isinstance(change.new_value, dict):
                            raise Exception(
                                'Expected recorded_voiceovers to be a dict, '
                                'received %s' % change.new_value)
                        # Explicitly convert the duration_secs value from
                        # int to float. Reason for this is the data from
                        # the frontend will be able to match the backend
                        # state model for Voiceover properly. Also js
                        # treats any number that can be float and int as
                        # int (no explicit types). For example,
                        # 10.000 is not 10.000 it is 10.
                        new_voiceovers_mapping = (
                            change.new_value['voiceovers_mapping'])
                        language_codes_to_audio_metadata = (
                            new_voiceovers_mapping.values())
                        for language_codes in language_codes_to_audio_metadata:
                            for audio_metadata in language_codes.values():
                                audio_metadata['duration_secs'] = (
                                    float(audio_metadata['duration_secs'])
                                )
                        recorded_voiceovers = (
                            state_domain.RecordedVoiceovers.from_dict(
                                change.new_value))
                        state.update_recorded_voiceovers(recorded_voiceovers)
                    elif (change.property_name ==
                        exp_domain.STATE_PROPERTY_WRITTEN_TRANSLATIONS):
                        if not isinstance(change.new_value, dict):
                            raise Exception(
                                'Expected written_translations to be a dict, '
                                'received %s' % change.new_value)
                        cleaned_written_translations_dict = (
                            state_domain.WrittenTranslations
                            .convert_html_in_written_translations(
                                change.new_value, html_cleaner.clean))
                        written_translations = (
                            state_domain.WrittenTranslations.from_dict(
                                cleaned_written_translations_dict))
                        state.update_written_translations(written_translations)
                elif change.cmd == exp_domain.DEPRECATED_CMD_ADD_TRANSLATION:
                    # DEPRECATED: This command is deprecated. Please do not use.
                    # The command remains here to support old suggestions.
                    exploration.states[change.state_name].add_translation(
                        change.content_id, change.language_code,
                        change.translation_html)
                elif change.cmd == exp_domain.CMD_ADD_WRITTEN_TRANSLATION:
                    exploration.states[change.state_name].add_written_translation(
                        change.content_id, change.language_code,
                        change.translation_html, change.data_format)
                elif (change.cmd ==
                    exp_domain.CMD_MARK_WRITTEN_TRANSLATIONS_AS_NEEDING_UPDATE):
                    exploration.states[
                        change.state_name
                    ].mark_written_translations_as_needing_update(change.content_id)
                elif change.cmd == exp_domain.CMD_EDIT_EXPLORATION_PROPERTY:
                    if change.property_name == 'title':
                        exploration.update_title(change.new_value)
                    elif change.property_name == 'category':
                        exploration.update_category(change.new_value)
                    elif change.property_name == 'objective':
                        exploration.update_objective(change.new_value)
                    elif change.property_name == 'language_code':
                        exploration.update_language_code(change.new_value)
                    elif change.property_name == 'tags':
                        exploration.update_tags(change.new_value)
                    elif change.property_name == 'blurb':
                        exploration.update_blurb(change.new_value)
                    elif change.property_name == 'author_notes':
                        exploration.update_author_notes(change.new_value)
                    elif change.property_name == 'param_specs':
                        exploration.update_param_specs(change.new_value)
                    elif change.property_name == 'param_changes':
                        exploration.update_param_changes(list(
                            python_utils.MAP(to_param_domain, change.new_value)))
                    elif change.property_name == 'init_state_name':
                        exploration.update_init_state_name(change.new_value)
                    elif change.property_name == 'auto_tts_enabled':
                        exploration.update_auto_tts_enabled(change.new_value)
                    elif change.property_name == 'correctness_feedback_enabled':
                        exploration.update_correctness_feedback_enabled(
                            change.new_value)
                elif (change.cmd ==
                    exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
                    # Loading the exploration model from the datastore into an
                    # Exploration domain object automatically converts it to use
                    # the latest states schema version. As a result, simply
                    # resaving the exploration is sufficient to apply the states
                    # schema update. Thus, no action is needed here other than
                    # to make sure that the version that the user is trying to
                    # migrate to is the latest version.
                    target_version_is_current_state_schema_version = (
                        change.to_version ==
                        python_utils.UNICODE(feconf.CURRENT_STATE_SCHEMA_VERSION))
                    if not target_version_is_current_state_schema_version:
                        raise Exception(
                            'Expected to migrate to the latest state schema '
                            'version %s, received %s' % (
                                feconf.CURRENT_STATE_SCHEMA_VERSION,
                                change.to_version))
            return exploration

        except Exception as e:
            logging.error(
                '%s %s %s %s' % (
                    e.__class__.__name__, e, exploration_id,
                    pprint.pprint(change_list))
            )
            python_utils.reraise_exception()