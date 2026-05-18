import { SiteChrome } from '@/components/site-chrome';

export default function ContactPage() {
  return (
    <SiteChrome>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-5 rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-3xl font-bold text-white">Contact</h1>
          <p className="text-sm leading-7 text-white/60">
            For corrections, updates, feedback or collaboration queries, contact the All University team.
          </p>
          <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            Email: <a className="font-semibold underline" href="mailto:contact@alluniversity.org">contact@alluniversity.org</a>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
