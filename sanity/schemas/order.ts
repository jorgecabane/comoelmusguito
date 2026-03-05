/**
 * Schema: Order
 * Órdenes de compra
 */

import { defineField, defineType } from 'sanity';
import chileRegionsData from '../../lib/utils/chile-regions.json';

interface Region {
  name: string;
  communes: string[];
}

// Validar que los datos se carguen correctamente
const CHILE_REGIONS: Region[] = Array.isArray(chileRegionsData) 
  ? (chileRegionsData as Region[])
  : [];

// Crear array de nombres de regiones de forma segura
// Asegurarse de que siempre sea un array válido
let ALL_REGIONS: string[] = [];
try {
  if (Array.isArray(CHILE_REGIONS) && CHILE_REGIONS.length > 0) {
    ALL_REGIONS = CHILE_REGIONS
      .map((r) => r?.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0);
  }
} catch (error) {
  console.error('Error inicializando ALL_REGIONS:', error);
  ALL_REGIONS = [];
}

export default defineType({
  name: 'order',
  title: 'Orden',
  type: 'document',
  icon: () => '📋',
  fields: [
    defineField({
      name: 'orderId',
      title: 'ID de Orden',
      type: 'string',
      description: 'ID único de la orden (ej: ORD-1234567890-abc)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'flowOrder',
      title: 'Orden de Flow',
      type: 'string',
      description: 'Número de orden de Flow.cl (puede venir como string o number desde la API)',
      // Convertir number a string si es necesario
      validation: (Rule) =>
        Rule.custom((value) => {
          if (value === undefined || value === null) return true; // Opcional
          // Aceptar tanto string como number
          if (typeof value === 'string' || typeof value === 'number') {
            return true;
          }
          return 'Debe ser un string o number';
        }),
    }),
    defineField({
      name: 'customerEmail',
      title: 'Email del Cliente',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
      description: 'Email usado para comprar (para vincular si se registra después)',
    }),
    defineField({
      name: 'customerName',
      title: 'Nombre del Cliente',
      type: 'string',
      description: 'Nombre completo del cliente',
    }),
    defineField({
      name: 'userId',
      title: 'Usuario',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'Usuario registrado (null si compró como invitado)',
      options: {
        disableNew: true,
      },
      // Los campos reference pueden ser null por defecto si no tienen required()
    }),
    defineField({
      name: 'items',
      title: 'Productos',
      type: 'array',
      of: [
        {
          type: 'object',
          options: {
            // Habilitar _key automático para items del array
          },
          fields: [
            {
              name: 'id',
              title: 'ID del Producto',
              type: 'string',
            },
            {
              name: 'type',
              title: 'Tipo',
              type: 'string',
              options: {
                list: [
                  { title: 'Terrario', value: 'terrarium' },
                  { title: 'Curso Online', value: 'course' },
                  { title: 'Taller Presencial', value: 'workshop' },
                  { title: 'Insumo', value: 'supply' },
                ],
              },
            },
            {
              name: 'name',
              title: 'Nombre',
              type: 'string',
            },
            {
              name: 'slug',
              title: 'Slug',
              type: 'string',
            },
            {
              name: 'price',
              title: 'Precio',
              type: 'number',
            },
            {
              name: 'currency',
              title: 'Moneda',
              type: 'string',
              options: {
                list: [
                  { title: 'CLP', value: 'CLP' },
                  { title: 'USD', value: 'USD' },
                ],
              },
            },
            {
              name: 'quantity',
              title: 'Cantidad',
              type: 'number',
            },
            {
              name: 'selectedDate',
              title: 'Fecha Seleccionada (Talleres)',
              type: 'object',
              fields: [
                {
                  name: 'date',
                  title: 'Fecha',
                  type: 'datetime',
                },
                {
                  name: 'time',
                  title: 'Hora',
                  type: 'string',
                },
              ],
            },
            {
              name: 'shippingPreference',
              title: 'Preferencia de Envío',
              type: 'string',
              options: {
                list: [
                  { title: 'Retiro en Local', value: 'pickup' },
                  { title: 'Envío a Domicilio', value: 'shipping' },
                ],
              },
              description: 'Cómo el cliente quiere recibir este producto (solo para productos despachables)',
            },
            {
              name: 'snapshot',
              title: 'Snapshot del Producto',
              type: 'object',
              description: 'Información del producto al momento de la compra (por si se elimina después)',
              fields: [
                {
                  name: 'image',
                  title: 'Imagen',
                  type: 'string',
                  description: 'URL de la imagen principal',
                },
                {
                  name: 'description',
                  title: 'Descripción',
                  type: 'text',
                  description: 'Descripción corta del producto',
                },
                {
                  name: 'longDescription',
                  title: 'Descripción Completa',
                  type: 'array',
                  of: [{ type: 'block' }],
                  description: 'Descripción completa en formato rich text',
                },
                {
                  name: 'size',
                  title: 'Tamaño',
                  type: 'string',
                  description: 'Tamaño del producto (para terrarios)',
                },
                {
                  name: 'category',
                  title: 'Categoría',
                  type: 'string',
                  description: 'Categoría del producto (para terrarios e insumos)',
                },
                {
                  name: 'duration',
                  title: 'Duración',
                  type: 'number',
                  description: 'Duración en horas (para cursos)',
                },
                {
                  name: 'level',
                  title: 'Nivel',
                  type: 'string',
                  description: 'Nivel del curso',
                },
                {
                  name: 'location',
                  title: 'Ubicación',
                  type: 'string',
                  description: 'Ubicación del taller',
                },
                {
                  name: 'weight',
                  title: 'Peso',
                  type: 'number',
                  description: 'Peso en gramos (para insumos)',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'total',
      title: 'Total',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Moneda',
      type: 'string',
      options: {
        list: [
          { title: 'CLP', value: 'CLP' },
          { title: 'USD', value: 'USD' },
        ],
      },
      initialValue: 'CLP',
    }),
    defineField({
      name: 'paymentStatus',
      title: 'Estado del Pago',
      type: 'number',
      options: {
        list: [
          { title: 'Pendiente', value: 1 },
          { title: 'Pagado', value: 2 },
          { title: 'Rechazado', value: 3 },
          { title: 'Anulado', value: 4 },
        ],
      },
      initialValue: 1,
    }),
    defineField({
      name: 'paymentDate',
      title: 'Fecha de Pago',
      type: 'datetime',
    }),
    defineField({
      name: 'createdAt',
      title: 'Fecha de Creación',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Última Actualización',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'emailSent',
      title: 'Email de Confirmación Enviado',
      type: 'boolean',
      description: 'Indica si ya se envió el email de confirmación de compra',
      initialValue: false,
    }),
    // Campos de Regalo
    defineField({
      name: 'isGift',
      title: 'Es Regalo',
      type: 'boolean',
      description: 'Indica si esta orden es un regalo para otra persona',
      initialValue: false,
    }),
    defineField({
      name: 'recipientEmail',
      title: 'Email del Destinatario',
      type: 'string',
      description: 'Email de la persona que recibirá el regalo',
      hidden: ({ parent }) => !parent?.isGift,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const isGift = (context.parent as any)?.isGift;
          if (isGift && !value) {
            return 'Email del destinatario es requerido para regalos';
          }
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Email inválido';
          }
          return true;
        }),
    }),
    defineField({
      name: 'recipientName',
      title: 'Nombre del Destinatario',
      type: 'string',
      description: 'Nombre de la persona que recibirá el regalo',
      hidden: ({ parent }) => !parent?.isGift,
    }),
    defineField({
      name: 'giftMessage',
      title: 'Mensaje Personalizado',
      type: 'text',
      description: 'Mensaje personalizado para el destinatario (máximo 500 caracteres)',
      hidden: ({ parent }) => !parent?.isGift,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'giftToken',
      title: 'Token de Canje',
      type: 'string',
      description: 'Token único para canjeo si el destinatario no tiene cuenta',
      readOnly: true,
    }),
    defineField({
      name: 'giftRedeemedAt',
      title: 'Fecha de Canje',
      type: 'datetime',
      description: 'Fecha y hora en que el regalo fue canjeado',
      hidden: ({ parent }) => !parent?.isGift,
      readOnly: true,
    }),
    defineField({
      name: 'giftRedeemedBy',
      title: 'Canjeado Por',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'Usuario que canjeó el regalo',
      hidden: ({ parent }) => !parent?.isGift,
      readOnly: true,
      // Los campos reference pueden ser null por defecto si no tienen required()
    }),
    // Campos de Despacho
    defineField({
      name: 'requiresShipping',
      title: 'Requiere Despacho',
      type: 'boolean',
      description: 'Indica si esta orden tiene productos que requieren despacho',
      initialValue: false,
    }),
    defineField({
      name: 'shippingAddress',
      title: 'Dirección de Despacho',
      type: 'object',
      description: 'Dirección para el despacho de productos (solo disponible dentro de Chile)',
      hidden: ({ parent }) => !parent?.requiresShipping,
      fields: [
        {
          name: 'region',
          title: 'Región',
          type: 'string',
          options: {
            // Array estático generado al cargar el schema
            list: ALL_REGIONS.map((region) => ({
              title: region,
              value: region,
            })),
          },
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const requiresShipping = (context.parent as any)?.requiresShipping;
              if (requiresShipping && !value) {
                return 'Región es requerida para despacho';
              }
              if (value && typeof value === 'string' && Array.isArray(ALL_REGIONS) && !ALL_REGIONS.includes(value)) {
                return 'Región inválida';
              }
              return true;
            }),
        },
        {
          name: 'comuna',
          title: 'Comuna',
          type: 'string',
          description: 'Ingrese la comuna de despacho',
          // Nota: Sanity no soporta bien funciones en options.list para campos anidados,
          // por lo que usamos un input de texto con validación
          validation: (Rule) =>
            Rule.custom((value, context) => {
              // Obtener el documento padre para acceder a requiresShipping
              const document = context.document as any;
              const requiresShipping = document?.requiresShipping;
              
              // Obtener la región del objeto shippingAddress (context.parent es shippingAddress)
              const shippingAddress = context.parent as any;
              const region = shippingAddress?.region;
              
              if (requiresShipping && !value) {
                return 'Comuna es requerida para despacho';
              }
              if (value && typeof value === 'string' && region && typeof region === 'string' && Array.isArray(CHILE_REGIONS)) {
                const regionData = CHILE_REGIONS.find((r) => r.name === region);
                if (regionData && Array.isArray(regionData.communes) && !regionData.communes.includes(value)) {
                  return `Comuna "${value}" no pertenece a la región "${region}". Comunas válidas: ${regionData.communes.slice(0, 5).join(', ')}...`;
                }
              }
              return true;
            }),
        },
        {
          name: 'address',
          title: 'Dirección',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const requiresShipping = (context.parent as any)?.requiresShipping;
              if (requiresShipping && !value) {
                return 'Dirección es requerida para despacho';
              }
              return true;
            }),
        },
        {
          name: 'number',
          title: 'Número',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const requiresShipping = (context.parent as any)?.requiresShipping;
              if (requiresShipping && !value) {
                return 'Número es requerido para despacho';
              }
              return true;
            }),
        },
        {
          name: 'details',
          title: 'Detalles Adicionales (Opcional)',
          type: 'text',
          rows: 3,
          description: 'Referencias adicionales, departamento, etc.',
        },
        {
          name: 'contactEmail',
          title: 'Email de Contacto para Despacho',
          type: 'string',
          description: 'Email para coordinar el envío con Starken',
          validation: (Rule: any) =>
            Rule.custom((value: any, context: any) => {
              const document = context.document as any;
              if (document?.requiresShipping && !value) {
                return 'Email de contacto es requerido para despacho';
              }
              if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Email inválido';
              }
              return true;
            }),
        },
        {
          name: 'phone',
          title: 'Teléfono de Contacto',
          type: 'string',
          description: 'Número de teléfono para coordinar el despacho',
          validation: (Rule: any) =>
            Rule.custom((value: any, context: any) => {
              const document = context.document as any;
              if (document?.requiresShipping && !value) {
                return 'Teléfono es requerido para despacho';
              }
              return true;
            }),
        },
        {
          name: 'rut',
          title: 'RUT del Destinatario',
          type: 'string',
          description: 'RUT chileno del destinatario (requerido por Starken)',
          validation: (Rule: any) =>
            Rule.custom((value: any, context: any) => {
              const document = context.document as any;
              if (document?.requiresShipping && !value) {
                return 'RUT es requerido para despacho';
              }
              return true;
            }),
        },
      ],
    }),
  ],
  preview: {
    select: {
      orderId: 'orderId',
      customerName: 'customerName',
      customerEmail: 'customerEmail',
      total: 'total',
      currency: 'currency',
      status: 'paymentStatus',
      isGift: 'isGift',
      recipientName: 'recipientName',
      recipientEmail: 'recipientEmail',
      requiresShipping: 'requiresShipping',
    },
    prepare({ orderId, customerName, customerEmail, total, currency, status, isGift, recipientName, recipientEmail, requiresShipping }) {
      const statusLabels: Record<number, string> = {
        1: '⏳ Pendiente',
        2: '✅ Pagado',
        3: '❌ Rechazado',
        4: '🚫 Anulado',
      };

      const giftLabel = isGift ? ` 🎁 Regalo para: ${recipientName || recipientEmail || 'Sin destinatario'}` : '';
      const shippingLabel = requiresShipping ? ' 🚚 Despacho' : '';

      return {
        title: `${orderId || 'Sin ID'}${isGift ? ' 🎁' : ''}${shippingLabel}`,
        subtitle: `${customerName || customerEmail || 'Sin cliente'}${giftLabel} • ${statusLabels[status as number] || 'Desconocido'} • ${total ? `$${total.toLocaleString('es-CL')} ${currency}` : 'Sin monto'}`,
      };
    },
  },
  orderings: [
    {
      title: 'Fecha de Creación (Más reciente)',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Fecha de Creación (Más antigua)',
      name: 'createdAtAsc',
      by: [{ field: 'createdAt', direction: 'asc' }],
    },
    {
      title: 'Estado del Pago',
      name: 'paymentStatus',
      by: [{ field: 'paymentStatus', direction: 'asc' }],
    },
  ],
});

