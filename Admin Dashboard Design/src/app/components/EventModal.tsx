import { Event } from '@/app/data/mockData';
import { X, ExternalLink } from 'lucide-react';

interface EventModalProps {
  event: Event;
  onClose: () => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end"
      onClick={onClose}
    >
      <div 
        className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#ECECF0] px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-[#12130F] mb-1">{event.nom}</h2>
            <p className="text-sm text-[#717182]">Event ID: {event.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#F8F8F8] rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-[#717182]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Client Info */}
          <section>
            <h3 className="text-[#12130F] mb-4 pb-2 border-b-2 border-[#C1950E]">Client Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm text-[#12130F]">{event.eventDetails.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Phone</p>
                <p className="text-sm text-[#12130F]">{event.eventDetails.phone}</p>
              </div>
            </div>
          </section>

          {/* Event Info */}
          <section>
            <h3 className="text-[#12130F] mb-4 pb-2 border-b-2 border-[#C1950E]">Event Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Date</p>
                <p className="text-sm text-[#12130F]">
                  {new Date(event.dateEvent).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Pack</p>
                <p className="text-sm text-[#12130F]">{event.pack}</p>
              </div>
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Lieu</p>
                <p className="text-sm text-[#12130F]">{event.lieu}</p>
              </div>
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Commercial</p>
                <p className="text-sm text-[#12130F]">{event.commercial}</p>
              </div>
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Nb Personnes</p>
                <p className="text-sm text-[#12130F]">{event.eventDetails.nbPersonnes}</p>
              </div>
              <div>
                <p className="text-xs text-[#717182] uppercase tracking-wide mb-1">Nb Miroirs</p>
                <p className="text-sm text-[#12130F]">{event.eventDetails.nbMiroirs}</p>
              </div>
            </div>
          </section>

          {/* Financial Recap */}
          <section>
            <h3 className="text-[#12130F] mb-4 pb-2 border-b-2 border-[#C1950E]">Financial Recap</h3>
            <div className="bg-[#F8F8F8] rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#717182]">CA Généré</span>
                <span className="text-[#12130F]">{event.eventDetails.caGenere.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#717182]">Coût Opérationnel</span>
                <span className="text-[#12130F]">{event.eventDetails.coutOperationnel.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="pt-4 border-t border-[#CCCCCC] flex justify-between items-center">
                <span className="text-[#12130F]">Marge Brute (Event)</span>
                <span className="text-xl text-[#C1950E]">{event.margeBrute.toLocaleString('fr-FR')} €</span>
              </div>
              <p className="text-xs text-[#717182] italic">Source: Google Sheets (read-only)</p>
            </div>
          </section>

          {/* Links */}
          {(event.eventDetails.invoiceLink || event.eventDetails.galleryLink || event.eventDetails.zipLink) && (
            <section>
              <h3 className="text-[#12130F] mb-4 pb-2 border-b-2 border-[#C1950E]">Links</h3>
              <div className="space-y-3">
                {event.eventDetails.invoiceLink && (
                  <a 
                    href={event.eventDetails.invoiceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#C1950E] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Invoice
                  </a>
                )}
                {event.eventDetails.galleryLink && (
                  <a 
                    href={event.eventDetails.galleryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#C1950E] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Gallery
                  </a>
                )}
                {event.eventDetails.zipLink && (
                  <a 
                    href={event.eventDetails.zipLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#C1950E] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Download ZIP
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Status */}
          <section>
            <h3 className="text-[#12130F] mb-4 pb-2 border-b-2 border-[#C1950E]">Payment Status</h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm border-2 ${
                event.acompteStatus === 'Payé'
                  ? 'border-[#C1950E] text-[#C1950E] bg-[rgba(193,149,14,0.05)]'
                  : 'border-[#CD1B17] text-[#CD1B17] bg-[rgba(205,27,23,0.05)]'
              }`}>
                Acompte: {event.acompteStatus}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
