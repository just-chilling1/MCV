import Link from "next/link";
import { Brain, CheckCircle2, Lightbulb, LucideIcon, Play, Star } from "lucide-react";
import {
  getMindsetTutorialVideos,
  getPlatformTutorialVideos,
  getPremiumTutorialVideos,
  trainingProTips,
  trainingQuickStartChecklist,
  trainingWorkflowSteps,
} from "@/lib/training-content";
import { TrainingPageLayout } from "../components/TrainingPageLayout";
import { TrainingVideoCard } from "../components/TrainingVideoCard";
import { TrainingCtaSection } from "../components/TrainingCtaSection";

function TrainingSectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100">
        <Icon className="h-5 w-5 text-brass-700" />
      </div>
      <div>
        <h2 className="text-lg font-medium text-text-heading">{title}</h2>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

export default function TrainingVideosPage() {
  const platformVideos = getPlatformTutorialVideos();
  const premiumVideos = getPremiumTutorialVideos();
  const mindsetVideos = getMindsetTutorialVideos();

  return (
    <TrainingPageLayout>
      <section className="flex flex-col gap-6">
        <TrainingSectionHeader
          icon={Play}
          title="Platform Tutorials"
          subtitle="Core workflow — watch in order after Dashboard intro videos"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 xl:grid-cols-3 xl:gap-8">
          {platformVideos.map((video, index) => (
            <TrainingVideoCard key={video.title} video={video} index={index} priority={index === 0} />
          ))}
        </div>
      </section>

      <section className="glass-card p-5 sm:p-6">
        <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-text-muted">Quick reference</h3>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainingWorkflowSteps.map((step) => (
            <li key={step.step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass-100 text-[13px] font-medium text-brass-700">
                {step.step}
              </span>
              <div className="min-w-0">
                <Link
                  href={step.page}
                  className="text-sm font-medium text-text-heading transition-colors hover:text-brass-700"
                >
                  {step.title}
                </Link>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <TrainingSectionHeader
          icon={Star}
          title="Premium Feature Tutorials"
          subtitle="Scale after your first article — watch in any order"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 xl:gap-8">
          {premiumVideos.map((video) => (
            <TrainingVideoCard key={video.badge} video={video} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <TrainingSectionHeader
          icon={Brain}
          title="Mindset Videos"
          subtitle="Beliefs and habits for each feature — watch with the matching how-to"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 xl:grid-cols-3 xl:gap-8">
          {mindsetVideos.map((video) => (
            <TrainingVideoCard key={video.title} video={video} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-brass-700" />
            <h3 className="text-base font-medium text-text-heading">Launch checklist</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {trainingQuickStartChecklist.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brass-700" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-brass-700" />
            <h3 className="text-base font-medium text-text-heading">Pro tips</h3>
          </div>
          <ul className="mt-4 space-y-4">
            {trainingProTips.map((tip) => (
              <li key={tip.title}>
                <p className="text-sm font-medium text-text-heading">{tip.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">{tip.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <TrainingCtaSection />
    </TrainingPageLayout>
  );
}
