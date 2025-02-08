/**
 * Support for in-line styles px to vw.
 * The code in this file is from the scale-view open source project.
 * Source code link: https://github.com/wswmsword/scale-view
 * Many thanks to the author @wswmsword for the support!
 */

import {round} from 'lodash-es';

// Ideal width, the width of the design
const idealWidth = 375;

// Indicates the maximum width of the telescopic view
const maxWidth = 600;

/**
 * Size-restricted vw conversion
 * @param {number} n
 */
export default function vw(n: number) {
  if (n === 0) return n;

  const vwN = round((n * 100) / idealWidth, 3);
  const maxN = round((n * maxWidth) / idealWidth, 3);
  const cssF = n > 0 ? 'min' : 'max';
  return `${cssF}(${vwN}vw, ${maxN}px)`;
}
