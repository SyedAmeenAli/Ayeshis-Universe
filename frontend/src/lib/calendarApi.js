import { apiGet, apiPost } from "@/lib/api";

export function fetchActivityTypes() {
  return apiGet("/calendar/activity-types");
}

export function fetchCalendarSlots() {
  return apiGet("/calendar/slots");
}

export function bookSlot(slotId, payload) {
  return apiPost(`/calendar/slots/${slotId}/book`, payload);
}

export function cancelBooking(bookingId) {
  return apiPost(`/calendar/bookings/${bookingId}/cancel`);
}
