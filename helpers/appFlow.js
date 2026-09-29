import { DevicePage } from "../pages/DevicePage.js";
import { RegistrationPage } from "../pages/RegistrationPage.js";
import { ProfilePage } from "../pages/ProfilePage.js";
import { PlansPage } from "../pages/PlansPage.js";
import { PaymentCardPage } from "../pages/PaymentCardPage.js";
import { PaymentPage } from "../pages/PaymentPage.js";
import { getRegistrationData, logPurchase } from "./utils.js";

const EXTENSION_WEB_URL = process.env.EXTENSION_WEB_URL;

export async function completeRegistrationToPlans(page, userIndex) {

  // Enter Phone Number
  const registrationPage = new RegistrationPage(page);
  await registrationPage.goto(EXTENSION_WEB_URL);
  const { phoneNumber, firstName, lastName, email } = getRegistrationData(userIndex);
  await registrationPage.completePhoneVerification(phoneNumber);

  // Device check
  const devicePage = new DevicePage(page);
  await devicePage.completeDeviceCheck();

  // Verify OTP 
  await registrationPage.verifyOTP();

  // Profile creation
  const profilePage = new ProfilePage(page);
  await profilePage.createProfile(firstName, lastName, email);

  // Plans page should now be loaded
  const plansPage = new PlansPage(page);
  await plansPage.verifyPlansPageLoads();

  // return user details so caller can log purchase information
  return { firstName, lastName, email };
}

/**
 * Complete payment card entry flow
 */
export async function completePaymentCardDetails(page) {
  await completeRegistrationToPlans(page);

  const plansPage = new PlansPage(page);
  await plansPage.selectPlan("Basic", "monthly");
  await plansPage.proceedToPayment();

  const paymentCardPage = new PaymentCardPage(page);
  await paymentCardPage.fillAllCardDetails();
  await paymentCardPage.submitCardDetails();
}

/**
 * Complete end-to-end flow with Basic Monthly plan
 */
export async function completeBasicMonthlyFlow(page) {
  const user = await completeRegistrationToPlans(page);

  const plansPage = new PlansPage(page);
  await plansPage.selectPlan("basic", "monthly");
  await plansPage.proceedToPayment();

  const paymentCardPage = new PaymentCardPage(page);
  await paymentCardPage.fillAllCardDetails();
  await paymentCardPage.submitCardDetails();

  const paymentPage = new PaymentPage(page);
  await paymentPage.expectPlanDetails({
    planName: "Basic",
    billingCycle: "monthly",
  });
  await paymentPage.completePayment();
  await paymentPage.continueAfterPayment();

  // log the purchase for reporting
  logPurchase(`${user.firstName} ${user.lastName}`, "Basic", "monthly");
}

/**
 * Complete end-to-end flow with Basic Yearly plan
 */
export async function completeBasicYearlyFlow(page) {
  const user = await completeRegistrationToPlans(page);

  const plansPage = new PlansPage(page);
  await plansPage.selectPlan("basic", "yearly");
  await plansPage.proceedToPayment();

  const paymentCardPage = new PaymentCardPage(page);
  await paymentCardPage.fillAllCardDetails();
  await paymentCardPage.submitCardDetails();

  const paymentPage = new PaymentPage(page);
  await paymentPage.expectPlanDetails({
    planName: "Basic",
    billingCycle: "yearly",
  });
  await paymentPage.completePayment();
  await paymentPage.continueAfterPayment();

  // log
  logPurchase(`${user.firstName} ${user.lastName}`, "Basic", "yearly");
}

/**
 * Complete end-to-end flow with Premium Monthly plan
 */
export async function completePremiumMonthlyFlow(page) {
  const user = await completeRegistrationToPlans(page);

  const plansPage = new PlansPage(page);
  await plansPage.selectPlan("premium", "monthly");
  await plansPage.proceedToPayment();

  const paymentCardPage = new PaymentCardPage(page);
  await paymentCardPage.fillAllCardDetails();
  await paymentCardPage.submitCardDetails();

  const paymentPage = new PaymentPage(page);
  await paymentPage.expectPlanDetails({
    planName: "Premium",
    billingCycle: "monthly",
  });
  await paymentPage.completePayment();
  await paymentPage.continueAfterPayment();

  logPurchase(`${user.firstName} ${user.lastName}`, "Premium", "monthly");
}

/**
 * Complete end-to-end flow with Premium Yearly plan
 */
export async function completePremiumYearlyFlow(page) {
  const user = await completeRegistrationToPlans(page);

  const plansPage = new PlansPage(page);
  await plansPage.selectPlan("premium", "yearly");
  await plansPage.proceedToPayment();

  const paymentCardPage = new PaymentCardPage(page);
  await paymentCardPage.fillAllCardDetails();
  await paymentCardPage.submitCardDetails();

  const paymentPage = new PaymentPage(page);
  await paymentPage.expectPlanDetails({
    planName: "Premium",
    billingCycle: "yearly",
  });
  await paymentPage.completePayment();
  await paymentPage.continueAfterPayment();

  logPurchase(`${user.firstName} ${user.lastName}`, "Premium", "yearly");
}

export async function completePlanFlow(page, planName, billingCycle, userIndex) {
  const user = await completeRegistrationToPlans(page, userIndex);
  const plansPage = new PlansPage(page);

  await plansPage.selectPlan(planName, billingCycle);
  await plansPage.proceedToPayment();

  const paymentCardPage = new PaymentCardPage(page);
  await paymentCardPage.fillAllCardDetails();
  await paymentCardPage.submitCardDetails();

  const paymentPage = new PaymentPage(page);
  await paymentPage.expectPlanDetails({ planName, billingCycle });
  await paymentPage.completePayment();
  await paymentPage.continueAfterPayment();

  logPurchase(`${user.firstName} ${user.lastName}`, planName, billingCycle);
}

export async function completeFlowForExistingUser(page, number = process.env.USER_X_PHONE) {
  const registrationPage = new RegistrationPage(page);
  await registrationPage.goto(EXTENSION_WEB_URL);
  await registrationPage.completePhoneVerification(number);
  await registrationPage.enterOTP(process.env.OTP || "1234");
  await registrationPage.submitButton.click();
  await registrationPage.waitForURL(/.*\/chats/, 10000);
}