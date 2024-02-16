# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Functions for working with Android."""

from __future__ import annotations

import logging
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import translation_domain
from core.domain import translation_services
from core.domain import user_services
from core.platform import models

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services
    from mypy_imports import translate_services
    from mypy_imports import translation_models

translate_services = models.Registry.import_translate_services()
secrets_services = models.Registry.import_secrets_services()

(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


def initialize_android_test_data() -> str:
    """Generates structures for Android end-to-end tests.

    This handler generates structures for Android end-to-end tests in
    order to evaluate the integration of network requests from the
    Android client to the backend. This handler should only be called
    once (or otherwise raises an exception), and can only be used in
    development mode (this handler is unavailable in production).

    The specific structures that are generated:
        Topic: A topic with both a test story and a subtopic.
        Story: A story with 'android_interactions' as an exploration node.
        Exploration: 'android_interactions' from the local assets.
        Subtopic: A dummy subtopic to validate the topic.
        Skill: A dummy skill to validate the subtopic.

    Returns:
        str. The topic ID of the created topic.

    Raises:
        Exception. When used in production mode.
        InvalidInputException. The topic is already
            created but not published.
        InvalidInputException. The topic is already published.
    """
    user_id = feconf.SYSTEM_COMMITTER_ID
    exp_id = '26'
    target_language_code = 'pt'
    entity_type = feconf.TranslatableEntityType(feconf.ENTITY_TYPE_EXPLORATION)

    if topic_services.does_topic_with_name_exist('Android test'):
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)

        # If the topic already exists, delete it before proceeding.
        topic_services.delete_topic(user_id, topic.id)

        # Also delete the demo exploration's translations, if any.
        test_exploration = exp_fetchers.get_exploration_by_id(
            exp_id, strict=False)
        if test_exploration:
            entity_translation_model = (
                translation_models.EntityTranslationsModel.get_model(
                    entity_type,
                    exp_id,
                    test_exploration.version,
                    target_language_code
                )
            )
            if entity_translation_model:
                entity_translation_model.delete()

        # Unconditionally reset possible machine translations.
        translation_models.MachineTranslationModel.delete_multi(
            translation_models.MachineTranslationModel.get_all().fetch())

        # Remove the topic from classroom pages if it's present.
        classrooms_property = config_domain.CLASSROOM_PAGES_DATA
        classrooms = classrooms_property.value
        for classroom in classrooms:
            classroom['topic_ids'].remove(topic.id)
        config_services.set_property(
            user_id, classrooms_property.name, classrooms)

    # Generate new Structure id for topic, story, skill and question.
    topic_id = topic_fetchers.get_new_topic_id()
    story_id = story_services.get_new_story_id()
    skill_id = skill_services.get_new_skill_id()
    question_id = question_services.get_new_question_id()

    # Create dummy skill and question.
    skill = _create_dummy_skill(
        skill_id, 'Dummy Skill for Android', '<p>Dummy Explanation 1</p>')
    question = _create_dummy_question(question_id, 'Question 1', [skill_id])
    question_services.add_question(user_id, question)
    question_services.create_new_question_skill_link(
        user_id, question_id, skill_id, 0.3)

    # Create and update topic to validate before publishing.
    topic = topic_domain.Topic.create_default_topic(
        topic_id, 'Android test', 'test-topic-one', 'description', 'fragm')
    topic.update_url_fragment('test-topic')
    topic.update_meta_tag_content('tag')
    topic.update_page_title_fragment_for_web('page title for topic')

    # Save the dummy image to the filesystem to be used as thumbnail.
    with utils.open_file(
        os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
        'rb',
        encoding=None
    ) as f:
        raw_image = f.read()
    fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_TOPIC, topic_id)
    fs.commit(
        '%s/test_svg.svg' % constants.ASSET_TYPE_THUMBNAIL,
        raw_image,
        mimetype='image/svg+xml'
    )

    # Update thumbnail properties.
    topic_services.update_thumbnail_filename(topic, 'test_svg.svg')
    topic.update_thumbnail_bg_color('#C6DCDA')

    # Add other structures to the topic.
    topic.add_canonical_story(story_id)
    topic.add_uncategorized_skill_id(skill_id)
    topic.add_subtopic(1, 'Test Subtopic Title', 'testsubtop')

    # Update and validate subtopic.
    topic_services.update_subtopic_thumbnail_filename(topic, 1, 'test_svg.svg')
    topic.update_subtopic_thumbnail_bg_color(1, '#FFFFFF')
    topic.update_subtopic_url_fragment(1, 'suburl')
    topic.move_skill_id_to_subtopic(None, 1, skill_id)
    topic.update_skill_ids_for_diagnostic_test([skill_id])
    subtopic_page = (
        subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
            1, topic_id))
    subtopic_page.page_contents.subtitled_html.html = (
        'Example revision card. Click <oppia-noninteractive-skillreview '
        'skill_id-with-value="&amp;quot;%s&amp;quot;" text-with-value="'
        '&amp;quot;here&amp;quot;"></oppia-noninteractive-skillreview> to'
        ' open a concept card.' % skill_id
    )

    # Upload local exploration to the datastore and enable feedback.
    exp_services.load_demo(exp_id)
    rights_manager.release_ownership_of_exploration(
        user_services.get_system_user(), exp_id)

    # Add and update the exploration/node to the story.
    story = story_domain.Story.create_default_story(
        story_id,
        'Android End to End testing',
        'Description',
        topic_id,
        'android-end-to-end-testing'
    )

    story.add_node(
        '%s%d' % (story_domain.NODE_ID_PREFIX, 1), 'Testing with UI Automator'
    )

    story.update_node_description(
        '%s%d' % (story_domain.NODE_ID_PREFIX, 1),
        'To test all Android interactions'
    )
    story.update_node_exploration_id(
        '%s%d' % (story_domain.NODE_ID_PREFIX, 1), exp_id
    )

    # Save the dummy image to the filesystem to be used as thumbnail.
    with utils.open_file(
        os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
        'rb',
        encoding=None
    ) as f:
        raw_image = f.read()
    fs = fs_services.GcsFileSystem(feconf.ENTITY_TYPE_STORY, story_id)
    fs.commit(
        '%s/test_svg.svg' % constants.ASSET_TYPE_THUMBNAIL,
        raw_image,
        mimetype='image/svg+xml'
    )

    story.update_node_thumbnail_filename(
        '%s%d' % (story_domain.NODE_ID_PREFIX, 1), 'test_svg.svg')
    story.update_node_thumbnail_bg_color(
        '%s%d' % (story_domain.NODE_ID_PREFIX, 1), '#F8BF74')

    # Update and validate the story.
    story.update_meta_tag_content('tag')
    story.update_thumbnail_filename('test_svg.svg')
    story.update_thumbnail_bg_color(
        constants.ALLOWED_THUMBNAIL_BG_COLORS['story'][0])

    # Save the previously created structures
    # (skill, story, topic, subtopic).
    skill_services.save_new_skill(user_id, skill)
    story_services.save_new_story(user_id, story)
    topic_services.save_new_topic(user_id, topic)
    subtopic_page_services.save_subtopic_page(
        user_id, subtopic_page, 'Added subtopic',
        [topic_domain.TopicChange({
            'cmd': topic_domain.CMD_ADD_SUBTOPIC,
            'subtopic_id': 1,
            'title': 'Dummy Subtopic Title',
            'url_fragment': 'dummy-fragment'
        })]
    )

    # Generates translation opportunities for the Contributor Dashboard.
    exp_ids_in_story = story.story_contents.get_all_linked_exp_ids()
    opportunity_services.add_new_exploration_opportunities(
        story_id, exp_ids_in_story)

    # Publish the story and topic.
    topic_services.publish_story(topic_id, story_id, user_id)
    topic_services.publish_topic(topic_id, user_id)

    # Upload thumbnails to be accessible through AssetsDevHandler.
    _upload_thumbnail(topic_id, feconf.ENTITY_TYPE_TOPIC)
    _upload_thumbnail(story_id, feconf.ENTITY_TYPE_STORY)

    # Arrange fake translations since the emulator translation service won't
    # support the Android test exploration by default.
    emulator_client = translate_services.CLIENT
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        (
            '<p>Test exploration with all android specific interactions</p>'
            '<oppia-noninteractive-image alt-with-value="&amp;quot;'
            'tests&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"'
            ' filepath-with-value="&amp;quot;img_20210622_123005_'
            'efcgi87dk2_height_130_width_289.png&amp;quot;">'
            '</oppia-noninteractive-image>'
        ), (
            '<p>Exploração de teste com todas as interações específicas do '
            'Android</p><oppia-noninteractive-image alt-with-value='
            '"&amp;quot;tests&amp;quot;" caption-with-value="&amp;quot;'
            '&amp;quot;" filepath-with-value="&amp;quot;img_20210622_'
            '123005_efcgi87dk2_height_130_width_289.png&amp;quot;">'
            '</oppia-noninteractive-image>'
        )
    )
    emulator_client.add_expected_response(
        'en', target_language_code, 'Continue', 'Continuar')
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>What fraction represents half of something?</p>',
        '<p>Que fração representa a metade de algo?</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>That answer isn\'t correct. Try again.</p>',
        '<p>Essa resposta não está correta. Tente novamente.</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Correct!</p>', '<p>Correto!</p>')
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Remember that two halves, when added together, make one whole.</p>',
        '<p>Lembre-se que duas metades, quando somadas, formam um todo.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>One half is a fraction resulting from dividing one by two.</p>',
        '<p>A metade é uma fração resultante da divisão de um por dois.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code, (
            '<p>Half in fraction is represented by 1 in the numerator and 2'
            ' in the denominator.</p>'
        ), (
            '<p>A metade em fração é representada por 1 no numerador e 2 no'
            ' denominador.</p>'
        )
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code, (
            '<p>Half of something has one part in the numerator for every'
            ' two parts in the denominator.</p>'
        ), (
            '<p>Metade de algo tem uma parte no numerador para cada duas'
            ' partes no denominador.</p>'
        )
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>In which language does Oppia mean \'to learn\'?</p>',
        '<p>Em que língua Oppia significa \'aprender\'?</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Not quite. Try again (or maybe use a search engine).</p>',
        (
            '<p>Não exatamente. Tente novamente (ou talvez use um mecanismo'
            ' de pesquisa).</p>'
        )
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>What are the primary colors of light?</p>',
        '<p>Quais são as cores primárias da luz?</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>That\'s not quite right. Try again.</p>',
        '<p>Isto não está completamente correto. Tente novamente.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p><strong>Correct!</strong></p>',
        '<p><strong>Correto!</strong></p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        (
            '<p>\'Yellow\' is considered a primary color in the RYB spectrum, '
            'but that doesn\'t correspond to light. Try again!</p>'
        ), (
            '<p>\'Amarelo\' é considerada uma cor primária no espectro'
            ' RYB, mas não corresponde à luz. Tente novamente!</p>'
        )
    )
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Red</p>', '<p>Vermelho</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Yellow</p>', '<p>Amarelo</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Green</p>', '<p>Verde</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Blue</p>', '<p>Azul</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Orange</p>', '<p>Laranja</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Purple</p>', '<p>Roxo</p>')
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Sort the following in descending order.</p>',
        '<p>Classifique o seguinte em ordem decrescente.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Not quite. Try again.</p>',
        '<p>Não exatamente. Tente novamente.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>That\'s correct</p>',
        '<p>Está correto</p>'
    )
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>0.35</p>', '<p>0.35</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>3/5</p>', '<p>3/5</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>0.5</p>', '<p>0.5</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>0.46</p>', '<p>0.46</p>')
    emulator_client.add_expected_response(
        'en',
        target_language_code, (
            '<p>Sort the following in descending order, putting equal'
            ' items in the same position.</p>'
        ), (
            '<p>Classifique o seguinte em ordem decrescente, colocando'
            ' itens iguais na mesma posição.</p>'
        )
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Seems like you did the ascending order</p>',
        '<p>Parece que você fez a ordem crescente</p>'
    )
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>6.0</p>', '<p>6.0</p>')
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        'Congratulations, you have finished!',
        'Parabéns, você terminou!'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Click on the "O" letter in the below image.</p>',
        '<p>Clique na letra "O" na imagem abaixo.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Select the left most letter</p>',
        '<p>Selecione a letra mais à esquerda</p>'
    )
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Continue</p>', '<p>Continuar</p>')
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>What is 11 times 11?</p>',
        '<p>Quanto é 11 vezes 11?</p>'
    )
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Try again</p>', '<p>Tente novamente</p>'
    )
    emulator_client.add_expected_response(
        'en', target_language_code,
        '<p>Not quite. It\'s actually larger than that. Try again.</p>',
        (
            '<p>Não exatamente. Na verdade, é maior do que isso. Tente'
            ' novamente.</p>'
        )
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Not quite. It\'s less than that.</p>',
        '<p>Não exatamente. É menos que isso.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Which bird can sustain flight for long periods of time?</p>',
        '<p>Qual ave pode sustentar o vôo por longos períodos de tempo?</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Try again.</p>',
        '<p>Tente novamente.</p>'
    )
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        '<p>Correct! Eagles can sustain flight.</p>',
        '<p>Correto! As águias podem sustentar o vôo.</p>'
    )
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Penguin</p>', '<p>Pinguim</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Chicken</p>', '<p>Frango</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Eagle</p>', '<p>Águia</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Tiger</p>', '<p>Tigre</p>')
    emulator_client.add_expected_response(
        'en',
        target_language_code,
        (
            '<p>Two numbers are respectively 20% and 50% more than a third'
            ' number. The ratio of the two numbers is:</p>'
        ), (
            '<p>Dois números são, respectivamente, 20% e 50% mais do que um'
            ' terceiro número. A razão entre os dois números é:</p>'
        )
    )
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Not correct</p>', '<p>Incorreto</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, '<p>Correct</p>', '<p>Correto</p>')
    emulator_client.add_expected_response(
        'en', target_language_code, 'finnish', 'finlandês')

    # Add translations for the test exploration.
    test_exploration = exp_fetchers.get_exploration_by_id(exp_id)
    translatable_text_dict = translation_services.get_translatable_text(
        test_exploration, target_language_code)
    for translations_dict in translatable_text_dict.values():
        for content_id, translatable_content in translations_dict.items():
            content_to_translate = translatable_content.content_value
            translated_content_value: feconf.ContentValueType
            if translatable_content.is_data_format_list():
                translated_list = [
                    translation_services.get_and_cache_machine_translation(
                        source_language_code='en',
                        target_language_code=target_language_code,
                        source_text=text_option
                    ) for text_option in content_to_translate
                ]
                translated_content_value = []
                for translated_str in translated_list:
                    assert translated_str is not None
                    translated_content_value.append(translated_str)
            else:
                # In order to tighten the type we use isinstance. This will
                # never fail as is_data_format_list is false so this will be
                # a string.
                assert isinstance(content_to_translate, str)
                translated_str = (
                    translation_services.get_and_cache_machine_translation(
                        source_language_code='en',
                        target_language_code=target_language_code,
                        source_text=content_to_translate
                    )
                )
                assert translated_str is not None
                translated_content_value = translated_str

            translated_content = translation_domain.TranslatedContent(
                translated_content_value,
                translatable_content.content_format,
                needs_update=False
            )
            translation_services.add_new_translation(
                entity_type,
                exp_id,
                test_exploration.version,
                target_language_code,
                content_id,
                translated_content
            )

    # Add the new topic to all available classrooms.
    classrooms_property = config_domain.CLASSROOM_PAGES_DATA
    classrooms = classrooms_property.value
    for classroom in classrooms:
        classroom['topic_ids'].append(topic_id)
    config_services.set_property(user_id, classrooms_property.name, classrooms)

    return topic_id


def _upload_thumbnail(structure_id: str, structure_type: str) -> None:
    """Uploads images to the local datastore to be fetched using the
    AssetDevHandler.
    """
    with utils.open_file(
        os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'),
        'rb',
        encoding=None
    ) as f:
        image_content = f.read()
        fs_services.save_original_and_compressed_versions_of_image(
            'test_svg.svg',
            structure_type,
            structure_id,
            image_content,
            'thumbnail',
            False
        )


def _create_dummy_question(
    question_id: str, question_content: str, linked_skill_ids: List[str]
) -> question_domain.Question:
    """Creates a dummy question object with the given question ID.

    Args:
        question_id: str. The ID of the question to be created.
        question_content: str. The question content.
        linked_skill_ids: list(str). The IDs of the skills to which the
            question is linked to.

    Returns:
        Question. The dummy question with given values.
    """
    content_id_generator = translation_domain.ContentIdGenerator()
    state = state_domain.State.create_default_state(
        'ABC',
        content_id_generator.generate(translation_domain.ContentType.CONTENT),
        content_id_generator.generate(
            translation_domain.ContentType.DEFAULT_OUTCOME
        ),
        is_initial_state=True
    )
    state.update_interaction_id('TextInput')
    state.update_interaction_customization_args({
        'placeholder': {
            'value': {
                'content_id': content_id_generator.generate(
                    translation_domain.ContentType.CUSTOMIZATION_ARG),
                'unicode_str': ''
            }
        },
        'rows': {'value': 1},
        'catchMisspellings': {
            'value': False
        }
    })

    state.update_linked_skill_id(None)
    state.update_content(
        state_domain.SubtitledHtml(state.content.content_id, question_content))

    solution = state_domain.Solution(
        'TextInput',
        False,
        'Solution',
        state_domain.SubtitledHtml(
            content_id_generator.generate(
                translation_domain.ContentType.SOLUTION
            ),
            '<p>This is a solution.</p>'
        )
    )
    hints_list = [
        state_domain.Hint(
            state_domain.SubtitledHtml(
                content_id_generator.generate(
                    translation_domain.ContentType.HINT
                ),
                '<p>This is a hint.</p>'
            )
        )
    ]

    state.update_interaction_solution(solution)
    state.update_interaction_hints(hints_list)
    state.update_interaction_default_outcome(
        state_domain.Outcome(
            None,
            None,
            state_domain.SubtitledHtml(
                content_id_generator.generate(
                    translation_domain.ContentType.DEFAULT_OUTCOME
                ),
                '<p>Dummy Feedback</p>'
            ),
            True,
            [],
            None,
            None
        )
    )
    question = question_domain.Question(
        question_id,
        state,
        feconf.CURRENT_STATE_SCHEMA_VERSION,
        constants.DEFAULT_LANGUAGE_CODE,
        0,
        linked_skill_ids,
        [],
        content_id_generator.next_content_id_index
    )
    return question


def _create_dummy_skill(
    skill_id: str, skill_description: str, explanation: str
) -> skill_domain.Skill:
    """Creates a dummy skill object with the given values.

    Args:
        skill_id: str. The ID of the skill to be created.
        skill_description: str. The description of the skill.
        explanation: str. The review material for the skill.

    Returns:
        Skill. The dummy skill with given values.
    """
    rubrics = [
        skill_domain.Rubric(constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
        skill_domain.Rubric(constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
        skill_domain.Rubric(constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])
    ]
    skill = skill_domain.Skill.create_default_skill(
        skill_id, skill_description, rubrics)
    skill.update_explanation(state_domain.SubtitledHtml('1', explanation))
    return skill


def verify_android_build_secret(secret: str) -> bool:
    """Verifies the secret key from Android build.

    Args:
        secret: str. The secret key provided by the request.

    Returns:
        bool. Whether the secret key is valid.
    """
    android_build_secret = secrets_services.get_secret('ANDROID_BUILD_SECRET')
    if android_build_secret is None:
        logging.error('Android build secret is not available.')
        return False

    return secret == android_build_secret
