import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readFile } from "fs/promises";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

const LOGO_CID = "altessa-logo";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let cachedLogoBase64: string | null = null;
let logoLoadAttempted = false;

async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64 || logoLoadAttempted) {
    return cachedLogoBase64;
  }

  logoLoadAttempted = true;
  try {
    const logoPath = path.join(process.cwd(), "public", "altessa-logo.svg");
    const file = await readFile(logoPath);
    cachedLogoBase64 = file.toString("base64");
    return cachedLogoBase64;
  } catch (error) {
    console.warn("[CONTACT_EMAIL] No se pudo cargar altessa-logo.svg:", error);
    cachedLogoBase64 = null;
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(payload: {
  name: string;
  emailDisplay: string;
  emailRaw: string;
  phone: string;
  subject: string;
  message: string;
  logoCid?: string;
}): string {
  const { name, emailDisplay, emailRaw, phone, subject, message, logoCid } = payload;

  const logoBlock = logoCid
    ? `<img src="cid:${logoCid}" alt="Altessa" width="180" style="display:block;margin:0 auto 28px auto;" />`
    : "<div style=\"font-size:32px;font-weight:700;color:#f6f3e5;text-align:center;margin-bottom:28px;\">Altessa</div>";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Consulta Altessa</title>
  </head>
  <body style="margin:0;background-color:#050505;color:#f6f3e5;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="max-width:720px;background:linear-gradient(135deg,#080808 0%,#121212 100%);border-radius:28px;border:1px solid rgba(213,170,59,0.3);overflow:hidden;box-shadow:0 24px 60px rgba(213,170,59,0.18);">
            <tr>
              <td style="padding:40px 40px 24px 40px;background:radial-gradient(circle at top,#1c1c1c 0%,transparent 70%);">
                ${logoBlock}
                <h1 style="margin:0;font-size:32px;line-height:1.2;font-weight:600;text-align:center;color:#f6f3e5;">Nueva consulta para el equipo Altessa</h1>
                <p style="margin:16px auto 0 auto;max-width:520px;text-align:center;font-size:15px;line-height:1.6;color:rgba(246,243,229,0.78);">Un cliente dejo sus datos desde el formulario web. Te compartimos el resumen para que puedas responder con la distincion Altessa.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px 40px;">
                <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="background-color:#0c0c0c;border-radius:20px;border:1px solid rgba(213,170,59,0.2);overflow:hidden;">
                  <tr>
                    <td style="padding:28px 32px;border-bottom:1px solid rgba(213,170,59,0.15);">
                      <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:top;width:48%;padding-right:16px;">
                            <p style="margin:0;font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#d5aa3b;">Nombre</p>
                            <p style="margin:8px 0 0 0;font-size:18px;color:#f6f3e5;">${name}</p>
                          </td>
                          <td style="vertical-align:top;width:52%;padding-left:16px;border-left:1px solid rgba(213,170,59,0.15);">
                            <p style="margin:0;font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#d5aa3b;">Correo</p>
                            <p style="margin:8px 0 0 0;font-size:18px;color:#f6f3e5;">${emailDisplay}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 32px;border-bottom:1px solid rgba(213,170,59,0.15);">
                      <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:top;width:48%;padding-right:16px;">
                            <p style="margin:0;font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#d5aa3b;">Telefono</p>
                            <p style="margin:8px 0 0 0;font-size:16px;color:rgba(246,243,229,0.85);">${phone}</p>
                          </td>
                          <td style="vertical-align:top;width:52%;padding-left:16px;border-left:1px solid rgba(213,170,59,0.15);">
                            <p style="margin:0;font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#d5aa3b;">Asunto</p>
                            <p style="margin:8px 0 0 0;font-size:16px;color:rgba(246,243,229,0.85);">${subject}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px;">
                      <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#d5aa3b;">Mensaje</p>
                      <div style="margin:0;font-size:16px;line-height:1.7;color:#f6f3e5;">${message}</div>
                    </td>
                  </tr>
                </table>

                <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;background:linear-gradient(135deg,rgba(213,170,59,0.16),rgba(213,170,59,0.05));border-radius:18px;border:1px solid rgba(213,170,59,0.35);">
                  <tr>
                    <td style="padding:24px 28px;">
                      <p style="margin:0 0 10px 0;font-size:13px;letter-spacing:0.28em;text-transform:uppercase;color:#d5aa3b;">Siguiente paso sugerido</p>
                      <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(246,243,229,0.82);">
                        Respondé directamente a <a href="mailto:${emailRaw}" style="color:#f6f3e5;text-decoration:none;font-weight:600;">${emailDisplay}</a>. Incluí una propuesta personalizada y, si corresponde, coordiná una videollamada o visita al atelier Altessa.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px 40px;">
                <p style="margin:0;text-align:center;font-size:11px;color:rgba(246,243,229,0.45);letter-spacing:0.22em;text-transform:uppercase;">
                  Altessa - Guardianes del tiempo
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Mail service not configured. Please set RESEND_API_KEY." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const subjectInput = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nombre, correo y mensaje son obligatorios." },
        { status: 400 },
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ingresa un correo electronico valido." },
        { status: 400 },
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "El mensaje es demasiado largo (maximo 2000 caracteres)." },
        { status: 400 },
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return NextResponse.json(
        { error: "ADMIN_EMAIL no esta configurado en el servidor." },
        { status: 500 },
      );
    }

    const sanitizedSubject = subjectInput.replace(/[\r\n]+/g, " ").slice(0, 120);
    const nameForSubject = name.replace(/[\r\n]+/g, " ").slice(0, 60) || "cliente Altessa";
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "No proporcionado");
    const safeSubject = escapeHtml(sanitizedSubject || "Consulta desde el sitio web");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const logoBase64 = await loadLogoBase64();
    const attachments = logoBase64
      ? [
          {
            filename: "altessa-logo.svg",
            content: logoBase64,
            contentType: "image/svg+xml",
            disposition: "inline" as const,
            cid: LOGO_CID,
            encoding: "base64",
          },
        ]
      : undefined;

    const emailSubject = sanitizedSubject
      ? `Consulta - ${sanitizedSubject}`
      : `Nueva consulta de ${nameForSubject}`;

    await resend.emails.send({
      from: "Altessa Consulta <onboarding@resend.dev>",
      to: adminEmail,
      replyTo: email,
      subject: emailSubject,
      html: buildHtml({
        name: safeName,
        emailDisplay: safeEmail,
        emailRaw: email,
        phone: safePhone,
        subject: safeSubject,
        message: safeMessage,
        logoCid: logoBase64 ? LOGO_CID : undefined,
      }),
      attachments,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[CONTACT_FORM_ERROR]", error);
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje. Intenta nuevamente en unos minutos." },
      { status: 500 },
    );
  }
}





