import type { ActionFunctionArgs } from 'react-router';
import { CUSTOMIZER_TEMPLATES, type TShirtDesignConfig } from '~/schemas/customizer.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

let SAVED_DESIGNS_DB: TShirtDesignConfig[] = [...CUSTOMIZER_TEMPLATES];

export class CustomizerService {
  static async getCustomizerData() {
    return cacheData(
      'customizer:presets',
      300,
      async () => {
        try {
          return {
            templates: CUSTOMIZER_TEMPLATES,
            savedDesigns: SAVED_DESIGNS_DB,
            initialConfig: SAVED_DESIGNS_DB[0] || CUSTOMIZER_TEMPLATES[0],
          };
        } catch (error) {
          ErrorCatch({ error, context: 'CustomizerService:getCustomizerData' });
          return {
            templates: CUSTOMIZER_TEMPLATES,
            savedDesigns: [],
            initialConfig: CUSTOMIZER_TEMPLATES[0],
          };
        }
      },
      { tags: ['customizer'] }
    );
  }

  static async saveDesign(config: TShirtDesignConfig) {
    const existingIndex = SAVED_DESIGNS_DB.findIndex((d) => d.id === config.id);
    if (existingIndex !== -1) {
      SAVED_DESIGNS_DB[existingIndex] = config;
    } else {
      SAVED_DESIGNS_DB.unshift(config);
    }
    invalidateCacheByTag('customizer');
    return { success: true, design: config };
  }
}

export async function handleCustomizerAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    const strategies: Record<string, () => Promise<Response>> = {
      'save-design': async () => {
        const rawConfig = formData.get('config');
        if (!rawConfig) throw new ApiError('Data desain tidak ditemukan', 400);
        const parsed = JSON.parse(String(rawConfig));
        const res = await CustomizerService.saveDesign(parsed);
        return successResponse(res);
      },
      'order-custom-design': async () => {
        const rawConfig = formData.get('config');
        if (!rawConfig) throw new ApiError('Data konfigurasi pesanan kosong', 400);
        return successResponse({ success: true, message: 'Pesanan desain berhasil diproses ke antrian produksi!' });
      },
    };

    const strategy = strategies[intent];
    if (!strategy) {
      throw new ApiError(`Aksi "${intent}" tidak dikenali`, 400);
    }

    return await strategy();
  } catch (error) {
    ErrorCatch({ error, context: 'handleCustomizerAction' });
    return errorResponse(error);
  }
}
