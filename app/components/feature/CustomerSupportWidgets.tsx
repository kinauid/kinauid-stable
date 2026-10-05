import React, { useState } from 'react';
import {
  HelpCircle,
  PhoneCall,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  LifeBuoy,
} from 'lucide-react';
import type { CustomerSupportData, FaqItem } from '~/schemas/customer-support.schema';

interface CustomerSupportWidgetProps {
  data: CustomerSupportData;
  onCreateTicket: (payload: any) => void;
  isSubmitting?: boolean;
}

export const CustomerSupportWidget: React.FC<CustomerSupportWidgetProps> = ({
  data,
  onCreateTicket,
  isSubmitting,
}) => {
  const [activeFaqId, setActiveFaqId] = useState<string | null>('1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'order' | 'payment' | 'shipping' | 'design' | 'other'>('order');
  const [ticketOrderNumber, setTicketOrderNumber] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const filteredFaqs = (data?.faqs || []).filter((f) => {
    if (selectedCategory === 'all') return true;
    return f.category === selectedCategory;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    onCreateTicket({
      intent: 'create-ticket',
      subject: ticketSubject,
      category: ticketCategory,
      order_number: ticketOrderNumber,
      message: ticketMessage,
    });
    setTicketSubject('');
    setTicketOrderNumber('');
    setTicketMessage('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Fast Help WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data?.csContacts?.map((contact, idx) => (
          <div
            key={idx}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--text)]">{contact.name}</h4>
                <p className="text-xs text-[var(--text-muted)]">{contact.role}</p>
                <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  {contact.available_hours}
                </p>
              </div>
            </div>

            <a
              href={`https://wa.me/${contact.whatsapp}?text=Halo%20Admin%20Kinau,%20saya%20ingin%20konsultasi%20pesanan`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Hubungi CS via WhatsApp
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        ))}
      </div>

      {/* Main FAQ & Help Desk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: FAQs Accordion */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[var(--primary)]" />
                Pertanyaan yang Sering Diajukan (FAQ)
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Jawaban cepat untuk seputar proses order dan produksi.</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'order', 'design', 'payment', 'shipping'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {cat === 'all' ? 'Semua' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = activeFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs transition"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-semibold text-xs text-[var(--text)]">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)]/50 pt-3 bg-[var(--background)]/30">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Submit Support Ticket Form */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleTicketSubmit}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-[var(--primary)]" />
                Buat Tiket Kendala
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Punya kendala pada pesanan atau butuh revisi mockup cepat?
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Subjek Kendala</label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Contoh: Konfirmasi perubahan warna tali lanyard"
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Kategori</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as any)}
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                >
                  <option value="order">Pesanan & Antrean</option>
                  <option value="design">Desain & Mockup</option>
                  <option value="payment">Pembayaran & DP</option>
                  <option value="shipping">Ekspedisi & Resi</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Nomor Order (Opsional)</label>
                <input
                  type="text"
                  value={ticketOrderNumber}
                  onChange={(e) => setTicketOrderNumber(e.target.value)}
                  placeholder="ORD-..."
                  className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">Pesan Lengkap</label>
              <textarea
                required
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Jelaskan detail kendala atau pertanyaan Anda..."
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-[var(--text)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Tiket ke Tim Support
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
