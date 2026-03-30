import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  QrCode,
  Leaf,
  Factory,
  FlaskConical,
  Package,
  Truck,
  CheckCircle2,
  Lock,
  Fingerprint,
  Database,
  ArrowRight
} from 'lucide-react';
import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import HBIcon from "@/components/HBIcon";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const traceabilitySteps = [
  {
    icon: Leaf,
    title: 'Cultivation',
    description: 'Seeds planted in EU GMP certified facilities with environmental monitoring',
    details: ['Seed genetics verified', 'Growth conditions logged', 'Pesticide-free cultivation', 'Batch ID assigned']
  },
  {
    icon: Factory,
    title: 'Processing',
    description: 'Harvested, dried, and processed under strict pharmaceutical conditions',
    details: ['Harvest date recorded', 'Drying conditions monitored', 'Processing batch tracked', 'Quality checkpoints']
  },
  {
    icon: FlaskConical,
    title: 'Testing',
    description: 'Comprehensive third-party laboratory analysis for every batch',
    details: ['Cannabinoid profiling', 'Terpene analysis', 'Contaminant screening', 'Potency verification']
  },
  {
    icon: Package,
    title: 'Packaging',
    description: 'Pharmaceutical-grade packaging with unique identifiers',
    details: ['Child-resistant containers', 'UV protection', 'Tamper-evident seals', 'QR code applied']
  },
  {
    icon: Truck,
    title: 'Distribution',
    description: 'Temperature-controlled, secure delivery to verified patients',
    details: ['Cold chain maintained', 'Secure transport', 'Delivery confirmation', 'Patient verification']
  }
];

const packagingFeatures = [
  {
    icon: Lock,
    title: 'Child-Resistant',
    description: 'Certified child-resistant closures to prevent accidental access'
  },
  {
    icon: Shield,
    title: 'Tamper-Evident',
    description: 'Visible indicators if packaging has been opened or compromised'
  },
  {
    icon: Fingerprint,
    title: 'UV-Protected',
    description: 'Light-blocking materials to preserve product integrity and potency'
  },
  {
    icon: QrCode,
    title: 'QR Verification',
    description: 'Scan to verify authenticity and view complete product journey'
  }
];

const blockchainBenefits = [
  {
    title: 'Immutable Records',
    description: 'Every step in the supply chain is permanently recorded and cannot be altered.'
  },
  {
    title: 'Complete Transparency',
    description: 'Patients can verify the full journey of their product from seed to delivery.'
  },
  {
    title: 'Anti-Counterfeit',
    description: 'Unique identifiers prevent product counterfeiting and ensure authenticity.'
  },
  {
    title: 'Regulatory Compliance',
    description: 'Full audit trail meets the requirements of all regulatory bodies.'
  }
];

const Traceability = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <PageTransition variant="premium">
      <SEOHead 
        title="Seed-to-Sale Traceability | Healing Buds"
        description="Learn how Healing Buds uses blockchain technology for complete seed-to-sale traceability. QR verification, pharmaceutical packaging, and full supply chain transparency."
        canonical="/traceability"
      />
      <div className="min-h-screen bg-background">
        <Header onMenuStateChange={setMenuOpen} />
        
        <main className="pt-24 pb-16">
          {/* Hero Section */}
          <section className="relative py-16 lg:py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <Database className="w-4 h-4" />
                    Blockchain Verified
                  </span>
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    Seed-to-Sale Traceability
                  </h1>
                  <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Every Healing Buds product is tracked from cultivation to delivery using 
                    blockchain technology, ensuring complete transparency and authenticity.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Supply Chain Steps */}
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                    The Journey of Your Product
                  </h2>
                  <p className="font-body text-muted-foreground max-w-2xl mx-auto">
                    Each step is recorded on an immutable blockchain ledger
                  </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                  {/* Connection line */}
                  <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
                  
                  <div className="grid lg:grid-cols-5 gap-6">
                    {traceabilitySteps.map((step, index) => (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        <Card className="h-full bg-card border-border/50">
                          <CardHeader className="text-center pb-3">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 relative z-10 border-4 border-background">
                              <step.icon className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">Step {index + 1}</div>
                            <CardTitle className="text-lg">{step.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                              {step.description}
                            </p>
                            <ul className="space-y-2">
                              {step.details.map((detail) => (
                                <li key={detail} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* QR Verification Section */}
          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <QrCode className="w-8 h-8 text-primary" />
                      <h2 className="font-display text-3xl font-bold text-foreground">
                        QR Code Verification
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                      Every product includes a unique QR code that connects to our blockchain 
                      verification system. Simply scan to access:
                    </p>
                    <ul className="space-y-4 mb-8">
                      {[
                        'Complete product journey from seed to your hands',
                        'Third-party lab test results and certificates',
                        'Batch information and production date',
                        'Cannabinoid and terpene profiles',
                        'Product authenticity confirmation'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                      <CardContent className="p-8 text-center">
                        <div className="w-48 h-48 mx-auto mb-6 rounded-2xl bg-white p-4 shadow-lg">
                          <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <QrCode className="w-24 h-24 text-primary" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">Scan to Verify</h3>
                        <p className="text-sm text-muted-foreground">
                          Each product has a unique QR code linking to its complete blockchain record
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* Packaging Standards */}
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Pharmaceutical-Grade Packaging
                  </h2>
                  <p className="font-body text-muted-foreground max-w-2xl mx-auto">
                    Every product is packaged to pharmaceutical standards for safety and integrity
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {packagingFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full text-center">
                        <CardContent className="pt-6">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <feature.icon className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Blockchain Benefits */}
          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Database className="w-8 h-8 text-primary" />
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                      Why Blockchain?
                    </h2>
                  </div>
                  <p className="font-body text-muted-foreground">
                    The benefits of immutable, distributed ledger technology for medical cannabis
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {blockchainBenefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full bg-card/50 border-border/50">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                              <p className="text-sm text-muted-foreground">{benefit.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-primary/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center">
                <HBIcon size="xl" className="mx-auto mb-6" />
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Experience Transparency
                </h2>
                <p className="text-muted-foreground mb-8">
                  Join thousands of patients who trust our fully traceable, 
                  pharmaceutical-grade medical cannabis products.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link to="/eligibility">
                      Check Eligibility
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/about">About Healing Buds</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </PageTransition>
  );
};

export default Traceability;
