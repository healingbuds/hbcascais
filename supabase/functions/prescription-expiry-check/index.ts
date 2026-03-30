import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting prescription expiry check...");

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: expiringDocs, error: fetchError } = await supabase
      .from("prescription_documents")
      .select("id, file_name, document_type, expiry_date, user_id, expiry_notification_sent")
      .not("expiry_date", "is", null)
      .gte("expiry_date", today.toISOString())
      .lte("expiry_date", sevenDaysFromNow.toISOString())
      .eq("expiry_notification_sent", false);

    if (fetchError) {
      console.error("Error fetching expiring documents:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringDocs?.length || 0} expiring documents to notify`);

    const notificationResults = [];

    for (const doc of expiringDocs || []) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doc.user_id);
        
        if (userError || !userData.user?.email) {
          console.error(`Could not get user email for ${doc.user_id}:`, userError);
          continue;
        }

        const userEmail = userData.user.email;
        const expiryDate = new Date(doc.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const docTypeLabels: Record<string, string> = {
          prescription: "Prescription",
          medical_certificate: "Medical Certificate",
          referral: "Doctor Referral",
          id_document: "ID Document",
          other: "Document",
        };
        const docTypeLabel = docTypeLabels[doc.document_type] || "Document";

        console.log(`Sending expiry notification to ${userEmail} for ${doc.file_name}`);

        // Logo URL for email header
        const logoUrl = `${supabaseUrl}/storage/v1/object/public/email-assets/hb-logo-white.png`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header img { max-width: 180px; height: auto; }
              .header p { color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 14px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .alert-box h2 { color: #92400e; margin-top: 0; }
              .document-info { background: white; border-radius: 8px; padding: 15px; margin: 15px 0; }
              .btn { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Healing Buds" width="180" />
                <p>Medical Cannabis Care</p>
              </div>
              <div class="content">
                <div class="alert-box">
                  <h2>⚠️ Document Expiring Soon</h2>
                  <p>Your medical document will expire in <strong>${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</strong>.</p>
                </div>
                
                <div class="document-info">
                  <p><strong>Document Type:</strong> ${docTypeLabel}</p>
                  <p><strong>File Name:</strong> ${doc.file_name}</p>
                  <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                
                <p>To continue using our medical cannabis services without interruption, please upload a renewed document before the expiry date.</p>
                
                <a href="https://healingbuds.co.uk/dashboard" class="btn">Upload New Document</a>
                
                <div class="footer">
                  <p>This is an automated notification from Healing Buds.</p>
                  <p>If you have any questions, please contact our support team.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Healing Buds <notifications@healingbuds.co.uk>",
            to: [userEmail],
            subject: `Your ${docTypeLabel} Expires in ${daysUntilExpiry} Days`,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log("Email sent:", emailResult);

        const { error: updateError } = await supabase
          .from("prescription_documents")
          .update({
            expiry_notification_sent: true,
            expiry_notification_sent_at: new Date().toISOString(),
          })
          .eq("id", doc.id);

        if (updateError) {
          console.error(`Error updating notification status for ${doc.id}:`, updateError);
        }

        notificationResults.push({ docId: doc.id, email: userEmail, success: true });
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        notificationResults.push({
          docId: doc.id,
          success: false,
          error: docError instanceof Error ? docError.message : "Unknown error",
        });
      }
    }

    console.log("Expiry check completed:", notificationResults);

    return new Response(
      JSON.stringify({ success: true, processed: notificationResults.length, results: notificationResults }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in prescription expiry check:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});