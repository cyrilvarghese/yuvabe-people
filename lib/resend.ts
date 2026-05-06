import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENT = process.env.RECIPIENT_EMAIL ?? "arunkumar@yuvabe.com";

export type ApplicationEmailPayload = {
  candidateName: string;
  email: string;
  about: string;
  resumeUrl: string;
  skills: string[];
  jobTitle: string;
  jobCode: string;
};

export async function sendApplicationEmail(
  payload: ApplicationEmailPayload
): Promise<void> {
  const { candidateName, email, about, resumeUrl, skills, jobTitle, jobCode } =
    payload;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const atsUrl = `${appUrl}/jobs/${jobCode}`;

  await resend.emails.send({
    from: "Yuvabe ATS <onboarding@resend.dev>",
    to: RECIPIENT,
    subject: `New application — ${jobTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1A1815;">
        <p style="font-size:13px;color:#8A857B;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.12em;">
          New application · JOB-${jobCode}
        </p>
        <h2 style="margin:0 0 24px;font-size:22px;font-weight:600;">${jobTitle}</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #E5E0D5;font-size:12px;color:#8A857B;width:110px;text-transform:uppercase;letter-spacing:0.1em;">Candidate</td>
            <td style="padding:8px 0;border-bottom:1px solid #E5E0D5;font-size:14px;">${candidateName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #E5E0D5;font-size:12px;color:#8A857B;text-transform:uppercase;letter-spacing:0.1em;">Email</td>
            <td style="padding:8px 0;border-bottom:1px solid #E5E0D5;font-size:14px;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #E5E0D5;font-size:12px;color:#8A857B;text-transform:uppercase;letter-spacing:0.1em;">Skills</td>
            <td style="padding:8px 0;border-bottom:1px solid #E5E0D5;font-size:14px;">${skills.join(", ") || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;color:#8A857B;text-transform:uppercase;letter-spacing:0.1em;">Resume</td>
            <td style="padding:8px 0;font-size:14px;">
              ${resumeUrl
                ? `<a href="${resumeUrl}" style="color:#B8553A;text-decoration:none;">View resume PDF ↗</a>`
                : "<span style=\"color:#8A857B;\">Not provided</span>"}
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:#8A857B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">About</p>
        <p style="font-size:14px;line-height:1.6;color:#1A1815;margin:0 0 32px;white-space:pre-wrap;">${about}</p>

        <a href="${atsUrl}" style="display:inline-block;background:#B8553A;color:#FAF8F4;font-size:12px;font-family:monospace;text-transform:uppercase;letter-spacing:0.14em;padding:10px 20px;text-decoration:none;border-radius:2px;">
          View in ATS ↗
        </a>
      </div>
    `,
    text: [
      `New application — ${jobTitle} [JOB-${jobCode}]`,
      "",
      `Candidate: ${candidateName}`,
      `Email:     ${email}`,
      `Skills:    ${skills.join(", ") || "—"}`,
      "",
      "About:",
      about,
      "",
      `Resume PDF: ${resumeUrl || "Not provided"}`,
      "",
      `View in ATS: ${atsUrl}`,
    ].join("\n"),
  });
}
