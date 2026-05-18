import { SiteChrome } from '@/components/site-chrome';

export default function AboutPage() {
  return (
    <SiteChrome>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-5 rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-3xl font-bold text-white">About Us</h1>
          <p className="text-sm leading-7 text-white/60">
            All University Updates is an independent student information portal that helps students find university notices, exam updates, results, admission alerts, board updates and entrance exam information in one place.
          </p>
          <p className="text-sm leading-7 text-white/60">
            We collect and organize public information with direct official links so students can quickly verify every update from the original university, board or exam website.
          </p>
        </div>
      </section>
    </SiteChrome>
  );
}
