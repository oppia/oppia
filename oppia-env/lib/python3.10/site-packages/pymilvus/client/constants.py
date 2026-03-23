from pymilvus.grpc_gen import common_pb2

ConsistencyLevel = common_pb2.ConsistencyLevel

LOGICAL_BITS = 18
LOGICAL_BITS_MASK = (1 << LOGICAL_BITS) - 1
EVENTUALLY_TS = 1
BOUNDED_TS = 2
DEFAULT_CONSISTENCY_LEVEL = ConsistencyLevel.Bounded
DEFAULT_RESOURCE_GROUP = "__default_resource_group"
DYNAMIC_FIELD_NAME = "$meta"
REDUCE_STOP_FOR_BEST = "reduce_stop_for_best"
COLLECTION_ID = "collection_id"
GROUP_BY_FIELD = "group_by_field"
GROUP_SIZE = "group_size"
RANK_GROUP_SCORER = "rank_group_scorer"
STRICT_GROUP_SIZE = "strict_group_size"
ITERATOR_FIELD = "iterator"
ITERATOR_SESSION_TS_FIELD = "iterator_session_ts"
ITER_SEARCH_V2_KEY = "search_iter_v2"
ITER_SEARCH_BATCH_SIZE_KEY = "search_iter_batch_size"
ITER_SEARCH_LAST_BOUND_KEY = "search_iter_last_bound"
ITER_SEARCH_ID_KEY = "search_iter_id"
PAGE_RETAIN_ORDER_FIELD = "page_retain_order"
HINTS = "hints"

RANKER_TYPE_RRF = "rrf"
RANKER_TYPE_WEIGHTED = "weighted"

GUARANTEE_TIMESTAMP = "guarantee_timestamp"
