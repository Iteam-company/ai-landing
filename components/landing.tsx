import { Header } from "@/components/sections/header";
import { AutomationNetworkHero } from "@/components/sections/automation-network-hero";
import { Pains } from "@/components/sections/pains";
import { Solutions } from "@/components/sections/solutions";
import { Showcase } from "@/components/sections/showcase";
import { About } from "@/components/sections/about";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";
import { Booking } from "@/components/sections/booking";
import { CustomerAccess } from "@/components/sections/customer-access";
import { hasFeature } from "@/lib/features";
import { getContent } from "@/content";
import { getUi } from "@/content";
import type { Locale } from "@/lib/lang";

export function Landing({ locale }: { locale: Locale }) {
  const site = getContent(locale);
  const ui = getUi(locale);

  return (
    <>
      <Header
        nav={site.nav}
        brand={site.brand}
        locale={locale}
        a11y={ui.a11y}
      />
      <main className="grain relative">
        <AutomationNetworkHero
          automationNetworkContent={site.automationNetwork}
          heroContent={site.hero}
        />
        <Pains content={site.pains} ui={ui.pains} />
        <Solutions content={site.solutions} a11y={ui.a11y} />
        <Showcase content={site.showcase} />
        <About content={site.about} />
        <Faq content={site.faq} transitionHref="#booking" />
        {hasFeature("calendar") ? (
          <Booking content={site.booking} ui={ui.booking} locale={locale} />
        ) : null}
        {hasFeature("customers") ? (
          <CustomerAccess content={site.customers} ui={ui.portal} locale={locale} />
        ) : null}
      </main>
      <Footer content={site.footer} brand={site.brand} />
    </>
  );
}
