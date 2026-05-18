import { SiteChrome } from '@/components/site-chrome';

export default function PrivacyPolicyPage() {
  return (
    <SiteChrome>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-5 rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-sm leading-7 text-white/60">
            All University Updates is designed to provide public education updates. We do not ask students for sensitive personal information to browse notices, universities, boards or exam pages.
          </p>
          <p className="text-sm leading-7 text-white/60">
            Basic technical information such as browser, device and usage data may be used to improve performance, reliability and content quality. External official links are controlled by their respective websites.
          </p>
          <p className="text-sm leading-7 text-white/60">
            If you contact us, we may use your message and email address only to respond to your query.
          </p>
        </div>
      </section>
    </SiteChrome>
  );
}
