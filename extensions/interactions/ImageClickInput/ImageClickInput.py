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
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Python configuration for ImageClickInput interaction."""

from __future__ import annotations

from extensions.interactions import base
from proto_files import objects_pb2
from proto_files import state_pb2


class ImageClickInput(base.BaseInteraction):
    """Interaction allowing multiple-choice selection on an image."""

    name = 'Image Region'
    description = 'Allows learners to click on regions of an image.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    _dependency_ids = []
    answer_type = 'ClickOnImage'
    instructions = 'I18N_INTERACTIONS_IMAGE_CLICK_INSTRUCTION'
    narrow_instructions = 'View image'
    needs_summary = False
    # It is required to show which region is being clicked on while specifying
    # a solution. Once this issue is fixed, ImageClickInput interaction can be
    # supported by the solution feature.
    can_have_solution = False
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'imageAndRegions',
        'description': 'Image',
        'schema': {
            'type': 'custom',
            'obj_type': 'ImageWithRegions',
        },
        'default_value': {
            'imagePath': '',
            'labeledRegions': []
        },
    }, {
        'name': 'highlightRegionsOnHover',
        'description': 'Highlight regions when the learner hovers over them',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }]

    _answer_visualization_specs = [{
        # Bar chart with answer counts.
        'id': 'ClickHexbins',
        'options': {},
        'calculation_id': 'AnswerFrequencies',
        # Adding addressed info for hexbins needs more design work, but
        # conceptually should be possible by highlighting which hexagons are
        # explicitly addressed.
        'addressed_info_is_supported': False,
    }]

    @classmethod
    def to_android_image_click_input_proto(
            cls, default_outcome, customization_args, hints, answer_groups
    ):
        """Creates a ImageClickInputInstanceDto proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            ImageClickInputInstanceDto. The proto object.
        """
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args)
        )
        outcome_proto = default_outcome.to_android_outcome_proto()
        hints_proto_list = cls.get_hint_proto_list(cls, hints)
        answer_groups_proto = cls._convert_answer_groups_to_proto(answer_groups)

        return state_pb2.ImageClickInputInstanceDto(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _convert_answer_groups_to_proto(cls, answer_groups):
        """Creates a AnswerGroupDto proto object
        for ImageClickInputInstanceDto.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list(AnswerGroupDto). The proto object list.
        """
        answer_group_list_proto = []
        for answer_group in answer_groups:
            base_answer_group_proto = (
                answer_group.to_android_answer_group_proto())
            rules_spec_proto = cls._convert_rule_specs_to_proto(
                answer_group.rule_specs)
            answer_group_list_proto.append(
                state_pb2.ImageClickInputInstanceDto.AnswerGroupDto(
                    base_answer_group=base_answer_group_proto,
                    rule_specs=rules_spec_proto
                )
            )

        return answer_group_list_proto

    @classmethod
    def _convert_rule_specs_to_proto(cls, rule_specs_list):
        """Creates a RuleSpecDto proto object list.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list(RuleSpecDto). The proto object list.
        """
        rule_specs_list_proto = []

        rule_type_to_proto_func_mapping = {
            'IsInRegion': cls._convert_is_in_image_region_rule_spec_to_proto
        }
        rule_type_to_proto_mapping = {
            'IsInRegion': lambda x: (
                state_pb2.ImageClickInputInstanceDto.RuleSpecDto(
                    is_in_region=x))
        }

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            rule_proto = (
                rule_type_to_proto_func_mapping[rule_type](
                    rule_spec.inputs['x']
                )
            )
            rule_specs_list_proto.append(
                rule_type_to_proto_mapping[rule_type](rule_proto)
            )

        return rule_specs_list_proto

    @classmethod
    def _convert_is_in_image_region_rule_spec_to_proto(cls, is_in_region):
        """Creates a IsInRegionSpecDto proto object.

        Args:
            is_in_region: str. The input region name.

        Returns:
            IsInRegionSpecDto. The proto object.
        """
        image_click_dto = state_pb2.ImageClickInputInstanceDto
        return image_click_dto.RuleSpecDto.IsInRegionSpecDto(
            input_region=is_in_region
        )

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
        for ImageClickInputInstanceDto.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgsDto. The proto object.
        """
        image_and_regions_proto = cls._convert_image_and_regions_to_proto(
            customization_args['imageAndRegions'])

        return state_pb2.ImageClickInputInstanceDto.CustomizationArgsDto(
            image_and_regions=image_and_regions_proto
        )

    @classmethod
    def _convert_image_and_regions_to_proto(cls, image_and_regions_dict):
        """Creates a ImageWithRegionsDto proto object.

        Args:
            image_and_regions_dict: dict. The dict of
                image and regions.

        Returns:
            ImageWithRegionsDto. The proto object.
        """
        image_file_path = image_and_regions_dict.value['imagePath']
        labeled_regions_list_proto = cls._convert_labeled_region_to_list_proto(
            image_and_regions_dict.value['labeledRegions'])

        return objects_pb2.ImageWithRegionsDto(
            image_file_path=image_file_path,
            labeled_regions=labeled_regions_list_proto
        )

    @classmethod
    def _convert_labeled_region_to_list_proto(cls, labeled_regions_list):
        """Creates a LabeledRegionDto proto object list.

        Args:
            labeled_regions_list: list(LabeledRegion). The list of
                lable regions.

        Returns:
            list(LabeledRegionDto). The proto object list.
        """
        labeled_regions_list_proto = []
        for labeled_regions in labeled_regions_list:
            labeled_regions_list_proto.append(
                cls._convert_labeled_region_to_proto(
                    labeled_regions['label'],
                    labeled_regions['region']['area']
                )
            )

        return labeled_regions_list_proto

    @classmethod
    def _convert_labeled_region_to_proto(cls, label, area):
        """Creates a LabeledRegionDto proto object.

        Args:
            label: str. The lable of the clicked region.
            area: list(list(float)). The area is the list
                of two sub list representing x and y coordinates.

        Returns:
            LabeledRegionDto. The LabeledRegionDto proto object.
        """
        normalized_rectangle_2d_proto = (
            cls._to_normalized_rectangle_2d_proto(area))

        return objects_pb2.ImageWithRegionsDto.LabeledRegionDto(
            label=label,
            normalized_rectangle_2d=normalized_rectangle_2d_proto
        )

    @classmethod
    def _to_normalized_rectangle_2d_proto(cls, area):
        """Creates a NormalizedRectangle2dDto proto object.

        Args:
            area: list(list(float)). The area is the list
                of two sub list representing x and y coordinates.

        Returns:
            NormalizedRectangle2dDto. The proto object.
        """
        labled_region_dto = objects_pb2.ImageWithRegionsDto.LabeledRegionDto
        return labled_region_dto.NormalizedRectangle2dDto(
            top_left=cls._convert_point2d_to_proto(area[0]),
            bottom_right=cls._convert_point2d_to_proto(area[1])
        )

    @classmethod
    def _convert_point2d_to_proto(cls, area):
        """Creates a Point2dDto proto object.

        Args:
            area: list(float). The area is the list of coordinates consists
                of x,y points.

        Returns:
            Point2dDto. The proto object.
        """
        return objects_pb2.NormalizedPoint2dDto(x=area[0], y=area[1])
