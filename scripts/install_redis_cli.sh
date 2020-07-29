cd third_party/redis-cli-6.0.6 &&
make distclean &&
make &&
sudo cp src/redis-server /usr/local/bin/ &&
sudo cp src/redis-cli /usr/local/bin/ &&
sudo mkdir -p /etc/redis/ &&
sudo cp ../../redis.conf /etc/redis/redis.conf
