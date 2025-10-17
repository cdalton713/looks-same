'use strict';

/**
 * VerticalShiftComparator handles content that has shifted vertically in web pages.
 * It detects and compensates for vertical shifts within a specified tolerance range.
 */
module.exports = class VerticalShiftComparator {
    constructor(baseComparator, img1, img2, opts = {}) {
        this._baseComparator = baseComparator;
        this._img1 = img1;
        this._img2 = img2;
        this._tolerance = opts.verticalShiftTolerance || 0;
        this._optimalShift = null;
        this._shiftDetectionComplete = false;
    }

    /**
     * Detects the optimal vertical shift between two images by comparing
     * horizontal strips at different vertical offsets.
     */
    _detectOptimalShift() {
        if (this._shiftDetectionComplete) {
            return this._optimalShift;
        }

        const sampleRows = this._getSampleRows();
        const shiftScores = new Map();

        // Test different shift offsets within tolerance range
        for (let shift = -this._tolerance; shift <= this._tolerance; shift++) {
            let matchScore = 0;
            let samplesChecked = 0;

            for (const row of sampleRows) {
                const score = this._compareRowWithShift(row, shift);
                if (score !== null) {
                    matchScore += score;
                    samplesChecked++;
                }
            }

            if (samplesChecked > 0) {
                shiftScores.set(shift, matchScore / samplesChecked);
            }
        }

        // Find the shift with the highest match score
        let bestShift = 0;
        let bestScore = 0;

        for (const [shift, score] of shiftScores) {
            if (score > bestScore) {
                bestScore = score;
                bestShift = shift;
            }
        }

        this._optimalShift = bestShift;
        this._shiftDetectionComplete = true;
        return bestShift;
    }

    /**
     * Gets sample rows to test for shift detection.
     * Samples are taken from different vertical positions.
     */
    _getSampleRows() {
        const height = Math.min(this._img1.height, this._img2.height);
        const sampleCount = Math.min(10, Math.floor(height / 10));
        const rows = [];

        if (sampleCount === 0) {
            return [0];
        }

        // Sample evenly distributed rows
        const step = Math.floor(height / (sampleCount + 1));
        for (let i = 1; i <= sampleCount; i++) {
            rows.push(Math.min(i * step, height - 1));
        }

        return rows;
    }

    /**
     * Compares a row with a vertical shift applied.
     * Returns a score from 0 to 1 indicating how well the rows match.
     */
    _compareRowWithShift(row, shift) {
        const width = Math.min(this._img1.width, this._img2.width);
        const height1 = this._img1.height;
        const height2 = this._img2.height;

        const row2 = row + shift;

        // Check if the shifted row is within bounds
        if (row < 0 || row >= height1 || row2 < 0 || row2 >= height2) {
            return null;
        }

        let matches = 0;
        let total = 0;

        // Sample pixels across the row
        const sampleStep = Math.max(1, Math.floor(width / 20));

        for (let x = 0; x < width; x += sampleStep) {
            const color1 = this._img1.getPixel(x, row);
            const color2 = this._img2.getPixel(x, row2);

            const pixelMatches = this._baseComparator({
                color1,
                color2,
                img1: this._img1,
                img2: this._img2,
                x,
                y: row,
                width: this._img1.width,
                height: this._img1.height
            });

            if (pixelMatches) {
                matches++;
            }
            total++;
        }

        return total > 0 ? matches / total : 0;
    }

    /**
     * Main comparison function that applies vertical shift compensation.
     */
    compare(data) {
        // If no tolerance is set, use base comparator directly
        if (this._tolerance === 0) {
            return this._baseComparator(data);
        }

        // Try the base comparator first without shifting
        // This allows other comparators (like caret) to work with original positions
        if (this._baseComparator(data)) {
            return true;
        }

        // If base comparison failed, try with shift compensation
        // Get the optimal shift (computed once and cached)
        const shift = this._detectOptimalShift();

        // If no shift detected, return the original comparison result
        if (shift === 0) {
            return false;
        }

        // Apply the shift to y coordinate for img2
        const shiftedY = data.y + shift;

        // Check if shifted position is out of bounds
        if (shiftedY < 0 || shiftedY >= this._img2.height) {
            // Out of bounds pixels are considered different
            return false;
        }

        // Get the pixel from the shifted position
        const shiftedColor2 = this._img2.getPixel(data.x, shiftedY);

        // Compare using the base comparator with the shifted pixel
        // We need to maintain the original y coordinate for other comparators
        // that might depend on position (like caret detection)
        const shiftedData = {
            ...data,
            color2: shiftedColor2,
            // Keep original y for position-dependent comparators
            originalY: data.y,
            shiftedY: shiftedY
        };

        return this._baseComparator(shiftedData);
    }

    /**
     * Gets the detected vertical shift offset.
     * Useful for debugging and reporting.
     */
    getDetectedShift() {
        return this._optimalShift;
    }
};