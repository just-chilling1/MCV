export interface WizardStepProps {
  /** Hide page-level header and stepper — used inside Sales Offer Generator */
  embedded?: boolean;
  onContinue?: () => void;
  onBack?: () => void;
}

export type WizardStepNumber = 1 | 2 | 3 | 4;

export const SALES_OFFER_GENERATOR_PATH = "/sales-offer-generator";
