include .docker.env

run-devserver:
  @echo "Updating the docker env variables..."
  @echo "save_datastore        = $(save_datastore)"
  @echo "disable_host_checking = $(disable_host_checking)"
  @echo "no_auto_restart       = $(no_auto_restart)"
  @echo "prod_env              = $(prod_env)"
  @echo "maintenance_mode      = $(maintenance_mode)"
  @echo "source_maps           = $(source_maps)"
  save_datastore=$(save_datastore) \
  disable_host_checking=$(disable_host_checking) \
  no_auto_restart=$(no_auto_restart) \
  prod_env=$(prod_env) \
  maintenance_mode=$(maintenance_mode) \
  source_maps=$(source_maps) \
  docker compose up

setup-devserver:
  docker compose build

clean:
  docker compose down
  docker rmi oppia-dev-server oppia-angular-build oppia-webpack-compiler oppia-datastore redis:6.2.4 elasticsearch:7.17.0 node:16.13.0-alpine
  docker volume rm oppia_cloud_datastore_emulator_cache oppia_firebase_emulator_cache oppia_proto_files oppia_frontend_proto_files oppia_node_modules oppia_redis_dump oppia_third_party

terminal:
  docker compose up -d
  docker exec -it angular-build sh

stop-devserver:
  docker compose down
