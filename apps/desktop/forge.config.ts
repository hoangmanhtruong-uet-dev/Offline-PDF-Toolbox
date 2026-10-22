import path from 'node:path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerMSIX } from '@electron-forge/maker-msix';
import { VitePlugin } from '@electron-forge/plugin-vite';

import { MakerWindowsZip } from './forge/MakerWindowsZip';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Offline PDF Toolbox',
    executableName: 'OfflinePdfToolbox',
    appBundleId: 'com.mtdstudio.offlinepdftoolbox',
    appCategoryType: 'public.app-category.productivity',
    icon: 'assets/icon',
    // The Vite plugin sets this automatically to keep only the built output.
    // We extend it to also ship the bundled `resources/` (qpdf binary) and `assets/`.
    ignore: (file: string) => {
      if (!file) return false;
      if (file.startsWith('/.vite')) return false;
      if (file.startsWith('/resources')) return false;
      if (file.startsWith('/assets')) return false;
      return true;
    },
  },
  rebuildConfig: {},
  makers: [
    // Maker riêng: bản `maker-zip` của Forge lỗi với Node 26 (xem
    // `forge/MakerWindowsZip.ts`).
    new MakerWindowsZip({}, ['win32']),
    // MSIX maker cần Windows SDK; chỉ bật khi dựng gói phát hành.
    ...(process.env.OPTB_BUILD_MSIX === '1'
      ? [
          new MakerMSIX(
            {
              packageAssets: path.resolve(__dirname, 'assets'),
              appManifest: path.resolve(__dirname, 'AppxManifest.xml'),
              manifestVariables: {
                appExecutable: 'OfflinePdfToolbox.exe',
                packageIdentity: process.env.MSIX_IDENTITY_NAME || 'MTDStudio.OfflinePDFToolbox',
                publisher: process.env.MSIX_PUBLISHER || 'CN=F6CFEAEE-C755-4C7E-BDC5-FD89DA169656',
                publisherDisplayName: process.env.MSIX_PUBLISHER_DISPLAY_NAME || 'MTD Studio',
                packageDisplayName: 'Offline PDF Toolbox',
                packageDescription: 'Merge, split, compress and rotate PDFs entirely on your PC',
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
