from typing import Dict


class IndexParam:
    def __init__(self, field_name: str, index_type: str, index_name: str, **kwargs):
        """
        Examples:

            >>> IndexParam(
            >>>     field_name="embeddings",
            >>>     index_type="HNSW",
            >>>     index_name="hnsw_index",
            >>>     metric_type="COSINE",
            >>>     M=64,
            >>>     efConstruction=100,
            >>> )
        """
        self._field_name = field_name
        self._index_type = index_type
        self._index_name = index_name

        # index configs are unique to each index,
        # if params={} is passed in, it will be flattened and merged
        # with other configs.
        self._configs = {}
        self._configs.update(kwargs.pop("params", {}))
        self._configs.update(kwargs)

    @property
    def field_name(self):
        return self._field_name

    @property
    def index_name(self):
        return self._index_name

    @property
    def index_type(self):
        return self._index_type

    def get_index_configs(self) -> Dict:
        """return index_type and index configs in a dict

        Examples:

            {
                "index_type": "HNSW",
                "metrics_type": "COSINE",
                "M": 64,
                "efConstruction": 100,
            }
        """
        configs = self._configs
        # Omit index_type if it's empty
        if self.index_type:
            configs["index_type"] = self.index_type
        return configs

    def to_dict(self) -> Dict:
        """All params"""
        return {
            "field_name": self.field_name,
            "index_type": self.index_type,
            "index_name": self.index_name,
            **self._configs,
        }

    def __str__(self):
        return str(self.to_dict())

    __repr__ = __str__

    def __eq__(self, other: None):
        if isinstance(other, self.__class__):
            return dict(self) == dict(other)

        if isinstance(other, dict):
            return dict(self) == other
        return False


class IndexParams(list):
    """List of indexs of a collection"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def add_index(self, field_name: str, index_type: str = "", index_name: str = "", **kwargs):
        index_param = IndexParam(field_name, index_type, index_name, **kwargs)
        super().append(index_param)
