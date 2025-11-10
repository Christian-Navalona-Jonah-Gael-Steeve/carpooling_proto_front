import React from 'react';
import { IncomingCallModal } from './IncomingCallModal';
import { ActiveCallModal } from './ActiveCallModal';

/**
 * Global call modals component that shows incoming/active call modals
 *
 * Flow:
 * - Incoming call: IncomingCallModal -> (accept) -> ActiveCallModal
 * - Outgoing call: ActiveCallModal (shows immediately as initiator)
 */
export const CallModals: React.FC = () => {
  return (
    <>
      <IncomingCallModal />
      <ActiveCallModal />
    </>
  );
};
