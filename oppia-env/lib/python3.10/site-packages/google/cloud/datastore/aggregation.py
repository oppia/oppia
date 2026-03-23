# # Copyright 2022 Google LLC
# #
# # Licensed under the Apache License, Version 2.0 (the "License");
# # you may not use this file except in compliance with the License.
# # You may obtain a copy of the License at
# #
# #     http://www.apache.org/licenses/LICENSE-2.0
# #
# # Unless required by applicable law or agreed to in writing, software
# # distributed under the License is distributed on an "AS IS" BASIS,
# # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# # See the License for the specific language governing permissions and
# # limitations under the License.
#
# """Create / interact with Google Cloud Datastore aggregation queries."""
import abc
from abc import ABC

from google.api_core import page_iterator

from google.cloud.datastore_v1.types import entity as entity_pb2
from google.cloud.datastore_v1.types import query as query_pb2
from google.cloud.datastore import helpers
from google.cloud.datastore.query import _pb_from_query

from google.cloud.datastore.query_profile import ExplainMetrics
from google.cloud.datastore.query_profile import QueryExplainError

from google.cloud.datastore.query import _NOT_FINISHED
from google.cloud.datastore.query import _FINISHED


class BaseAggregation(ABC):
    """
    Base class representing an Aggregation operation in Datastore
    """

    def __init__(self, alias=None):
        self.alias = alias

    @abc.abstractmethod
    def _to_pb(self):
        """
        Convert this instance to the protobuf representation
        """


class CountAggregation(BaseAggregation):
    """
    Representation of a "Count" aggregation query.

    :type alias: str
    :param alias: The alias for the aggregation.

    :type value: int
    :param value: The resulting value from the aggregation.

    """

    def __init__(self, alias=None):
        super(CountAggregation, self).__init__(alias=alias)

    def _to_pb(self):
        """
        Convert this instance to the protobuf representation
        """
        aggregation_pb = query_pb2.AggregationQuery.Aggregation()
        aggregation_pb.count = query_pb2.AggregationQuery.Aggregation.Count()
        aggregation_pb.alias = self.alias
        return aggregation_pb


class SumAggregation(BaseAggregation):
    """
    Representation of a "Sum" aggregation query.

    :type property_ref: str
    :param property_ref: The property_ref for the aggregation.

    :type value: int
    :param value: The resulting value from the aggregation.

    """

    def __init__(self, property_ref, alias=None):
        self.property_ref = property_ref
        super(SumAggregation, self).__init__(alias=alias)

    def _to_pb(self):
        """
        Convert this instance to the protobuf representation
        """
        aggregation_pb = query_pb2.AggregationQuery.Aggregation()
        aggregation_pb.sum = query_pb2.AggregationQuery.Aggregation.Sum()
        aggregation_pb.sum.property.name = self.property_ref
        aggregation_pb.alias = self.alias
        return aggregation_pb


class AvgAggregation(BaseAggregation):
    """
    Representation of a "Avg" aggregation query.

    :type property_ref: str
    :param property_ref: The property_ref for the aggregation.

    :type value: int
    :param value: The resulting value from the aggregation.

    """

    def __init__(self, property_ref, alias=None):
        self.property_ref = property_ref
        super(AvgAggregation, self).__init__(alias=alias)

    def _to_pb(self):
        """
        Convert this instance to the protobuf representation
        """
        aggregation_pb = query_pb2.AggregationQuery.Aggregation()
        aggregation_pb.avg = query_pb2.AggregationQuery.Aggregation.Avg()
        aggregation_pb.avg.property.name = self.property_ref
        aggregation_pb.alias = self.alias
        return aggregation_pb


class AggregationResult(object):
    """
    A class representing result from Aggregation Query

    :type alias: str
    :param alias: The alias for the aggregation.

    :type value: int
    :param value: The resulting value from the aggregation.

    """

    def __init__(self, alias, value):
        self.alias = alias
        self.value = value

    def __repr__(self):
        return "<Aggregation alias=%s, value=%s>" % (self.alias, self.value)


class AggregationQuery(object):
    """An Aggregation query against the Cloud Datastore.

    This class serves as an abstraction for creating aggregations over query
    in the Cloud Datastore.

    :type client: :class:`google.cloud.datastore.client.Client`
    :param client: The client used to connect to Datastore.

    :type query: :class:`google.cloud.datastore.query.Query`
    :param query: The query used for aggregations.

    :type explain_options: :class:`~google.cloud.datastore.ExplainOptions`
    :param explain_options: (Optional) Options to enable query profiling for
        this query. When set, explain_metrics will be available on the iterator
        returned by query.fetch().
        If not passed, will use value from given query.
    """

    def __init__(
        self,
        client,
        query,
        explain_options=None,
    ):
        self._client = client
        self._nested_query = query
        self._aggregations = []
        # fallback to query._explain_options if not set
        self._explain_options = explain_options or query._explain_options

    @property
    def project(self):
        """Get the project for this AggregationQuery.

        :rtype: str
        :returns: The project for the query.
        """
        return self._nested_query._project or self._client.project

    @property
    def namespace(self):
        """The nested query's namespace

        :rtype: str or None
        :returns: the namespace assigned to this query
        """
        return self._nested_query._namespace or self._client.namespace

    def _to_pb(self):
        """
        Returns the protobuf representation for this Aggregation Query
        """
        pb = query_pb2.AggregationQuery()
        pb.nested_query = _pb_from_query(self._nested_query)
        for aggregation in self._aggregations:
            aggregation_pb = aggregation._to_pb()
            pb.aggregations.append(aggregation_pb)
        return pb

    def count(self, alias=None):
        """
        Adds a count over the nested query

        :type alias: str
        :param alias: (Optional) The alias for the count
        """
        count_aggregation = CountAggregation(alias=alias)
        self._aggregations.append(count_aggregation)
        return self

    def sum(self, property_ref, alias=None):
        """
        Adds a sum over the nested query

        :type property_ref: str
        :param property_ref: The property_ref for the sum
        """
        sum_aggregation = SumAggregation(property_ref=property_ref, alias=alias)
        self._aggregations.append(sum_aggregation)
        return self

    def avg(self, property_ref, alias=None):
        """
        Adds a avg over the nested query

        :type property_ref: str
        :param property_ref: The property_ref for the sum
        """
        avg_aggregation = AvgAggregation(property_ref=property_ref, alias=alias)
        self._aggregations.append(avg_aggregation)
        return self

    def add_aggregation(self, aggregation):
        """
        Adds an aggregation operation to the nested query

        :type aggregation: :class:`google.cloud.datastore.aggregation.BaseAggregation`
        :param aggregation: An aggregation operation, e.g. a CountAggregation
        """
        self._aggregations.append(aggregation)

    def add_aggregations(self, aggregations):
        """
        Adds a list of aggregations to the nested query
        :type aggregations: list
        :param aggregations: a list of aggregation operations
        """
        self._aggregations.extend(aggregations)

    def fetch(
        self,
        client=None,
        limit=None,
        eventual=False,
        retry=None,
        timeout=None,
        read_time=None,
    ):
        """Execute the Aggregation Query; return an iterator for the aggregation results.

        For example:

        .. testsetup:: aggregation-query-fetch

            import uuid

            from google.cloud import datastore

            unique = str(uuid.uuid4())[0:8]
            client = datastore.Client(namespace='ns{}'.format(unique))


        .. doctest:: aggregation-query-fetch

            >>> andy = datastore.Entity(client.key('Person', 1234))
            >>> andy['name'] = 'Andy'
            >>> sally = datastore.Entity(client.key('Person', 2345))
            >>> sally['name'] = 'Sally'
            >>> bobby = datastore.Entity(client.key('Person', 3456))
            >>> bobby['name'] = 'Bobby'
            >>> client.put_multi([andy, sally, bobby])
            >>> query = client.query(kind='Andy')
            >>> aggregation_query = client.aggregation_query(query)
            >>> result = aggregation_query.count(alias="total").fetch(limit=5)
            >>> result
            <google.cloud.datastore.aggregation.AggregationResultIterator object at ...>

        .. testcleanup:: aggregation-query-fetch

            client.delete(andy.key)

        :type client: :class:`google.cloud.datastore.client.Client`
        :param client: (Optional) client used to connect to datastore.
                       If not supplied, uses the query's value.

        :type eventual: bool
        :param eventual: (Optional) Defaults to strongly consistent (False).
                                    Setting True will use eventual consistency,
                                    but cannot be used inside a transaction or
                                    with read_time, otherwise will raise
                                    ValueError.

        :type retry: :class:`google.api_core.retry.Retry`
        :param retry:
            A retry object used to retry requests. If ``None`` is specified,
            requests will be retried using a default configuration.

        :type timeout: float
        :param timeout:
            Time, in seconds, to wait for the request to complete.
            Note that if ``retry`` is specified, the timeout applies
            to each individual attempt.

        :type read_time: datetime
        :param read_time:
            (Optional) use read_time read consistency, cannot be used inside a
            transaction or with eventual consistency, or will raise ValueError.

        :rtype: :class:`AggregationIterator`
        :returns: The iterator for the aggregation query.
        """
        if client is None:
            client = self._client

        return AggregationResultIterator(
            self,
            client,
            limit=limit,
            eventual=eventual,
            retry=retry,
            timeout=timeout,
            read_time=read_time,
        )


class AggregationResultIterator(page_iterator.Iterator):
    """Represent the state of a given execution of a Query.

    :type aggregation_query: :class:`~google.cloud.datastore.aggregation.AggregationQuery`
    :param aggregation_query: AggregationQuery object holding permanent configuration (i.e.
                  things that don't change on with each page in
                  a results set).

    :type client: :class:`~google.cloud.datastore.client.Client`
    :param client: The client used to make a request.

    :type eventual: bool
    :param eventual: (Optional) Defaults to strongly consistent (False).
                                Setting True will use eventual consistency,
                                but cannot be used inside a transaction or
                                with read_time, otherwise will raise ValueError.

    :type retry: :class:`google.api_core.retry.Retry`
    :param retry:
        A retry object used to retry requests. If ``None`` is specified,
        requests will be retried using a default configuration.

    :type timeout: float
    :param timeout:
        Time, in seconds, to wait for the request to complete.
        Note that if ``retry`` is specified, the timeout applies
        to each individual attempt.

    :type read_time: datetime
    :param read_time: (Optional) Runs the query with read time consistency.
                      Cannot be used with eventual consistency or inside a
                      transaction, otherwise will raise ValueError. This feature is in private preview.
    """

    def __init__(
        self,
        aggregation_query,
        client,
        limit=None,
        eventual=False,
        retry=None,
        timeout=None,
        read_time=None,
    ):
        super(AggregationResultIterator, self).__init__(
            client=client,
            item_to_value=_item_to_aggregation_result,
        )

        self._aggregation_query = aggregation_query
        self._eventual = eventual
        self._retry = retry
        self._timeout = timeout
        self._read_time = read_time
        self._limit = limit
        # The attributes below will change over the life of the iterator.
        self._explain_metrics = None
        self._more_results = True

    def _build_protobuf(self):
        """Build a query protobuf.

        Relies on the current state of the iterator.

        :rtype:
            :class:`.query_pb2.AggregationQuery.Aggregation`
        :returns: The aggregation_query protobuf object for the current
                  state of the iterator.
        """
        pb = self._aggregation_query._to_pb()
        if self._limit is not None and self._limit > 0:
            pb.nested_query.limit = self._limit
        return pb

    def _process_query_results(self, response_pb):
        """Process the response from a datastore query.

        :type response_pb: :class:`.datastore_pb2.RunQueryResponse`
        :param response_pb: The protobuf response from a ``runQuery`` request.

        :rtype: iterable
        :returns: The next page of entity results.
        :raises ValueError: If ``more_results`` is an unexpected value.
        """

        if response_pb.batch.more_results == _NOT_FINISHED:
            self._more_results = True
        elif response_pb.batch.more_results in _FINISHED:
            self._more_results = False
        else:
            raise ValueError("Unexpected value returned for `more_results`.")

        return [
            result.aggregate_properties
            for result in response_pb.batch.aggregation_results
        ]

    def _next_page(self):
        """Get the next page in the iterator.

        :rtype: :class:`~google.cloud.iterator.Page`
        :returns: The next page in the iterator (or :data:`None` if
                  there are no pages left).
        """
        if not self._more_results:
            return None

        transaction_id, new_transaction_options = helpers.get_transaction_options(
            self.client.current_transaction
        )
        read_options = helpers.get_read_options(
            self._eventual, transaction_id, self._read_time, new_transaction_options
        )

        partition_id = entity_pb2.PartitionId(
            project_id=self._aggregation_query.project,
            database_id=self.client.database,
            namespace_id=self._aggregation_query.namespace,
        )

        kwargs = {}

        if self._retry is not None:
            kwargs["retry"] = self._retry

        if self._timeout is not None:
            kwargs["timeout"] = self._timeout
        request = {
            "project_id": self._aggregation_query.project,
            "partition_id": partition_id,
            "read_options": read_options,
            "aggregation_query": self._build_protobuf(),
        }
        if self._aggregation_query._explain_options:
            request[
                "explain_options"
            ] = self._aggregation_query._explain_options._to_dict()
        helpers.set_database_id_to_request(request, self.client.database)

        response_pb = None

        while response_pb is None or response_pb.batch.more_results == _NOT_FINISHED:
            if response_pb is not None:
                # We haven't finished processing. A likely reason is we haven't
                # skipped all of the results yet. Don't return any results.
                # Instead, rerun query, adjusting offsets. Datastore doesn't process
                # more than 1000 skipped results in a query.
                new_query_pb = query_pb2.AggregationQuery()
                new_query_pb._pb.CopyFrom(
                    request["aggregation_query"]._pb
                )  # copy for testability
                request["aggregation_query"] = new_query_pb

            response_pb = self.client._datastore_api.run_aggregation_query(
                request=request.copy(), **kwargs
            )
            # capture explain metrics if present in response
            # should only be present in last response, and only if explain_options was set
            if response_pb.explain_metrics:
                self._explain_metrics = ExplainMetrics._from_pb(
                    response_pb.explain_metrics
                )

        item_pbs = self._process_query_results(response_pb)
        return page_iterator.Page(self, item_pbs, self.item_to_value)

    @property
    def explain_metrics(self) -> ExplainMetrics:
        """
        Get the metrics associated with the query execution.
        Metrics are only available when explain_options is set on the query. If
        ExplainOptions.analyze is False, only plan_summary is available. If it is
        True, execution_stats is also available.

        :rtype: :class:`~google.cloud.datastore.query_profile.ExplainMetrics`
        :returns: The metrics associated with the query execution.
        :raises: :class:`~google.cloud.datastore.query_profile.QueryExplainError`
            if explain_metrics is not available on the query.
        """
        if self._explain_metrics is not None:
            return self._explain_metrics
        elif self._aggregation_query._explain_options is None:
            raise QueryExplainError("explain_options not set on query.")
        elif self._aggregation_query._explain_options.analyze is False:
            # we need to run the query to get the explain_metrics
            # analyze=False only returns explain_metrics, no results
            self._next_page()
            if self._explain_metrics is not None:
                return self._explain_metrics
        raise QueryExplainError(
            "explain_metrics not available until query is complete."
        )


# pylint: disable=unused-argument
def _item_to_aggregation_result(iterator, pb):
    """Convert a raw protobuf aggregation result to the native object.

    :type iterator: :class:`~google.api_core.page_iterator.Iterator`
    :param iterator: The iterator that is currently in use.

    :type pb:
        :class:`proto.marshal.collections.maps.MapComposite`
    :param pb: The aggregation properties pb from the aggregation query result

    :rtype: :class:`google.cloud.datastore.aggregation.AggregationResult`
    :returns: The list of AggregationResults
    """
    results = [
        AggregationResult(alias=k, value=pb[k].integer_value or pb[k].double_value)
        for k in pb.keys()
    ]
    return results
