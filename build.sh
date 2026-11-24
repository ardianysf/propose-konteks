#!/bin/sh
# Builds everything Vercel serves into site/: the prototype (design system, login, demo app) and the landing pages.
set -e
cd "$(dirname "$0")"
sh tools/publish.sh
sh landing/build.sh
rm -rf landing/__pycache__ tools/__pycache__
