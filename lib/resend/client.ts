/**
 * Cliente para Resend
 * Envío de emails de confirmación y notificaciones
 */

import 'server-only';
import { Resend } from 'resend';
import { getTelLink, getFormattedPhoneNumber } from '@/lib/config/contact';
import { formatDateLong, formatWorkshopDateFull } from '@/lib/sanity/utils';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hola@comoelmusguito.cl';

if (!RESEND_API_KEY) {
  console.warn('RESEND_API_KEY no está configurada. Los emails no se enviarán.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export interface EmailOrderItem {
  name: string;
  type: 'terrarium' | 'course' | 'workshop' | 'supply';
  quantity: number;
  price: number;
  currency: string;
  image?: string;
  slug?: string;
  selectedDate?: {
    // Único ISO que necesitamos. La hora/fecha en zona Chile se computa en render.
    date: string;
  };
}

export interface EmailOrderData {
  orderId: string;
  flowOrder?: string;
  customerName?: string;
  customerEmail: string;
  items: EmailOrderItem[];
  total: number;
  currency: string;
  paymentDate: string;
  flowInvoiceUrl?: string;
  hasAccount?: boolean; // Si el usuario tiene cuenta registrada
  isGift?: boolean; // Si el pedido es un regalo
  recipientName?: string; // Nombre del destinatario del regalo
  recipientEmail?: string; // Email del destinatario del regalo
  giftMessage?: string; // Mensaje personalizado del regalo
  requiresShipping?: boolean; // Si el pedido requiere despacho
  shippingAddress?: {
    region: string;
    comuna: string;
    address: string;
    number: string;
    details?: string;
  };
}

export interface GiftEmailData {
  giftToken: string;
  recipientName?: string;
  recipientEmail: string;
  senderName?: string;
  senderEmail: string;
  giftMessage?: string;
  items: EmailOrderItem[];
  orderId: string;
  requiresShipping?: boolean;
  shippingAddress?: {
    region: string;
    comuna: string;
    address: string;
    number: string;
    details?: string;
  };
}

/**
 * Enviar email de confirmación de compra
 */
export async function sendOrderConfirmationEmail(data: EmailOrderData): Promise<void> {
  if (!resend) {
    console.warn('Resend no está configurado. Email no enviado.');
    return;
  }

  try {
    const { html, subject } = generateOrderConfirmationEmail(data);

    await resend.emails.send({
      from: `comoelmusguito <${RESEND_FROM_EMAIL}>`,
      to: data.customerEmail,
      subject,
      html,
    });

    console.log(`Email de confirmación enviado a ${data.customerEmail} para orden ${data.orderId}`);
  } catch (error) {
    console.error('Error enviando email de confirmación:', error);
    throw error;
  }
}

/**
 * Generar HTML del email de confirmación
 */
function generateOrderConfirmationEmail(data: EmailOrderData): { html: string; subject: string } {
  const subject = data.isGift 
    ? `¡Tu regalo en comoelmusguito está confirmado! 🎁`
    : `¡Tu compra en comoelmusguito está confirmada! 🌱`;

  // Agrupar items por tipo para mostrar mensajes específicos
  const terrarios = data.items.filter((item) => item.type === 'terrarium');
  const cursos = data.items.filter((item) => item.type === 'course');
  const talleres = data.items.filter((item) => item.type === 'workshop');
  const insumos = data.items.filter((item) => item.type === 'supply');

  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'CLP') {
      return `$${amount.toLocaleString('es-CL')} CLP`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Compra</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0; color: #2d3e2d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a7c59 0%, #6b9f7a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">
                🌱 comoelmusguito
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Saludo -->
              <h2 style="margin: 0 0 20px 0; color: #2d3e2d; font-size: 24px; font-weight: 600;">
                ¡Tu compra está confirmada!
              </h2>
              
              <p style="margin: 0 0 30px 0; color: #5a5a5a; font-size: 16px; line-height: 1.6;">
                Hola${data.customerName ? ` ${data.customerName}` : ''},
              </p>
              
              <p style="margin: 0 0 30px 0; color: #5a5a5a; font-size: 16px; line-height: 1.6;">
                ${data.isGift 
                  ? 'Gracias por crear vida con nosotros. Tu regalo está confirmado y el destinatario recibirá un email con los detalles.'
                  : 'Gracias por crear vida con nosotros. Tu pedido está confirmado y estamos preparando todo para ti.'}
              </p>

              ${data.isGift ? `
              <!-- Información del Regalo -->
              <div style="background-color: #FDFAF6; border: 2px solid rgba(45, 80, 22, 0.3); border-radius: 12px; padding: 24px; margin: 30px 0;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <span style="font-size: 24px;">🎁</span>
                  <h3 style="margin: 0; color: #1A1F16; font-size: 18px; font-weight: 600;">
                    Este pedido es un regalo
                  </h3>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0 0 4px 0; color: #6B7566; font-size: 14px; font-weight: 500;">
                    Destinatario:
                  </p>
                  <p style="margin: 0; color: #1A1F16; font-size: 15px; font-weight: 600;">
                    ${data.recipientName || 'Sin nombre'} ${data.recipientEmail ? `(${data.recipientEmail})` : ''}
                  </p>
                </div>
                ${data.giftMessage ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(45, 80, 22, 0.2);">
                  <p style="margin: 0 0 4px 0; color: #6B7566; font-size: 14px; font-weight: 500;">
                    Tu mensaje:
                  </p>
                  <p style="margin: 0; color: #1A1F16; font-size: 14px; font-style: italic; line-height: 1.6; white-space: pre-wrap;">
                    "${data.giftMessage}"
                  </p>
                </div>
                ` : ''}
                <p style="margin: 16px 0 0 0; color: #6B7566; font-size: 13px; line-height: 1.5;">
                  El destinatario recibirá un email con los detalles del regalo y un código para canjearlo.
                </p>
              </div>
              ` : ''}

              <!-- Resumen de Orden -->
              <div style="background-color: #f9f9f4; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #2d3e2d; font-size: 18px; font-weight: 600;">
                  Resumen de tu Compra
                </h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 8px 0; color: #5a5a5a; font-size: 14px;">Número de Orden:</td>
                    <td align="right" style="padding: 8px 0; color: #2d3e2d; font-weight: 600; font-size: 14px;">${data.orderId}</td>
                  </tr>
                  ${data.flowOrder ? `
                  <tr>
                    <td style="padding: 8px 0; color: #5a5a5a; font-size: 14px;">Orden Flow:</td>
                    <td align="right" style="padding: 8px 0; color: #2d3e2d; font-weight: 600; font-size: 14px;">${data.flowOrder}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #5a5a5a; font-size: 14px;">Fecha:</td>
                    <td align="right" style="padding: 8px 0; color: #2d3e2d; font-weight: 600; font-size: 14px;">${formatDateLong(data.paymentDate)}</td>
                  </tr>
                </table>

                <div style="border-top: 2px solid #e8e8e3; padding-top: 20px; margin-top: 20px;">
                  <h4 style="margin: 0 0 16px 0; color: #2d3e2d; font-size: 16px; font-weight: 600;">
                    Productos
                  </h4>
                  
                  ${data.items.map((item) => `
                    <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e8e8e3;">
                      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div style="flex: 1;">
                          <p style="margin: 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">${item.name}</p>
                          <p style="margin: 4px 0 0 0; color: #5a5a5a; font-size: 13px;">
                            ${item.type === 'terrarium' ? '🌿 Terrario' : item.type === 'course' ? '🎓 Curso Online' : item.type === 'workshop' ? '🤝 Taller Presencial' : '🛠️ Insumo'}
                            ${item.quantity > 1 ? ` • Cantidad: ${item.quantity}` : ''}
                          </p>
                          ${item.selectedDate ? `
                            <p style="margin: 4px 0 0 0; color: #4a7c59; font-size: 13px; font-weight: 500;">
                              📅 ${formatWorkshopDateFull(item.selectedDate.date)}
                            </p>
                          ` : ''}
                        </div>
                        <div style="text-align: right;">
                          <p style="margin: 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                            ${formatPrice(item.price * item.quantity, item.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                  
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #4a7c59;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="color: #2d3e2d; font-size: 18px; font-weight: 600;">Total:</span>
                      <span style="color: #2d3e2d; font-size: 20px; font-weight: 700;">${formatPrice(data.total, data.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              ${!data.isGift ? `
              <!-- Próximos Pasos -->
              <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 16px 0; color: #2d3e2d; font-size: 18px; font-weight: 600;">
                  Próximos Pasos
                </h3>
                
                ${terrarios.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🌿 Para tus Terrarios:
                  </p>
                  <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    ${terrarios.some((t) => t.selectedDate) 
                      ? 'Te contactaremos pronto para coordinar el retiro de tu terrario.'
                      : 'Te contactaremos en las próximas 24 horas para coordinar el retiro de tu terrario. Si tienes alguna pregunta, puedes escribirnos directamente.'}
                  </p>
                </div>
                ` : ''}
                
                ${cursos.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🎓 Para tus Cursos Online:
                  </p>
                  <p style="margin: 0 0 12px 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    ${data.hasAccount 
                      ? 'Tu acceso al curso está activo. Ya puedes acceder a tus cursos desde tu cuenta.'
                      : 'Para acceder a tus cursos online, necesitas crear una cuenta. Es rápido y te permitirá ver tu progreso, descargar materiales y acceder desde cualquier dispositivo.'}
                  </p>
                  ${data.hasAccount ? `
                    <div style="text-align: center; margin: 16px 0 0 0;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl'}/mi-cuenta?tab=cursos" 
                         style="display: inline-block; background-color: #4a7c59; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Ir a Mis Cursos →
                      </a>
                    </div>
                  ` : `
                    <div style="background-color: #fff9e6; border: 2px solid #ffd700; border-radius: 8px; padding: 12px; margin: 12px 0;">
                      <p style="margin: 0; color: #856404; font-size: 13px; font-weight: 600; text-align: center; line-height: 1.5;">
                        ⚠️ Importante: Crea tu cuenta usando el mismo email con el que compraste (${data.customerEmail}) para que tus cursos se vinculen automáticamente.
                      </p>
                    </div>
                    <div style="text-align: center; margin: 16px 0 0 0;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl'}/auth/register" 
                         style="display: inline-block; background-color: #4a7c59; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-right: 8px;">
                        Crear mi Cuenta →
                      </a>
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl'}/auth/login" 
                         style="display: inline-block; background-color: transparent; color: #4a7c59; padding: 12px 24px; border: 2px solid #4a7c59; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Ya tengo cuenta
                      </a>
                    </div>
                  `}
                </div>
                ` : ''}
                
                ${talleres.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🤝 Para tus Talleres:
                  </p>
                  <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    Tu cupo está confirmado. Te esperamos en el taller en la fecha y hora que seleccionaste. 
                    ${talleres[0].selectedDate ? `Recuerda: ${formatWorkshopDateFull(talleres[0].selectedDate.date)}.` : ''}
                  </p>
                  <p style="margin: 12px 0 0 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    <strong>Ubicación:</strong> Santa Isabel 676, Providencia, Santiago
                  </p>
                </div>
                ` : ''}

                ${insumos.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🛠️ Para tus Insumos:
                  </p>
                  <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    ${data.requiresShipping 
                      ? 'Te contactaremos en las próximas 24 horas para coordinar el despacho de tus insumos.'
                      : 'Te contactaremos en las próximas 24 horas para coordinar el retiro o envío de tus insumos.'}
                  </p>
                </div>
                ` : ''}

                ${data.requiresShipping && data.shippingAddress ? `
                <div style="background-color: #fff9e6; border-left: 4px solid #ffd700; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 12px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🚚 Dirección de Despacho:
                  </p>
                  <p style="margin: 0 0 8px 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    <strong>${data.shippingAddress.address} ${data.shippingAddress.number}</strong><br>
                    ${data.shippingAddress.comuna}, ${data.shippingAddress.region}${data.shippingAddress.details ? `<br>${data.shippingAddress.details}` : ''}
                  </p>
                  <p style="margin: 12px 0 0 0; color: #856404; font-size: 13px; line-height: 1.6; font-weight: 500;">
                    ⚠️ Comoelmusguito te contactará después de la compra para coordinar el costo y fecha de envío. El despacho solo está disponible dentro de Chile.
                  </p>
                </div>
                ` : ''}
              </div>
              ` : ''}

              ${data.flowInvoiceUrl ? `
              <!-- Link a Boleta -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.flowInvoiceUrl}" 
                   style="display: inline-block; background-color: #4a7c59; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Ver Boleta en Flow →
                </a>
              </div>
              ` : ''}

              <!-- Footer -->
              <div style="border-top: 1px solid #e8e8e3; padding-top: 30px; margin-top: 40px; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                  Si tienes alguna pregunta, no dudes en escribirnos.
                </p>
                <p style="margin: 0; color: #2d3e2d; font-size: 14px; font-weight: 600;">
                  Con cariño,<br>
                  Tomás Barrera<br>
                  <span style="color: #4a7c59;">comoelmusguito</span>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Background -->
          <tr>
            <td style="background-color: #f9f9f4; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #5a5a5a; font-size: 12px;">
                Este email fue enviado a ${data.customerEmail}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { html, subject };
}

/**
 * Enviar email de verificación de cuenta
 */
export async function sendVerificationEmail(
  email: string,
  name: string | undefined,
  verificationToken: string
): Promise<void> {
  if (!resend) {
    console.warn('Resend no está configurado. Email no enviado.');
    return;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const verificationUrl = `${siteUrl}/api/auth/verify-email?token=${verificationToken}`;

    const { html, subject } = generateVerificationEmail(name || email, verificationUrl);

    await resend.emails.send({
      from: `comoelmusguito <${RESEND_FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Email de verificación enviado a ${email}`);
  } catch (error) {
    console.error('Error enviando email de verificación:', error);
    throw error;
  }
}

/**
 * Generar HTML del email de verificación
 */
function generateVerificationEmail(
  name: string,
  verificationUrl: string
): { html: string; subject: string } {
  const subject = `Verifica tu cuenta en comoelmusguito 🌿`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0; color: #2d3e2d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a7c59 0%, #6b9f7a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">
                🌱 comoelmusguito
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <h2 style="margin: 0 0 20px 0; color: #2d3e2d; font-size: 24px; font-weight: 600;">
                ¡Bienvenido a comoelmusguito!
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #5a5a5a; font-size: 16px; line-height: 1.6;">
                Hola${name ? ` ${name}` : ''},
              </p>
              
              <p style="margin: 0 0 30px 0; color: #5a5a5a; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte. Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de email haciendo clic en el botón de abajo.
              </p>

              <!-- Botón de Verificación -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background-color: #4a7c59; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Verificar mi Email
                </a>
              </div>

              <p style="margin: 30px 0 0 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #4a7c59; font-size: 13px; word-break: break-all;">
                ${verificationUrl}
              </p>

              <p style="margin: 30px 0 0 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                Este enlace expirará en 48 horas. Si no verificas tu cuenta en ese tiempo, deberás registrarte nuevamente.
              </p>

              <!-- Footer -->
              <div style="border-top: 1px solid #e8e8e3; padding-top: 30px; margin-top: 40px; text-align: center;">
                <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                  Si no creaste esta cuenta, puedes ignorar este email.
                </p>
                <p style="margin: 12px 0 0 0; color: #2d3e2d; font-size: 14px; font-weight: 600;">
                  Con cariño,<br>
                  Tomás Barrera<br>
                  <span style="color: #4a7c59;">comoelmusguito</span>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Background -->
          <tr>
            <td style="background-color: #f9f9f4; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #5a5a5a; font-size: 12px;">
                Este email fue enviado para verificar tu cuenta
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { html, subject };
}

/**
 * Enviar email de reset de contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string | undefined,
  resetToken: string,
  isInitializing: boolean = false
): Promise<void> {
  if (!resend) {
    console.warn('Resend no está configurado. Email no enviado.');
    return;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetUrl = `${siteUrl}/auth/reset-password?token=${resetToken}`;

    const { html, subject } = generatePasswordResetEmail(name || email, resetUrl, isInitializing);

    await resend.emails.send({
      from: `comoelmusguito <${RESEND_FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Email de reset de contraseña enviado a ${email}`);
  } catch (error) {
    console.error('Error enviando email de reset de contraseña:', error);
    throw error;
  }
}

/**
 * Generar HTML del email de reset de contraseña
 */
function generatePasswordResetEmail(
  name: string,
  resetUrl: string,
  isInitializing: boolean = false
): { html: string; subject: string } {
  const subject = isInitializing
    ? `Crea tu contraseña - comoelmusguito 🌿`
    : `Restablece tu contraseña - comoelmusguito 🌿`;

  const heading = isInitializing
    ? 'Crea tu contraseña'
    : 'Restablece tu contraseña';

  const intro = isInitializing
    ? 'Tu cuenta se creó iniciando sesión con Google. Estás a punto de crear una contraseña por primera vez para también poder iniciar sesión con tu email y contraseña. Podrás seguir usando Google si quieres.'
    : 'Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, puedes ignorar este email de forma segura.';

  const ctaLabel = isInitializing ? 'Crear Contraseña' : 'Restablecer Contraseña';
  const footerNote = isInitializing
    ? 'Este email fue enviado para crear la contraseña de tu cuenta'
    : 'Este email fue enviado para restablecer tu contraseña';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0; color: #2d3e2d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a7c59 0%, #6b9f7a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">
                🌱 comoelmusguito
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <h2 style="margin: 0 0 20px 0; color: #2d3e2d; font-size: 24px; font-weight: 600;">
                ${heading}
              </h2>

              <p style="margin: 0 0 20px 0; color: #5a5a5a; font-size: 16px; line-height: 1.6;">
                Hola${name ? ` ${name}` : ''},
              </p>

              <p style="margin: 0 0 30px 0; color: #5a5a5a; font-size: 16px; line-height: 1.6;">
                ${intro}
              </p>

              <!-- Botón de Reset -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}"
                   style="display: inline-block; background-color: #4a7c59; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  ${ctaLabel}
                </a>
              </div>

              <p style="margin: 30px 0 0 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #4a7c59; font-size: 13px; word-break: break-all;">
                ${resetUrl}
              </p>

              <p style="margin: 30px 0 0 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                Este enlace expirará en 1 hora por seguridad.
              </p>

              <!-- Footer -->
              <div style="border-top: 1px solid #e8e8e3; padding-top: 30px; margin-top: 40px; text-align: center;">
                <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                  Si no solicitaste este cambio, puedes ignorar este email de forma segura.
                </p>
                <p style="margin: 12px 0 0 0; color: #2d3e2d; font-size: 14px; font-weight: 600;">
                  Con cariño,<br>
                  Tomás Barrera<br>
                  <span style="color: #4a7c59;">comoelmusguito</span>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Background -->
          <tr>
            <td style="background-color: #f9f9f4; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #5a5a5a; font-size: 12px;">
                ${footerNote}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { html, subject };
}

/**
 * Enviar email de contacto desde formulario
 */
export async function sendContactEmail(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (!resend) {
    throw new Error('Resend no está configurado');
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hola@comoelmusguito.cl';
  const toEmail = process.env.CONTACT_EMAIL || 'hola@comoelmusguito.cl';

  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: data.email,
    subject: `[Contacto] ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #f5f5dc; margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
          </div>
          
          <div style="background: #f5f5dc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2d5016; margin-top: 0; font-size: 20px;">Información del Contacto</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600; width: 120px;">Nombre:</td>
                  <td style="padding: 8px 0; color: #333;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">
                    <a href="mailto:${data.email}" style="color: #4a7c2a; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600;">Teléfono:</td>
                  <td style="padding: 8px 0; color: #333;">
                    <a href="tel:${data.phone}" style="color: #4a7c2a; text-decoration: none;">${data.phone}</a>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 600;">Asunto:</td>
                  <td style="padding: 8px 0; color: #333;">${data.subject}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2d5016; margin-top: 0; font-size: 20px;">Mensaje</h2>
              <div style="color: #333; white-space: pre-wrap; line-height: 1.8;">${data.message}</div>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                Puedes responder directamente a este email para contactar a ${data.name}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  // También enviar confirmación al usuario
  await resend.emails.send({
    from: fromEmail,
    to: data.email,
    subject: 'Hemos recibido tu mensaje - Como el Musguito',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #f5f5dc; margin: 0; font-size: 24px;">¡Hola ${data.name}!</h1>
          </div>
          
          <div style="background: #f5f5dc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 16px; margin-top: 0;">
              Hemos recibido tu mensaje sobre: <strong>${data.subject}</strong>
            </p>
            
            <p style="color: #333; font-size: 16px;">
              Te responderemos lo antes posible, generalmente en un plazo de 24-48 horas hábiles.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;"><strong>Tu mensaje:</strong></p>
              <p style="color: #333; font-size: 14px; white-space: pre-wrap; margin: 0;">${data.message}</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;"><strong>¿Necesitas contactarnos urgentemente?</strong></p>
              <p style="color: #333; font-size: 14px; margin: 0;">
                Teléfono: <a href="${getTelLink()}" style="color: #4a7c2a; text-decoration: none;">${getFormattedPhoneNumber()}</a><br>
                Email: <a href="mailto:hola@comoelmusguito.cl" style="color: #4a7c2a; text-decoration: none;">hola@comoelmusguito.cl</a>
              </p>
            </div>

            <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                Gracias por contactarnos,<br>
                <strong style="color: #2d5016;">El equipo de Como el Musguito</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Enviar email de regalo al destinatario
 */
export async function sendGiftEmail(data: GiftEmailData): Promise<void> {
  if (!resend) {
    console.warn('Resend no está configurado. Email de regalo no enviado.');
    return;
  }

  try {
    const { html, subject } = generateGiftEmail(data);

    await resend.emails.send({
      from: `comoelmusguito <${RESEND_FROM_EMAIL}>`,
      to: data.recipientEmail,
      subject,
      html,
    });

    console.log(`Email de regalo enviado a ${data.recipientEmail} para orden ${data.orderId}`);
  } catch (error) {
    console.error('Error enviando email de regalo:', error);
    throw error;
  }
}

/**
 * Generar HTML del email de regalo
 */
function generateGiftEmail(data: GiftEmailData): { html: string; subject: string } {
  const subject = `¡Tienes un regalo de ${data.senderName || 'alguien especial'}! 🎁`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl';
  const redeemUrl = `${baseUrl}/mi-cuenta`;

  // Agrupar items por tipo
  const cursos = data.items.filter((item) => item.type === 'course');
  const talleres = data.items.filter((item) => item.type === 'workshop');
  const terrarios = data.items.filter((item) => item.type === 'terrarium');
  const insumos = data.items.filter((item) => item.type === 'supply');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Tienes un Regalo!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0; color: #2d3e2d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header con gradiente especial para regalo -->
          <tr>
            <td style="background: linear-gradient(135deg, #2D5016 0%, #3D6B22 50%, #6B9362 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">
                🎁 ¡Tienes un Regalo!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Saludo -->
              <h2 style="margin: 0 0 20px 0; color: #1A1F16; font-size: 24px; font-weight: 600;">
                ¡Hola${data.recipientName ? ` ${data.recipientName}` : ''}!
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #6B7566; font-size: 16px; line-height: 1.6;">
                <strong>${data.senderName || data.senderEmail}</strong> te ha enviado un regalo especial:
              </p>

              ${data.giftMessage ? `
              <!-- Mensaje Personalizado -->
              <div style="background-color: #FDFAF6; border-left: 4px solid #D4A574; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; color: #1A1F16; font-size: 15px; font-style: italic; line-height: 1.6; white-space: pre-wrap;">"${data.giftMessage}"</p>
              </div>
              ` : ''}

              <!-- Resumen del Regalo -->
              <div style="background-color: #FDFAF6; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #1A1F16; font-size: 18px; font-weight: 600;">
                  Tu Regalo
                </h3>
                
                ${cursos.length > 0 ? `
                <div style="margin-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; color: #2D5016; font-size: 16px; font-weight: 600;">📚 Cursos Online:</h4>
                  ${cursos.map((item) => `
                    <p style="margin: 4px 0; color: #1A1F16; font-size: 14px;">• ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}</p>
                  `).join('')}
                </div>
                ` : ''}

                ${talleres.length > 0 ? `
                <div style="margin-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; color: #2D5016; font-size: 16px; font-weight: 600;">🎨 Talleres:</h4>
                  ${talleres.map((item) => `
                    <p style="margin: 4px 0; color: #1A1F16; font-size: 14px;">• ${item.name}${item.selectedDate ? ` - ${formatDateLong(item.selectedDate.date)}` : ''}${item.quantity > 1 ? ` x${item.quantity}` : ''}</p>
                  `).join('')}
                </div>
                ` : ''}

                ${terrarios.length > 0 ? `
                <div style="margin-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; color: #2D5016; font-size: 16px; font-weight: 600;">🌿 Terrarios:</h4>
                  ${terrarios.map((item) => `
                    <p style="margin: 4px 0; color: #1A1F16; font-size: 14px;">• ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}</p>
                  `).join('')}
                </div>
                ` : ''}

                ${insumos.length > 0 ? `
                <div style="margin-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; color: #2D5016; font-size: 16px; font-weight: 600;">🛠️ Insumos:</h4>
                  ${insumos.map((item) => `
                    <p style="margin: 4px 0; color: #1A1F16; font-size: 14px;">• ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}</p>
                  `).join('')}
                </div>
                ` : ''}
              </div>

              ${data.requiresShipping && data.shippingAddress ? `
              <!-- Información de Despacho -->
              <div style="background-color: #fff9e6; border-left: 4px solid #ffd700; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 12px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                  🚚 Dirección de Despacho:
                </p>
                <p style="margin: 0 0 8px 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                  <strong>${data.shippingAddress.address} ${data.shippingAddress.number}</strong><br>
                  ${data.shippingAddress.comuna}, ${data.shippingAddress.region}${data.shippingAddress.details ? `<br>${data.shippingAddress.details}` : ''}
                </p>
                <p style="margin: 12px 0 0 0; color: #856404; font-size: 13px; line-height: 1.6; font-weight: 500;">
                  ⚠️ Comoelmusguito te contactará después de canjear tu regalo para coordinar el costo y fecha de envío.
                </p>
              </div>
              ` : ''}

              <!-- Token de Canje -->
              <div style="background-color: #FDFAF6; border: 2px dashed #3D6B22; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #1A1F16; font-size: 14px; font-weight: 600;">
                  Tu código de regalo:
                </p>
                <div style="background-color: #ffffff; border: 2px solid #3D6B22; border-radius: 8px; padding: 16px; margin: 12px 0;">
                  <p style="margin: 0; color: #2D5016; font-size: 20px; font-weight: bold; font-family: monospace; letter-spacing: 2px;">
                    ${data.giftToken}
                  </p>
                </div>
                <p style="margin: 12px 0 0 0; color: #6B7566; font-size: 13px; line-height: 1.5;">
                  Guarda este código. Lo necesitarás para canjear tu regalo.
                </p>
              </div>

              <!-- Instrucciones -->
              <div style="background-color: rgba(107, 147, 98, 0.1); border: 1px solid rgba(61, 107, 34, 0.2); border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h4 style="margin: 0 0 12px 0; color: #1A1F16; font-size: 16px; font-weight: 600;">
                  ¿Cómo canjear tu regalo?
                </h4>
                <ol style="margin: 0; padding-left: 20px; color: #6B7566; font-size: 14px; line-height: 1.8;">
                  <li>Si ya tienes cuenta, inicia sesión en <a href="${baseUrl}/mi-cuenta" style="color: #2D5016; text-decoration: none; font-weight: 600;">Mi Cuenta</a></li>
                  <li>Haz clic en "Canjear Regalo" y pega el código</li>
                  <li>Si no tienes cuenta, <a href="${baseUrl}/auth/register" style="color: #2D5016; text-decoration: none; font-weight: 600;">crea una aquí</a> y luego canjea tu regalo</li>
                </ol>
              </div>

              <!-- Botón de Acción -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${redeemUrl}" 
                   style="display: inline-block; background-color: #2D5016; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Canjear mi Regalo →
                </a>
              </div>

              <!-- Próximos Pasos (para el destinatario después de canjear) -->
              <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 16px 0; color: #2d3e2d; font-size: 18px; font-weight: 600;">
                  Próximos Pasos
                </h3>
                
                ${terrarios.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🌿 Para tus Terrarios:
                  </p>
                  <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    ${terrarios.some((t) => t.selectedDate) 
                      ? 'Te contactaremos pronto para coordinar el retiro de tu terrario.'
                      : 'Te contactaremos en las próximas 24 horas para coordinar el retiro de tu terrario. Si tienes alguna pregunta, puedes escribirnos directamente.'}
                  </p>
                </div>
                ` : ''}
                
                ${cursos.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🎓 Para tus Cursos Online:
                  </p>
                  <p style="margin: 0 0 12px 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    Una vez que canjees tu regalo, tu acceso al curso estará activo. Podrás acceder a tus cursos desde tu cuenta y ver tu progreso, descargar materiales y acceder desde cualquier dispositivo.
                  </p>
                  <div style="text-align: center; margin: 16px 0 0 0;">
                    <a href="${baseUrl}/mi-cuenta?filter=courses" 
                       style="display: inline-block; background-color: #4a7c59; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                      Ir a Mis Cursos →
                    </a>
                  </div>
                </div>
                ` : ''}
                
                ${talleres.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🤝 Para tus Talleres:
                  </p>
                  <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    Tu cupo está confirmado. Te esperamos en el taller en la fecha y hora seleccionada. 
                    ${talleres[0].selectedDate ? `Recuerda: ${formatWorkshopDateFull(talleres[0].selectedDate.date)}.` : ''}
                  </p>
                  <p style="margin: 12px 0 0 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    <strong>Ubicación:</strong> Santa Isabel 676, Providencia, Santiago
                  </p>
                </div>
                ` : ''}

                ${insumos.length > 0 ? `
                <div style="background-color: #f0f7f2; border-left: 4px solid #4a7c59; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; color: #2d3e2d; font-weight: 600; font-size: 15px;">
                    🛠️ Para tus Insumos:
                  </p>
                  <p style="margin: 0; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    Te contactaremos en las próximas 24 horas para coordinar el retiro o envío de tus insumos.
                  </p>
                </div>
                ` : ''}
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid rgba(107, 117, 102, 0.2); padding-top: 30px; margin-top: 40px; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #6B7566; font-size: 14px; line-height: 1.6;">
                  Si tienes alguna pregunta, no dudes en escribirnos.
                </p>
                <p style="margin: 0; color: #1A1F16; font-size: 14px; font-weight: 600;">
                  Con cariño,<br>
                  Tomás Barrera<br>
                  <span style="color: #2D5016;">comoelmusguito</span>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Background -->
          <tr>
            <td style="background-color: #FDFAF6; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #6B7566; font-size: 12px;">
                Este email fue enviado a ${data.recipientEmail}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return { html, subject };
}

