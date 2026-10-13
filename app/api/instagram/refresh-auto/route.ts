/**
 * API Route: Auto Refresh Instagram Token
 * 
 * Este endpoint:
 * 1. Refresca el token de Instagram
 * 2. Actualiza automáticamente la variable de entorno en Vercel usando la API
 * 
 * Protegido por CRON_SECRET para que solo Vercel pueda llamarlo
 * 
 * GET /api/instagram/refresh-auto
 */

import { NextResponse } from 'next/server';
import { refreshInstagramToken } from '@/lib/instagram/token';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Opcional
const CRON_SECRET = process.env.CRON_SECRET; // Secret para proteger el endpoint
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

/**
 * Actualizar variable de entorno en Vercel usando la API
 */
async function updateVercelEnvVariable(
  key: string,
  value: string,
  environments: ('production' | 'preview' | 'development')[] = ['production', 'preview']
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return {
        success: false,
        error: 'VERCEL_TOKEN o VERCEL_PROJECT_ID no configurados',
      };
    }

    const baseUrl = 'https://api.vercel.com';
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

    // Paso 1: Eliminar la variable antigua (si existe)
    // Primero obtenemos todas las variables para encontrar el ID
    const listResponse = await fetch(
      `${baseUrl}/v9/projects/${VERCEL_PROJECT_ID}/env${teamParam}`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (!listResponse.ok) {
      const error = await listResponse.json().catch(() => ({}));
      console.error('Error al listar variables de Vercel:', error);
      return {
        success: false,
        error: `Error al listar variables: ${JSON.stringify(error)}`,
      };
    }

    const envVars = await listResponse.json();
    const existingVar = envVars.envs?.find((env: any) => env.key === key);

    // Si existe, eliminarla
    if (existingVar) {
      const deleteResponse = await fetch(
        `${baseUrl}/v9/projects/${VERCEL_PROJECT_ID}/env/${existingVar.id}${teamParam}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
          },
        }
      );

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json().catch(() => ({}));
        console.error('Error al eliminar variable de Vercel:', error);
        // Continuamos de todas formas, puede que no exista
      }
    }

    // Paso 2: Crear la nueva variable
    const createResponse = await fetch(
      `${baseUrl}/v9/projects/${VERCEL_PROJECT_ID}/env${teamParam}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted', // Variable encriptada
          target: environments, // Aplicar a production y preview
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({}));
      console.error('Error al crear variable de Vercel:', error);
      return {
        success: false,
        error: `Error al crear variable: ${JSON.stringify(error)}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en updateVercelEnvVariable:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Auto-refresh del token de Instagram y actualización en Vercel
 */
export async function GET(request: Request) {
  try {
    // Vercel Cron envía `Authorization: Bearer ${CRON_SECRET}` cuando CRON_SECRET está definido
    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET no configurado en variables de entorno' },
        { status: 500 }
      );
    }

    if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'No autorizado. Secret inválido.' },
        { status: 401 }
      );
    }

    // Validar configuración
    if (!INSTAGRAM_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'INSTAGRAM_ACCESS_TOKEN no configurado' },
        { status: 500 }
      );
    }

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json(
        {
          error: 'Configuración de Vercel incompleta',
          details: {
            hasVercelToken: !!VERCEL_TOKEN,
            hasProjectId: !!VERCEL_PROJECT_ID,
          },
          instructions: [
            'Necesitas configurar:',
            '1. VERCEL_TOKEN - Token de API de Vercel (vercel.com/account/tokens)',
            '2. VERCEL_PROJECT_ID - ID del proyecto (Settings → General)',
            '3. VERCEL_TEAM_ID - Opcional, solo si es proyecto de team',
          ],
        },
        { status: 500 }
      );
    }

    console.log('🔄 Iniciando refresh automático de token de Instagram...');

    // Paso 1: Refrescar el token de Instagram
    const refreshResult = await refreshInstagramToken(INSTAGRAM_ACCESS_TOKEN);

    if (!refreshResult) {
      return NextResponse.json(
        {
          error: 'No se pudo refrescar el token de Instagram',
          code: 'REFRESH_FAILED',
          instructions: [
            'El token puede haber expirado completamente (más de 60 días).',
            'Necesitas obtener un nuevo token manualmente:',
            '1. Ejecuta: npm run script:instagram-auth',
            '2. Sigue el proceso de autorización',
            '3. Actualiza INSTAGRAM_ACCESS_TOKEN manualmente en Vercel',
          ],
        },
        { status: 401 }
      );
    }

    console.log('✅ Token de Instagram refrescado exitosamente');

    // Paso 2: Actualizar variable de entorno en Vercel
    console.log('📝 Actualizando variable de entorno en Vercel...');
    const updateResult = await updateVercelEnvVariable(
      'INSTAGRAM_ACCESS_TOKEN',
      refreshResult.token,
      ['production', 'preview'] // Aplicar a production y preview
    );

    if (!updateResult.success) {
      return NextResponse.json(
        {
          error: 'Token refrescado pero falló actualización en Vercel',
          token: refreshResult.token, // Retornar token para actualización manual
          vercelError: updateResult.error,
          instructions: [
            'El token se refrescó exitosamente, pero falló la actualización automática en Vercel.',
            'Actualiza manualmente INSTAGRAM_ACCESS_TOKEN en Vercel con:',
            refreshResult.token,
          ],
        },
        { status: 500 }
      );
    }

    console.log('✅ Variable de entorno actualizada en Vercel');

    // Paso 3: Opcional - Redesplegar (comentado por ahora, puede ser costoso)
    // Si quieres redesplegar automáticamente, descomenta esto:
    /*
    const redeployResponse = await fetch(
      `https://api.vercel.com/v13/deployments${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: VERCEL_PROJECT_ID,
          project: VERCEL_PROJECT_ID,
        }),
      }
    );
    */

    return NextResponse.json({
      success: true,
      message: 'Token refrescado y actualizado en Vercel exitosamente',
      expiresIn: refreshResult.expiresIn,
      expiresInDays: Math.floor(refreshResult.expiresIn / 86400),
      expiresAt: new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString(),
      note: 'La variable de entorno se actualizó. El nuevo token estará disponible en el próximo deploy.',
    });
  } catch (error) {
    console.error('Error en refresh-auto:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

