type ChargeInput = {
  connectedAccountId: string;
  amount: number;
  paymentToken?: string | null;
  simulateFailure?: boolean;
};

export class StripeConnectMockGateway {
  async createOnboardingLink(companySlug: string) {
    const fakeAccountId = `acct_${companySlug.replace(/[^a-z0-9]/gi, "").slice(0, 12) || "demo"}`;

    return {
      onboardingUrl: `/dashboard/billing?mockStripeConnect=1&accountId=${fakeAccountId}`,
      suggestedAccountId: fakeAccountId,
      status: "mock_pending"
    };
  }

  async charge(input: ChargeInput) {
    if (!input.connectedAccountId) {
      return {
        success: false,
        status: "failed" as const,
        providerTransactionId: null,
        rawResponse: { error: "Missing connected account" }
      };
    }

    if (input.simulateFailure || input.paymentToken === "fail") {
      return {
        success: false,
        status: "failed" as const,
        providerTransactionId: `pi_fail_${Date.now()}`,
        rawResponse: { error: "Mock Stripe payment failed" }
      };
    }

    return {
      success: true,
      status: "succeeded" as const,
      providerTransactionId: `pi_mock_${Date.now()}`,
      rawResponse: {
        connectedAccountId: input.connectedAccountId,
        amount: input.amount
      }
    };
  }
}
