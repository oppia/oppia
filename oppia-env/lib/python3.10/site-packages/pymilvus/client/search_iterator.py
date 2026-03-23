import logging
from copy import deepcopy
from typing import Callable, Dict, List, Optional, Union

from pymilvus.client import entity_helper, utils
from pymilvus.client.constants import (
    COLLECTION_ID,
    GUARANTEE_TIMESTAMP,
    ITER_SEARCH_BATCH_SIZE_KEY,
    ITER_SEARCH_ID_KEY,
    ITER_SEARCH_LAST_BOUND_KEY,
    ITER_SEARCH_V2_KEY,
    ITERATOR_FIELD,
)
from pymilvus.client.search_result import Hit, Hits
from pymilvus.exceptions import ExceptionsMessage, ParamError, ServerVersionIncompatibleException
from pymilvus.orm.connections import Connections
from pymilvus.orm.constants import MAX_BATCH_SIZE, OFFSET, UNLIMITED
from pymilvus.orm.iterator import SearchPage, fall_back_to_latest_session_ts

logger = logging.getLogger(__name__)


class SearchIteratorV2:
    # for compatibility, track the number of total results left
    _left_res_cnt = None

    def __init__(
        self,
        connection: Connections,
        collection_name: str,
        data: Union[List, utils.SparseMatrixInputType],
        batch_size: int = 1000,
        limit: Optional[int] = UNLIMITED,
        filter: Optional[str] = None,
        output_fields: Optional[List[str]] = None,
        search_params: Optional[Dict] = None,
        timeout: Optional[float] = None,
        partition_names: Optional[List[str]] = None,
        anns_field: Optional[str] = None,
        round_decimal: Optional[int] = -1,
        external_filter_func: Optional[Callable[[Hits], Union[Hits, List[Hit]]]] = None,
        **kwargs,
    ):
        self._check_params(batch_size, data, kwargs)

        # for compatibility, support limit, deprecate in future
        if limit != UNLIMITED:
            self._left_res_cnt = limit

        self._conn = connection
        self._set_up_collection_id(collection_name)
        kwargs[COLLECTION_ID] = self._collection_id
        self._params = {
            "collection_name": collection_name,
            "data": data,
            "anns_field": anns_field,
            "param": deepcopy(search_params),
            "limit": batch_size,
            "expression": filter,
            "partition_names": partition_names,
            "output_fields": output_fields,
            "timeout": timeout,
            "round_decimal": round_decimal,
            ITERATOR_FIELD: True,
            ITER_SEARCH_V2_KEY: True,
            ITER_SEARCH_BATCH_SIZE_KEY: batch_size,
            GUARANTEE_TIMESTAMP: 0,
            **kwargs,
        }
        self._external_filter_func = external_filter_func
        self._cache = []
        self._batch_size = batch_size
        self._probe_for_compability(self._params)

    def _set_up_collection_id(self, collection_name: str):
        res = self._conn.describe_collection(collection_name)
        self._collection_id = res[COLLECTION_ID]

    def _check_token_exists(self, token: Union[str, None]):
        if token is None or token == "":
            raise ServerVersionIncompatibleException(
                message=ExceptionsMessage.SearchIteratorV2FallbackWarning
            )

    # this detects whether the server supports search_iterator_v2 and is for compatibility only
    # if the server holds iterator states, this implementation needs to be reconsidered
    def _probe_for_compability(self, params: Dict):
        dummy_params = deepcopy(params)
        dummy_batch_size = 1
        dummy_params["limit"] = dummy_batch_size
        dummy_params[ITER_SEARCH_BATCH_SIZE_KEY] = dummy_batch_size
        iter_info = self._conn.search(**dummy_params).get_search_iterator_v2_results_info()
        self._check_token_exists(iter_info.token)

    # internal next function, do not use this outside of this class
    def _next(self):
        res = self._conn.search(**self._params)
        iter_info = res.get_search_iterator_v2_results_info()
        self._check_token_exists(iter_info.token)
        self._params[ITER_SEARCH_LAST_BOUND_KEY] = iter_info.last_bound

        # patch token and guarantee timestamp for the first next() call
        if ITER_SEARCH_ID_KEY not in self._params:
            # the token should not change during the lifetime of the iterator
            self._params[ITER_SEARCH_ID_KEY] = iter_info.token
        if self._params[GUARANTEE_TIMESTAMP] <= 0:
            if res.get_session_ts() > 0:
                self._params[GUARANTEE_TIMESTAMP] = res.get_session_ts()
            else:
                logger.warning(
                    "failed to set up mvccTs from milvus server, use client-side ts instead"
                )
                self._params[GUARANTEE_TIMESTAMP] = fall_back_to_latest_session_ts()
        return res

    def next(self):
        if self._left_res_cnt is not None and self._left_res_cnt <= 0:
            return None

        if self._external_filter_func is None:
            # return SearchPage for compability
            return self._wrap_return_res(self._next()[0])
        # the length of the results should be `batch_size` if no limit is set,
        # otherwise it should be the number of results left if less than `batch_size`
        target_len = (
            self._batch_size
            if self._left_res_cnt is None
            else min(self._batch_size, self._left_res_cnt)
        )
        while True:
            hits = self._next()[0]

            # no more results from server
            if len(hits) == 0:
                break

            # apply external filter
            if self._external_filter_func is not None:
                hits = self._external_filter_func(hits)

            self._cache.extend(hits)
            if len(self._cache) >= target_len:
                break

        # if the number of elements in cache is less than or equal to target_len,
        #   return all results we could possibly return
        # if the number of elements in cache is more than target_len,
        #   return target_len results and keep the rest for next call
        ret = self._cache[:target_len]
        del self._cache[:target_len]
        # return SearchPage for compability
        return self._wrap_return_res(ret)

    def close(self):
        pass

    def _check_params(
        self,
        batch_size: int,
        data: Union[List, utils.SparseMatrixInputType],
        kwargs: Dict,
    ):
        # metric_type can be empty, deduced at server side
        # anns_field can be empty, deduced at server side

        # check batch size
        if batch_size < 0:
            raise ParamError(message="batch size cannot be less than zero")
        if batch_size > MAX_BATCH_SIZE:
            raise ParamError(message=f"batch size cannot be larger than {MAX_BATCH_SIZE}")

        # check offset
        if kwargs.get(OFFSET, 0) != 0:
            raise ParamError(message="Offset is not supported for search_iterator_v2")

        # check num queries, heavy to check at server side
        rows = entity_helper.get_input_num_rows(data)
        if rows > 1:
            raise ParamError(
                message="search_iterator_v2 does not support processing multiple vectors simultaneously"
            )
        if rows == 0:
            raise ParamError(message="The vector data for search cannot be empty")

    def _wrap_return_res(self, res: Hits) -> SearchPage:
        if len(res) == 0:
            return SearchPage(None)

        if self._left_res_cnt is None:
            return SearchPage(res)

        # When we have a limit, ensure we don't return more results than requested
        cur_len = len(res)
        if cur_len > self._left_res_cnt:
            res = res[: self._left_res_cnt]
        self._left_res_cnt -= cur_len
        return SearchPage(res)
