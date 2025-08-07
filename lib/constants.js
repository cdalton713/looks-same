'use strict';

// https://en.wikipedia.org/wiki/PNG
const PNG = {
    RGBA_CHANNELS: 4,
    WIDTH_OFFSET: 16,
    HEIGHT_OFFSET: 20,
    SIGNATURE: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    BIT_DEPTH_EIGHT_BIT: 8,
    COLOR_TYPE_RGBA: 6,
    COMPRESSION_DEFLATE: 0,
    FILTER_NO_FILTER: 0,
    INTERLACE_NO_INTERLACE: 0,
    IHDR_LENGTH: 13,
    MIN_ASSIST_BYTES: 57
};

module.exports = {
    JND: 2.3, // Just noticeable difference if ciede2000 >= JND then colors difference is noticeable by human eye
    REQUIRED_IMAGE_FIELDS: ['source', 'boundingBox'],
    REQUIRED_BOUNDING_BOX_FIELDS: ['left', 'top', 'right', 'bottom'],
    CLUSTERS_SIZE: 10,
    BITS_IN_BYTE: 8,
    PNG,
};
