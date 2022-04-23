# StrictRedis is defined as attribute in redis and mypy does not allow
# imports of attributes. But to define stubs of redis we have to import
# it. Thus to avoid mypy error, ignore is added here. 
from redis import StrictRedis as RedisStrict  # type: ignore[attr-defined]

StrictRedis = RedisStrict