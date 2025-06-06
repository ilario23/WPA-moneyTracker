import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetMini,
  presetUno,
} from 'unocss';

import presetRemToPx from '@unocss/preset-rem-to-px';

// For those of you who are new to unocss, you can take advantage of this tool： https://to-unocss.netlify.app

export default defineConfig({
  presets: [
    presetUno,
    presetAttributify,
    presetIcons(),
    // Why should I use this plugin?
    // The template uses viewport as the mobile adaptation scheme, and unocss defaults to rem.
    // So it needs to be converted to px, and then postcss converts the px to vw/vh to complete the adaptation.
    presetRemToPx({
      // Why is the base font size set here? Look at the following article
      // https://juejin.cn/post/7262975395620618298
      baseFontSize: 4,
    }),
    presetMini(),
  ],
  shortcuts: [
    // shortcuts to multiple utilities
    [
      'btn',
      'px-6 py-3 rounded-3 border-none inline-block bg-green-400 text-white cursor-pointer !outline-none hover:bg-green-600 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50',
    ],
  ],
});
