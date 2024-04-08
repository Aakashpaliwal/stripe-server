




//NEW CODE
// This is your test secret API key.
const stripe = require('stripe')('sk_test_51KKj1USBYQWkn281VgnMudUDxF7GosXqFPXHWUgArYSadOaHzQv2Vm8i9gXwjC6WxDhvDMJX4i9ON4lqvuE5NMLP00yGpzrjA2');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require("cors");
// app.use(express.static('public'));
// app.use(express.json())
// Use bodyParser middleware to parse JSON in the request body
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors())

const PORT = 5000

// const YOUR_DOMAIN = 'http://localhost:3000';
const YOUR_DOMAIN = 'https://dev-app.chroniclecloud.com';

app.get('/home', (req, res) => {
  res.status(200).json('Welcome, your app is working well');
})


app.get('/getAllPrices', async (req, res) => {
  // console.log('getallReq', req)
  // console.log(res)
  const prices = await stripe.prices.list({
    // limit: 3,
    active: true
  });

  
const products = await stripe.products.list({
  active: true
});

console.log('22222222222222222222222222222222222222222222222222222222222222222222222',products)

  res.send({ allProduct: prices, products: products })
})

app.post('/create-checkout-session', async (req, res) => {
  console.log('checkout req===============', req.body)


  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    customer_email: 'akashdevtestten@yopmail.com',
    line_items: [
      {
        price: req.body.lookup_key,
        // For metered billing, do not pass quantity
        quantity: 1,

      },
    ],
    // ui_mode: 'embedded',
    mode: 'subscription',
    // redirect_on_completion: 'if_required',
    subscription_data: {
      trial_period_days: 30
    },


    // ui_mode: 'embedded',
    // success_url: `${YOUR_DOMAIN}/home/upgradePlan?success=true&session_id={CHECKOUT_SESSION_ID}`,

    //URL's FOR UPGRADING THE PLAN USING CHECKOUT
    // success_url: `${YOUR_DOMAIN}/home/paypal?success=true&session_id={CHECKOUT_SESSION_ID}`,
    // cancel_url: `${YOUR_DOMAIN}/home/paypal`,

    //URL's FOR INITIAL SUBSCRIPTION WHEN REGISTRATION
    success_url: `${YOUR_DOMAIN}/usersubscriptionpayment?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}/usersubscriptionpayment`,
  });

  console.log('session=====================================', session.url)
  console.log(session)
  // res.send({session})
  res.redirect(303, session.url);
});

app.post('/create-portal-session', async (req, res) => {
  console.log('req======================', req.body)
  console.log(req.body.body)
  console.log(req.body.sessionId)
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(req.body.sessionID);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  // const returnUrl = YOUR_DOMAIN;

  // const portalSession = await stripe.billingPortal.sessions.create({
  //   customer: checkoutSession.customer,
  //   return_url: returnUrl,
  // });

  // res.redirect(303, portalSession.url);

  res.send({ checkoutDetails: checkoutSession })


});

app.post('/get-subscription', async (req, res) => {
  console.log(req.body)
  const subscriptions = await stripe.subscriptions.list({
    customer: req.body.customer
  });
  res.send({ subscriptions })
})

app.post('/subsScheduling', async (req, res) => {
  console.log('req=====', req.body.subsId)
  console.log(req.body.priceId)
  console.log(req.body)
  // Create a subscription schedule with the existing subscription
  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: req.body.subscription_id,
  });


  // Retrieve the customer's subscriptions
  // const subscriptions = await stripe.subscriptions.list({
  //   customer: req.body.customerId,
  // });

  // console.log('8888888888888888888888888', subscriptions)

  // Find the Basic Plan subscription
  // const basicPlanSubscription = subscriptions.data.find(
  //   (sub) => sub.items.data[0].price.id === 'price_1OWunYSBYQWkn281O7MnWdiL'
  // );

  // console.log('=============================================', basicPlanSubscription)

  // const schedule = await stripe.subscriptionSchedules.create({
  //   customer: req.body.customerId,
  //   start_date: basicPlanSubscription.current_period_end, // Start after the current billing cycle ends
  //   end_behavior: 'cancel',
  //   phases: [
  //     {
  //       items: [
  //         {
  //           price: req.body.priceId, // Replace with the actual price ID for the Premium Plan
  //         },
  //       ],
  //       iterations: 1,
  //     },
  //   ],
  // });
  // res.send({ schedule })
  console.log('schedule==============>', schedule)
  // const currentPhase = schedule.phases[0];

  // Add one second to the end_date of the current phase
  // const upgradedStartDate = new Date((currentPhase.end_date + 1) * 1000);
  // Update the schedule with the new phase
  const subscriptionSchedule = await stripe.subscriptionSchedules.update(
    schedule.id,
    {
      end_behavior: 'release',
      phases: [
        {
          items: [
            {
              price: schedule.phases[0].items[0].price,
              quantity: schedule.phases[0].items[0].quantity,
            },
          ],
          // iterations: 1, // Set the number of billing cycles for this phase
          // start_date: schedule.phases[0].start_date, // Upgrade immediately after the current phase ends
          // end_date: (upgradedStartDate.getTime() / 1000) + 5, // Same end_date as start_date
          start_date: schedule.phases[0].start_date,
          end_date: schedule.phases[0].end_date,
          // start_date: 'now',
          proration_behavior: 'none',
          // start_date: 'now',
        },
        {
          items: [
            {
              price: req.body.lookup_key,
              quantity: 1,
            },
          ],
          start_date: schedule.phases[0].end_date,
          proration_behavior: 'none',
          iterations: 1,
        },
      ],
    }
  );
  console.log('4888888888888888888888888888888888888================', subscriptionSchedule)
  // res.send({ subscriptionSchedule })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer: req.body.customerId,
    line_items: [{
      price: req.body.lookup_key,
      quantity: 1,
    }],
    // subscription: req.body.subscription_id,
    success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  });
  // res.send({session})
  res.redirect(303, session.url);
})

app.post('/changeSubscriptionMethod', async(req,res) => {
  console.log(req.body)

  const currentSubscription = await stripe.subscriptions.list({
    customer: req.body.customerId,
    // status: 'active',
    limit: 1,
  });

  const currentSubscriptionId = currentSubscription.data[0].id; 

// Step 2: Schedule Upgrade for the Next Billing Cycle
const currentBillingCycleEnd = currentSubscription.data[0].current_period_end;
const nextBillingCycleStart = new Date(currentBillingCycleEnd * 1000);
nextBillingCycleStart.setUTCDate(nextBillingCycleStart.getUTCDate() + 1);


  const subscription = await stripe.subscriptions.update(
    req.body.subscription_id,
    {
      items: [
        {
          id: req.body.subscription_item_id,
          price: req.body.lookup_key,
        },
      ],
      trial_end: currentBillingCycleEnd,
      // trial_from_plan: true,
      // cancel_at_period_end: true
    }
  );

  // res.send({subscription})

  console.log('=========================================================',subscription)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer: req.body.customerId,
    line_items: [{
      price: req.body.lookup_key,
      quantity: 1,
    }],
    // subscription: req.body.subscription_id,
    // subscription: {
    //   billing_cycle_anchor: currentBillingCycleEnd
    // },
    success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  });
  // res.send({session})
  res.redirect(303, session.url);
  // res.json({ id: session.id });

  // const currentSubscription = await stripe.subscriptions.list({
  //   customer: req.body.customerId,
  // });
  // console.log(currentSubscription)
  // const currentSubscriptionId = currentSubscription.data[0].id;
})

app.post('/newsubscription',async(req, res) => {
  console.log(req.body)

  const currentSubscription = await stripe.subscriptions.list({
    customer: req.body.customerId,
    // status: 'active',
    limit: 1,
  });

  console.log('999999999999999999999999999999999999999999999999',currentSubscription)

  const currentBillingCycleEnd = currentSubscription.data?.[0]?.current_period_end;
  console.log(currentBillingCycleEnd)
  console.log(currentBillingCycleEnd + Math.floor(currentBillingCycleEnd / 1000) + 1 * 24 * 60 * 60)
  console.log(currentBillingCycleEnd + (30 * 24 * 60 * 60))
  let timeStampHere = currentBillingCycleEnd + (30 * 24 * 60 * 60)

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'subscription',
  customer: req.body.customerId,
  line_items: [{
    price: req.body.lookup_key,
    quantity: 1
  }],
  // subscription: req.body.subscription_id,
  // subscription_data: {
  //   billing_cycle_anchor: currentBillingCycleEnd,
  //   // trial_period_days: 30
  //   proration_behavior: "none"
  // },
  // success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
  // cancel_url: `${YOUR_DOMAIN}?canceled=true`,

  success_url: `${YOUR_DOMAIN}/home/paypal?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${YOUR_DOMAIN}/home/paypal`,

});
// res.send({session})
res.redirect(303, session.url);

console.log('0000000000000000000000000000000000000000000000000000000',session)

if(session) {
  
// const cancelSubscription = await stripe.subscriptions.update(
//   req.body.subscription_id,
//   {
//     cancel_at_period_end: true,
//   }
// );
const subscription = await stripe.subscriptions.cancel(req.body.subscription_id);
}

// const subscription = await stripe.subscriptions.update(
//   req.body.subscription_id,
//   {
//     items: [
//       {
//         id: req.body.subscription_item_id,
//         deleted: true,
//       },
//       // {
//       //   price: req.body.lookup_key,
//       // },
//     ],
//   }
// );






})

// const updateUserNewSubscription = async () => {
//   const subscription = await stripe.subscriptions.cancel(req.body.subscription_id);
// }


app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (request, response) => {
    // console.log('webhook=====', request)
    let event = request.body;
    // Replace this endpoint secret with your endpoint's unique secret
    // If you are testing with the CLI, find the secret by running 'stripe listen'
    // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    // at https://dashboard.stripe.com/webhooks
    const endpointSecret = 'whsec_ewX0IU2HKE0tTBhprQtv6eFwQJ3PbfTN';
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        // console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }
    let subscription;
    let status;
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.trial_will_end':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription trial ending.
        // handleSubscriptionTrialEnding(subscription);
        break;
      case 'customer.subscription.deleted':
        subscription = event.data.object;
        status = subscription.status;
        console.log(subscription)
        console.log(`394 Subscription status of ${subscription?.id} is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case 'customer.subscription.created':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`401 Subscription status of ${subscription?.id} is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case 'customer.subscription.updated':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`408 Subscription status of ${subscription?.id} is ${status}.`);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;
      default:
      case 'checkout.session.async_payment_failed':
        const checkoutSessionAsyncPaymentFailed = event.data.object;
        // Then define and call a function to handle the event checkout.session.async_payment_failed
        break;
      case 'checkout.session.async_payment_succeeded':
        const checkoutSessionAsyncPaymentSucceeded = event.data.object;

        // Then define and call a function to handle the event checkout.session.async_payment_succeeded
        break;
      case 'checkout.session.completed':
        const checkoutSessionCompleted = event.data.object;
        console.log('419====', checkoutSessionCompleted)
        // updateUserNewSubscription()
        // Update the user's subscription in Stripe
        // stripe.subscriptions.update(newSubscriptionId, {
        //   cancel_at_period_end: true,
        // })
        // .then(updatedSubscription => {
        //   // Implement additional logic if needed
      
        //   console.log(`Subscription updated for user ${customerId}`);
        // })
        // .catch(error => {
        //   console.error(`Error updating subscription for user ${customerId}: ${error.message}`);
        // });
        // Then define and call a function to handle the event checkout.session.completed
        break;
      case 'checkout.session.expired':
        const checkoutSessionExpired = event.data.object;
        console.log('466====', checkoutSessionExpired)
        // Then define and call a function to handle the event checkout.session.expired
        break;
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

app.use(express.json());

app.listen(5000, () => console.log(`Running on port ${PORT}`));
