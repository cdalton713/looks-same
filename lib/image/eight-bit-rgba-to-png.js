const {unsigned: crc32} = require('buffer-crc32');
const zlib = require('node:zlib');
const { PNG } = require('../constants');

const COMPRESSION_LEVEL = 3;

const convertRgbaToScanlines = (rgba, width, height) => {
    const stride = width * PNG.RGBA_CHANNELS;
    const scanlines = Buffer.allocUnsafe(height * (1 + stride)); // extra byte for filter

    let scanlineOffset = 0;
    let pixelDataOffset = 0;

    for (let y = 0; y < height; y++) {
        scanlineOffset = scanlines.writeUInt8(PNG.FILTER_NO_FILTER, scanlineOffset);
        scanlineOffset += rgba.copy(scanlines, scanlineOffset, pixelDataOffset, pixelDataOffset + stride);

        pixelDataOffset += stride;
    }

    if (scanlineOffset !== scanlines.byteLength) {
        throw new Error('Got malformed input while trying to convert rgba to png');
    }

    return scanlines;
}

exports.convertRgbaToPng = (rgba, width, height, compressionLevel = COMPRESSION_LEVEL) => {
    const scanlines = convertRgbaToScanlines(rgba, width, height);
    const compressedData = zlib.deflateSync(scanlines, { level: compressionLevel });
    const resultBuffer = Buffer.allocUnsafe(PNG.MIN_ASSIST_BYTES + compressedData.length);

    let pointer = 0;

    // signature
    pointer += PNG.SIGNATURE.copy(resultBuffer);

    // IHDR
    const ihdrPointer = (pointer = resultBuffer.writeUInt32BE(PNG.IHDR_LENGTH, pointer));
    pointer += resultBuffer.write("IHDR", pointer, "ascii");
    pointer = resultBuffer.writeUInt32BE(width, pointer);
    pointer = resultBuffer.writeUInt32BE(height, pointer);
    pointer = resultBuffer.writeUInt8(PNG.BIT_DEPTH_EIGHT_BIT, pointer);
    pointer = resultBuffer.writeUInt8(PNG.COLOR_TYPE_RGBA, pointer);
    pointer = resultBuffer.writeUInt8(PNG.COMPRESSION_DEFLATE, pointer);
    pointer = resultBuffer.writeUInt8(PNG.FILTER_NO_FILTER, pointer);
    pointer = resultBuffer.writeUInt8(PNG.INTERLACE_NO_INTERLACE, pointer);
    const ihdrCrc = crc32(resultBuffer.subarray(ihdrPointer, pointer));
    pointer = resultBuffer.writeUInt32BE(ihdrCrc, pointer);

    // IDAT
    const idatPointer = (pointer = resultBuffer.writeUInt32BE(compressedData.length, pointer));
    pointer += resultBuffer.write("IDAT", idatPointer, "ascii");
    pointer += compressedData.copy(resultBuffer, pointer);
    const idatCrc = crc32(resultBuffer.subarray(idatPointer, pointer));
    pointer = resultBuffer.writeUInt32BE(idatCrc, pointer);

    // IEND (empty)
    const iendPointer = (pointer = resultBuffer.writeUInt32BE(0, pointer));
    pointer += resultBuffer.write("IEND", pointer, "ascii");
    const iendCrc = crc32(resultBuffer.subarray(iendPointer, pointer));
    pointer = resultBuffer.writeUInt32BE(iendCrc, pointer);

    if (pointer !== resultBuffer.byteLength) {
        throw new Error("Got malformed input while trying to convert rgba to png");
    }
    return resultBuffer;
};
