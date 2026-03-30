import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Brain,
  Activity,
  Heart,
  Stethoscope,
  Pill,
  CheckCircle2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import SEOHead from "@/components/SEOHead";
import HBIcon from "@/components/HBIcon";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const conditionCategories = [
  {
    id: 'pain',
    icon: Activity,
    title: 'Pain Management',
    description: 'Chronic and acute pain conditions where conventional treatments have been insufficient.',
    conditions: [
      { name: 'Chronic Pain Syndrome', description: 'Persistent pain lasting more than 3 months' },
      { name: 'Neuropathic Pain', description: 'Nerve damage causing burning, shooting, or stabbing pain' },
      { name: 'Fibromyalgia', description: 'Widespread musculoskeletal pain with fatigue' },
      { name: 'Cancer-Related Pain', description: 'Pain associated with cancer or cancer treatment' },
      { name: 'Arthritis', description: 'Rheumatoid and osteoarthritis pain management' },
      { name: 'Complex Regional Pain Syndrome (CRPS)', description: 'Chronic pain usually affecting a limb' }
    ]
  },
  {
    id: 'psychiatry',
    icon: Brain,
    title: 'Psychiatry',
    description: 'Mental health conditions where medical cannabis may provide symptomatic relief.',
    conditions: [
      { name: 'PTSD', description: 'Post-traumatic stress disorder symptom management' },
      { name: 'Anxiety Disorders', description: 'Generalized anxiety, social anxiety, panic disorder' },
      { name: 'Treatment-Resistant Depression', description: 'Depression unresponsive to conventional treatments' },
      { name: 'Insomnia', description: 'Chronic sleep disorders affecting quality of life' },
      { name: 'OCD', description: 'Obsessive-compulsive disorder symptom management' }
    ]
  },
  {
    id: 'neurology',
    icon: Stethoscope,
    title: 'Neurology',
    description: 'Neurological conditions with evidence supporting cannabinoid therapy.',
    conditions: [
      { name: 'Epilepsy', description: 'Treatment-resistant seizure disorders' },
      { name: 'Multiple Sclerosis', description: 'Spasticity and pain management in MS patients' },
      { name: "Parkinson's Disease", description: 'Motor symptoms and tremor management' },
      { name: 'Migraine Disorders', description: 'Chronic migraine prevention and treatment' },
      { name: 'Neuropathy', description: 'Peripheral nerve damage and symptoms' },
      { name: 'Tourette Syndrome', description: 'Tic reduction and symptom management' }
    ]
  },
  {
    id: 'gastro',
    icon: Pill,
    title: 'Gastroenterology',
    description: 'Gastrointestinal conditions where cannabinoids may provide relief.',
    conditions: [
      { name: "Crohn's Disease", description: 'Inflammatory bowel disease symptom management' },
      { name: 'Ulcerative Colitis', description: 'Chronic inflammatory condition of the colon' },
      { name: 'Irritable Bowel Syndrome', description: 'Abdominal pain and altered bowel habits' },
      { name: 'Chemotherapy-Induced Nausea', description: 'Nausea and vomiting from cancer treatment' },
      { name: 'Appetite Disorders', description: 'Loss of appetite due to medical conditions' }
    ]
  },
  {
    id: 'palliative',
    icon: Heart,
    title: 'Palliative & Supportive Care',
    description: 'End-of-life and quality-of-life focused care.',
    conditions: [
      { name: 'Appetite Stimulation', description: 'For patients with cancer, HIV/AIDS, or other wasting conditions' },
      { name: 'Cachexia', description: 'Severe weight loss and muscle wasting' },
      { name: 'End-of-Life Symptom Management', description: 'Comprehensive symptom relief for terminal patients' },
      { name: 'Quality of Life Improvement', description: 'Holistic symptom management for chronic conditions' }
    ]
  }
];

const Conditions = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <PageTransition variant="premium">
      <SEOHead 
        title="Qualifying Medical Conditions | Healing Buds"
        description="Explore the medical conditions that may qualify for medical cannabis treatment including chronic pain, PTSD, epilepsy, MS, and more. Learn about our assessment process."
        canonical="/conditions"
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
                    <HBIcon size="sm" />
                    Medical Eligibility
                  </span>
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    Qualifying Conditions
                  </h1>
                  <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Medical cannabis may be prescribed for a range of conditions across multiple 
                    medical specialties. Our licensed physicians evaluate each case individually.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Approval Rate Banner */}
          <section className="py-8 bg-highlight/10 border-y border-highlight/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-highlight" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-highlight">98% Approval Rate</p>
                    <p className="text-sm text-muted-foreground">For eligible patients who complete our assessment</p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/eligibility">
                    Start Free Assessment
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Conditions by Category */}
          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="space-y-8">
                  {conditionCategories.map((category, categoryIndex) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: categoryIndex * 0.1 }}
                    >
                      <Card className="overflow-hidden">
                        <CardHeader 
                          className="bg-muted/30 cursor-pointer"
                          onClick={() => setExpandedCategory(
                            expandedCategory === category.id ? null : category.id
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <category.icon className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl">{category.title}</CardTitle>
                                <CardDescription className="mt-1">{category.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground hidden sm:inline">
                                {category.conditions.length} conditions
                              </span>
                              <motion.div
                                animate={{ rotate: expandedCategory === category.id ? 90 : 0 }}
                              >
                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                              </motion.div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <motion.div
                          initial={false}
                          animate={{ 
                            height: expandedCategory === category.id ? 'auto' : 0,
                            opacity: expandedCategory === category.id ? 1 : 0
                          }}
                          className="overflow-hidden"
                        >
                          <CardContent className="pt-6">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {category.conditions.map((condition) => (
                                <div 
                                  key={condition.name}
                                  className="p-4 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-medium text-foreground">{condition.name}</p>
                                      <p className="text-sm text-muted-foreground mt-1">{condition.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </motion.div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Not Listed Section */}
          <section className="py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Don't See Your Condition?</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          This list is not exhaustive. Our medical team evaluates each patient individually 
                          based on their specific medical history and circumstances. If you have a condition 
                          not listed here, we encourage you to complete our assessment — our physicians will 
                          determine if medical cannabis may be appropriate for your situation.
                        </p>
                        <Button asChild>
                          <Link to="/eligibility">Start Your Assessment</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Process Overview */}
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                    How the Assessment Works
                  </h2>
                  <p className="text-muted-foreground">
                    A simple, confidential process to determine your eligibility
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { 
                      step: 1, 
                      title: 'Free Online Assessment', 
                      description: 'Complete a quick questionnaire about your condition and medical history. Takes less than 5 minutes.' 
                    },
                    { 
                      step: 2, 
                      title: 'Medical Consultation', 
                      description: 'Speak with a licensed physician who specializes in cannabinoid therapy to discuss your treatment options.' 
                    },
                    { 
                      step: 3, 
                      title: 'Verification & Access', 
                      description: 'Once approved, complete identity verification and gain access to pharmaceutical-grade products.' 
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full text-center">
                        <CardContent className="pt-6">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <span className="text-xl font-bold text-primary">{item.step}</span>
                          </div>
                          <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center mt-10">
                  <Button asChild size="lg">
                    <Link to="/eligibility">
                      Begin Your Assessment
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
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

export default Conditions;
