from typing import Any, Dict, Tuple, Union

from pymilvus.exceptions import ParamError


def validate_params(params: Dict[str, Any], expected_type: Union[type, Tuple[type, ...]]):
    validate_param("params", params, Dict)
    for param_name, param in params.items():
        validate_param(param_name, param, expected_type)


def validate_param(
    param_name: str, param: Any, expected_type: Union[type, Tuple[type, ...]]
) -> None:
    if param is None:
        msg = f"missing required argument: [{param_name}]"
        raise ParamError(message=msg)

    if not isinstance(param, expected_type):
        msg = (
            f"wrong type of argument [{param_name}], "
            f"expected type: [{expected_type.__name__}], "
            f"got type: [{type(param).__name__}]"
        )
        raise ParamError(message=msg)


def validate_noneable_param(
    param_name: str, param: Any, expected_type: Union[type, Tuple[type, ...]]
):
    if param is None:
        return

    validate_param(param_name, param, expected_type)
