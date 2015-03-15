# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


prod:
	NODE_ENV=production ./node_modules/.bin/webpack -p

dev:
	NODE_ENV=development ./node_modules/.bin/webpack

server.pid:
	node test/server.js & echo $$! > $@

stop-server:
	kill `cat ./server.pid`
	rm ./server.pid

test: test/build/tests.js server.pid
	@if test -n "$$JENKINS"; \
	then ./node_modules/.bin/mocha-phantomjs -R xunit http://localhost:21029/test/fixtures/index.html | \
		sed '/^[^<]/ d' > \
		test/build/xunit.xml; \
	fi;
	./node_modules/.bin/mocha-phantomjs http://localhost:21029/test/fixtures/index.html; make stop-server

# Output TAP formatted tests on stdout, used for phabricator/arc pre-commit
tap-test: test/build/tests.js server.pid
	./node_modules/.bin/mocha-phantomjs http://localhost:21029/test/fixtures/index.html -R tap; make stop-server

clean:
	rm -f build/*
	rm -f test/build/*
	rm -f server.pid

watch:
	NODE_ENV=development && ./node_modules/.bin/webpack --watch

test/build/tests.js: test/src/* src/*
	./node_modules/.bin/webpack test/src/tests.js $@ --config test/webpack.config.js

.PHONY: clean build test jenkins watch tap-test stop-server server.pid
