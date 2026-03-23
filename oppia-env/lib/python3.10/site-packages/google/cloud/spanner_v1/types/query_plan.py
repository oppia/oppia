# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import proto  # type: ignore

from google.protobuf import struct_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.spanner.v1",
    manifest={
        "PlanNode",
        "QueryPlan",
    },
)


class PlanNode(proto.Message):
    r"""Node information for nodes appearing in a
    [QueryPlan.plan_nodes][google.spanner.v1.QueryPlan.plan_nodes].

    Attributes:
        index (int):
            The ``PlanNode``'s index in [node
            list][google.spanner.v1.QueryPlan.plan_nodes].
        kind (google.cloud.spanner_v1.types.PlanNode.Kind):
            Used to determine the type of node. May be needed for
            visualizing different kinds of nodes differently. For
            example, If the node is a
            [SCALAR][google.spanner.v1.PlanNode.Kind.SCALAR] node, it
            will have a condensed representation which can be used to
            directly embed a description of the node in its parent.
        display_name (str):
            The display name for the node.
        child_links (Sequence[google.cloud.spanner_v1.types.PlanNode.ChildLink]):
            List of child node ``index``\ es and their relationship to
            this parent.
        short_representation (google.cloud.spanner_v1.types.PlanNode.ShortRepresentation):
            Condensed representation for
            [SCALAR][google.spanner.v1.PlanNode.Kind.SCALAR] nodes.
        metadata (google.protobuf.struct_pb2.Struct):
            Attributes relevant to the node contained in a group of
            key-value pairs. For example, a Parameter Reference node
            could have the following information in its metadata:

            ::

                {
                  "parameter_reference": "param1",
                  "parameter_type": "array"
                }
        execution_stats (google.protobuf.struct_pb2.Struct):
            The execution statistics associated with the
            node, contained in a group of key-value pairs.
            Only present if the plan was returned as a
            result of a profile query. For example, number
            of executions, number of rows/time per execution
            etc.
    """

    class Kind(proto.Enum):
        r"""The kind of [PlanNode][google.spanner.v1.PlanNode]. Distinguishes
        between the two different kinds of nodes that can appear in a query
        plan.
        """
        KIND_UNSPECIFIED = 0
        RELATIONAL = 1
        SCALAR = 2

    class ChildLink(proto.Message):
        r"""Metadata associated with a parent-child relationship appearing in a
        [PlanNode][google.spanner.v1.PlanNode].

        Attributes:
            child_index (int):
                The node to which the link points.
            type_ (str):
                The type of the link. For example, in Hash
                Joins this could be used to distinguish between
                the build child and the probe child, or in the
                case of the child being an output variable, to
                represent the tag associated with the output
                variable.
            variable (str):
                Only present if the child node is
                [SCALAR][google.spanner.v1.PlanNode.Kind.SCALAR] and
                corresponds to an output variable of the parent node. The
                field carries the name of the output variable. For example,
                a ``TableScan`` operator that reads rows from a table will
                have child links to the ``SCALAR`` nodes representing the
                output variables created for each column that is read by the
                operator. The corresponding ``variable`` fields will be set
                to the variable names assigned to the columns.
        """

        child_index = proto.Field(
            proto.INT32,
            number=1,
        )
        type_ = proto.Field(
            proto.STRING,
            number=2,
        )
        variable = proto.Field(
            proto.STRING,
            number=3,
        )

    class ShortRepresentation(proto.Message):
        r"""Condensed representation of a node and its subtree. Only present for
        ``SCALAR`` [PlanNode(s)][google.spanner.v1.PlanNode].

        Attributes:
            description (str):
                A string representation of the expression
                subtree rooted at this node.
            subqueries (Mapping[str, int]):
                A mapping of (subquery variable name) -> (subquery node id)
                for cases where the ``description`` string of this node
                references a ``SCALAR`` subquery contained in the expression
                subtree rooted at this node. The referenced ``SCALAR``
                subquery may not necessarily be a direct child of this node.
        """

        description = proto.Field(
            proto.STRING,
            number=1,
        )
        subqueries = proto.MapField(
            proto.STRING,
            proto.INT32,
            number=2,
        )

    index = proto.Field(
        proto.INT32,
        number=1,
    )
    kind = proto.Field(
        proto.ENUM,
        number=2,
        enum=Kind,
    )
    display_name = proto.Field(
        proto.STRING,
        number=3,
    )
    child_links = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message=ChildLink,
    )
    short_representation = proto.Field(
        proto.MESSAGE,
        number=5,
        message=ShortRepresentation,
    )
    metadata = proto.Field(
        proto.MESSAGE,
        number=6,
        message=struct_pb2.Struct,
    )
    execution_stats = proto.Field(
        proto.MESSAGE,
        number=7,
        message=struct_pb2.Struct,
    )


class QueryPlan(proto.Message):
    r"""Contains an ordered list of nodes appearing in the query
    plan.

    Attributes:
        plan_nodes (Sequence[google.cloud.spanner_v1.types.PlanNode]):
            The nodes in the query plan. Plan nodes are returned in
            pre-order starting with the plan root. Each
            [PlanNode][google.spanner.v1.PlanNode]'s ``id`` corresponds
            to its index in ``plan_nodes``.
    """

    plan_nodes = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="PlanNode",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
