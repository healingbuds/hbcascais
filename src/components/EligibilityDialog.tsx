import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, CheckCircle2, AlertCircle, Leaf } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useGeoLocation } from '@/hooks/useGeoLocation';

// Validation schemas for each step
const step1Schema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be less than 50 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number must be less than 20 characters'),
  dateOfBirth: z.date().refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, 'You must be at least 18 years old'),
});

const step2Schema = z.object({
  conditions: z.array(z.string()).min(1, 'Please select at least one condition'),
  otherCondition: z.string().max(200, 'Description must be less than 200 characters').optional(),
  symptoms: z.string().trim().min(10, 'Please provide details about your symptoms').max(500, 'Description must be less than 500 characters'),
});

const step3Schema = z.object({
  previousCannabisUse: z.enum(['yes', 'no']),
  currentMedications: z.string().max(500, 'Description must be less than 500 characters').optional(),
  allergies: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

const step4Schema = z.object({
  consent: z.boolean().refine((val) => val === true, 'You must provide consent to continue'),
  privacyAcknowledgment: z.boolean().refine((val) => val === true, 'You must acknowledge the privacy policy'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

interface EligibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const medicalConditions = [
  'Chronic Pain',
  'Anxiety',
  'Depression',
  'PTSD',
  'Insomnia',
  'Cancer-related symptoms',
  'Epilepsy/Seizures',
  'Multiple Sclerosis',
  'Other (please specify)',
];

const EligibilityDialog = ({ open, onOpenChange }: EligibilityDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data & Step4Data>>({});
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const geoLocation = useGeoLocation();

  // Step 1 form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData as Step1Data,
  });

  // Step 2 form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      conditions: [],
      otherCondition: '',
      symptoms: '',
      ...(formData as Step2Data),
    },
  });

  // Step 3 form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData as Step3Data,
  });

  // Step 4 form
  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      consent: false,
      privacyAcknowledgment: false,
      ...(formData as Step4Data),
    },
  });

  const handleStep1Submit = (data: Step1Data) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: Step3Data) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(4);
  };

  const handleStep4Submit = (data: Step4Data) => {
    const finalData = { ...formData, ...data };
    
    // Determine eligibility (basic logic - can be enhanced)
    const eligible = finalData.dateOfBirth && 
                     (new Date().getFullYear() - finalData.dateOfBirth.getFullYear()) >= 18 &&
                     finalData.conditions && 
                     finalData.conditions.length > 0 &&
                     finalData.consent === true;
    
    setIsEligible(eligible);
    setCurrentStep(5);

    toast({
      title: eligible ? "Application Submitted" : "More Information Needed",
      description: eligible 
        ? "Thank you for your application. Our team will review and contact you shortly."
        : "Based on the information provided, we need additional verification. Our team will contact you.",
    });
  };

  const handleBack = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({});
    setIsEligible(null);
    step1Form.reset();
    step2Form.reset();
    step3Form.reset();
    step4Form.reset();
    onOpenChange(false);
  };

  const renderProgressBar = () => (
    <div className="flex items-center justify-between mb-8 sm:mb-10 px-2">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center flex-1">
          <div
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all duration-300 shadow-sm",
              currentStep >= step
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground"
            )}
          >
            {currentStep > step ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              step
            )}
          </div>
          {step < 4 && (
            <div
              className={cn(
                "flex-1 h-1 mx-2 sm:mx-3 rounded-full transition-all duration-300",
                currentStep > step ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Section divider component
  const SectionDivider = () => (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <Leaf className="w-4 h-4 text-primary/40" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Medical Cannabis Eligibility
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            Complete all steps to determine your eligibility for medical cannabis treatment.
          </DialogDescription>
        </DialogHeader>

        {currentStep <= 4 && renderProgressBar()}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">1</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="firstName" className="text-foreground/90">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    {...step1Form.register('firstName')}
                  />
                  {step1Form.formState.errors.firstName && (
                    <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="lastName" className="text-foreground/90">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    {...step1Form.register('lastName')}
                  />
                  {step1Form.formState.errors.lastName && (
                    <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <SectionDivider />

              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-foreground/90">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...step1Form.register('email')}
                />
                {step1Form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="phone" className="text-foreground/90">
                  Phone Number * <span className="text-xs text-muted-foreground font-normal">({geoLocation.countryName})</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={geoLocation.phonePlaceholder}
                  {...step1Form.register('phone')}
                />
                {step1Form.formState.errors.phone && (
                  <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.phone.message}</p>
                )}
              </div>

              <SectionDivider />

              <div className="space-y-2.5">
                <Label className="text-foreground/90">Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left h-12 rounded-xl border-2 hover:border-primary/30 transition-all",
                        !step1Form.watch('dateOfBirth') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-primary/60" />
                      {step1Form.watch('dateOfBirth') ? (
                        format(step1Form.watch('dateOfBirth'), "PPP")
                      ) : (
                        <span>Select your date of birth</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={step1Form.watch('dateOfBirth')}
                      onSelect={(date) => step1Form.setValue('dateOfBirth', date as Date)}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                {step1Form.formState.errors.dateOfBirth && (
                  <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="px-8 h-12 rounded-xl font-semibold text-base">
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Medical Information */}
        {currentStep === 2 && (
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">2</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Medical Information</h3>
              </div>
              
              <div className="space-y-4">
                <Label className="text-foreground/90 text-base">Medical Conditions *</Label>
                <p className="text-sm text-muted-foreground -mt-2">Select all conditions that apply to you</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {medicalConditions.map((condition) => (
                    <div 
                      key={condition} 
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() => {
                        const currentConditions = step2Form.getValues('conditions') || [];
                        const isChecked = currentConditions.includes(condition);
                        if (isChecked) {
                          step2Form.setValue('conditions', currentConditions.filter((c) => c !== condition));
                        } else {
                          step2Form.setValue('conditions', [...currentConditions, condition]);
                        }
                      }}
                    >
                      <Checkbox
                        id={condition}
                        checked={step2Form.watch('conditions')?.includes(condition)}
                        onCheckedChange={(checked) => {
                          const currentConditions = step2Form.getValues('conditions') || [];
                          if (checked) {
                            step2Form.setValue('conditions', [...currentConditions, condition]);
                          } else {
                            step2Form.setValue(
                              'conditions',
                              currentConditions.filter((c) => c !== condition)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={condition} className="font-normal cursor-pointer text-foreground/80 flex-1">
                        {condition}
                      </Label>
                    </div>
                  ))}
                </div>
                {step2Form.formState.errors.conditions && (
                  <p className="text-sm text-destructive">{step2Form.formState.errors.conditions.message}</p>
                )}
              </div>

              {step2Form.watch('conditions')?.includes('Other (please specify)') && (
                <>
                  <SectionDivider />
                  <div className="space-y-2.5">
                    <Label htmlFor="otherCondition" className="text-foreground/90">Please specify other condition</Label>
                    <Input
                      id="otherCondition"
                      placeholder="Describe your condition"
                      {...step2Form.register('otherCondition')}
                    />
                    {step2Form.formState.errors.otherCondition && (
                      <p className="text-sm text-destructive">{step2Form.formState.errors.otherCondition.message}</p>
                    )}
                  </div>
                </>
              )}

              <SectionDivider />

              <div className="space-y-2.5">
                <Label htmlFor="symptoms" className="text-foreground/90">Describe Your Symptoms *</Label>
                <Textarea
                  id="symptoms"
                  {...step2Form.register('symptoms')}
                  placeholder="Please describe your symptoms and how they affect your daily life..."
                  className="min-h-32 rounded-xl border-2 p-4 resize-none focus:border-primary/50 transition-all"
                />
                {step2Form.formState.errors.symptoms && (
                  <p className="text-sm text-destructive">{step2Form.formState.errors.symptoms.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 gap-4">
              <Button type="button" variant="outline" onClick={handleBack} className="px-6 h-12 rounded-xl">
                Back
              </Button>
              <Button type="submit" className="px-8 h-12 rounded-xl font-semibold text-base">
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Medical History */}
        {currentStep === 3 && (
          <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">3</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Medical History</h3>
              </div>
              
              <div className="space-y-4">
                <Label className="text-foreground/90 text-base">Have you used medical cannabis before? *</Label>
                <RadioGroup
                  onValueChange={(value) => step3Form.setValue('previousCannabisUse', value as 'yes' | 'no')}
                  defaultValue={step3Form.watch('previousCannabisUse')}
                  className="flex gap-4 pt-2"
                >
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 flex-1 cursor-pointer transition-all",
                      step3Form.watch('previousCannabisUse') === 'yes' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/30"
                    )}
                    onClick={() => step3Form.setValue('previousCannabisUse', 'yes')}
                  >
                    <RadioGroupItem value="yes" id="cannabis-yes" />
                    <Label htmlFor="cannabis-yes" className="font-normal cursor-pointer text-base">Yes</Label>
                  </div>
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 flex-1 cursor-pointer transition-all",
                      step3Form.watch('previousCannabisUse') === 'no' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/30"
                    )}
                    onClick={() => step3Form.setValue('previousCannabisUse', 'no')}
                  >
                    <RadioGroupItem value="no" id="cannabis-no" />
                    <Label htmlFor="cannabis-no" className="font-normal cursor-pointer text-base">No</Label>
                  </div>
                </RadioGroup>
                {step3Form.formState.errors.previousCannabisUse && (
                  <p className="text-sm text-destructive">{step3Form.formState.errors.previousCannabisUse.message}</p>
                )}
              </div>

              <SectionDivider />

              <div className="space-y-2.5">
                <Label htmlFor="currentMedications" className="text-foreground/90">Current Medications</Label>
                <p className="text-sm text-muted-foreground -mt-1">Optional - helps us assess potential interactions</p>
                <Textarea
                  id="currentMedications"
                  {...step3Form.register('currentMedications')}
                  placeholder="List any medications you are currently taking..."
                  className="min-h-24 rounded-xl border-2 p-4 resize-none focus:border-primary/50 transition-all"
                />
                {step3Form.formState.errors.currentMedications && (
                  <p className="text-sm text-destructive">{step3Form.formState.errors.currentMedications.message}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="allergies" className="text-foreground/90">Allergies</Label>
                <p className="text-sm text-muted-foreground -mt-1">Optional - list any known allergies</p>
                <Textarea
                  id="allergies"
                  {...step3Form.register('allergies')}
                  placeholder="List any known allergies..."
                  className="min-h-24 rounded-xl border-2 p-4 resize-none focus:border-primary/50 transition-all"
                />
                {step3Form.formState.errors.allergies && (
                  <p className="text-sm text-destructive">{step3Form.formState.errors.allergies.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 gap-4">
              <Button type="button" variant="outline" onClick={handleBack} className="px-6 h-12 rounded-xl">
                Back
              </Button>
              <Button type="submit" className="px-8 h-12 rounded-xl font-semibold text-base">
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* Step 4: Consent & Acknowledgment */}
        {currentStep === 4 && (
          <form onSubmit={step4Form.handleSubmit(handleStep4Submit)} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">4</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Consent & Acknowledgment</h3>
              </div>
              
              <div className="space-y-5 bg-muted/30 p-5 sm:p-6 rounded-2xl border border-border/50">
                <div 
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    step4Form.watch('consent') 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => step4Form.setValue('consent', !step4Form.watch('consent'))}
                >
                  <Checkbox
                    id="consent"
                    checked={step4Form.watch('consent')}
                    onCheckedChange={(checked) => step4Form.setValue('consent', checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent" className="text-sm font-normal cursor-pointer leading-relaxed text-foreground/80">
                    I consent to the collection and processing of my personal health information for the purpose of assessing my eligibility for medical cannabis treatment. I understand that this information will be reviewed by qualified healthcare professionals.
                  </Label>
                </div>
                {step4Form.formState.errors.consent && (
                  <p className="text-sm text-destructive pl-2">{step4Form.formState.errors.consent.message}</p>
                )}

                <div 
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    step4Form.watch('privacyAcknowledgment') 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => step4Form.setValue('privacyAcknowledgment', !step4Form.watch('privacyAcknowledgment'))}
                >
                  <Checkbox
                    id="privacy"
                    checked={step4Form.watch('privacyAcknowledgment')}
                    onCheckedChange={(checked) => step4Form.setValue('privacyAcknowledgment', checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer leading-relaxed text-foreground/80">
                    I acknowledge that I have read and understood the privacy policy and understand how my data will be stored and used in accordance with applicable healthcare regulations.
                  </Label>
                </div>
                {step4Form.formState.errors.privacyAcknowledgment && (
                  <p className="text-sm text-destructive pl-2">{step4Form.formState.errors.privacyAcknowledgment.message}</p>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <strong className="text-foreground">Important:</strong> This assessment does not constitute medical advice or guarantee approval for medical cannabis treatment. A qualified healthcare professional will review your application and may contact you for additional information or consultation.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4 gap-4">
              <Button type="button" variant="outline" onClick={handleBack} className="px-6 h-12 rounded-xl">
                Back
              </Button>
              <Button type="submit" className="px-8 h-12 rounded-xl font-semibold text-base">
                Submit Application
              </Button>
            </div>
          </form>
        )}

        {/* Step 5: Result */}
        {currentStep === 5 && (
          <div className="space-y-8 py-8">
            <div className="flex flex-col items-center text-center space-y-5">
              {isEligible ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground">
                    Application Submitted Successfully
                  </h3>
                  <p className="text-muted-foreground max-w-md leading-relaxed">
                    Thank you for completing the eligibility assessment. Based on the information provided, you may be eligible for medical cannabis treatment. Our healthcare team will review your application and contact you within 2-3 business days.
                  </p>
                  <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl mt-4 w-full max-w-md">
                    <p className="text-sm text-foreground/80">
                      We've sent a confirmation email to <strong className="text-foreground">{formData.email}</strong>. Please check your inbox for next steps.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground">
                    Additional Information Required
                  </h3>
                  <p className="text-muted-foreground max-w-md leading-relaxed">
                    Thank you for your application. Based on the information provided, we need to gather some additional details to properly assess your eligibility. Our team will contact you shortly to discuss your options.
                  </p>
                  <div className="bg-secondary/5 border border-secondary/20 p-5 rounded-2xl mt-4 w-full max-w-md">
                    <p className="text-sm text-foreground/80">
                      We've sent a confirmation email to <strong className="text-foreground">{formData.email}</strong>. A healthcare professional will reach out within 2-3 business days.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={handleClose} className="px-10 h-12 rounded-xl font-semibold text-base">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EligibilityDialog;
