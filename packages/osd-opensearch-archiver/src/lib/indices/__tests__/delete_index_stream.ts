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

import sinon from 'sinon';

import { createListStream, createPromiseFromStreams } from '../../streams';

import { createDeleteIndexStream } from '../delete_index_stream';

import {
  createStubStats,
  createStubClient,
  createStubIndexRecord,
  createStubLogger,
} from './stubs';

const log = createStubLogger();

describe('opensearchArchiver: createDeleteIndexStream()', () => {
  it('deletes the index without checking if it exists', async () => {
    const stats = createStubStats();
    const client = createStubClient([]);

    await createPromiseFromStreams([
      createListStream([createStubIndexRecord('index1')]),
      createDeleteIndexStream(client, stats, log, []),
    ]);

    sinon.assert.notCalled(stats.deletedIndex as sinon.SinonSpy);
    sinon.assert.notCalled(client.indices.create as sinon.SinonSpy);
    sinon.assert.calledOnce(client.indices.delete as sinon.SinonSpy);
    sinon.assert.notCalled(client.indices.exists as sinon.SinonSpy);
  });

  it('reports the delete when the index existed', async () => {
    const stats = createStubStats();
    const client = createStubClient(['index1']);

    await createPromiseFromStreams([
      createListStream([createStubIndexRecord('index1')]),
      createDeleteIndexStream(client, stats, log, []),
    ]);

    sinon.assert.calledOnce(stats.deletedIndex as sinon.SinonSpy);
    sinon.assert.notCalled(client.indices.create as sinon.SinonSpy);
    sinon.assert.calledOnce(client.indices.delete as sinon.SinonSpy);
    sinon.assert.notCalled(client.indices.exists as sinon.SinonSpy);
  });
});
