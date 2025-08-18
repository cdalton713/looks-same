'use strict';

const fs = require('fs');
const {convertRgbaToPng} = require('./eight-bit-rgba-to-png');
const ImageBase = require('../image-base');
const {BITS_IN_BYTE, PNG: {WIDTH_OFFSET, HEIGHT_OFFSET, RGBA_CHANNELS}} = require('../constants');

const initJsquashPromise = new Promise(resolve => {
    const wasmLocation = require.resolve('@jsquash/png/codec/pkg/squoosh_png_bg.wasm');

    Promise.all([
        import('@jsquash/png/decode.js'),
        fs.promises.readFile(wasmLocation)
    ]).then(([mod, wasmBytes]) => mod.init(wasmBytes)).then(resolve);
});

const jsquashDecode = (buffer) => {
    return Promise.all([
        import('@jsquash/png/decode.js'),
        initJsquashPromise
    ]).then(([{decode}]) => decode(buffer, { bitDepth: BITS_IN_BYTE }));
};

module.exports = class Image extends ImageBase {
    constructor(buffer, rgb) {
        super();

        if (rgb) {
            this._width = rgb.width;
            this._height = rgb.height;
            this._imgData = buffer;
        } else {
            this._width = buffer.readUInt32BE(WIDTH_OFFSET);
            this._height = buffer.readUInt32BE(HEIGHT_OFFSET);
            this._imgDataPromise = jsquashDecode(buffer).then(({data}) => {
                return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
            });
        }
    }

    async _getImgData() {
        if (this._imgData) {
            return this._imgData;
        }

        return this._imgData = await this._imgDataPromise;
    }

    async init() {
        await this._getImgData();
    }

    getPixel(x, y) {
        const idx = (this._width * y + x) * RGBA_CHANNELS;

        return {
            R: this._imgData[idx],
            G: this._imgData[idx + 1],
            B: this._imgData[idx + 2]
        };
    }

    async _getPngBuffer() {
        const imageData = await this._getImgData();

        return convertRgbaToPng(imageData, this._width, this._height);
    }

    async save(path) {
        const data = await this._getPngBuffer();

        return fs.promises.writeFile(path, data);
    }

    async createBuffer(extension) {
        return extension === 'raw' ? this._imgData.data : this._getPngBuffer();
    }
};
