import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerMSIX } from '@electron-forge/maker-msix';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Offline PDF Toolbox',
    executableName: 'OfflinePdfToolbox',
    appBundleId: 'com.offlinepdftoolbox.app',
    appCategoryType: 'public.app-category.productivity',
    // The Vite plugin sets this automatically to keep only the built output.
    // We extend it to also ship the bundled `resources/` folder (qpdf binary).
    ignore: (file: string) => {
      if (!file) return false;
      if (file.startsWith('/.vite')) return false;
      if (file.startsWith('/resources')) return false;
      return true;
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['win32']),
    // MSIX maker cần Windows SDK; chỉ bật khi dựng gói phát hành.
    ...(process.env.OPTB_BUILD_MSIX === '1'
      ? [
          new MakerMSIX(
            {
              manifestVariables: {
                publisher: 'CN=Offline PDF Toolbox',
              },
            },
            ['win32'],
          ),
        ]
      : []),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
