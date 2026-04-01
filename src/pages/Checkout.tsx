import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, CreditCard, CheckCircle2, AlertCircle, Loader2, MapPin, Home, Building2, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Header from '@/layout/Header';
import Footer from '@/components/Footer';
import { useShop } from '@/context/ShopContext';
import { EligibilityGate } from '@/components/shop/EligibilityGate';
import { ShippingAddressForm, type ShippingAddress } from '@/components/shop/ShippingAddressForm';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useDrGreenApi } from '@/hooks/useDrGreenApi';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { formatPrice, getCurrencyForCountry } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';

// Retry utility with exponential backoff - preserves real error messages
async function retryOperation<T>(
  operation: () => Promise<{ data: T | null; error: string | null }>,
  operationName: string,
  maxRetries: number = 3
): Promise<{ data: T | null; error: string | null }> {
  let lastError: string | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await operation();
    
    if (!result.error) return result;
    
    // Store the actual error for potential return
    lastError = result.error;
    console.log(`[${operationName}] Attempt ${attempt}/${maxRetries} error:`, result.error);
    
    // Check for non-retryable status codes and error patterns
    // Status 400/401/403/422 = client errors, don't retry
    const nonRetryablePatterns = [
      'Status 400', 'Status 401', 'Status 403', 'Status 422',
      'validation', 'required', 'MISSING_', 'AUTH_FAILED',
      'CLIENT_INACTIVE', 'SHIPPING_ADDRESS_REQUIRED', 'not active',
      'retryable: false', 'retryable":false'
    ];
    
    const isNonRetryable = nonRetryablePatterns.some(pattern => 
      result.error?.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isNonRetryable) {
      console.warn(`[${operationName}] Non-retryable error detected:`, result.error);
      return result;
    }
    
    // Retry for potentially transient errors (5xx, timeouts, network issues)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
      console.log(`[${operationName}] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Return the last real error, not a generic message
  return { 
    data: null, 
    error: lastError || `${operationName} failed after ${maxRetries} attempts` 
  };
}
// Fire-and-forget email — never blocks checkout
async function sendOrderConfirmationEmail(payload: {
  email: string;
  customerName: string;
  orderId: string;
  items: { strain_name: string; quantity: number; unit_price: number }[];
  totalAmount: number;
  currency: string;
  shippingAddress: ShippingAddress;
  isLocalOrder: boolean;
  region?: string;
}) {
  try {
    if (!payload.email) return;
    const { error } = await supabase.functions.invoke('send-order-confirmation', { body: payload });
    if (error) console.warn('[OrderEmail] Failed:', error.message);
    else console.log('[OrderEmail] Sent for', payload.orderId);
  } catch (e) {
    console.warn('[OrderEmail] Error:', e);
  }
}

// Map raw API/proxy errors to user-friendly messages
function getFriendlyErrorMessage(rawError: string): string {
  const lower = rawError.toLowerCase();
  if (lower.includes('shipping') || lower.includes('address'))
    return 'Your shipping address could not be verified. Please check your address and try again.';
  if (lower.includes('payment'))
    return 'Payment processing failed. Please try again in a moment.';
  if (lower.includes('not active') || lower.includes('client_inactive'))
    return 'Your account is not yet active. Please complete verification before placing an order.';
  if (lower.includes('timeout') || lower.includes('network') || lower.includes('fetch'))
    return 'We couldn\'t reach the server. Please check your connection and try again.';
  if (lower.includes('401') || lower.includes('403') || lower.includes('auth'))
    return 'Your session may have expired. Please sign in again and retry.';
  if (lower.includes('cart') || lower.includes('empty'))
    return 'Your cart appears to be empty on the server. Please add items again.';
  if (lower.includes('stock') || lower.includes('quantity') || lower.includes('limit'))
    return 'One or more items exceed available stock. Please adjust quantities and try again.';
  // Generic fallback — still better than raw API strings
  return 'Something went wrong while placing your order. Please try again. If the problem persists, contact support.';
}

const Checkout = () => {

  const { cart, cartTotal, cartTotalConverted, clearCart, drGreenClient, countryCode, convertFromEUR } = useShop();
  const navigate = useNavigate();
  const { t } = useTranslation('shop');
  const { toast } = useToast();
  const { createOrder, getClientDetails } = useDrGreenApi();
  const { saveOrder } = useOrderTracking();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  
  
  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [needsShippingAddress, setNeedsShippingAddress] = useState(false);
  const [addressMode, setAddressMode] = useState<'saved' | 'custom'>('saved');
  const [addressManuallySaved, setAddressManuallySaved] = useState(false);

  // Fetch client details to check for shipping address
  // Priority: 1) Manual session save, 2) Local DB, 3) Dr. Green API, 4) Prompt user
  useEffect(() => {
    const checkShippingAddress = async () => {
      // Skip re-fetch if user already saved address manually
      if (addressManuallySaved) {
        setIsLoadingAddress(false);
        return;
      }

      if (!drGreenClient?.drgreen_client_id) {
        setIsLoadingAddress(false);
        return;
      }

      // First, check local database for shipping address (faster, more reliable)
      const localShipping = drGreenClient.shipping_address;
      if (localShipping && localShipping.address1) {
        console.log('[Checkout] Using shipping address from local DB');
        const addr = localShipping as ShippingAddress;
        setSavedAddress(addr);
        setShippingAddress(addr);
        setNeedsShippingAddress(false);
        setAddressMode('saved');
        setIsLoadingAddress(false);
        return;
      }

      // Fallback: try Dr. Green API and persist locally
      try {
        const result = await getClientDetails(drGreenClient.drgreen_client_id);
        
        if (result.error) {
          console.warn('Could not fetch client details from API:', result.error);
          setNeedsShippingAddress(true);
        } else if (result.data?.shipping && result.data.shipping.address1) {
          const addr = result.data.shipping;
          setSavedAddress(addr);
          setShippingAddress(addr);
          setNeedsShippingAddress(false);
          setAddressMode('saved');

          // Persist API shipping address to local DB so future loads are instant
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            supabase
              .from('drgreen_clients')
              .update({
                shipping_address: JSON.parse(JSON.stringify(addr)),
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', user.id)
              .then(({ error: updateErr }) => {
                if (updateErr) console.warn('[Checkout] Failed to cache shipping address locally:', updateErr);
                else console.log('[Checkout] Cached shipping address from API to local DB');
              });
          }
        } else {
          setNeedsShippingAddress(true);
        }
      } catch (error) {
        console.error('Failed to fetch client details:', error);
        // Graceful fallback: prompt for address instead of blocking
        setNeedsShippingAddress(true);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    checkShippingAddress();
  // Note: getClientDetails is now stable via useMemo in useDrGreenApi
  }, [drGreenClient, getClientDetails, addressManuallySaved]);

  // Handle address mode toggle
  const handleAddressModeChange = (mode: 'saved' | 'custom') => {
    setAddressMode(mode);
    if (mode === 'saved' && savedAddress) {
      setShippingAddress(savedAddress);
    }
  };

  const handleShippingAddressSaved = (address: ShippingAddress) => {
    console.log('[Checkout] Address saved:', address);
    // Mark as manually saved to prevent useEffect from re-fetching and overwriting
    setAddressManuallySaved(true);
    // Set address FIRST, before changing needsShippingAddress
    setShippingAddress(address);
    setSavedAddress(address); // Also save as "saved" address
    // Then update state to show the address selection UI
    setNeedsShippingAddress(false);
    setAddressMode('saved');
    toast({
      title: 'Shipping Address Saved',
      description: 'You can now proceed with your order.',
    });
  };

  const handlePlaceOrder = async () => {
    if (!drGreenClient || cart.length === 0) return;

    // Validate shipping address exists
    if (!shippingAddress || !shippingAddress.address1) {
      toast({
        title: 'Shipping Address Required',
        description: 'Please provide a shipping address before placing your order.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('Verifying account...');

    try {
      const clientId = drGreenClient.drgreen_client_id;

      // PRE-FLIGHT: Verify client is still Active + KYC Verified via API
      const preflight = await getClientDetails(clientId);
      if (preflight.error) {
        throw new Error('Could not verify your account status. Please try again.');
      }
      if (preflight.data && preflight.data.adminApproval !== 'VERIFIED') {
        throw new Error('Your account is not yet approved. Please wait for admin verification before placing an order.');
      }
      if (preflight.data && !preflight.data.isKYCVerified) {
        throw new Error('Your KYC verification is not complete. Please complete verification before placing an order.');
      }
      console.log('[Checkout] Pre-flight passed: client is VERIFIED + KYC done');

      setPaymentStatus('Creating order...');

      // Use the atomic createOrder which handles:
      // 1. PATCH client shipping address
      // 2. POST items to server-side cart
      // 3. POST order creation from cart
      // All in one server-side transaction
      console.log('[Checkout] Creating order via atomic transaction...');
      
      const orderResult = await retryOperation(
        () => createOrder({
          clientId: clientId,
          items: cart.map(item => ({
            productId: item.strain_id,
            quantity: item.quantity,
            price: item.unit_price,
          })),
          shippingAddress: {
            address1: shippingAddress.address1,
            address2: shippingAddress.address2 || '',
            city: shippingAddress.city,
            state: shippingAddress.state || shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            countryCode: shippingAddress.countryCode,
          },
        }),
        'Create order'
      );

      if (orderResult.error || !orderResult.data?.orderId) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const createdOrderId = orderResult.data.orderId;
      console.log('[Checkout] Order created:', createdOrderId);

      setPaymentStatus('Initiating payment...');

      // Create payment via Dr Green API
      const clientCountry = drGreenClient.country_code || countryCode || 'PT';
      const paymentResult = await retryOperation(
        () => createPayment({
          orderId: createdOrderId,
          amount: cartTotal,
          currency: 'USD',
          clientId: drGreenClient.drgreen_client_id,
        }),
        'Create payment'
      );

      if (paymentResult.error || !paymentResult.data) {
        throw new Error(paymentResult.error || 'Failed to initiate payment');
      }

      const paymentId = paymentResult.data.paymentId;
      setPaymentStatus('Processing payment...');

      // Poll for payment status (simplified - in production would use webhooks)
      let attempts = 0;
      const maxAttempts = 10;
      let finalStatus = 'PENDING';
      let finalPaymentStatus = 'PENDING';
      
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const statusResult = await getPayment(paymentId);
        
        if (statusResult.data?.status === 'PAID') {
          finalStatus = 'CONFIRMED';
          finalPaymentStatus = 'PAID';
          break;
        } else if (statusResult.data?.status === 'FAILED' || statusResult.data?.status === 'CANCELLED') {
          throw new Error('Payment was not successful');
        }
        
        attempts++;
      }

      // POST-ORDER CONFIRMATION: Fetch confirmed order from API (Step 6)
      setPaymentStatus('Confirming order details...');
      let confirmedTotal = cartTotal;
      const orderConfirmation = await getOrder(createdOrderId);
      if (orderConfirmation.data) {
        const apiTotal = orderConfirmation.data.totalAmount;
        if (apiTotal != null && apiTotal !== cartTotal) {
          console.warn(`[Checkout] Total mismatch — client: ${cartTotal}, API: ${apiTotal}. Using API value.`);
        }
        confirmedTotal = apiTotal ?? cartTotal;
        finalStatus = orderConfirmation.data.status || finalStatus;
      } else {
        console.warn('[Checkout] Could not fetch order confirmation, using client-side values:', orderConfirmation.error);
      }

      // Save order locally with complete context snapshot for reliable admin sync
const clientCountryCode = drGreenClient.country_code || countryCode || 'ZA';
      await saveOrder({
        drgreen_order_id: createdOrderId,
        status: finalStatus,
        payment_status: finalPaymentStatus,
        total_amount: confirmedTotal,
        items: cart.map(item => ({
          strain_id: item.strain_id,
          strain_name: item.strain_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        // Capture order context at checkout time
        client_id: drGreenClient.drgreen_client_id,
        shipping_address: {
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state || shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          countryCode: shippingAddress.countryCode,
        },
        customer_email: drGreenClient.email || undefined,
        customer_name: drGreenClient.full_name || undefined,
        country_code: clientCountryCode,
        currency: getCurrencyForCountry(clientCountryCode),
      });

      setOrderId(createdOrderId);
      setOrderComplete(true);
      await clearCart();

      // Send confirmation email (fire-and-forget)
      sendOrderConfirmationEmail({
        email: drGreenClient.email || '',
        customerName: drGreenClient.full_name || '',
        orderId: createdOrderId,
        items: cart.map(i => ({ strain_name: i.strain_name, quantity: i.quantity, unit_price: i.unit_price })),
        totalAmount: confirmedTotal,
        currency: getCurrencyForCountry(clientCountryCode),
        shippingAddress,
        isLocalOrder: false,
        region: clientCountryCode,
      });
      
      toast({
        title: finalPaymentStatus === 'PAID' ? 'Order Placed Successfully' : 'Order Submitted',
        description: `Your order ${createdOrderId} has been ${finalPaymentStatus === 'PAID' ? 'confirmed' : 'submitted for processing'}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Checkout] Order failed:', errorMessage);

      // Surface a clear, user-friendly error — NO silent fallback
      const friendlyMessage = getFriendlyErrorMessage(errorMessage);

      toast({
        title: 'Order could not be placed',
        description: friendlyMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setPaymentStatus('');
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-12 pb-8">
                    <>
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                      </div>
                      <h1 className="text-3xl font-bold text-foreground mb-4">
                        Order Confirmed!
                      </h1>
                      <p className="text-muted-foreground mb-2">
                        Thank you for your order. Your order ID is:
                      </p>
                      <p className="text-xl font-mono text-primary mb-8">
                        {orderId}
                      </p>
                      <p className="text-sm text-muted-foreground mb-8">
                        You will receive an email confirmation shortly with tracking information.
                      </p>
                    </>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate('/shop')}>
                      Continue Shopping
                    </Button>
                    <Button onClick={() => navigate('/orders')}>
                      View Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-12 pb-8 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Your Cart is Empty
                </h2>
                <p className="text-muted-foreground mb-8">
                  Add some products to your cart before checking out.
                </p>
                <Button onClick={() => navigate('/shop')}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <EligibilityGate>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Back button */}
              <Button
                variant="ghost"
                className="mb-6"
                onClick={() => navigate('/shop')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shop
              </Button>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Order Summary */}
                <div className="lg:col-span-2">
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {item.strain_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × {formatPrice(convertFromEUR(item.unit_price), countryCode)}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">
                            {formatPrice(convertFromEUR(item.quantity * item.unit_price), countryCode)}
                          </p>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(cartTotalConverted, countryCode)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Shipping & Payment Section */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Shipping Address Check */}
                  {isLoadingAddress ? (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardContent className="pt-6 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Checking shipping address...</span>
                      </CardContent>
                    </Card>
                  ) : needsShippingAddress ? (
                    // No saved address - show form directly
                    <div className="space-y-4">
                      <Alert className="bg-muted/30 border-border/50">
                        <MapPin className="h-4 w-4" />
                        <AlertTitle>Shipping Address Required</AlertTitle>
                        <AlertDescription>
                          Please add your shipping address to continue.
                        </AlertDescription>
                      </Alert>
                      
                      {drGreenClient && (
                        <ShippingAddressForm
                          clientId={drGreenClient.drgreen_client_id}
                          initialAddress={drGreenClient.shipping_address ? {
                            address1: (drGreenClient.shipping_address as any).address1 || '',
                            address2: (drGreenClient.shipping_address as any).address2 || '',
                            landmark: (drGreenClient.shipping_address as any).landmark || '',
                            city: (drGreenClient.shipping_address as any).city || '',
                            state: (drGreenClient.shipping_address as any).state || '',
                            postalCode: (drGreenClient.shipping_address as any).postalCode || '',
                            country: (drGreenClient.shipping_address as any).country || '',
                            countryCode: (drGreenClient.shipping_address as any).countryCode || drGreenClient.country_code || '',
                          } : undefined}
                          defaultCountry={drGreenClient.country_code || countryCode || 'ZA'}
                          onSuccess={handleShippingAddressSaved}
                          submitLabel="Save & Continue"
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Delivery Address Selection */}
                      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Delivery Address
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <RadioGroup 
                            value={addressMode} 
                            onValueChange={(v) => handleAddressModeChange(v as 'saved' | 'custom')}
                            className="space-y-3"
                          >
                            {/* Option 1: Use saved address */}
                            {savedAddress && (
                              <div 
                                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                                  addressMode === 'saved' 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-border/50 hover:border-border'
                                }`}
                                onClick={() => handleAddressModeChange('saved')}
                              >
                                <RadioGroupItem value="saved" id="addr-saved" className="mt-1" />
                                <Label htmlFor="addr-saved" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-2 font-medium">
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                    Use saved address
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {savedAddress.address1}<br />
                                    {savedAddress.city}, {savedAddress.postalCode}<br />
                                    {savedAddress.country}
                                  </div>
                                </Label>
                              </div>
                            )}
                            
                            {/* Option 2: Different address */}
                            <div 
                              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                                addressMode === 'custom' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border/50 hover:border-border'
                              }`}
                              onClick={() => handleAddressModeChange('custom')}
                            >
                              <RadioGroupItem value="custom" id="addr-custom" className="mt-1" />
                              <Label htmlFor="addr-custom" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2 font-medium">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  Ship to a different address
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  Work, pickup point, or alternative location
                                </span>
                              </Label>
                            </div>
                          </RadioGroup>
                          
                          {/* Show form when custom selected */}
                          {addressMode === 'custom' && drGreenClient && (
                            <div className="pt-4 border-t border-border/50">
                              <ShippingAddressForm
                                clientId={drGreenClient.drgreen_client_id}
                                initialAddress={savedAddress}
                                defaultCountry={savedAddress?.countryCode || drGreenClient.country_code || countryCode || 'ZA'}
                                onSuccess={handleShippingAddressSaved}
                                submitLabel="Confirm Address"
                                variant="inline"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Payment Card */}
                      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Shipping summary */}
                          <div className="p-3 rounded-lg bg-muted/30 text-sm">
                            <p className="font-medium text-foreground flex items-center gap-2 mb-1">
                              <MapPin className="h-3.5 w-3.5" />
                              Shipping to:
                            </p>
                            <p className="text-muted-foreground">
                              {shippingAddress?.address1}, {shippingAddress?.city}
                            </p>
                          </div>

                          {/* Notice */}
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              Payment will be processed securely through our payment provider.
                            </p>
                          </div>

                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handlePlaceOrder}
                            disabled={isProcessing || !shippingAddress}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {paymentStatus || 'Processing...'}
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Place Order - {formatPrice(cartTotalConverted, countryCode)}
                              </>
                            )}
                          </Button>

                          <p className="text-xs text-center text-muted-foreground">
                            By placing this order, you agree to our terms of service and confirm that you are a verified medical patient.
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </EligibilityGate>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
