'use strict';

const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fs = require('fs');

const stubBuffer = Buffer.from([123]);

describe('lib/image/index.js', () => {
    const sandbox = sinon.createSandbox();

    let image, mkOriginalImage;

    beforeEach(() => {
        sandbox.stub(fs.promises, 'readFile').resolves(stubBuffer);

        mkOriginalImage = sandbox.stub();
        image = proxyquire('../../lib/image', {
            './original-image': {create: mkOriginalImage},
            './bounded-image': {create: sandbox.stub()}
        });
    });

    afterEach(() => sandbox.restore());

    describe('fromFile', () => {
        it('should parse and return image instance', async () => {
            await image.fromFile('/filePath');

            assert.calledOnceWith(mkOriginalImage, stubBuffer);
        });

        it('should throw error with file path and original error message at stack', async () => {
            const parseError = new Error('test error');
            fs.promises.readFile.withArgs('/filePath').rejects(parseError);

            const error = await assert.isRejected(image.fromFile('/filePath'));

            assert.match(error.message, 'Can\'t load img file /filePath');
            assert.match(error.stack, 'Error: test error');
        });
    });
});
