import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

export class MailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailDeliveryError';
  }
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST not set — emails will not be sent');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>('SMTP_PORT', '587')),
      secure: this.config.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
    return this.transporter;
  }

  async send(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    const transport = this.getTransporter();
    if (!transport) {
      return { ok: false, error: 'SMTP is not configured' };
    }

    const from = this.config.get<string>('SMTP_FROM', 'noreply@bctigers.ca');
    try {
      await transport.sendMail({ from, ...options });
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      this.logger.error('Failed to send email', err);
      return { ok: false, error: message };
    }
  }

  /** Sends email or throws MailDeliveryError when delivery fails. */
  async sendOrThrow(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    const result = await this.send(options);
    if (!result.ok) {
      throw new MailDeliveryError(result.error);
    }
  }

  appUrl(path: string): string {
    const base = this.config.get<string>('APP_URL', 'http://localhost:5173');
    return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
