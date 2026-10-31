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
        className="flex flex-col gap-5"
      >
        <motion.div variants={itemVariants}>
          <SupportStatCards />
        </motion.div>

        <motion.div variants={itemVariants}>
          <SupportChannelCards />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div id="faq" className="card-base scroll-mt-24 overflow-hidden p-0 lg:col-span-3">
            <SupportFaqCardHeader />
            <div className="px-4 py-4 sm:px-5">
              <SupportFaqAccordion sections={faqSections} />
            </div>
          </div>

          <div id="contact" className="support-contact-glow scroll-mt-24 lg:col-span-2">
            <ContactSupportWidget />
          </div>
        </motion.div>

        <SupportRefundSection />
      </motion.div>
    </SupportPageLayout>
  );
}
