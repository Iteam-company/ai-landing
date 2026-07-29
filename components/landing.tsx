import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Pains } from "@/components/sections/pains";
import { Solutions } from "@/components/sections/solutions";
import { Showcase } from "@/components/sections/showcase";
import { Pricing } from "@/components/sections/pricing";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Booking } from "@/components/sections/booking";
import { CustomerAccess } from "@/components/sections/customer-access";
import { hasFeature } from "@/lib/features";
import { site } from "@/content/site";

export function Landing() {
  return (
    <>
      <Header nav={site.nav} brand={site.brand} />
      <main className="grain relative">
        <Hero content={site.hero} calendar={site.contact.calendar} />
        <Pains content={site.pains} />
        <Solutions content={site.solutions} />
        <Showcase content={site.showcase} />
        <Pricing content={site.pricing} />
        {/* Optional EasyLand features — rendered only when switched on at scaffold time. */}
        {hasFeature("calendar") ? <Booking content={site.booking} /> : null}
        {hasFeature("customers") ? <CustomerAccess content={site.customers} /> : null}
        <Contact content={site.contact} />
      </main>
      <Footer content={site.footer} brand={site.brand} />
    </>
  );
}
