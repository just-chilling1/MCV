"use client";

import { motion } from "framer-motion";
import { faqSections } from "@/config/faq.config";
import { ContactSupportWidget } from "@/components/dashboard/ContactSupportWidget";
import { SupportPageLayout } from "../components/SupportPageLayout";
import { SupportChannelCards } from "../components/SupportChannelCards";
import { SupportStatCards } from "../components/SupportStatCards";
import {
  SupportFaqAccordion,
  SupportFaqCardHeader,
} from "../components/SupportFaqAccordion";
import {
  SupportRefundSection,
  containerVariants,
  itemVariants,
} from "../components/SupportRefundSection";

export default function SupportPage() {
  return (
    <SupportPageLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        <motion.div variants={itemVariants} id="contact" className="scroll-mt-24">
          <ContactSupportWidget featured />
        </motion.div>

        <motion.div variants={itemVariants}>
          <SupportStatCards />
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="mb-3 text-[13px] font-medium uppercase tracking-wide text-text-muted">
            Other ways to reach us
          </p>
          <SupportChannelCards />
        </motion.div>

        <motion.div variants={itemVariants} id="faq" className="card-base scroll-mt-24 overflow-hidden p-0">
          <SupportFaqCardHeader />
          <div className="px-4 py-4 sm:px-5">
            <SupportFaqAccordion sections={faqSections} />
          </div>
        </motion.div>

        <SupportRefundSection />
      </motion.div>
    </SupportPageLayout>
  );
}
