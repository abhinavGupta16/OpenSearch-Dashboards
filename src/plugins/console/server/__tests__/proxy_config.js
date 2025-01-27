/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* eslint-env mocha */

import expect from '@osd/expect';
import sinon from 'sinon';
import https, { Agent as HttpsAgent } from 'https';
import { parse as parseUrl } from 'url';

import { ProxyConfig } from '../lib/proxy_config';

const matchGoogle = {
  protocol: 'https',
  host: 'google.com',
  path: '/search',
};
const parsedGoogle = parseUrl('https://google.com/search');
const parsedLocalOpenSearch = parseUrl('https://localhost:5601/search');

describe('ProxyConfig', function () {
  describe('constructor', function () {
    beforeEach(function () {
      sinon.stub(https, 'Agent');
    });

    afterEach(function () {
      https.Agent.restore();
    });

    it('uses ca to create sslAgent', function () {
      const config = new ProxyConfig({
        ssl: {
          ca: ['content-of-some-path'],
        },
      });

      expect(config.sslAgent).to.be.a(https.Agent);
      sinon.assert.calledOnce(https.Agent);
      const sslAgentOpts = https.Agent.firstCall.args[0];
      expect(sslAgentOpts).to.eql({
        ca: ['content-of-some-path'],
        cert: undefined,
        key: undefined,
        rejectUnauthorized: true,
      });
    });

    it('uses cert, and key to create sslAgent', function () {
      const config = new ProxyConfig({
        ssl: {
          cert: 'content-of-some-path',
          key: 'content-of-another-path',
        },
      });

      expect(config.sslAgent).to.be.a(https.Agent);
      sinon.assert.calledOnce(https.Agent);
      const sslAgentOpts = https.Agent.firstCall.args[0];
      expect(sslAgentOpts).to.eql({
        ca: undefined,
        cert: 'content-of-some-path',
        key: 'content-of-another-path',
        rejectUnauthorized: true,
      });
    });

    it('uses ca, cert, and key to create sslAgent', function () {
      const config = new ProxyConfig({
        ssl: {
          ca: ['content-of-some-path'],
          cert: 'content-of-another-path',
          key: 'content-of-yet-another-path',
          rejectUnauthorized: true,
        },
      });

      expect(config.sslAgent).to.be.a(https.Agent);
      sinon.assert.calledOnce(https.Agent);
      const sslAgentOpts = https.Agent.firstCall.args[0];
      expect(sslAgentOpts).to.eql({
        ca: ['content-of-some-path'],
        cert: 'content-of-another-path',
        key: 'content-of-yet-another-path',
        rejectUnauthorized: true,
      });
    });
  });

  describe('#getForParsedUri', function () {
    describe('parsed url does not match', function () {
      it('returns {}', function () {
        const config = new ProxyConfig({
          match: matchGoogle,
          timeout: 100,
        });

        expect(config.getForParsedUri(parsedLocalOpenSearch)).to.eql({});
      });
    });

    describe('parsed url does match', function () {
      it('assigns timeout value', function () {
        const football = {};
        const config = new ProxyConfig({
          match: matchGoogle,
          timeout: football,
        });

        expect(config.getForParsedUri(parsedGoogle).timeout).to.be(football);
      });

      it('assigns ssl.verify to rejectUnauthorized', function () {
        const football = {};
        const config = new ProxyConfig({
          match: matchGoogle,
          ssl: {
            verify: football,
          },
        });

        expect(config.getForParsedUri(parsedGoogle).rejectUnauthorized).to.be(football);
      });

      describe('uri us http', function () {
        describe('ca is set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                ca: ['path/to/ca'],
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'http:' }).agent).to.be(undefined);
          });
        });
        describe('cert is set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                cert: 'path/to/cert',
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'http:' }).agent).to.be(undefined);
          });
        });
        describe('key is set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                key: 'path/to/key',
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'http:' }).agent).to.be(undefined);
          });
        });
        describe('cert + key are set', function () {
          it('creates but does not output the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                cert: 'path/to/cert',
                key: 'path/to/key',
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'http:' }).agent).to.be(undefined);
          });
        });
      });

      describe('uri us https', function () {
        describe('ca is set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                ca: ['path/to/ca'],
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'https:' }).agent).to.be(config.sslAgent);
          });
        });
        describe('cert is set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                cert: 'path/to/cert',
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'https:' }).agent).to.be(config.sslAgent);
          });
        });
        describe('key is set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                key: 'path/to/key',
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'https:' }).agent).to.be(config.sslAgent);
          });
        });
        describe('cert + key are set', function () {
          it('creates and outputs the agent', function () {
            const config = new ProxyConfig({
              ssl: {
                cert: 'path/to/cert',
                key: 'path/to/key',
              },
            });

            expect(config.sslAgent).to.be.an(HttpsAgent);
            expect(config.getForParsedUri({ protocol: 'https:' }).agent).to.be(config.sslAgent);
          });
        });
      });
    });
  });
});
