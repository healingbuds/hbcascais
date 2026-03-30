import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import MobileBottomActions from "@/components/MobileBottomActions";
import { FileText, AlertCircle, Scale, Users, Shield, Coins } from "lucide-react";
import { useGeoLocation } from "@/hooks/useGeoLocation";

const TermsOfService = () => {
  const { t, i18n } = useTranslation("legal");
  const [menuOpen, setMenuOpen] = useState(false);
  const locationConfig = useGeoLocation();
  
  const formatDate = () => {
    const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-US';
    return new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <PageTransition variant="premium">
      <div className="min-h-screen bg-background pb-24 lg:pb-0">
        <Header onMenuStateChange={setMenuOpen} />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <FileText className="w-16 h-16 text-primary" />
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t("terms.title")}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("terms.lastUpdated")} {formatDate()}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-8 text-foreground/90">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold">{t("terms.agreement.title")}</h2>
                </div>
                <p className="leading-relaxed mb-4">
                  {t("terms.agreement.content")}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold">{t("terms.eligibility.title")}</h2>
                </div>
                <p className="leading-relaxed mb-4">
                  {t("terms.eligibility.intro")}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {(t("terms.eligibility.items", { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Coins className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold">{t("terms.nftKeys.title")}</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t("terms.nftKeys.ownership.title")}</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      {(t("terms.nftKeys.ownership.items", { returnObjects: true }) as string[]).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t("terms.nftKeys.tiers.title")}</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      {(t("terms.nftKeys.tiers.items", { returnObjects: true }) as Array<{ label: string; desc: string }>).map((item, index) => (
                        <li key={index}><strong>{item.label}</strong> {item.desc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold">{t("terms.compliance.title")}</h2>
                </div>
                <p className="leading-relaxed mb-4">
                  {t("terms.compliance.intro")}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {(t("terms.compliance.items", { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.useServices.title")}</h2>
                <p className="leading-relaxed mb-4">{t("terms.useServices.intro")}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {(t("terms.useServices.items", { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold">{t("terms.risks.title")}</h2>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg mb-4">
                  <p className="font-semibold mb-2">{t("terms.risks.warning")}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {(t("terms.risks.items", { returnObjects: true }) as Array<{ label: string; desc: string }>).map((item, index) => (
                      <li key={index}><strong>{item.label}</strong> {item.desc}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.blockchainTraceability.title")}</h2>
                <p className="leading-relaxed mb-4">
                  {t("terms.blockchainTraceability.intro")}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {(t("terms.blockchainTraceability.items", { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <p className="leading-relaxed mt-4">
                  {t("terms.blockchainTraceability.note")}
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.intellectualProperty.title")}</h2>
                <p className="leading-relaxed">
                  {t("terms.intellectualProperty.content")}
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.liability.title")}</h2>
                <p className="leading-relaxed mb-4">
                  {t("terms.liability.intro")}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {(t("terms.liability.items", { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.termination.title")}</h2>
                <p className="leading-relaxed">
                  {t("terms.termination.content")}
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.governingLaw.title")}</h2>
                <p className="leading-relaxed">
                  {t("terms.governingLaw.content")}
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.changesTerms.title")}</h2>
                <p className="leading-relaxed">
                  {t("terms.changesTerms.content")}
                </p>
              </section>

              <section className="bg-card p-6 rounded-lg border border-border">
                <h2 className="font-display text-2xl font-bold mb-4">{t("terms.contact.title")}</h2>
                <p className="leading-relaxed mb-4">
                  {t("terms.contact.content")}
                </p>
                <div className="space-y-2">
                  <p><strong>{t("terms.contact.email")}</strong> {locationConfig.email.replace('info@', 'legal@')}</p>
                  <p><strong>{t("terms.contact.address")}</strong> {locationConfig.address}, {locationConfig.city}</p>
                </div>
              </section>
            </div>
          </div>
        </main>
        <Footer />
        <BackToTop />
        <MobileBottomActions menuOpen={menuOpen} />
      </div>
    </PageTransition>
  );
};

export default TermsOfService;
