/**
 * Sanity Document Action: Reembolsar orden y revocar accesos a cursos
 *
 * Cuando Tomás cambia paymentStatus a 5 (Reembolsado) desde Sanity Studio,
 * esta acción revoca automáticamente los courseAccess asociados a la orden.
 */

import { useClient } from 'sanity';
import { useState } from 'react';
import type { DocumentActionComponent } from 'sanity';

const REFUND_STATUS = 5;

export const refundOrderAction: DocumentActionComponent = (props) => {
  const { id, type, published } = props;
  const client = useClient({ apiVersion: '2024-01-01' });
  const [isRunning, setIsRunning] = useState(false);

  if (type !== 'order') return null;

  const currentStatus = published?.paymentStatus as number | undefined;

  // Only show the action if the order is paid (status 2)
  if (currentStatus !== 2) return null;

  return {
    label: 'Reembolsar y revocar accesos',
    tone: 'critical',
    onHandle: async () => {
      if (isRunning) return;

      const confirmed = window.confirm(
        'Esta acción cambiará el estado a "Reembolsado" y revocará los accesos a cursos de esta orden. ¿Continuar?'
      );

      if (!confirmed) return;

      setIsRunning(true);

      try {
        const orderId = published?.orderId as string;

        // 1. Revocar accesos a cursos asociados a esta orden
        const courseAccesses = await client.fetch<Array<{ _id: string }>>(
          `*[_type == "courseAccess" && order._ref == $orderRef]{ _id }`,
          { orderRef: id }
        );

        for (const access of courseAccesses) {
          await client.delete(access._id);
        }

        // 2. Actualizar orden a Reembolsado
        await client
          .patch(id)
          .set({
            paymentStatus: REFUND_STATUS,
            refundedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .commit();

        const revokedCount = courseAccesses.length;
        window.alert(
          `Orden ${orderId} reembolsada. ${revokedCount} acceso${revokedCount !== 1 ? 's' : ''} a curso${revokedCount !== 1 ? 's' : ''} revocado${revokedCount !== 1 ? 's' : ''}.`
        );
      } catch (error) {
        console.error('Error reembolsando orden:', error);
        window.alert('Error al reembolsar la orden. Revisa la consola.');
      } finally {
        setIsRunning(false);
      }
    },
  };
};
