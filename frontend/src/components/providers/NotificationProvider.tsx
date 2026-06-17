"use client";

import ToastContainer from "@/components/ui/ToastContainer";
import UrgentAlertTicker from "@/components/ui/UrgentAlertTicker";

export default function NotificationProvider() {
  return (
    <>
      {/* TODO Fase 7: PersistentAlertBar 
          diintegrasikan ke dalam RUL Banner */}
      <ToastContainer />
      <UrgentAlertTicker />
    </>
  );
}
