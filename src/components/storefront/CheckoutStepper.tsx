import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
    currentStep: 1 | 2 | 3;
}

export function CheckoutStepper({ currentStep }: StepperProps) {
    const steps = [
        { num: 1, label: 'Cart' },
        { num: 2, label: 'Address' },
        { num: 3, label: 'Payment' }
    ];

    return (
        <div className="hidden lg:flex items-center justify-center py-6 border-b border-neutral-100 bg-white mb-6">
            <div className="flex items-center">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.num;
                    const isActive = currentStep === step.num;

                    return (
                        <React.Fragment key={step.num}>
                            {/* Step Circle and Label */}
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                    ${isActive || isCompleted ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}
                                >
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                                </div>
                                <span
                                    className={`text-sm font-medium tracking-wide uppercase transition-colors
                    ${isActive || isCompleted ? 'text-neutral-900' : 'text-neutral-500'}`}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connecting Line (don't show after last step) */}
                            {index < steps.length - 1 && (
                                <div className="w-16 h-[1px] mx-4 bg-neutral-200">
                                    <div
                                        className="h-full bg-neutral-900 transition-all duration-300"
                                        style={{ width: isCompleted ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
