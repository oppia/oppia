import datetime
import sys
from typing import Any, Callable, Union

import numpy as np

from pymilvus.exceptions import ParamError
from pymilvus.grpc_gen import milvus_pb2 as milvus_types

from . import entity_helper
from .singleton_utils import Singleton


def validate_strs(**kwargs):
    """validate if all values are legal non-emtpy str"""
    invalid_pair = {k: v for k, v in kwargs.items() if not validate_str(v)}
    if invalid_pair:
        msg = f"Illegal str variables: {invalid_pair}, expect non-empty str"
        raise ParamError(message=msg)


def validate_nullable_strs(**kwargs):
    """validate if all values are either None or legal non-empty str"""
    invalid_pair = {k: v for k, v in kwargs.items() if v is not None and not validate_str(v)}
    if invalid_pair:
        msg = f"Illegal nullable str variables: {invalid_pair}, expect None or non-empty str"
        raise ParamError(message=msg)


def validate_str(var: Any) -> bool:
    """check if a variable is legal non-empty str"""
    return var and isinstance(var, str)


def is_legal_address(addr: Any) -> bool:
    if not isinstance(addr, str):
        return False

    a = addr.split(":")
    if len(a) != 2:
        return False

    return is_legal_host(a[0]) and is_legal_port(a[1])


def is_legal_host(host: Any) -> bool:
    return isinstance(host, str) and len(host) > 0 and (":" not in host)


def is_legal_port(port: Any) -> bool:
    if isinstance(port, (str, int)):
        try:
            int(port)
        except ValueError:
            return False
        else:
            return True
    return False


def int_or_str(item: Union[int, str]) -> str:
    if isinstance(item, int):
        return str(item)

    return item


def is_correct_date_str(param: str) -> bool:
    try:
        datetime.datetime.strptime(param, "%Y-%m-%d")
    except ValueError:
        return False

    return True


def is_legal_dimension(dim: Any) -> bool:
    try:
        _ = int(dim)
    except ValueError:
        return False

    return True


def is_legal_index_size(index_size: Any) -> bool:
    return isinstance(index_size, int)


def is_legal_table_name(table_name: Any) -> bool:
    return validate_str(table_name)


def is_legal_db_name(db_name: Any) -> bool:
    # you can connect to the default database "".
    return isinstance(db_name, str)


def is_legal_field_name(field_name: Any) -> bool:
    return field_name and isinstance(field_name, str)


def is_legal_index_name(index_name: Any) -> bool:
    return index_name and isinstance(index_name, str)


def is_legal_timeout(timeout: Any) -> bool:
    return timeout is None or isinstance(timeout, (int, float))


def is_legal_nlist(nlist: Any) -> bool:
    return not isinstance(nlist, bool) and isinstance(nlist, int)


def is_legal_topk(topk: Any) -> bool:
    return not isinstance(topk, bool) and isinstance(topk, int)


def is_legal_ids(ids: Any) -> bool:
    if not ids or not isinstance(ids, list):
        return False

    # TODO: Here check id valid value range may not match other SDK
    for i in ids:
        if not isinstance(i, (int, str)):
            return False
        try:
            i_ = int(i)
            if i_ < 0 or i_ > sys.maxsize:
                return False
        except Exception:
            return False

    return True


def is_legal_nprobe(nprobe: Any) -> bool:
    return isinstance(nprobe, int)


def is_legal_itopk_size(itopk_size: Any) -> bool:
    return isinstance(itopk_size, int)


def is_legal_search_width(search_width: Any) -> bool:
    return isinstance(search_width, int)


def is_legal_min_iterations(min_iterations: Any) -> bool:
    return isinstance(min_iterations, int)


def is_legal_max_iterations(max_iterations: Any) -> bool:
    return isinstance(max_iterations, int)


def is_legal_drop_ratio(drop_ratio: Any) -> bool:
    return isinstance(drop_ratio, float) and 0 <= drop_ratio < 1


def is_legal_team_size(team_size: Any) -> bool:
    return isinstance(team_size, int)


def is_legal_cmd(cmd: Any) -> bool:
    return cmd and isinstance(cmd, str)


def parser_range_date(date: Union[str, datetime.date]) -> str:
    if isinstance(date, datetime.date):
        return date.strftime("%Y-%m-%d")

    if isinstance(date, str):
        if not is_correct_date_str(date):
            raise ParamError(message="Date string should be YY-MM-DD format!")

        return date

    raise ParamError(
        message="Date should be YY-MM-DD format string or datetime.date, "
        "or datetime.datetime object"
    )


def is_legal_date_range(start: str, end: str) -> bool:
    start_date = datetime.datetime.strptime(start, "%Y-%m-%d")
    end_date = datetime.datetime.strptime(end, "%Y-%m-%d")

    return (end_date - start_date).days >= 0


def is_legal_partition_name(tag: Any) -> bool:
    return tag is not None and isinstance(tag, str)


def is_legal_limit(limit: Any) -> bool:
    return isinstance(limit, int) and limit > 0


def is_legal_anns_field(field: Any) -> bool:
    return field is None or isinstance(field, str)


def is_legal_search_data(data: Any) -> bool:
    if entity_helper.entity_is_sparse_matrix(data):
        return True

    if not isinstance(data, (list, np.ndarray)):
        return False

    return all(isinstance(vector, (list, bytes, np.ndarray, str)) for vector in data)


def is_legal_output_fields(output_fields: Any) -> bool:
    if output_fields is None:
        return True

    if not isinstance(output_fields, list):
        return False

    return all(is_legal_field_name(field) for field in output_fields)


def is_legal_partition_name_array(tag_array: Any) -> bool:
    if tag_array is None:
        return True

    if not isinstance(tag_array, list):
        return False

    return all(is_legal_partition_name(tag) for tag in tag_array)


def is_legal_replica_number(replica_number: int) -> bool:
    return isinstance(replica_number, int)


def _raise_param_error(param_name: str, param_value: Any) -> None:
    raise ParamError(message=f"`{param_name}` value {param_value} is illegal")


def is_legal_round_decimal(round_decimal: Any) -> bool:
    return isinstance(round_decimal, int) and -2 < round_decimal < 7


def is_legal_guarantee_timestamp(ts: Any) -> bool:
    return (ts is None) or (isinstance(ts, int) and ts >= 0)


def is_legal_user(user: Any) -> bool:
    return isinstance(user, str)


def is_legal_password(password: Any) -> bool:
    return isinstance(password, str)


def is_legal_role_name(role_name: Any) -> bool:
    return role_name and isinstance(role_name, str)


def is_legal_operate_user_role_type(operate_user_role_type: Any) -> bool:
    return operate_user_role_type in (
        milvus_types.OperateUserRoleType.AddUserToRole,
        milvus_types.OperateUserRoleType.RemoveUserFromRole,
    )


def is_legal_include_user_info(include_user_info: Any) -> bool:
    return isinstance(include_user_info, bool)


def is_legal_include_role_info(include_role_info: Any) -> bool:
    return isinstance(include_role_info, bool)


def is_legal_object(object: Any) -> bool:
    return object and isinstance(object, str)


def is_legal_object_name(object_name: Any) -> bool:
    return object_name and isinstance(object_name, str)


def is_legal_privilege(privilege: Any) -> bool:
    return privilege and isinstance(privilege, str)


def is_legal_collection_properties(properties: Any) -> bool:
    return properties and isinstance(properties, dict)


def is_legal_operate_privilege_type(operate_privilege_type: Any) -> bool:
    return operate_privilege_type in (
        milvus_types.OperatePrivilegeType.Grant,
        milvus_types.OperatePrivilegeType.Revoke,
    )


def is_legal_privilege_group(privilege_group: Any) -> bool:
    return privilege_group and isinstance(privilege_group, str)


def is_legal_privileges(privileges: Any) -> bool:
    return (
        privileges
        and isinstance(privileges, list)
        and all(is_legal_privilege(p) for p in privileges)
    )


def is_legal_operate_privilege_group_type(operate_privilege_group_type: Any) -> bool:
    return operate_privilege_group_type in (
        milvus_types.OperatePrivilegeGroupType.AddPrivilegesToGroup,
        milvus_types.OperatePrivilegeGroupType.RemovePrivilegesFromGroup,
    )


class ParamChecker(metaclass=Singleton):
    def __init__(self) -> None:
        self.check_dict = {
            "db_name": is_legal_db_name,
            "collection_name": is_legal_table_name,
            "alias": is_legal_table_name,
            "field_name": is_legal_field_name,
            "dimension": is_legal_dimension,
            "index_file_size": is_legal_index_size,
            "topk": is_legal_topk,
            "ids": is_legal_ids,
            "nprobe": is_legal_nprobe,
            "nlist": is_legal_nlist,
            "cmd": is_legal_cmd,
            "partition_name": is_legal_partition_name,
            "partition_name_array": is_legal_partition_name_array,
            "limit": is_legal_limit,
            "anns_field": is_legal_anns_field,
            "search_data": is_legal_search_data,
            "output_fields": is_legal_output_fields,
            "round_decimal": is_legal_round_decimal,
            "guarantee_timestamp": is_legal_guarantee_timestamp,
            "user": is_legal_user,
            "password": is_legal_password,
            "role_name": is_legal_role_name,
            "operate_user_role_type": is_legal_operate_user_role_type,
            "include_user_info": is_legal_include_user_info,
            "include_role_info": is_legal_include_role_info,
            "object": is_legal_object,
            "object_name": is_legal_object_name,
            "privilege": is_legal_privilege,
            "operate_privilege_type": is_legal_operate_privilege_type,
            "properties": is_legal_collection_properties,
            "replica_number": is_legal_replica_number,
            "resource_group_name": is_legal_table_name,
            "itopk_size": is_legal_itopk_size,
            "search_width": is_legal_search_width,
            "min_iterations": is_legal_min_iterations,
            "max_iterations": is_legal_max_iterations,
            "team_size": is_legal_team_size,
            "index_name": is_legal_index_name,
            "timeout": is_legal_timeout,
            "drop_ratio_build": is_legal_drop_ratio,
            "drop_ratio_search": is_legal_drop_ratio,
            "privilege_group": is_legal_privilege_group,
            "privileges": is_legal_privileges,
            "operate_privilege_group_type": is_legal_operate_privilege_group_type,
        }

    def check(self, key: str, value: Callable):
        if key in self.check_dict:
            if not self.check_dict[key](value):
                _raise_param_error(key, value)
        else:
            raise ParamError(message=f"unknown param `{key}`")


def _get_param_checker():
    return ParamChecker()


def check_pass_param(*_args: Any, **kwargs: Any) -> None:  # pylint: disable=too-many-statements
    if kwargs is None:
        raise ParamError(message="Param should not be None")
    checker = _get_param_checker()
    for key, value in kwargs.items():
        checker.check(key, value)
