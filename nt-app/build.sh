#!/bin/bash

set -e

docker build -t electron-build .
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD:/src" electron-build