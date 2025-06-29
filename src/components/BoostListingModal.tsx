import React from "react";
import BoostPaymentModal from "./payments/BoostPaymentModal";

interface BoostListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
  partTitle: string;
  partPrice: number;
  onBoostComplete: () => void;
}

const BoostListingModal: React.FC<BoostListingModalProps> = ({
  isOpen,
  onClose,
  partId,
  partTitle,
  partPrice,
  onBoostComplete,
}) => {
  return (
    <BoostPaymentModal
      isOpen={isOpen}
      onClose={onClose}
      partId={partId}
      partTitle={partTitle}
      partPrice={partPrice}
      onSuccess={onBoostComplete}
    />
  );
};

export default BoostListingModal;
