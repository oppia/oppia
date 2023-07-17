#!/bin/bash

python -m scripts.build \
$([ "$prod_env" = "true" ] && echo "--prod_env") \
$([ "$maintenance_mode" = "true" ] && echo "--maintenance_mode") \
$([ "$source_maps" = "true" ] && echo "--source_maps")

/google-cloud-sdk/bin/dev_appserver.py \
$([ "$prod_env" = "true" ] && echo "/app/oppia/app.yaml" || echo "/app/oppia/app_dev_docker.yaml") \
--runtime=python38 \
--host=0.0.0.0 \
--port=8181 \
--admin_host=0.0.0.0 \
--admin_port=8000 \
--skip_sdk_update_check=true \
$([ "no_auto_restart" = "true" ] && echo "--automatic_restart=false" || echo "--automatic_restart=true") \
--log_level=info \
--dev_appserver_log_level=info \
$([ "$disable_host_checking" != "true" ] && echo "--enable_host_checking")
