import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import QueryState from '@/components/shared/QueryState';
import { usePublicSettings } from '@/hooks/useSettings';
import { useSubmitContact } from '@/hooks/useContact';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const { data: settings } = usePublicSettings();
  const submitContact = useSubmitContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitContact.mutateAsync(form);
    setSubmitted(true);
  };

  const contactItems = [
    { icon: MapPin, label: 'Address', value: settings?.contact_address ?? 'Burnaby, BC' },
    { icon: Mail, label: 'Email', value: settings?.contact_email ?? 'info@bctigers.ca' },
    { icon: Phone, label: 'Phone', value: settings?.contact_phone ?? '' },
  ].filter((item) => item.value);

  return (
    <PageLayout>
      <div className="bg-[#0038FF] text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-[#CCFF00]" style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: '4px 4px 0 #001A99' }}>
            Contact Us
          </h1>
          <p className="text-white/80 mt-4">Get in touch with the BC Tigers team</p>
        </div>
      </div>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 uppercase">Get In Touch</h2>
            <QueryState isEmpty={contactItems.length === 0} emptyMessage="Contact details unavailable.">
              {contactItems.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="bg-[#0038FF] p-2 rounded-xl flex-shrink-0">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">{item.label}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{item.value}</p>
                  </div>
                </div>
              ))}
            </QueryState>
          </div>

          <div className="md:col-span-2">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-black text-gray-900">Message Sent!</h3>
                <p className="text-gray-500 mt-2">We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Tournament inquiry" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help you?"
                    required
                    className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0038FF] resize-none"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitContact.isPending}>
                  <Send className="w-4 h-4" /> {submitContact.isPending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
