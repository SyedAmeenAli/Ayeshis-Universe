import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ACTIVITY_LABELS, STATUS_LABELS, STATUS_TINT } from "@/data/calendar";
import { fetchCalendarSlots, bookSlot, cancelBooking } from "@/lib/calendarApi";

export default function CalendarPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setLoading(true);
    fetchCalendarSlots()
      .then(setSlots)
      .finally(() => setLoading(false));
  }

  async function onCancelBooking(slot) {
    if (!slot.booking) return;
    await cancelBooking(slot.booking.id);
    toast("Booking cancelled.");
    refresh();
  }

  return (
    <div className="min-h-screen w-full pt-24 md:pt-28 pb-24 px-5 md:px-10 max-w-4xl mx-auto">
      <header className="mb-10">
        <span className="type-mono text-[10px] text-text-muted">TWO-SIDED / 1709</span>
        <h1 className="mt-3 font-editorial text-5xl md:text-6xl">Our Calendar</h1>
        <p className="mt-3 text-text-secondary">Book your baby boy.</p>
      </header>

      {loading ? (
        <p className="text-xs text-text-muted">Loading availability…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {slots.map((slot, i) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.03 }}
              className="rounded-2xl border border-white/10 bg-surface-1 p-5 flex items-center justify-between gap-4"
              data-testid={`calendar-slot-${slot.id}`}
            >
              <div>
                <span className="type-mono text-[10px] text-text-muted">
                  {new Date(slot.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {slot.time_label}
                </span>
                <div className="mt-1">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] type-mono ${STATUS_TINT[slot.status]}`}>
                    {STATUS_LABELS[slot.status]}
                  </span>
                </div>
                {slot.booking && (
                  <p className="mt-2 text-xs text-lavender">{ACTIVITY_LABELS[slot.booking.activity]}</p>
                )}
              </div>

              {slot.status === "busy" && slot.booking ? (
                <button
                  onClick={() => onCancelBooking(slot)}
                  className="type-mono text-[9px] text-text-muted hover:text-danger-red border border-white/10 rounded-full px-3 py-1.5"
                  data-testid={`calendar-cancel-${slot.id}`}
                >
                  cancel
                </button>
              ) : slot.status === "busy" ? (
                <span className="type-mono text-[9px] text-text-muted">unavailable</span>
              ) : (
                <MagneticButton
                  onClick={() => setBookingSlot(slot)}
                  variant="ghost"
                  size="sm"
                  data-testid={`calendar-book-${slot.id}`}
                >
                  book
                </MagneticButton>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <BookingDialog
        slot={bookingSlot}
        onClose={() => setBookingSlot(null)}
        onBooked={(booking) => {
          setConfirmed({ slot: bookingSlot, booking });
          setBookingSlot(null);
          refresh();
        }}
      />

      <ConfirmationDialog confirmed={confirmed} onClose={() => setConfirmed(null)} />
    </div>
  );
}

function BookingDialog({ slot, onClose, onBooked }) {
  const [activity, setActivity] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slot) {
      setActivity(null);
      setNote("");
    }
  }, [slot]);

  async function submit() {
    if (!slot || !activity) return;
    setSaving(true);
    try {
      const res = await bookSlot(slot.id, { activity, note });
      onBooked(res.booking);
    } catch {
      toast("Could not book — try another slot.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent data-testid="calendar-booking-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Book {slot ? new Date(slot.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>Choose an activity and add a note if you want.</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-wrap gap-2 my-3">
          {Object.entries(ACTIVITY_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActivity(id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                activity === id ? "border-lavender text-lavender bg-lavender/10" : "border-white/12 text-text-secondary"
              }`}
              data-testid={`calendar-activity-${id}`}
            >
              {label}
            </button>
          ))}
        </div>

        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" rows={3} />

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <MagneticButton onClick={submit} disabled={!activity || saving} variant="primary" size="md" data-testid="calendar-confirm-book">
            {saving ? "booking…" : "confirm booking"}
          </MagneticButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmationDialog({ confirmed, onClose }) {
  if (!confirmed) return null;
  const { slot, booking } = confirmed;
  const dateLabel = new Date(slot.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const activityLabel = ACTIVITY_LABELS[booking.activity];
  const shareText = `Hello baby boy. You have been officially booked for ${dateLabel} at ${slot.time_label}. Activity: ${activityLabel}. Attendance is compulsory.`;

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  }

  function downloadIcs() {
    const dt = slot.date.replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${activityLabel} with Ameen`,
      `DESCRIPTION:${shareText.replace(/,/g, "\\,")}`,
      `DTSTART:${dt}T${slot.time_label.replace(":", "")}00`,
      "DURATION:PT2H",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slot.date}-${booking.activity}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent data-testid="calendar-confirmation">
        <AlertDialogHeader>
          <div className="w-10 h-10 rounded-full bg-lavender/15 flex items-center justify-center mb-2">
            <Check className="w-5 h-5 text-lavender" />
          </div>
          <AlertDialogTitle>Ayesha has booked Ameen.</AlertDialogTitle>
          <AlertDialogDescription>{shareText}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
          <MagneticButton onClick={downloadIcs} variant="ghost" size="md" data-testid="calendar-download-ics">
            add to calendar
          </MagneticButton>
          <MagneticButton onClick={shareWhatsApp} variant="primary" size="md" data-testid="calendar-share-whatsapp">
            share via WhatsApp
          </MagneticButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
