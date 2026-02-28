const fs = require('fs');

const cartPath = 'd:/PY/anti-gravity-google-app and improvement project for storekriti/new-setup-storebuilder/src/pages/store/CartPage.tsx';
let cartContent = fs.readFileSync(cartPath, 'utf-8');

const targetCart = `            <div className="w-full lg:w-[380px] shrink-0">
              <div className="bg-neutral-50 p-8 sticky top-24">
                <h3 className="font-serif tracking-tight text-xl mb-6">Order Summary</h3>
                <div className="space-y-4 text-neutral-600 mb-6">
                  <div className="flex justify-between">`;

const replacementCart = `            <div className="w-full lg:w-[380px] shrink-0">
              <div className="bg-neutral-50 p-8 sticky top-24">
                <h3 className="font-serif tracking-tight text-xl mb-6">Order Summary</h3>

                {/* Free Delivery Banner */}
                {freeDeliveryThreshold && (
                  <div className={\`mb-6 p-4 rounded-none border flex flex-col gap-2 \${isEligibleForFreeDelivery
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-neutral-200'
                    }\`}>
                    <div className="flex items-center gap-2">
                      <Truck className={\`w-5 h-5 \${isEligibleForFreeDelivery ? 'text-green-600' : 'text-neutral-600'}\`} />
                      <p className={\`text-sm font-medium \${isEligibleForFreeDelivery ? 'text-green-700' : 'text-neutral-700'}\`}>
                        {isEligibleForFreeDelivery
                          ? '🎉 You get FREE delivery!'
                          : \`Add ₹\${amountToFreeDelivery.toFixed(0)} more for FREE delivery\`
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-neutral-600 mb-6">
                  <div className="flex justify-between">`;

if (cartContent.includes(targetCart)) {
    cartContent = cartContent.replace(targetCart, replacementCart);
} else {
    cartContent = cartContent.replace(targetCart.replace(/\n/g, '\r\n'), replacementCart.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(cartPath, cartContent);

const taskPath = 'C:/Users/store/.gemini/antigravity/brain/36b29047-89fc-45eb-9d39-f4322beba0c3/task.md';
let taskContent = fs.readFileSync(taskPath, 'utf-8');

taskContent = taskContent.replace(
    '- [ ] Checkout fee calculation utility (Storefront logic for fixed, min order, free delivery override)',
    '- [x] Checkout fee calculation utility (Storefront logic for fixed, min order, free delivery override)'
).replace(
    '- [ ] Storefront UI Updates: D2C and Grocery Cart & Checkout (Basic fees display)',
    '- [x] Storefront UI Updates: D2C and Grocery Cart & Checkout (Basic fees display)'
);

fs.writeFileSync(taskPath, taskContent);

console.log('Fixed CartPage and task.md');
