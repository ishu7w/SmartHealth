#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm ci --prefix frontend
npm run build --prefix frontend
mvn -B -f backend/pom.xml clean
mkdir -p backend/target/classes/static
cp -R frontend/dist/. backend/target/classes/static/
mvn -B -f backend/pom.xml package
