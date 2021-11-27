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
    instructions = 'Click on the image'
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
    def to_proto(
        cls, default_outcome, customization_args, hints, answer_groups
    ):
        """Creates a ImageClickInputInstance proto object.

        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustominzationArgs. The domain object.
            hints: Hint. The domain object.
            answer_groups: AnswerGroups. The domain object.

        Returns:
            ImageClickInputInstance. The proto object.
        """
        customization_args_proto = (
            cls._to_customization_args_proto(
                customization_args)
        )
        outcome_proto = default_outcome.to_proto()
        hints_proto_list = cls.get_hint_proto(cls, hints)
        answer_groups_proto = cls._to_answer_groups_proto(
            answer_groups)

        return state_pb2.ImageClickInputInstance(
            customization_args=customization_args_proto,
            default_outcome=outcome_proto,
            hints=hints_proto_list,
            answer_groups=answer_groups_proto
        )

    @classmethod
    def _to_answer_groups_proto(cls, answer_groups):
        """Creates a AnswerGroup proto object
            for ImageClickInputInstance.

        Args:
            answer_groups: list(AnswerGroup). List of answer groups of the
                interaction instance.

        Returns:
            list. The AnswerGroup proto object list.
        """
        answer_group_list_proto = []

        for answer_group in answer_groups:
            base_answer_group_proto = answer_group.to_proto()
            rules_spec_proto = cls._to_rule_specs_proto(
                answer_group.rule_specs)
            answer_group_proto = state_pb2.ImageClickInputInstance.AnswerGroup(
                base_answer_group=base_answer_group_proto,
                rule_specs=rules_spec_proto
            )
            answer_group_list_proto.append(answer_group_proto)

        return answer_group_list_proto

    @classmethod
    def _to_rule_specs_proto(cls, rule_specs_list):
        """Creates a RuleSpec proto object list.

        Args:
            rule_specs_list: list(RuleSpec). List of rule specifications.

        Returns:
            list. The RuleSpec proto object list.
        """
        rule_specs_list_proto = []
        rules_specs_proto = {}

        for rule_spec in rule_specs_list:
            rule_type = rule_spec.rule_type
            if rule_type == 'IsInRegion':
                is_in_region_proto = cls._to_is_in_image_region_proto(
                    rule_spec.inputs['x'])
                rules_specs_proto = state_pb2.ImageClickInputInstance.RuleSpec(
                    is_in_region=is_in_region_proto)

            rule_specs_list_proto.append(rules_specs_proto)

        return rule_specs_list_proto

    @classmethod
    def _to_is_in_image_region_proto(cls, is_in_region):
        """Creates a IsInRegionSpec proto object.

        Args:
            is_in_region: str. The input region name.

        Returns:
            IsInRegionSpec. The proto object.
        """
        return state_pb2.ImageClickInputInstance.RuleSpec.IsInRegionSpec(
            input_region=is_in_region
    )

    @classmethod
    def _to_customization_args_proto(cls, customization_args):
        """Creates a CustomizationArgs proto object
        for ImageClickInputInstance.

        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.

        Returns:
            CustomizationArgs. The proto object.
        """
        image_and_regions_proto = cls._to_image_and_regions_proto(
            customization_args['imageAndRegions'])

        return state_pb2.ImageClickInputInstance.CustomizationArgs(
            image_and_regions=image_and_regions_proto
        )

    @classmethod
    def _to_image_and_regions_proto(cls, image_and_regions_list):
        """Creates a ImageWithRegions proto object.

        Args:
            image_and_regions_list: list. The list of
                image and regions.

        Returns:
            ImageWithRegions. The proto object.
        """
        image_file_path = image_and_regions_list.value['imagePath']
        labeled_regions_list_proto = cls._to_labeled_region_list_proto(
            image_and_regions_list.value['labeledRegions'])

        return objects_pb2.ImageWithRegions(
            image_file_path=image_file_path,
            labeled_regions=labeled_regions_list_proto
        )

    @classmethod
    def _to_labeled_region_list_proto(cls, labeled_regions_list):
        """Creates a LabeledRegion proto object list.

        Args:
            labeled_regions_list: list. The list of
                lable regions.

        Returns:
            list. The LabeledRegion proto object list.
        """
        labeled_regions_list_proto = []

        for labeled_regions in labeled_regions_list:
            labeled_region_proto = cls._to_labeled_region_proto(
                labeled_regions['label'],
                labeled_regions['region']['area'])

            labeled_regions_list_proto.append(labeled_region_proto)

        return labeled_regions_list_proto

    @classmethod
    def _to_labeled_region_proto(cls, label, area):
        """Creates a LabeledRegion proto object.

        Args:
            label: str. The lable of the clicked region.
            area: list. The area is the list of coordinates consists
                of x,y points.

        Returns:
            LabeledRegion. The LabeledRegion proto object.
        """
        normalized_rectangle_2d_proto = (
            cls._to_normalized_rectangle_2d_proto(area))

        return objects_pb2.ImageWithRegions.LabeledRegion(
            label=label,
            normalized_rectangle_2d=normalized_rectangle_2d_proto
        )

    @classmethod
    def _to_normalized_rectangle_2d_proto(cls, area):
        """Creates a NormalizedRectangle2d proto object.

        Args:
            area: list. The area is the list of coordinates consists
                of x,y points.

        Returns:
            NormalizedRectangle2d. The proto object.
        """
        return objects_pb2.ImageWithRegions.LabeledRegion.NormalizedRectangle2d(
            top_left=cls._to_point2d_proto(area[0]),
            bottom_right=cls._to_point2d_proto(area[1])
        )

    @classmethod
    def _to_point2d_proto(cls, area):
        """Creates a Point2d proto object.

        Args:
            area: list. The area is the coordinates consists
                of x,y points.

        Returns:
            Point2d. The Point2d proto object.
        """
        return objects_pb2.NormalizedPoint2d(x=area[0], y=area[1])
