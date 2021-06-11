{
    u'id': u'CwYhb8pnr3aJ',
    u'author_notes': u'',
    u'correctness_feedback_enabled': False,
    u'param_changes': [],
    u'language_code': u'en',
    u'title': u'Aryaman Testing',
    u'param_specs': {},
    u'states_schema_version': 45,
    u'states': {
        u'Introduction1': {
            u'linked_skill_id': None,
            u'recorded_voiceovers': {
                u'voiceovers_mapping': {
                    u'default_outcome': {},
                    u'content': {},
                    u'ca_buttonText_2': {}
                }
            },
            u'param_changes': [],
            u'content': {
                u'content_id': u'content',
                u'html': u'<p>Ram Ram Ram</p>'
            },
            u'card_is_checkpoint': True,
            u'next_content_id_index': 3,
            u'written_translations': {
                u'translations_mapping': {
                    u'default_outcome': {},
                    u'content': {},
                    u'ca_buttonText_2': {}
                }
            },
            u'solicit_answer_details': False,
            u'classifier_model_id': None,
            u'interaction': {
                u'id': u'Continue',
                u'answer_groups': [],
                u'solution': None,
                u'confirmed_unclassified_answers': [],
                u'hints': [],
                u'default_outcome': {
                    u'dest': u'end',
                    u'refresher_exploration_id': None,
                    u'labelled_as_correct': False,
                    u'feedback': {
                        u'content_id': u'default_outcome',
                        u'html': u''
                    },
                    u'missing_prerequisite_skill_id': None,
                    u'param_changes': []
                },
                u'customization_args': {
                    u'buttonText': {
                        u'value': {
                            u'content_id': u'ca_buttonText_2',
                            u'unicode_str': u'Continue'
                        }
                    }
                }
            }
        },
        u'end': {
            u'linked_skill_id': None,
            u'recorded_voiceovers': {
                u'voiceovers_mapping': {
                    u'content': {}
                }
            },
            u'param_changes': [],
            u'content': {
                u'content_id': u'content',
                u'html': u'<p>sadaskjashdkjhsdk nnewfweCongratulations, you have finished!</p>'
            },
            u'card_is_checkpoint': False,
            u'next_content_id_index': 0,
            u'written_translations': {
                u'translations_mapping': {
                    u'content': {}
                }
            },
            u'solicit_answer_details': False,
            u'classifier_model_id': None,
            u'interaction': {
                u'id': u'EndExploration',
                u'answer_groups': [],
                u'solution': None,
                u'confirmed_unclassified_answers': [],
                u'hints': [],
                u'default_outcome': None,
                u'customization_args': {
                    u'recommendedExplorationIds': {
                        u'value': []
                    }
                }
            }
        }
    },
    u'category': u'Algebra',
    u'blurb': u'',
    u'auto_tts_enabled': True,
    u'init_state_name': u'Introduction1',
    u'objective': u'jshbjsagjdaryman is a good boy',
    u'tags': []
}

def apply_change_list(exploration_id, change_list):
    """Applies a changelist to a pristine exploration and returns the result.

    Each entry in change_list is a dict that represents an ExplorationChange
    object.

    Args:
        exploration_id: str. The id of the exploration to which the change list
            is to be applied.
        change_list: list(ExplorationChange). The list of changes to apply.

    Returns:
        Exploration. The exploration domain object that results from applying
        the given changelist to the existing version of the exploration.

    Raises:
        Exception. Any entries in the changelist are invalid.
    """
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
            elif change.cmd == exp_domain.CMD_ADD_TRANSLATION:
                exploration.states[change.state_name].add_translation(
                    change.content_id, change.language_code,
                    change.translation_html)
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