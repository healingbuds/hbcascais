import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  MessageCircle, 
  HelpCircle,
  Package,
  Shield,
  Truck,
  FileText,
  User,
  ChevronRight,
  Phone,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGeoLocation } from "@/hooks/useGeoLocation";

const faqCategories = [
  {
    id: 'eligibility',
    title: 'Eligibility & Assessment',
    icon: Shield,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    questions: [
      {
        question: 'Who is eligible for medical cannabis?',
        answer: 'Medical cannabis is available for patients with qualifying conditions across multiple medical specialties including pain management (chronic pain, neuropathy, fibromyalgia), psychiatry (PTSD, anxiety, insomnia), neurology (epilepsy, MS, Parkinson\'s), gastroenterology (Crohn\'s, IBS), and palliative care. Our medical team evaluates each case individually.'
      },
      {
        question: 'How do I start the eligibility process?',
        answer: 'Complete our quick eligibility questionnaire (under 5 minutes) with your basic health information. If eligible, you\'ll be connected with a licensed medical professional for a consultation to discuss your treatment options and design a personalized plan.'
      },
      {
        question: 'What is the approval rate?',
        answer: 'We have a 98% approval rate for patients who complete the eligibility process. Our licensed medical professionals work with you to understand your condition and determine if medical cannabis is appropriate for your treatment.'
      },
      {
        question: 'How long does verification take?',
        answer: 'Identity verification (KYC) is typically completed within 24-48 hours. Medical review and consultation usually takes 2-5 business days. You will receive email notifications at each stage of the process.'
      },
      {
        question: 'What documents do I need?',
        answer: 'You will need a valid government-issued ID (passport, driver\'s license, or national ID card) linked to your home address for identity verification. This ensures compliance with local regulations and secure delivery.'
      }
    ]
  },
  {
    id: 'products',
    title: 'Products & Quality',
    icon: Package,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    questions: [
      {
        question: 'What products are available?',
        answer: 'We offer pharmaceutical-grade medical cannabis products including dried flower, oils, and other formulations. All products are produced in EU GMP certified facilities with full quality control. Product availability varies by country and is subject to local regulations.'
      },
      {
        question: 'What quality standards do products meet?',
        answer: 'All products are EU GMP (Good Manufacturing Practice) certified and produced in state-of-the-art pharmaceutical facilities. Every batch undergoes rigorous third-party lab testing for potency, purity, and contaminants. We maintain full seed-to-sale traceability using blockchain technology.'
      },
      {
        question: 'How is product packaging handled?',
        answer: 'All products are packaged to pharmaceutical standards with child-resistant, UV-resistant, and tamper-evident containers. Each package includes a QR code for complete traceability verification.'
      },
      {
        question: 'How do I place an order?',
        answer: 'Once your eligibility is verified, you can browse our product catalog and add items to your cart. Proceed to checkout to complete your order. Payment options and delivery methods will be displayed during checkout.'
      },
      {
        question: 'Can I order if I am not verified?',
        answer: 'No. For compliance and safety reasons, only verified patients can access the shop and place orders. This ensures medical cannabis is only provided to eligible patients under proper medical supervision as required by law.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Verification',
    icon: User,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    questions: [
      {
        question: 'How do I create an account?',
        answer: 'Click "Sign In" in the navigation and select "Create Account". You can register with your email address. After creating an account, you can begin the eligibility assessment process.'
      },
      {
        question: 'What is KYC verification?',
        answer: 'KYC (Know Your Customer) is a secure identity verification process required for all patients. It confirms your identity and age using a valid ID linked to your home address, ensuring compliance with medical cannabis regulations.'
      },
      {
        question: 'How do I check my verification status?',
        answer: 'Log in to your account and visit the Eligibility page or your Patient Dashboard. Your current verification status will be displayed, including any pending steps you need to complete.'
      },
      {
        question: 'My verification was rejected. What do I do?',
        answer: 'If your verification was rejected, you will receive an email explaining the reason. Common issues include unclear ID photos, ID not matching your registered address, or missing information. You can resubmit or contact support.'
      }
    ]
  },
  {
    id: 'delivery',
    title: 'Delivery & Shipping',
    icon: Truck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    questions: [
      {
        question: 'Where do you deliver?',
        answer: 'We currently deliver nationwide within Portugal, South Africa, Thailand, and the United Kingdom. Delivery is only available within countries where we are licensed to operate. Shipping addresses must match your verified account details.'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Delivery times vary by location. Typically, orders are dispatched within 1-2 business days and delivery takes 3-7 business days depending on your location. Express shipping options may be available in some regions.'
      },
      {
        question: 'How is my order packaged?',
        answer: 'All orders are shipped in discreet, secure packaging with no external branding that indicates the contents. Products are in child-resistant, UV-protected, tamper-evident containers.'
      },
      {
        question: 'Can I track my order?',
        answer: 'Yes. Once your order is dispatched, you will receive a tracking number via email. You can also view order status and tracking information in your Patient Dashboard under Orders.'
      }
    ]
  },
  {
    id: 'legal',
    title: 'Legal & Compliance',
    icon: FileText,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    questions: [
      {
        question: 'Is medical cannabis legal?',
        answer: 'Medical cannabis is legal for qualifying patients in the countries where we operate, subject to local regulations. In South Africa, medical cannabis access is regulated by SAHPRA. Our products and processes are fully compliant with all applicable regulations.'
      },
      {
        question: 'Do I need a prescription?',
        answer: 'Requirements vary by country. In South Africa, THC-containing products require a medical script issued by a licensed healthcare practitioner. Our consultation process ensures you meet all local requirements.'
      },
      {
        question: 'How is my data protected?',
        answer: 'We take data protection seriously. All personal and medical information is encrypted and stored securely in compliance with GDPR, POPIA (in South Africa), and local data protection regulations.'
      },
      {
        question: 'What regulatory bodies oversee your products?',
        answer: 'Our products are produced under EU GMP standards in licensed pharmaceutical facilities. Oversight includes SAHPRA (South Africa), INFARMED (Portugal), Thai FDA (Thailand), and relevant UK authorities.'
      }
    ]
  }
];

const quickActions = [
  {
    title: 'Check Eligibility',
    description: 'Start your medical assessment',
    icon: Shield,
    link: '/eligibility',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Browse Strains',
    description: 'View available products',
    icon: Package,
    link: '/shop',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    title: 'Patient Portal',
    description: 'Manage your account',
    icon: User,
    link: '/dashboard',
    color: 'from-violet-500 to-purple-600',
  },
];

const Support = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('eligibility');
  const locationConfig = useGeoLocation();

  return (
    <PageTransition variant="premium">
      <SEOHead 
        title="Support & FAQ | Healing Buds"
        description="Get answers to frequently asked questions about medical cannabis eligibility, ordering, delivery, and more. Contact our support team for assistance."
        canonical="/support"
      />
      <div className="min-h-screen bg-background">
        <Header onMenuStateChange={setMenuOpen} />
        
        <main className="pt-24 pb-16">
          {/* Hero Section - Compact */}
          <section className="relative py-12 lg:py-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                    <HelpCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                    How Can We Help?
                  </h1>
                  <p className="font-body text-lg text-muted-foreground">
                    Find answers to common questions or reach out to our support team
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Quick Actions - Horizontal Cards */}
          <section className="py-6">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={action.link}>
                      <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
                        <CardContent className="p-0">
                          <div className={`h-1.5 bg-gradient-to-r ${action.color}`} />
                          <div className="p-5 flex items-center gap-4">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {action.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {action.description}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section - Tabbed Interface */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-8"
                >
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-muted-foreground">
                    Select a category to find what you're looking for
                  </p>
                </motion.div>

                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                  {/* Category Tabs - Scrollable on mobile */}
                  <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                    <TabsList className="inline-flex h-auto p-1.5 bg-muted/50 rounded-2xl gap-1 min-w-max">
                      {faqCategories.map((category) => (
                        <TabsTrigger
                          key={category.id}
                          value={category.id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap transition-all"
                        >
                          <category.icon className={`w-4 h-4 ${activeCategory === category.id ? category.color : 'text-muted-foreground'}`} />
                          <span className="hidden sm:inline">{category.title}</span>
                          <span className="sm:hidden">{category.title.split(' ')[0]}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* FAQ Content */}
                  {faqCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id} className="mt-0">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Category Header Card */}
                          <div className={`rounded-2xl ${category.bgColor} p-6 mb-6`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center`}>
                                <category.icon className={`w-6 h-6 ${category.color}`} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-foreground">{category.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {category.questions.length} frequently asked questions
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Accordion */}
                          <Accordion type="single" collapsible className="space-y-3">
                            {category.questions.map((faq, index) => (
                              <AccordionItem
                                key={index}
                                value={`${category.id}-${index}`}
                                className="border border-border/50 rounded-xl overflow-hidden bg-card/50 hover:bg-card transition-colors"
                              >
                                <AccordionTrigger className="px-5 py-4 text-left hover:no-underline group">
                                  <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full ${category.bgColor} flex items-center justify-center mt-0.5`}>
                                      <span className={`text-xs font-bold ${category.color}`}>{index + 1}</span>
                                    </div>
                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors text-left">
                                      {faq.question}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-5 pb-5 pt-0">
                                  <div className="pl-9">
                                    <p className="text-muted-foreground leading-relaxed">
                                      {faq.answer}
                                    </p>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </motion.div>
                      </AnimatePresence>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          </section>

          {/* Contact Section - Clean Cards */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-8"
                >
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Still Need Help?
                  </h2>
                  <p className="text-muted-foreground">
                    Our support team is ready to assist you
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Email Support Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Mail className="w-7 h-7 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground mb-1">Email Support</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Send us a detailed message and we'll respond within 24-48 hours
                            </p>
                            <Button asChild className="w-full sm:w-auto">
                              <a href={`mailto:${locationConfig.email}`}>
                                Send Email
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Response time: 24-48 hours</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Phone Support Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
                            <Phone className="w-7 h-7 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground mb-1">Phone Support</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Speak directly with our support team during business hours
                            </p>
                            <Button variant="outline" asChild className="w-full sm:w-auto">
                              <a href={`tel:${locationConfig.phone.replace(/\s/g, '')}`}>
                                {locationConfig.phone}
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Mon-Fri: 9:00 AM - 5:00 PM</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Trust Badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-8 flex flex-wrap justify-center gap-6"
                >
                  {[
                    { icon: CheckCircle2, text: 'Verified Support Team' },
                    { icon: Shield, text: 'Secure Communication' },
                    { icon: Clock, text: 'Quick Response' },
                  ].map((badge, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <badge.icon className="w-4 h-4 text-primary" />
                      <span>{badge.text}</span>
                    </div>
                  ))}
                </motion.div>
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

export default Support;
