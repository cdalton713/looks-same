'use strict';

const fs = require('fs');
const NestedError = require('nested-error-stacks');
const OriginalIMG = require('./original-image');
const BoundedIMG = require('./bounded-image');

const createimage = async (buffer, {boundingBox, rgb} = {}) => {
    return boundingBox
        ? BoundedIMG.create(buffer, rgb, boundingBox)
        : OriginalIMG.create(buffer, rgb);
};

exports.fromBuffer = (buffer, opts) => createimage(buffer, opts);

exports.fromFile = async (filePath, opts = {}) => {
    try {
        const buffer = await fs.promises.readFile(filePath);
        return exports.fromBuffer(buffer, opts);
    } catch (err) {
        throw new NestedError(`Can't load img file ${filePath}`, err);
    }
};
