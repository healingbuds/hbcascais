import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Award, 
  Users, 
  Globe, 
  Leaf, 
  Building2,
  Heart,
  Target,
  CheckCircle2
} from 'lucide-react';
import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import HBIcon from "@/components/HBIcon";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import cultivationImage from '@/assets/cultivation-facility-bright.jpg';
import researchImage from '@/assets/research-lab-new.png';
import greenhouseImage from '@/assets/greenhouse-exterior-hq.jpg';

const values = [
  {
    icon: Shield,
    title: 'Regulatory Excellence',
    description: 'Full compliance with EU GMP standards, SAHPRA, and local regulatory bodies in every market we serve.'
  },
  {
    icon: Heart,
    title: 'Patient-Centered Care',
    description: 'Every decision is guided by our commitment to improving patient outcomes and quality of life.'
  },
  {
    icon: Award,
    title: 'Pharmaceutical Standards',
    description: 'Our products meet the highest pharmaceutical quality standards with rigorous third-party testing.'
  },
  {
    icon: Globe,
    title: 'Global Reach, Local Care',
    description: 'Operating across Portugal, South Africa, Thailand, and the UK with localized patient support.'
  }
];

const milestones = [
  { year: '2019', event: 'Founded with a vision to provide pharmaceutical-grade medical cannabis' },
  { year: '2020', event: 'Established EU GMP certified cultivation facility in Portugal' },
  { year: '2021', event: 'Launched blockchain-verified seed-to-sale traceability system' },
  { year: '2022', event: 'Expanded operations to South Africa and Thailand' },
  { year: '2023', event: 'Achieved SAHPRA compliance and UK market entry' },
  { year: '2024', event: 'Digital platform launch for streamlined patient access' }
];

const AboutUs = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <PageTransition variant="premium">
      <SEOHead 
        title="About Us | Healing Buds Medical Cannabis"
        description="Learn about Healing Buds' mission to provide pharmaceutical-grade medical cannabis. EU GMP certified facilities, blockchain traceability, and patient-centered care."
        canonical="/about"
      />
      <div className="min-h-screen bg-background">
        <Header onMenuStateChange={setMenuOpen} />
        
        <main className="pt-24 pb-16">
          {/* Hero Section */}
          <section className="relative py-16 lg:py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <HBIcon size="sm" />
                    Pharmaceutical-Grade Medical Cannabis
                  </span>
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    About Healing Buds
                  </h1>
                  <p className="font-body text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                    We are a licensed medical cannabis company committed to providing patients 
                    with safe, effective, and rigorously tested pharmaceutical-grade products 
                    through a regulated, transparent supply chain.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-8 h-8 text-primary" />
                      <h2 className="font-display text-3xl font-bold text-foreground">Our Mission</h2>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                      To improve the lives of patients worldwide by providing access to pharmaceutical-grade 
                      medical cannabis through a fully compliant, transparent, and patient-centered platform.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      We bridge the gap between cutting-edge cannabinoid science and patient care, 
                      ensuring that every product meets the highest standards of quality, safety, 
                      and efficacy. Our commitment to regulatory excellence means patients can trust 
                      the products they receive.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild>
                        <Link to="/eligibility">Check Eligibility</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/traceability">Our Standards</Link>
                      </Button>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <img 
                      src={greenhouseImage} 
                      alt="Healing Buds EU GMP certified cultivation facility"
                      className="w-full h-auto rounded-2xl shadow-xl"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Our Values
                  </h2>
                  <p className="font-body text-muted-foreground max-w-2xl mx-auto">
                    The principles that guide every aspect of our operations
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {values.map((value, index) => (
                    <motion.div
                      key={value.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                        <CardHeader>
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                            <value.icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{value.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{value.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Facilities Section */}
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
                    Our Facilities
                  </h2>
                  <p className="font-body text-muted-foreground max-w-2xl mx-auto">
                    State-of-the-art pharmaceutical production meeting EU GMP standards
                  </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full overflow-hidden">
                      <img 
                        src={cultivationImage} 
                        alt="Medical cannabis cultivation facility"
                        className="w-full h-48 object-cover"
                      />
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Building2 className="w-6 h-6 text-primary" />
                          <CardTitle>Cultivation Facility</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          Our EU GMP certified cultivation facility in Portugal utilizes 
                          advanced environmental controls and sustainable practices to produce 
                          consistent, pharmaceutical-grade cannabis.
                        </p>
                        <ul className="space-y-2">
                          {['Climate-controlled environment', 'Sustainable water management', 'Automated quality monitoring'].map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="h-full overflow-hidden">
                      <img 
                        src={researchImage} 
                        alt="Research and quality testing laboratory"
                        className="w-full h-48 object-cover"
                      />
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Leaf className="w-6 h-6 text-primary" />
                          <CardTitle>Research & Quality Lab</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          Our dedicated laboratory conducts rigorous testing on every batch, 
                          ensuring potency accuracy, purity, and safety before products reach patients.
                        </p>
                        <ul className="space-y-2">
                          {['Third-party verified testing', 'Full cannabinoid profiling', 'Contaminant screening'].map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline Section */}
          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Our Journey
                  </h2>
                  <p className="font-body text-muted-foreground">
                    Key milestones in our mission to transform medical cannabis access
                  </p>
                </motion.div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-8">
                    {milestones.map((milestone, index) => (
                      <motion.div
                        key={milestone.year}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative flex items-center gap-6 ${
                          index % 2 === 0 ? 'md:flex-row-reverse' : ''
                        }`}
                      >
                        <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background -translate-x-1/2" />
                        <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                          <span className="text-primary font-bold text-lg">{milestone.year}</span>
                          <p className="text-muted-foreground mt-1">{milestone.event}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
                  Ready to Begin Your Journey?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Check your eligibility for medical cannabis treatment and join thousands 
                  of patients who have found relief through our pharmaceutical-grade products.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link to="/eligibility">Check Eligibility</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/support">Contact Us</Link>
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

export default AboutUs;
