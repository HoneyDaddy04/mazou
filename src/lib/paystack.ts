interface PaystackInitOptions {
  email: string;
  amount: number; // in Naira
  orgId: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export function initializePaystack({ email, amount, orgId, onSuccess, onClose }: PaystackInitOptions) {
  const handler = window.PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100, // Convert to kobo
    currency: "NGN",
    metadata: {
      org_id: orgId,
      custom_fields: [
        { display_name: "Organization", variable_name: "org_id", value: orgId },
      ],
    },
    callback: (response: { reference: string }) => {
      onSuccess(response.reference);
    },
    onClose,
  });

  handler.openIframe();
}

export async function verifyTransaction(reference: string): Promise<boolean> {
  const response = await fetch(`/api/paystack/verify?reference=${reference}`);
  const data = await response.json();
  return data.status === "success";
}
