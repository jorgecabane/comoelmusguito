/**
 * Schema: Order
 * Órdenes de compra
 */

import { defineField, defineType } from 'sanity';

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
  ],
  preview: {
    select: {
      orderId: 'orderId',
      customerName: 'customerName',
      customerEmail: 'customerEmail',
      total: 'total',
      currency: 'currency',
      status: 'paymentStatus',
    },
    prepare({ orderId, customerName, customerEmail, total, currency, status }) {
      const statusLabels: Record<number, string> = {
        1: '⏳ Pendiente',
        2: '✅ Pagado',
        3: '❌ Rechazado',
        4: '🚫 Anulado',
      };

      return {
        title: `${orderId || 'Sin ID'}`,
        subtitle: `${customerName || customerEmail || 'Sin cliente'} • ${statusLabels[status as number] || 'Desconocido'} • ${total ? `$${total.toLocaleString('es-CL')} ${currency}` : 'Sin monto'}`,
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

