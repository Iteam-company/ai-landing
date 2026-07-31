import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Pains } from "@/components/sections/pains";
import { Solutions } from "@/components/sections/solutions";
import { Showcase } from "@/components/sections/showcase";
import { About } from "@/components/sections/about";
// import { Pricing } from "@/components/sections/pricing";
import { Comparison } from "@/components/sections/comparison";
import { Faq } from "@/components/sections/faq";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Booking } from "@/components/sections/booking";
import { CustomerAccess } from "@/components/sections/customer-access";
import { hasFeature } from "@/lib/features";
import { getContent } from "@/content";
import { getUi } from "@/content";
import type { Locale } from "@/lib/lang";

// Composition root. Everything below is fed from the locale's content object, so
// each prerendered locale ("/" and "/<locale>/") renders the same tree with its
// own copy.

export function Landing({ locale }: { locale: Locale }) {
  const site = getContent(locale);
  const ui = getUi(locale);

  return (
    <>
      <Header nav={site.nav} brand={site.brand} locale={locale} a11y={ui.a11y} />
      <main className="grain relative">
        <Hero content={site.hero} calendar={site.contact.calendar} a11y={ui.a11y} />
        <Pains content={site.pains} />
        <Solutions content={site.solutions} />
        <Showcase content={site.showcase} />
        <About content={site.about} />
        {/* <Pricing content={site.pricing} recommendedLabel={ui.pricing.recommended} /> */}
        <Comparison
          content={site.comparison}
          transitionHref="#faq"
        />
        <Faq
          content={site.faq}
          transitionHref={hasFeature("calendar") ? "#booking" : "#contact"}
        />
        {/* Optional EasyLand features — rendered only when switched on at scaffold time. */}
        {hasFeature("calendar") ? (
          <Booking content={site.booking} ui={ui.booking} locale={locale} />
        ) : null}
        {hasFeature("customers") ? (
          <CustomerAccess content={site.customers} ui={ui.portal} locale={locale} />
        ) : null}
        <Contact content={site.contact} messages={ui.form} locale={locale} />
      </main>
      <Footer content={site.footer} brand={site.brand} />
    </>
  );
}
