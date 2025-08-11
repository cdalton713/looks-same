'use strict';

const colorDiff = require('color-diff');
const img = require('./lib/image');
const areColorsSame = require('./lib/same-colors');
const AntialiasingComparator = require('./lib/antialiasing-comparator');
const IgnoreCaretComparator = require('./lib/ignore-caret-comparator');
const DiffArea = require('./lib/diff-area');
const utils = require('./lib/utils');
const {JND, PNG: {RGBA_CHANNELS}} = require('./lib/constants');

const makeAntialiasingComparator = (comparator, img1, img2, opts) => {
    const antialiasingComparator = new AntialiasingComparator(comparator, img1, img2, opts);
    return (data) => antialiasingComparator.compare(data);
};

const makeNoCaretColorComparator = (comparator, pixelRatio) => {
    const caretComparator = new IgnoreCaretComparator(comparator, pixelRatio);
    return (data) => caretComparator.compare(data);
};

function makeCIEDE2000Comparator(tolerance) {
    const upperBound = tolerance * 6.2; // cie76 <= 6.2 * ciede2000
    const lowerBound = tolerance * 0.695; // cie76 >= 0.695 * ciede2000

    let rgbColor1 = {};
    let rgbColor2 = {};
    let labColor1 = {};
    let labColor2 = {};

    return function doColorsLookSame(data) {
        if (areColorsSame(data)) {
            return true;
        }

        let lab1, lab2;

        /*jshint camelcase:false*/
        if (areColorsSame({color1: data.color1, color2: rgbColor1})) {
            lab1 = labColor1;
        } else if (areColorsSame({color1: data.color1, color2: rgbColor2})) {
            lab1 = labColor2;
        }

        if (areColorsSame({color1: data.color2, color2: rgbColor1})) {
            lab2 = labColor1;
        } else if (areColorsSame({color1: data.color2, color2: rgbColor2})) {
            lab2 = labColor2;
        }

        if (!lab1) {
            lab1 = colorDiff.rgb_to_lab(data.color1);
            rgbColor1 = data.color1;
            labColor1 = lab1;
        }

        if (!lab2) {
            lab2 = colorDiff.rgb_to_lab(data.color2);
            rgbColor2 = data.color2;
            labColor2 = lab2;
        }

        const cie76 = Math.sqrt(
            (lab1.L - lab2.L) * (lab1.L - lab2.L) +
            (lab1.a - lab2.a) * (lab1.a - lab2.a) +
            (lab1.b - lab2.b) * (lab1.b - lab2.b)
        );

        if (cie76 >= upperBound) {
            return false;
        }

        if (cie76 <= lowerBound) {
            return true;
        }

        return colorDiff.diff(lab1, lab2) < tolerance;
    };
}

const createComparator = (img1, img2, opts) => {
    let comparator = opts.strict ? areColorsSame : makeCIEDE2000Comparator(opts.tolerance);

    if (opts.ignoreAntialiasing) {
        comparator = makeAntialiasingComparator(comparator, img1, img2, opts);
    }

    if (opts.ignoreCaret) {
        comparator = makeNoCaretColorComparator(comparator, opts.pixelRatio);
    }

    return comparator;
};

const iterateRect = async (width, height, callback) => {
    return new Promise((resolve) => {
        const processRow = (y) => {
            setImmediate(() => {
                for (let x = 0; x < width; x++) {
                    callback(x, y);
                }

                y++;

                if (y < height) {
                    processRow(y);
                } else {
                    resolve();
                }
            });
        };

        processRow(0);
    });
};

const buildDiffImage = async (img1, img2, options) => {
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);
    const minWidth = Math.min(img1.width, img2.width);
    const minHeight = Math.min(img1.height, img2.height);

    const highlightColor = options.highlightColor;
    const resultBuffer = Buffer.allocUnsafe(width * height * RGBA_CHANNELS);

    const setPixel = (buf, x, y, {R, G, B}) => {
        const pixelInd = (y * width + x) * RGBA_CHANNELS;
        buf[pixelInd] = R;
        buf[pixelInd + 1] = G;
        buf[pixelInd + 2] = B;
        buf[pixelInd + 3] = 0xff;
    };

    await iterateRect(width, height, (x, y) => {
        if (x >= minWidth || y >= minHeight) {
            setPixel(resultBuffer, x, y, highlightColor);
            return;
        }

        const color1 = img1.getPixel(x, y);
        const color2 = img2.getPixel(x, y);

        if (!options.comparator({color1, color2, img1, img2, x, y, width, height, minWidth, minHeight})) {
            setPixel(resultBuffer, x, y, highlightColor);
        } else {
            setPixel(resultBuffer, x, y, color1);
        }
    });

    return img.fromBuffer(resultBuffer, {rgb: {width, height}});
};

const getToleranceFromOpts = (opts) => {
    if (!Object.hasOwn(opts, 'tolerance')) {
        return JND;
    }

    if (opts.strict) {
        throw new TypeError('Unable to use "strict" and "tolerance" options together');
    }

    return opts.tolerance;
};

const prepareOpts = (opts) => {
    opts = opts || {};
    opts.tolerance = getToleranceFromOpts(opts);

    const defaults = {
        ignoreCaret: true,
        ignoreAntialiasing: true,
        antialiasingTolerance: 0
    };

    return Object.assign(defaults, opts);
};

const getMaxDiffBounds = (first, second) => {
    const {x: left, y: top} = first.getActualCoord(0, 0);

    return {
        left,
        top,
        right: left + Math.max(first.width, second.width) - 1,
        bottom: top + Math.max(first.height, second.height) - 1
    };
};

module.exports = exports = async function looksSame(image1, image2, opts = {}) {
    opts = prepareOpts(opts);
    [image1, image2] = utils.formatImages(image1, image2);

    const {first, second} = await utils.readPair(image1, image2, utils.readBufferCb);
    const areBuffersEqual = utils.areBuffersEqual(first, second);

    const refImg = {size: {width: first.width, height: first.height}};
    const metaInfo = {refImg};

    if (areBuffersEqual) {
        const diffBounds = (new DiffArea()).area;

        return {equal: true, metaInfo, diffBounds, diffClusters: [diffBounds], diffImage: null};
    }

    if (!opts.createDiffImage && (first.width !== second.width || first.height !== second.height)) {
        const diffBounds = getMaxDiffBounds(first, second);

        return {equal: false, metaInfo, diffBounds, diffClusters: [diffBounds]};
    }

    const {first: img1, second: img2} = await utils.readPair(
        {...image1, source: first.buffer},
        {...image2, source: second.buffer},
        utils.readImgCb
    );

    const comparator = createComparator(img1, img2, opts);
    const {stopOnFirstFail, shouldCluster, clustersSize, createDiffImage, highlightColor} = opts;

    if (createDiffImage) {
        return utils.calcDiffImage(img1, img2, comparator, {highlightColor, shouldCluster, clustersSize});
    }

    const {diffArea, diffClusters} = await utils.getDiffPixelsCoords(img1, img2, comparator, {stopOnFirstFail, shouldCluster, clustersSize});
    const diffBounds = diffArea.area;
    const equal = diffArea.isEmpty();

    return {equal, metaInfo, diffBounds, diffClusters};
};

exports.getDiffArea = async function(image1, image2, opts = {}) {
    opts = prepareOpts(opts);
    [image1, image2] = utils.formatImages(image1, image2);

    const {first, second} = await utils.readPair(image1, image2);

    if (first.width !== second.width || first.height !== second.height) {
        return getMaxDiffBounds(first, second);
    }

    const comparator = createComparator(first, second, opts);

    const {diffArea} = await utils.getDiffPixelsCoords(first, second, comparator, opts);

    if (diffArea.isEmpty()) {
        return null;
    }

    return diffArea.area;
};

exports.createDiff = async function saveDiff(opts) {
    opts = prepareOpts(opts);
    opts.extension = opts.extension || 'png';

    const [image1, image2] = utils.formatImages(opts.reference, opts.current);
    const {first, second} = await utils.readPair(image1, image2);
    const diffImage = await buildDiffImage(first, second, {
        highlightColor: utils.parseColorString(opts.highlightColor),
        comparator: createComparator(first, second, opts)
    });

    return opts.diff === undefined
        ? diffImage.createBuffer(opts.extension)
        : diffImage.save(opts.diff);
};

exports.colors = (color1, color2, opts) => {
    opts = opts || {};

    if (opts.tolerance === undefined) {
        opts.tolerance = JND;
    }

    const comparator = makeCIEDE2000Comparator(opts.tolerance);

    return comparator({color1, color2});
};
